import { SearchProvider } from './SearchProvider.interface';
import { SearchResult } from '../types';

export class MockSearchProvider implements SearchProvider {
  name = 'mock_provider';

  async search(query: string, depth: number = 1): Promise<SearchResult[]> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate deterministic failures for robustness testing (10% chance)
    if (Math.random() < 0.1) {
      throw new Error(`MockSearchProvider Error: Connection timeout for query "${query}"`);
    }

    return [
      {
        title: `Software Engineer Intern - ${query.split(' ')[0]}`,
        url: `https://example.com/jobs/${Math.random().toString(36).substring(7)}`,
        snippet: `Join our team as an intern and work on cutting-edge technologies.`,
        sourceType: 'official_career_page',
        source: 'example.com',
        query: query
      },
      {
        title: `Remote Internship 2026 - ${query.split(' ')[0]}`,
        url: `https://linkedin.com/jobs/view/${Math.random().toString(36).substring(7)}`,
        snippet: `Exciting remote internship opportunity.`,
        sourceType: 'linkedin',
        source: 'linkedin.com',
        query: query
      }
    ];
  }
}
