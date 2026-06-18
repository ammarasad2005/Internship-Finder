import { createClient } from '@/lib/supabase/client';

export class CostTracker {
  private sessionId: string;
  private profileId: string;
  private accumulatedTokens: number = 0;

  constructor(sessionId: string, profileId: string) {
    this.sessionId = sessionId;
    this.profileId = profileId;
  }

  /**
   * Tracks token usage during execution.
   */
  logTokens(tokens: number) {
    this.accumulatedTokens += tokens;
  }

  /**
   * Commits the accumulated tokens to the database securely.
   */
  async flushToDatabase() {
    if (this.accumulatedTokens === 0) return;
    
    const supabase = createClient();
    await supabase.from('research_usage_logs').insert({
      session_id: this.sessionId,
      profile_id: this.profileId,
      tokens_used: this.accumulatedTokens
    });
    
    this.accumulatedTokens = 0;
  }
}
