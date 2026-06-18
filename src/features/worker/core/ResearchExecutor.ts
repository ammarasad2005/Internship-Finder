import { SearchQuery } from '@/features/brain/types';
import { SearchWave, ExecutableTask, WorkerMetrics } from '@/features/discovery/types';
import { ProviderRegistry } from '@/features/discovery/services/provider-registry.service';
import { ProviderRouter } from '@/features/discovery/services/provider-router.service';
import { SessionService } from '@/features/research/services/session.service';

export class ResearchExecutor {
  private sessionId: string;
  private metrics: WorkerMetrics;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
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
   * Executes the entire optimized research wave safely.
   */
  async executeWave(wave: SearchWave): Promise<WorkerMetrics> {
    const startTime = Date.now();
    await SessionService.publishEvent(this.sessionId, 'search_wave_started', `Starting execution wave ${wave.waveNumber} with ${wave.tasks.length} planned tasks.`);

    for (const task of wave.tasks) {
      await this.executeTaskWithRetry(task);
      // Wait to respect rate limits between queries
      await new Promise(r => setTimeout(r, 500)); 
    }

    this.metrics.executionTimeMs = Date.now() - startTime;
    await SessionService.publishEvent(this.sessionId, 'search_wave_completed', `Execution wave finished. Discovered ${this.metrics.resultsFound} raw links.`);
    
    return this.metrics;
  }

  /**
   * Internal function to execute a single task with exponential backoff and failover routing.
   */
  private async executeTaskWithRetry(task: ExecutableTask, attempt: number = 1) {
    const providerConfig = ProviderRegistry.getProvider(task.providerId);
    
    if (!providerConfig || !providerConfig.instance) {
      await SessionService.publishEvent(this.sessionId, 'query_failed', `Provider ${task.providerId} not found or disabled.`);
      return;
    }
    
    const provider = providerConfig.instance;

    try {
      this.metrics.queriesExecuted++;
      // A real execution would send this to the physical provider instance
      const results = await provider.search(task.query.text);
      
      this.metrics.resultsFound += results.length;
      
      // REPORT SUCCESS TO CIRCUIT BREAKER AND QUOTA TRACKER
      ProviderRegistry.reportSuccess(task.providerId, providerConfig.costPerQuery);

      await SessionService.createRun(
        this.sessionId, 
        task.query.text, 
        provider.name, 
        1, 
        results.length
      );

    } catch (error: any) {
      this.metrics.errorsEncountered++;
      
      // REPORT FAILURE TO CIRCUIT BREAKER
      ProviderRegistry.reportFailure(task.providerId);

      const errorMessage = error.message || '';
      // Fatal errors should not trigger local retry loop. 
      const isFatalError = errorMessage.includes('429') || errorMessage.includes('403') || errorMessage.includes('400');

      if (!isFatalError && attempt < 3) {
        // Transient network error (e.g. timeout) - exponential backoff
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, backoffMs));
        await this.executeTaskWithRetry(task, attempt + 1);
      } else {
        await SessionService.publishEvent(this.sessionId, 'query_failed', `Failed to execute query: "${task.query.text}" on ${provider.name}. Reason: ${errorMessage}`);
        
        // FAILOVER LOGIC
        // The current provider failed permanently. The Router automatically excludes degraded providers.
        const failoverProvider = ProviderRouter.getFailover(task.providerId, task.query);
        
        if (failoverProvider && failoverProvider.instance) {
          await SessionService.publishEvent(this.sessionId, 'failover_triggered', `Rerouting query "${task.query.text}" to backup provider: ${failoverProvider.name}`);
          
          // Re-map the task to the failover provider and start fresh
          task.providerId = failoverProvider.id;
          task.estimatedCost = failoverProvider.costPerQuery;
          await this.executeTaskWithRetry(task, 1);
        } else {
          await SessionService.publishEvent(this.sessionId, 'query_failed', `No failover providers available for query: "${task.query.text}". Abandoning task.`);
        }
      }
    }
  }
}
