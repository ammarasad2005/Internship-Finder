import { SearchQuery } from '../types';

export class QueryRankingService {
  /**
   * Assigns a deterministic priority score to queries.
   * FUTURE AI INTEGRATION: Use an AI ranking model or embed the queries to check 
   * semantic density against the user's specific past project experiences.
   */
  static rankQueries(queries: SearchQuery[]): SearchQuery[] {
    return queries.map(query => {
      let score = 50; // Base score

      // Role based queries usually yield the best direct job board hits
      if (query.category === 'role_based') score += 30;
      
      // Tech based queries are great for finding niche companies
      if (query.category === 'technology_based') score += 20;

      // Penalize overly generic skill queries slightly
      if (query.category === 'skill_based') score -= 10;

      // Boost specific keyword configurations
      if (query.text.includes('internship') && !query.text.includes('opportunities')) score += 5;
      
      // Add a slight deterministic random jitter to break ties (pseudo-random based on length)
      score += (query.text.length % 5);

      return { ...query, priorityScore: Math.min(score, 100) };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
