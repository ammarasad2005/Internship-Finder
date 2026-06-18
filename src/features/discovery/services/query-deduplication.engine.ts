import { SearchQuery } from '@/features/brain/types';

export class QueryDeduplicationEngine {
  /**
   * Filters out queries that have already been executed in previous waves or sessions.
   * Uses case-insensitive exact matching. Future integration could use fuzzy matching.
   */
  static filterDuplicates(queries: SearchQuery[], pastQueries: Set<string>): SearchQuery[] {
    return queries.filter(q => !pastQueries.has(q.text.toLowerCase().trim()));
  }
}
