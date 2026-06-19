import { Database } from '@/lib/supabase/types';

export type UserFeedback = Database['public']['Enums']['user_feedback_type'];

/**
 * A fully-hydrated match row joined with its internship data.
 * This is the shape consumed by the UI layer.
 */
export interface MatchWithInternship {
  id: string;
  profile_id: string;
  internship_id: string;
  session_id: string;
  semantic_score: number | null;
  explanation: string | null;
  user_feedback: UserFeedback | null;
  created_at: string;
  internship: {
    id: string;
    company_name: string;
    role_title: string;
    location: string | null;
    description: string | null;
    application_url: string | null;
    tags: string[] | null;
  };
}

/**
 * Human-readable label derived from a 0–100 semantic score.
 */
export type MatchQualityLabel =
  | 'Excellent Match'
  | 'Strong Match'
  | 'Good Match'
  | 'Possible Match'
  | 'Low Match';

export function getMatchQualityLabel(score: number | null): MatchQualityLabel {
  if (score === null || score < 25) return 'Low Match';
  if (score < 40) return 'Possible Match';
  if (score < 60) return 'Good Match';
  if (score < 80) return 'Strong Match';
  return 'Excellent Match';
}
