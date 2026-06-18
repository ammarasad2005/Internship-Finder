export type OnboardingMethod = 'resume' | 'linkedin' | 'quickstart' | null;

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  location_preference?: string;
  remote_preference?: string;
  duration_preference?: string;
  paid_preference?: boolean;
  confidence_score: number;
}

export interface ProfileSkill {
  id: string;
  skill_name: string;
  source: 'resume_parse' | 'manual' | 'ai_enrichment' | 'linkedin';
}

export interface ProfileProject {
  id: string;
  project_name: string;
  description: string;
  technologies: string[];
  source: 'resume_parse' | 'manual' | 'ai_enrichment' | 'linkedin';
}

export interface OnboardingState {
  method: OnboardingMethod;
  profile: Partial<Profile>;
  skills: ProfileSkill[];
  projects: ProfileProject[];
  step: 'method_selection' | 'data_collection' | 'conversational_enrichment' | 'review';
}
