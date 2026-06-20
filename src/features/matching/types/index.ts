import { FeedbackProfile } from '@/features/brain/services/FeedbackProfileBuilder';

export interface MatchScore {
  total_score: number;
  location_score: number;    // max 20
  tags_score: number;        // max 20
  project_score: number;     // max 25
  title_score: number;       // max 20
  ai_boost: number;          // max 15
}

export interface MatchResult {
  profile_id: string;
  internship_id: string;
  session_id: string;
  semantic_score: number;
  explanation: string | null;
  score_details: MatchScore;
}

export interface InternshipData {
  id: string;
  canonical_key: string;
  company_name: string;
  role_title: string;
  location: string | null;
  description: string | null;
  application_url: string | null;
  tags: string[];
  is_active: boolean;
  discovered_at: string;
}

export interface ActiveProfileData {
  profile_id: string;
  session_id: string;
  first_name: string | null;
  last_name: string | null;
  location_preference: string | null;
  remote_preference: 'remote' | 'hybrid' | 'onsite' | 'no_preference' | null;
  skills: string[];
  projects: { name: string; description: string | null; technologies: string[] | null }[];
  feedbackProfile?: FeedbackProfile;
}
