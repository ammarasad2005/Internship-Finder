import { createClient } from '@/lib/supabase/client';
import { ResearchSession, ResearchEvent, SessionStatus } from '../types';

export class SessionService {
  /**
   * Initializes a new research session in 'pending' status.
   */
  static async createSession(profileId: string, supabaseClient?: any): Promise<ResearchSession> {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('search_sessions')
      .insert({ profile_id: profileId, status: 'pending' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    // Publish initial event
    await this.publishEvent(data.id, 'session_created', 'Research session initialized and queued.', null, supabase);
    
    return data as ResearchSession;
  }

  /**
   * Fetches all sessions for a user.
   */
  static async getUserSessions(profileId: string, supabaseClient?: any): Promise<ResearchSession[]> {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
      .from('search_sessions')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as ResearchSession[];
  }

  /**
   * Fetches a specific session and its timeline events.
   */
  static async getSessionDetails(sessionId: string, supabaseClient?: any) {
    const supabase = supabaseClient || createClient();
    const { data: session, error: sessionError } = await supabase
      .from('search_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw new Error(sessionError.message);

    const { data: events, error: eventsError } = await supabase
      .from('research_session_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (eventsError) throw new Error(eventsError.message);

    return { session: session as ResearchSession, events: events as ResearchEvent[] };
  }

  /**
   * Internal worker tool to publish timeline events to the database.
   */
  static async publishEvent(sessionId: string, eventType: string, message: string, metadata: any = null, supabaseClient?: any) {
    const supabase = supabaseClient || createClient();
    await supabase.from('research_session_events').insert({
      session_id: sessionId,
      event_type: eventType,
      message,
      metadata,
    });
  }

  /**
   * Internal worker tool to update session status.
   */
  static async updateSessionStatus(sessionId: string, status: SessionStatus, supabaseClient?: any) {
    const supabase = supabaseClient || createClient();
    const updatePayload: any = { status };
    if (status === 'running') updatePayload.started_at = new Date().toISOString();
    if (status === 'completed' || status === 'failed') updatePayload.completed_at = new Date().toISOString();

    await supabase.from('search_sessions').update(updatePayload).eq('id', sessionId);
  }

  /**
   * Internal worker tool to log a specific research run (search query execution).
   */
  static async createRun(sessionId: string, queryUsed: string, searchProvider: string, depthLevel: number, resultsFound: number, supabaseClient?: any) {
    const supabase = supabaseClient || createClient();
    await supabase.from('research_runs').insert({
      session_id: sessionId,
      query_used: queryUsed,
      search_provider: searchProvider,
      depth_level: depthLevel,
      results_found: resultsFound,
    });
  }

  /**
   * Simulates a background worker executing a research session for demonstration.
   */
  static async simulateWorkerExecution(sessionId: string) {
    // This is purely for Phase 4 mock demonstration
    await this.updateSessionStatus(sessionId, 'running');
    
    const steps = [
      { type: 'profile_validated', msg: 'Profile analysis complete. Confidence score is high.', delay: 2000 },
      { type: 'domain_expansion_started', msg: 'Expanding domain terms using AI...', delay: 3000 },
      { type: 'search_wave_started', msg: 'Initiating search wave 1 across multiple providers.', delay: 4000 },
      { type: 'search_wave_completed', msg: 'Search wave 1 complete. Found 24 potential opportunities.', delay: 3000 },
      { type: 'matching_started', msg: 'Running semantic matching engine to filter noise...', delay: 4000 },
      { type: 'matching_completed', msg: 'Matching complete. 5 strong matches identified.', delay: 2000 },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      await this.publishEvent(sessionId, step.type, step.msg);
    }

    await this.updateSessionStatus(sessionId, 'completed');
  }
}
