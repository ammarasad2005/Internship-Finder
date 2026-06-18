import { ResearchPlan, SearchQuery } from '@/features/brain/types';
import { SearchProvider } from '../providers/SearchProvider.interface';
import { SessionService } from '@/features/research/services/session.service';
import { WorkerMetrics } from '../types';

export class ResearchExecutor {
  private sessionId: string;
  private provider: SearchProvider;
  private metrics: WorkerMetrics;

  constructor(sessionId: string, provider: SearchProvider) {
    this.sessionId = sessionId;
    this.provider = provider;
    this.metrics = {
      queriesExecuted: 0,
      resultsFound: 0,
      internshipsExtracted: 0,
      totalTokensUsed: 0,
      executionTimeMs: 0,
      errorsEncountered: 0
    };
  }

  /**
   * Executes the entire research plan safely.
   */
  async executePlan(plan: ResearchPlan): Promise<WorkerMetrics> {
    const startTime = Date.now();
    await SessionService.publishEvent(this.sessionId, 'search_wave_started', `Starting execution with ${plan.queries.length} planned queries.`);

    for (const query of plan.queries) {
      await this.executeQueryWithRetry(query);
      // Wait to respect rate limits
      await new Promise(r => setTimeout(r, 500)); 
    }

    this.metrics.executionTimeMs = Date.now() - startTime;
    await SessionService.publishEvent(this.sessionId, 'search_wave_completed', `Execution finished. Discovered ${this.metrics.resultsFound} raw links.`);
    
    return this.metrics;
  }

  /**
   * Internal function to execute a single query with exponential backoff.
   */
  private async executeQueryWithRetry(query: SearchQuery, attempt: number = 1) {
    try {
      this.metrics.queriesExecuted++;
      // A real execution would send this to the provider
      const results = await this.provider.search(query.text);
      
      this.metrics.resultsFound += results.length;
      
      await SessionService.createRun(
        this.sessionId, 
        query.text, 
        this.provider.name, 
        1, 
        results.length
      );

    } catch (error: any) {
      this.metrics.errorsEncountered++;
      if (attempt < 3) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, backoffMs));
        await this.executeQueryWithRetry(query, attempt + 1);
      } else {
        await SessionService.publishEvent(this.sessionId, 'query_failed', `Failed to execute query: "${query.text}" after 3 attempts.`);
      }
    }
  }
}
