import { SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

export type CacheType = 'domain_expansion' | 'resume_parse' | 'skill_extraction' | 'other';

export class AiCacheService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Generates a deterministic SHA-256 hex hash for cache keys.
   */
  static generateHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Retrieves a parsed JSON value from the global AI Cache.
   */
  async get<T>(key: string, type: CacheType): Promise<T | null> {
    const { data, error } = await this.supabase
      .from('ai_cache')
      .select('output_value')
      .eq('cache_key', key)
      .eq('cache_type', type)
      .single();

    if (error || !data) return null;
    return data.output_value as T;
  }

  /**
   * Saves a structured JSON response to the global AI Cache.
   */
  async set(key: string, type: CacheType, value: any, ttlDays = 30): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    const { error } = await this.supabase
      .from('ai_cache')
      .upsert({
        cache_key: key,
        cache_type: type,
        output_value: value,
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'cache_key'
      });

    if (error) {
      console.warn(`[AiCacheService] Failed to cache ${type} for key ${key}:`, error.message);
    }
  }
}
