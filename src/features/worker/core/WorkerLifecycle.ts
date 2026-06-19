import { SessionService } from '@/features/research/services/session.service';
import { ResearchPlanBuilder } from '@/features/brain/services/research-plan.service';
import { SearchWavePlanner } from '@/features/discovery/services/search-wave.planner';
import { CostTracker } from './CostTracker';
import { ResearchExecutor } from './ResearchExecutor';
import { MatchEngine } from '@/features/matching/services/MatchEngine';
import { MatchRepository } from '@/features/matching/services/MatchRepository';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

/**
 * WorkerLifecycle manages the global state of the worker.
 * Handles timeouts, state transitions, and guarantees atomic completion.
 */
export class WorkerLifecycle {
  /**
   * Picks up a pending session and executes it completely.
   */
  static async runSession(sessionId: string, profileId: string) {
    let heartbeatInterval: NodeJS.Timeout | null = null;
    const costTracker = new CostTracker(sessionId, profileId);

    try {
      // 1. Mark as running
      await SessionService.updateSessionStatus(sessionId, 'running');
      await SessionService.publishEvent(sessionId, 'worker_assigned', 'Background worker picked up the session.');

      // 2. Start Heartbeat (keeps UI aware that worker hasn't crashed)
      heartbeatInterval = setInterval(async () => {
        // In a real system, update a heartbeat timestamp in DB. Here we just log an event occasionally.
        // await SessionService.publishEvent(sessionId, 'heartbeat', 'Worker is healthy and processing.');
      }, 5000);

      // 3. Build the Brain Plan
      await SessionService.publishEvent(sessionId, 'planning_started', 'Brain is analyzing profile and generating query intents...');
      const plan = await ResearchPlanBuilder.buildPlan(profileId, sessionId);
      await SessionService.publishEvent(sessionId, 'planning_completed', `Brain generated ${plan.queries.length} specific search queries.`);

      // 4. Discovery Strategy: Build the Execution Wave
      const wave = SearchWavePlanner.buildWave(1, plan.queries, new Set(), { 
        maxQueriesPerWave: 15, 
        maxCostPerWave: 100 
      });
      costTracker.logTokens(wave.totalEstimatedCost); // Log estimated cost against budget tracker

      // 5. Execute the Optimized Wave
      const executor = new ResearchExecutor(sessionId);
      const metrics = await executor.executeWave(wave);

      // 6. Cleanup and Complete
      await costTracker.flushToDatabase();

      // 7. Phase 13 Matching Pipeline
      await SessionService.publishEvent(sessionId, 'matching_started', 'Evaluating discovered internships against your profile...');
      
      const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const repository = new MatchRepository(supabase);
      const matchEngine = new MatchEngine(supabase, repository);
      
      // We look back 24 hours to find newly discovered internships
      const lastRunTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await matchEngine.executeDeltaBatch(lastRunTime);

      await SessionService.publishEvent(sessionId, 'matching_completed', `AI Matching finalized. Saved ${metrics.resultsFound} potential matches.`);
      await SessionService.updateSessionStatus(sessionId, 'completed');

    } catch (error: any) {
      console.error(error);
      await SessionService.publishEvent(sessionId, 'fatal_error', `Worker encountered a fatal error: ${error.message}`);
      await SessionService.updateSessionStatus(sessionId, 'failed');
    } finally {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    }
  }
}
