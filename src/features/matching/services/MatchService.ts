import { createClient } from '@/lib/supabase/server';
import { MatchWithInternship } from '../types/ui';

export class MatchService {
  /**
   * Fetches all matches for a given session and profile,
   * joined with internship data, sorted by semantic_score descending.
   *
   * Runs server-side only using the SSR Supabase client.
   */
  static async getSessionMatches(
    sessionId: string,
    profileId: string
  ): Promise<MatchWithInternship[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        profile_id,
        internship_id,
        session_id,
        semantic_score,
        explanation,
        user_feedback,
        created_at,
        internships!inner (
          id,
          company_name,
          role_title,
          location,
          description,
          application_url,
          tags
        )
      `)
      .eq('session_id', sessionId)
      .eq('profile_id', profileId)
      .order('semantic_score', { ascending: false });

    if (error) {
      console.error('[MatchService] Failed to fetch matches:', error);
      throw new Error(error.message);
    }

    if (!data) return [];

    // Transform the Supabase join shape into our typed interface
    return data.map((row) => {
      const internships = row.internships as unknown as Array<{
        id: string;
        company_name: string;
        role_title: string;
        location: string | null;
        description: string | null;
        application_url: string | null;
        tags: string[] | null;
      }>;
      
      const internship = internships?.[0];

      if (!internship) {
        throw new Error(`Internship data missing for match ${row.id}`);
      }

      return {
        id: row.id,
        profile_id: row.profile_id,
        internship_id: row.internship_id,
        session_id: row.session_id,
        semantic_score: row.semantic_score,
        explanation: row.explanation,
        user_feedback: row.user_feedback,
        created_at: row.created_at,
        internship,
      };
    });
  }
}
