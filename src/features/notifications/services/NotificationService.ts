import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import * as nodemailer from 'nodemailer';
import { NotificationEmailTemplate, EmailMatchData } from '../components/NotificationEmailTemplate';
export class NotificationService {
  private supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  /**
   * Queries matches, validates user preferences, renders email, and calls Nodemailer API.
   */
  public async sendSessionSummaryEmail(sessionId: string, profileId: string): Promise<{ success: boolean; message: string }> {
    try {
      // 0. Verify notification has not been sent yet
      const { data: session, error: sessionError } = await this.supabase
        .from('search_sessions')
        .select('notification_sent')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('Failed to fetch session:', sessionError);
        return { success: false, message: 'Session not found' };
      }

      if (session.notification_sent) {
        return { success: true, message: 'Notification already sent for this session' };
      }

      // 1. Fetch user profile to check preferences
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('id, email_notifications_enabled, notification_threshold')
        .eq('id', profileId)
        .single();

      if (profileError || !profile) {
        console.error('Failed to fetch profile:', profileError);
        return { success: false, message: 'Profile not found' };
      }

      if (!profile.email_notifications_enabled) {
        return { success: true, message: 'User has disabled email notifications' };
      }

      const threshold = profile.notification_threshold ?? 75;

      // 2. Fetch matches for this session that meet the threshold
      const { data: matches, error: matchesError } = await this.supabase
        .from('matches')
        .select(`
          semantic_score,
          explanation,
          internships (
            company_name,
            role_title,
            application_url
          )
        `)
        .eq('session_id', sessionId)
        .gte('semantic_score', threshold)
        .order('semantic_score', { ascending: false });

      if (matchesError) {
        console.error('Failed to fetch matches:', matchesError);
        return { success: false, message: 'Failed to fetch matches' };
      }

      if (!matches || matches.length === 0) {
        return { success: true, message: 'No matches above threshold, skipping email' };
      }

      // Format data for template
      const emailData: EmailMatchData[] = matches.map((m: any) => ({
        company_name: m.internships?.company_name || 'Unknown Company',
        role_title: m.internships?.role_title || 'Unknown Role',
        semantic_score: m.semantic_score || 0,
        explanation: m.explanation || '',
        application_url: m.internships?.application_url || '#'
      }));

      // 3. Render HTML
      const htmlContent = NotificationEmailTemplate({ matches: emailData });

      // We need the user's email. Since it's not in the `profiles` table (usually it's in Supabase auth.users),
      // we need to fetch it from Supabase Auth admin API.
      const { data: userData, error: userError } = await this.supabase.auth.admin.getUserById(profileId);
      
      if (userError || !userData?.user?.email) {
        console.error('Failed to fetch user email:', userError);
        return { success: false, message: 'Failed to fetch user email' };
      }

      const userEmail = userData.user.email;

      // 4. Send email via Nodemailer
      try {
        await this.transporter.sendMail({
          from: `"Internship Finder" <${process.env.SMTP_USER}>`,
          to: userEmail,
          subject: `You have ${emailData.length} new internship matches!`,
          html: htmlContent,
        });
      } catch (sendError) {
        console.error('Failed to send email:', sendError);
        return { success: false, message: 'Failed to send email via Nodemailer' };
      }

      // 5. Mark notification as sent
      await this.supabase
        .from('search_sessions')
        .update({
          notification_sent: true,
          notification_sent_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      return { success: true, message: 'Summary email sent successfully' };
    } catch (error: any) {
      console.error('Notification service error:', error);
      return { success: false, message: error.message || 'Internal error' };
    }
  }
}
