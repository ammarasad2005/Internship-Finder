import { Database } from '@/lib/supabase/types';

export type SessionStatus = Database['public']['Enums']['search_session_status'];

export interface ResearchSession {
  id: string;
  profile_id: string;
  status: SessionStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ResearchEvent {
  id: string;
  session_id: string;
  event_type: string;
  message: string;
  metadata: any | null;
  created_at: string;
}

export interface ResearchRun {
  id: string;
  session_id: string;
  query_used: string;
  search_provider: string;
  depth_level: number;
  results_found: number;
  created_at: string;
}
