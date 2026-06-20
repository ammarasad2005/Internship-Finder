import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

export interface FeedbackProfile {
  positiveCompanies: Set<string>;
  positiveTags: Set<string>;
  negativeCompanies: Set<string>;
  negativeKeywords: Set<string>;
}

export class FeedbackProfileBuilder {
  /**
   * Aggregates historical feedback from matches for the specified profile.
   */
  static async build(supabase: SupabaseClient<Database>, profileId: string): Promise<FeedbackProfile> {
    const feedbackProfile: FeedbackProfile = {
      positiveCompanies: new Set(),
      positiveTags: new Set(),
      negativeCompanies: new Set(),
      negativeKeywords: new Set()
    };

    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        user_feedback,
        internships (
          company_name,
          role_title,
          tags
        )
      `)
      .eq('profile_id', profileId)
      .not('user_feedback', 'is', null);

    if (error) {
      console.error('[FeedbackProfileBuilder] Failed to fetch historical feedback', error);
      return feedbackProfile;
    }

    if (!matches || matches.length === 0) {
      return feedbackProfile;
    }

    for (const match of matches) {
      const internship = match.internships;
      // Handle the fact that postgrest joins return arrays or single objects depending on relationship.
      // internship_id is an fk, so it returns a single object or array of one object.
      const internData = Array.isArray(internship) ? internship[0] : internship;
      
      if (!internData) continue;

      const companyName = internData.company_name?.toLowerCase().trim();
      const roleTitle = internData.role_title?.toLowerCase().trim();
      const tags = Array.isArray(internData.tags) ? internData.tags : [];

      if (match.user_feedback === 'saved' || match.user_feedback === 'applied') {
        if (companyName) feedbackProfile.positiveCompanies.add(companyName);
        for (const tag of tags) {
          if (typeof tag === 'string') {
            feedbackProfile.positiveTags.add(tag.toLowerCase().trim());
          }
        }
      } else if (match.user_feedback === 'rejected') {
        if (companyName) feedbackProfile.negativeCompanies.add(companyName);
        if (roleTitle) {
          // Extract keywords from title roughly
          const tokens = roleTitle.split(/\s+/).filter((t: string) => t.length > 2);
          tokens.forEach((t: string) => feedbackProfile.negativeKeywords.add(t));
        }
      }
    }

    return feedbackProfile;
  }
}
