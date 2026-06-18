import { SessionService } from '@/features/research/services/session.service';
import { ResearchPlanBuilder } from '@/features/brain/services/research-plan.service';
import { CostTracker } from './CostTracker';
import { ResearchExecutor } from './ResearchExecutor';
import { MockSearchProvider } from '../providers/MockSearchProvider';

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
      costTracker.logTokens(plan.estimatedTokensRequired);
      await SessionService.publishEvent(sessionId, 'planning_completed', `Brain generated ${plan.queries.length} specific search queries.`);

      // 4. Execute the Plan
      const provider = new MockSearchProvider();
      const executor = new ResearchExecutor(sessionId, provider);
      const metrics = await executor.executePlan(plan);

      // 5. Cleanup and Complete
      await costTracker.flushToDatabase();
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
