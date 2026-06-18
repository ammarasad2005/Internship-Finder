import { WorkerLifecycle } from './core/WorkerLifecycle';

export class MockWorker {
  /**
   * Acts as the CLI entrypoint for a GitHub Action or Cron Job.
   */
  static async start(sessionId: string, profileId: string) {
    console.log(`[Worker] Starting execution for Session: ${sessionId}`);
    
    // In a real GitHub action, this would be a standalone Node script using @supabase/supabase-js 
    // configured with a SERVICE_ROLE_KEY to bypass RLS.
    await WorkerLifecycle.runSession(sessionId, profileId);
    
    console.log(`[Worker] Execution finished.`);
  }
}
