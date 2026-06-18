import { SupabaseClient } from '@supabase/supabase-js';
import { InternshipRow } from '../types';
import { UpsertStrategy } from './UpsertStrategy.service';

export class InternshipRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Persists an internship row, handling collisions natively.
   */
  async saveInternship(row: InternshipRow): Promise<{ id: string; isNew: boolean }> {
    return await UpsertStrategy.execute(this.supabase, row);
  }

  /**
   * Flags an internship as inactive if it's dead.
   */
  async markInactive(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('internships')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.warn(`[InternshipRepository] Failed to mark inactive: ${id}`);
    }
  }
}
