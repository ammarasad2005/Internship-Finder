import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { ActiveProfileData, InternshipData, MatchResult } from '../types';
import { MatchScorer } from './MatchScorer';
import { MatchExplanationService } from './MatchExplanationService';
import { MatchRepository } from './MatchRepository';

export class MatchEngine {
  private supabase: SupabaseClient<Database>;
  private repository: MatchRepository;

  constructor(supabase: SupabaseClient<Database>, repository: MatchRepository) {
    this.supabase = supabase;
    this.repository = repository;
  }

  /**
   * Main entry point for the Internship-Centric Delta Batch matching cycle.
   */
  public async executeDeltaBatch(lastRunTime: string): Promise<void> {
    console.log(`[MatchEngine] Starting Delta Batch for internships discovered after ${lastRunTime}`);

    // Step A: Fetch newly discovered internships once
    const internships = await this.fetchNewInternships(lastRunTime);
    if (internships.length === 0) {
      console.log('[MatchEngine] No new internships discovered. Batch complete.');
      return;
    }

    // Step B & C: Fetch active profiles with joined skills and projects
    const profiles = await this.fetchActiveProfiles();
    if (profiles.length === 0) {
      console.log('[MatchEngine] No active profiles found. Batch complete.');
      return;
    }

    console.log(`[MatchEngine] Loaded ${internships.length} internships and ${profiles.length} profiles into memory.`);

    // Step D: Perform matching entirely in local memory
    const allMatches: MatchResult[] = [];

    for (const profile of profiles) {
      const userMatches: MatchResult[] = [];

      for (const internship of internships) {
        const scoreDetails = MatchScorer.score(profile, internship);
        
        // Only keep decent matches to avoid DB bloat
        if (scoreDetails.total_score >= 25) {
          userMatches.push({
            profile_id: profile.profile_id,
            internship_id: internship.id,
            session_id: profile.session_id,
            semantic_score: scoreDetails.total_score,
            explanation: null,
            score_details: scoreDetails
          });
        }
      }

      // Sort user matches descending by score
      userMatches.sort((a, b) => b.semantic_score - a.semantic_score);

      // Step E: Gemini Integration for Top 5 matches
      const topMatches = userMatches.slice(0, 5);
      const remainingMatches = userMatches.slice(5);

      for (const match of topMatches) {
        const targetInternship = internships.find(i => i.id === match.internship_id)!;
        const explanationData = await MatchExplanationService.generateExplanation(profile, targetInternship);
        
        match.score_details.ai_boost = explanationData.score_boost;
        match.semantic_score = Math.min(100, match.semantic_score + explanationData.score_boost);
        match.explanation = explanationData.explanation;
      }

      // Add all back to the global pool
      allMatches.push(...topMatches, ...remainingMatches);
    }

    // Step F: Persist results
    if (allMatches.length > 0) {
      await this.repository.upsertBatch(allMatches);
      console.log(`[MatchEngine] Successfully finalized batch with ${allMatches.length} matches.`);
    }
  }

  private async fetchNewInternships(lastRunTime: string): Promise<InternshipData[]> {
    const { data, error } = await this.supabase
      .from('internships')
      .select('*')
      .gt('discovered_at', lastRunTime)
      .eq('is_active', true);

    if (error) throw error;
    
    return data.map(d => ({
      id: d.id,
      canonical_key: d.canonical_key,
      company_name: d.company_name,
      role_title: d.role_title,
      location: d.location,
      description: d.description,
      application_url: d.application_url,
      tags: d.tags || [],
      is_active: d.is_active,
      discovered_at: d.discovered_at
    }));
  }

  private async fetchActiveProfiles(): Promise<ActiveProfileData[]> {
    // We target active sessions (running or pending) to determine who is actively looking right now
    const { data, error } = await this.supabase
      .from('search_sessions')
      .select(`
        id,
        profile_id,
        profiles!inner (
          first_name,
          last_name,
          location_preference,
          remote_preference,
          profile_skills ( skill_name ),
          profile_projects ( project_name, description, technologies )
        )
      `)
      .in('status', ['running', 'pending']);

    if (error) throw error;
    if (!data) return [];

    const parsedProfiles: ActiveProfileData[] = [];

    for (const session of data) {
      const p = session.profiles as any; // Due to deep nested types, we cast slightly safely
      parsedProfiles.push({
        profile_id: session.profile_id,
        session_id: session.id,
        first_name: p.first_name,
        last_name: p.last_name,
        location_preference: p.location_preference,
        remote_preference: p.remote_preference,
        skills: p.profile_skills?.map((s: any) => s.skill_name) || [],
        projects: p.profile_projects?.map((pj: any) => ({
          name: pj.project_name,
          description: pj.description,
          technologies: pj.technologies || []
        })) || []
      });
    }

    return parsedProfiles;
  }
}
