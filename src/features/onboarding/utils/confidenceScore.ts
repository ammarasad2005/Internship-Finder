import { Profile, ProfileSkill, ProfileProject } from '../types';

export const CONFIDENCE_THRESHOLD = 70;

export function calculateConfidenceScore(
  profile: Partial<Profile>, 
  skills: ProfileSkill[], 
  projects: ProfileProject[]
): number {
  let score = 0;

  // Basic Information (max 20)
  if (profile.first_name && profile.last_name) score += 10;
  if (profile.location_preference) score += 10;

  // Preferences (max 10)
  if (profile.remote_preference) score += 5;
  if (profile.duration_preference) score += 5;

  // Skills (max 30) - 5 points per skill
  score += Math.min(skills.length * 5, 30);

  // Projects (max 40) - 15 points per project
  score += Math.min(projects.length * 15, 40);

  return Math.min(score, 100);
}
