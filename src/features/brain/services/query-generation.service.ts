import { SearchQuery, ExpandedDomain } from '../types';

export class QueryGenerationService {
  /**
   * Generates a diverse set of search intents based on expanded domains and preferences.
   * FUTURE AI INTEGRATION: Feed the expanded domains to an LLM to generate highly nuanced,
   * human-like search strings tailored for specific platforms (LinkedIn, Google Dorks, etc).
   */
  static generateQueries(
    expansions: ExpandedDomain[], 
    locationPref: string | null,
    remotePref: string | null
  ): SearchQuery[] {
    const queries: SearchQuery[] = [];
    const location = locationPref || 'Pakistan';
    const remoteSuffix = remotePref === 'remote' ? ' remote' : '';

    expansions.forEach(domain => {
      // Role based queries
      domain.roles.forEach(role => {
        queries.push({
          text: `${role} internship ${location}${remoteSuffix}`.trim(),
          category: 'role_based',
          priorityScore: 0 // to be scored later
        });
      });

      // Technology based queries
      domain.technologies.forEach(tech => {
        queries.push({
          text: `${tech} intern ${location}${remoteSuffix}`.trim(),
          category: 'technology_based',
          priorityScore: 0
        });
        
        queries.push({
          text: `${tech} student developer ${location}`.trim(),
          category: 'technology_based',
          priorityScore: 0
        });
      });

      // Skill/General based queries
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
