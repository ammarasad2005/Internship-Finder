import { SupabaseClient } from '@supabase/supabase-js';
import { InternshipSourceRow } from '../types';

export class InternshipSourcePersistenceService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Persists the provenance history.
   * The database has a UNIQUE constraint on (internship_id, source_url),
   * so we safely ignore duplicates.
   */
  async saveSources(sources: InternshipSourceRow[]): Promise<number> {
    if (!sources.length) return 0;

    const { data, error } = await this.supabase
      .from('internship_sources')
      .upsert(sources, {
        onConflict: 'internship_id, source_url',
        ignoreDuplicates: true // Do not update first_seen_at if it already exists
      })
      .select('id');

    if (error) {
      console.warn(`[InternshipSourcePersistence] Failed to insert sources: ${error.message}`);
      return 0;
    }

    // Return the number of actual inserts (data will be null if all ignored)
    return data ? data.length : 0;
  }
}
