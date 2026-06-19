import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { MatchResult } from '../types';

export class MatchRepository {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Persists a batch of MatchResults.
   * Utilizes the UNIQUE (profile_id, internship_id, session_id) constraint.
   * We omit user_feedback so that we never overwrite any existing user action if the match is regenerated.
   */
  public async upsertBatch(matches: MatchResult[]): Promise<void> {
    if (matches.length === 0) return;

    // Transform MatchResult to DB expected shape, omitting user_feedback
    // and explicitly omitting score_details since it's not a column, but we keep semantic_score
    const payloads = matches.map(m => ({
      profile_id: m.profile_id,
      internship_id: m.internship_id,
      session_id: m.session_id,
      semantic_score: m.semantic_score,
      explanation: m.explanation,
      // user_feedback is deliberately omitted to prevent overwriting during DO UPDATE
    }));

    const { error } = await this.supabase
      .from('matches')
      .upsert(payloads, {
        onConflict: 'profile_id,internship_id,session_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('[MatchRepository] Failed to upsert matches:', error);
      throw error;
    }
    
    console.log(`[MatchRepository] Successfully upserted ${payloads.length} matches.`);
  }
}
