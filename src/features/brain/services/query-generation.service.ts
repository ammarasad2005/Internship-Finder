import { SearchQuery, ExpandedDomain } from '../types';
import { SupabaseClient } from '@supabase/supabase-js';
import { GeminiService } from './gemini.service';
import { AiCacheService } from './ai-cache.service';
import { QueryGenerationResponseSchema } from '../schemas/gemini.schema';

export class QueryGenerationService {
  /**
   * Generates a diverse set of search intents based on expanded domains.
   * Uses AI Cache, Gemini reasoning, and a deterministic fallback.
   */
  static async generateQueries(
    expansions: ExpandedDomain[], 
    locationPref: string | null,
    remotePref: string | null,
    supabase: SupabaseClient
  ): Promise<SearchQuery[]> {
    const aiCache = new AiCacheService(supabase);
    const gemini = GeminiService.getInstance();

    const payloadString = JSON.stringify({ expansions, locationPref, remotePref });
    const cacheKey = AiCacheService.generateHash(`query_gen_${payloadString}`);

    // 1. Check AI Cache
    const cached = await aiCache.get<SearchQuery[]>(cacheKey, 'other');
    if (cached) return cached;

    // 2. Execute Gemini
    try {
      const response = await gemini.executeStructuredPrompt(
        `You are an expert technical recruiter generating Google Dorks and ATS search strings.
         Generate high quality, distinct, and highly targeted search queries for the provided domains.
         Categories must be one of: skill_based, role_based, technology_based, location_based, company_based.
         Output valid JSON strictly matching the requested schema.`,
        `Domains: ${JSON.stringify(expansions)}\nLocation: ${locationPref}\nRemote: ${remotePref}`,
        QueryGenerationResponseSchema
      );

      await aiCache.set(cacheKey, 'other', response.queries);
      return response.queries;

    } catch (error) {
      console.warn('[QueryGenerationService] Gemini failed, using deterministic fallback', error);
      return this.fallbackDeterministic(expansions, locationPref, remotePref);
    }
  }

  private static fallbackDeterministic(
    expansions: ExpandedDomain[], 
    locationPref: string | null,
    remotePref: string | null
  ): SearchQuery[] {
    const queries: SearchQuery[] = [];
    const location = locationPref || 'Pakistan';
    const remoteSuffix = remotePref === 'remote' ? ' remote' : '';

    expansions.forEach(domain => {
      domain.roles.forEach(role => {
        queries.push({
          text: `${role} internship ${location}${remoteSuffix}`.trim(),
          category: 'role_based',
          priorityScore: 0
        });
      });

      domain.technologies.forEach(tech => {
        queries.push({
          text: `${tech} intern ${location}${remoteSuffix}`.trim(),
          category: 'technology_based',
          priorityScore: 0
        });
      });

      domain.relatedTerms.forEach(term => {
        queries.push({
          text: `${term} internship opportunities ${location}`.trim(),
          category: 'skill_based',
          priorityScore: 0
        });
      });
    });

    return queries;
  }
}
