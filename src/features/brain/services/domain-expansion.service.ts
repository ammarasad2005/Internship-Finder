import { ExpandedDomain } from '../types';
import { SupabaseClient } from '@supabase/supabase-js';
import { GeminiService } from './gemini.service';
import { AiCacheService } from './ai-cache.service';
import { DomainExpansionResponseSchema } from '../schemas/gemini.schema';

export class DomainExpansionService {
  /**
   * Expands user skills/projects into broader canonical domains.
   * Uses AI Cache, Gemini reasoning, and a deterministic fallback.
   */
  static async expandProfile(
    skills: string[], 
    projects: string[], 
    supabase: SupabaseClient
  ): Promise<ExpandedDomain[]> {
    const aiCache = new AiCacheService(supabase);
    const gemini = GeminiService.getInstance();
    
    // Ensure logical equivalence generates identical cache keys
    const sortedSkills = [...skills].sort();
    const sortedProjects = [...projects].sort();
    
    const payloadString = JSON.stringify({ skills: sortedSkills, projects: sortedProjects });
    const cacheKey = AiCacheService.generateHash(`domain_expansion_${payloadString}`);
    
    // 1. Check AI Cache
    const cached = await aiCache.get<ExpandedDomain[]>(cacheKey, 'domain_expansion');
    if (cached) return cached;

    // 2. Execute Gemini
    try {
      const response = await gemini.executeStructuredPrompt(
        `You are a career counseling AI for software and tech internships.
         Map the user's specific skills and projects into broader career domains.
         Output valid JSON strictly matching the requested schema.`,
        `Skills: ${skills.join(', ')}\nProjects: ${projects.join(', ')}`,
        DomainExpansionResponseSchema
      );

      // Save to cache
      await aiCache.set(cacheKey, 'domain_expansion', response.expansions);
      return response.expansions;

    } catch (error) {
      console.warn('[DomainExpansionService] Gemini failed, using deterministic fallback', error);
      return this.fallbackDeterministic(skills, projects);
    }
  }

  private static fallbackDeterministic(skills: string[], projects: string[]): ExpandedDomain[] {
    const expansions: ExpandedDomain[] = [];
    const allInputs = [...skills, ...projects].map(s => s.toLowerCase());

    if (allInputs.some(s => s.includes('full stack') || s.includes('web') || s.includes('react'))) {
      expansions.push({
        originalTerm: 'Full Stack Development',
        relatedTerms: ['Frontend', 'Backend', 'Web Development', 'Software Engineering'],
        roles: ['Frontend Developer', 'Backend Engineer', 'Full Stack Intern', 'Web Developer'],
        technologies: ['React', 'Next.js', 'Node.js', 'TypeScript', 'PostgreSQL']
      });
    }

    if (allInputs.some(s => s.includes('data') || s.includes('python'))) {
      expansions.push({
        originalTerm: 'Data Science',
        relatedTerms: ['Machine Learning', 'Data Analysis', 'AI', 'Deep Learning'],
        roles: ['Data Science Intern', 'Data Analyst', 'Machine Learning Engineer', 'AI Intern'],
        technologies: ['Python', 'Pandas', 'TensorFlow', 'PyTorch', 'SQL']
      });
    }

    if (expansions.length === 0) {
      expansions.push({
        originalTerm: 'Software Engineering',
        relatedTerms: ['Software Development', 'Programming', 'IT'],
        roles: ['Software Engineering Intern', 'Software Developer Intern'],
        technologies: []
      });
    }

    return expansions;
  }
}
