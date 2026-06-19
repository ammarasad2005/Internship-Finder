import { ProfileService } from '@/features/onboarding/services/profile.service';
import { DomainExpansionService } from './domain-expansion.service';
import { QueryGenerationService } from './query-generation.service';
import { QueryRankingService } from './query-ranking.service';
import { ResearchPlan } from '../types';
import { createClient } from '@/lib/supabase/client';

export class ResearchPlanBuilder {
  /**
   * Orchestrates the Brain architecture to output an execution plan.
   */
  static async buildPlan(profileId: string, sessionId: string): Promise<ResearchPlan> {
    // 1. Profile Analysis
    const profileData = await ProfileService.getProfile(profileId);
    if (!profileData || !profileData.profile) throw new Error("Profile not found");

    const skills = profileData.skills.map((s: any) => s.skill_name);
    const projects = profileData.projects.map((p: any) => p.technologies ? p.technologies.join(' ') : p.project_name);

    const supabase = createClient();
    
    // 2. Domain Expansion
    const expandedDomains = await DomainExpansionService.expandProfile(skills, projects, supabase);

    // 3. Query Generation & Categorization
    let queries = await QueryGenerationService.generateQueries(
      expandedDomains, 
      profileData.profile.location_preference,
      profileData.profile.remote_preference,
      supabase
    );

    // 4. Query Ranking
    queries = QueryRankingService.rankQueries(queries);

    // 5. Build Final Plan
    return {
      profileId,
      sessionId,
      expandedDomains,
      queries: queries.slice(0, 15), // Cap the research plan to top 15 queries to save tokens
      totalQueriesGenerated: queries.length,
      estimatedTokensRequired: queries.length * 150 // Rough mock estimate
    };
  }
}
