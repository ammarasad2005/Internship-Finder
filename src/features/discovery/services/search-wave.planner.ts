import { SearchQuery } from '@/features/brain/types';
import { SearchWave, BudgetConfig, ExecutableTask } from '../types';
import { QueryDeduplicationEngine } from './query-deduplication.engine';
import { SearchCoverageAnalyzer } from './search-coverage.analyzer';
import { ProviderRouter } from './provider-router.service';
import { SearchCostEstimator } from './search-cost.estimator';
import { QueryBudgetManager } from './query-budget.manager';

export class SearchWavePlanner {
  /**
   * Orchestrates the planning layer. Takes raw AI-generated queries and processes
   * them into a constrained, optimized execution wave ready for the Worker.
   */
  static buildWave(
    waveNumber: number,
    rawQueries: SearchQuery[], 
    pastQueries: Set<string>, 
    budget: BudgetConfig
  ): SearchWave {
    
    // 1. Deduplicate
    const uniqueQueries = QueryDeduplicationEngine.filterDuplicates(rawQueries, pastQueries);

    // 2. Optimize Coverage (ensure diversity before allocating expensive providers)
    // We sample double the max limit to give the budget manager choices
    const diverseQueries = SearchCoverageAnalyzer.optimizeCoverage(uniqueQueries, budget.maxQueriesPerWave * 2);

    // 3. Provider Selection & Cost Estimation
    const potentialTasks: ExecutableTask[] = [];
    diverseQueries.forEach(query => {
      const provider = ProviderRouter.selectProvider(query);
      if (provider) {
        const cost = SearchCostEstimator.estimateCost(provider.costPerQuery, 1);
        potentialTasks.push({ query, providerId: provider.id, estimatedCost: cost });
      }
    });

    // 4. Budget Constraint Application
    const finalTasks = QueryBudgetManager.applyBudgetConstraints(potentialTasks, budget);

    // 5. Final Coverage Analysis
    const finalQueries = finalTasks.map(t => t.query);
    const coverageMetrics = SearchCoverageAnalyzer.getCoverageMetrics(finalQueries);

    const totalCost = finalTasks.reduce((sum, task) => sum + task.estimatedCost, 0);

    return {
      waveNumber,
      tasks: finalTasks,
      totalEstimatedCost: totalCost,
      coverageMetrics
    };
  }
}
