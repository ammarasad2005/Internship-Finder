import { SearchQuery } from '@/features/brain/types';

export class SearchCoverageAnalyzer {
  /**
   * Calculates the categorical distribution of a set of queries.
   */
  static getCoverageMetrics(queries: SearchQuery[]): Record<string, number> {
    const metrics: Record<string, number> = {};
    if (queries.length === 0) return metrics;

    queries.forEach(q => {
      metrics[q.category] = (metrics[q.category] || 0) + 1;
    });
    
    // Convert to percentages
    const total = queries.length;
    Object.keys(metrics).forEach(k => {
      metrics[k] = Math.round((metrics[k] / total) * 100);
    });
    
    return metrics;
  }

  /**
   * Re-sorts queries to ensure a diverse distribution of categories, preventing 
   * the budget from being consumed by only one type of query (e.g. all skill_based).
   */
  static optimizeCoverage(queries: SearchQuery[], targetCount: number): SearchQuery[] {
    const categorized: Record<string, SearchQuery[]> = {};
    
    // Group by category, keeping existing priority sorting intact
    queries.forEach(q => {
      if (!categorized[q.category]) categorized[q.category] = [];
      categorized[q.category].push(q);
    });

    const optimized: SearchQuery[] = [];
    let keys = Object.keys(categorized);
    
    // Round-robin selection across categories
    while(optimized.length < targetCount && keys.length > 0) {
      for (const k of [...keys]) {
        if (categorized[k].length > 0) {
          optimized.push(categorized[k].shift()!);
          if (optimized.length >= targetCount) break;
        } else {
          // Remove exhausted category from rotation
          keys = keys.filter(key => key !== k); 
        }
      }
    }

    // Restore strict priority sorting on the filtered, diverse set
    return optimized.sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
