import { SupabaseClient } from '@supabase/supabase-js';
import { InternshipRow } from '../types';

export class UpsertStrategy {
  /**
   * Executes a strict upsert operation on the internships table.
   * Supabase naturally handles the 'updated_at' trigger on modification.
   */
  static async execute(
    supabase: SupabaseClient, 
    row: InternshipRow
  ): Promise<{ id: string; isNew: boolean }> {
    
    // First, try to insert. If conflict on canonical_key, update specific fields.
    const { data, error } = await supabase
      .from('internships')
      .upsert(row, {
        onConflict: 'canonical_key',
        ignoreDuplicates: false // We WANT to update if it exists
      })
      .select('id, created_at, updated_at')
      .single();

    if (error || !data) {
      throw new Error(`[UpsertStrategy] Failed to upsert internship: ${error?.message}`);
    }

    // Determine if it was created just now by comparing timestamps
    // If updated_at equals created_at (or close to it), it's brand new.
    const createdTime = new Date(data.created_at).getTime();
    const updatedTime = new Date(data.updated_at || data.created_at).getTime();
    
    // If the difference is less than 1 second, it was an INSERT, not an UPDATE
    const isNew = Math.abs(updatedTime - createdTime) < 1000;

    return { id: data.id, isNew };
  }
}
