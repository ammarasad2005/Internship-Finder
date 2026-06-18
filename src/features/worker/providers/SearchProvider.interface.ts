import { SearchResult } from '../types';

export interface SearchProvider {
  /**
   * Uniquely identifies the search provider (e.g., 'google_cse', 'searxng', 'mock').
   */
  name: string;

  /**
   * Executes a search query and returns structured results.
   */
  search(query: string, depth?: number): Promise<SearchResult[]>;
}
