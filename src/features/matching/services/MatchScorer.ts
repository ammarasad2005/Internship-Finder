import { ActiveProfileData, InternshipData, MatchScore } from '../types';

export class MatchScorer {
  /**
   * Deterministically scores an internship against a user profile.
   * Max base score is 85. The remaining 15 points are reserved for the AI semantic boost.
   */
  public static score(profile: ActiveProfileData, internship: InternshipData): MatchScore {
    const location_score = this.scoreLocationAndRemote(profile, internship);
    const tags_score = this.scoreTagsAndSkills(profile, internship);
    const title_score = this.scoreTitleRelevance(profile, internship);
    const project_score = this.scoreProjectRelevance(profile, internship);
    
    let feedback_adjustment = 0;
    if (profile.feedbackProfile) {
      feedback_adjustment = this.scoreFeedback(profile.feedbackProfile, internship);
    }

    const total_score = location_score + tags_score + title_score + project_score + feedback_adjustment;

    return {
      total_score,
      location_score,
      tags_score,
      title_score,
      project_score,
      ai_boost: 0 // To be filled by MatchExplanationService
    };
  }

  private static scoreFeedback(feedbackProfile: import('@/features/brain/services/FeedbackProfileBuilder').FeedbackProfile, internship: InternshipData): number {
    let adjustment = 0;
    const companyName = internship.company_name.toLowerCase().trim();
    const title = internship.role_title.toLowerCase().trim();

    // Positive Company Boost
    if (feedbackProfile.positiveCompanies.has(companyName)) {
      adjustment += 15;
    }

    // Positive Tag Boost
    if (internship.tags && internship.tags.length > 0) {
      let tagOverlap = 0;
      for (const tag of internship.tags) {
        if (feedbackProfile.positiveTags.has(tag.toLowerCase().trim())) {
          tagOverlap++;
        }
      }
      if (tagOverlap > 0) {
        adjustment += Math.min(tagOverlap * 5, 10);
      }
    }

    // Negative Company Penalty
    if (feedbackProfile.negativeCompanies.has(companyName)) {
      adjustment -= 50;
    }

    // Negative Keyword Penalty
    let negativeKeywordHit = false;
    for (const kw of feedbackProfile.negativeKeywords) {
      if (title.includes(kw) || companyName.includes(kw)) {
        negativeKeywordHit = true;
        break;
      }
    }
    if (negativeKeywordHit) {
      adjustment -= 30;
    }

    // Cap the adjustments to avoid pure echo chamber
    if (adjustment > 20) adjustment = 20;
    if (adjustment < -50) adjustment = -50;

    return adjustment;
  }

  private static scoreLocationAndRemote(profile: ActiveProfileData, internship: InternshipData): number {
    let score = 0;
    
    // Remote Preference (Max 10)
    const roleIsRemote = internship.location?.toLowerCase().includes('remote') || internship.role_title.toLowerCase().includes('remote');
    if (profile.remote_preference === 'remote' && roleIsRemote) {
      score += 10;
    } else if (profile.remote_preference === 'onsite' && !roleIsRemote) {
      score += 10;
    } else if (profile.remote_preference === 'hybrid' || profile.remote_preference === 'no_preference') {
      score += 10; // Flexible users get points
    } else if (!profile.remote_preference) {
      score += 5; // Default if not specified
    }

    // Location Preference (Max 10)
    if (profile.location_preference && internship.location) {
      const pLoc = profile.location_preference.toLowerCase();
      const iLoc = internship.location.toLowerCase();
      if (iLoc.includes(pLoc) || pLoc.includes(iLoc)) {
        score += 10;
      }
    } else if (!profile.location_preference) {
      score += 10; // Flexible location gets full points
    }

    return Math.min(score, 20);
  }

  private static scoreTagsAndSkills(profile: ActiveProfileData, internship: InternshipData): number {
    if (!profile.skills.length || !internship.tags.length) return 0;

    let overlapCount = 0;
    const profileSkills = new Set(profile.skills.map(s => s.toLowerCase().trim()));
    
    for (const tag of internship.tags) {
      if (profileSkills.has(tag.toLowerCase().trim())) {
        overlapCount++;
      }
    }

    // Scale 0 to 20 based on overlap. 3 overlaps = max score.
    const score = Math.min((overlapCount / 3) * 20, 20);
    return Math.round(score);
  }

  private static scoreTitleRelevance(profile: ActiveProfileData, internship: InternshipData): number {
    // If the user has explicitly stated skills, check if the role title matches their skills
    if (!profile.skills.length) return 10; // Neutral score

    let score = 0;
    const lowerTitle = internship.role_title.toLowerCase();

    // Check if any skill or project technology is in the title (e.g. "React Developer")
    const keywords = [...profile.skills];
    for (const p of profile.projects) {
      if (p.technologies) keywords.push(...p.technologies);
    }

    const uniqueKeywords = Array.from(new Set(keywords.map(k => k.toLowerCase().trim())));
    
    for (const kw of uniqueKeywords) {
      if (lowerTitle.includes(kw)) {
        score += 10;
      }
    }

    // Software engineer generic boost
    if (lowerTitle.includes('software') || lowerTitle.includes('developer') || lowerTitle.includes('engineer')) {
      score += 5;
    }

    return Math.min(score, 20);
  }

  private static scoreProjectRelevance(profile: ActiveProfileData, internship: InternshipData): number {
    if (!profile.projects.length || !internship.description) return 0;

    let score = 0;
    const lowerDesc = internship.description.toLowerCase();

    for (const project of profile.projects) {
      // Check technologies
      if (project.technologies) {
        for (const tech of project.technologies) {
          if (lowerDesc.includes(tech.toLowerCase().trim())) {
            score += 5;
          }
        }
      }
      
      // Check project name loosely
      if (lowerDesc.includes(project.name.toLowerCase().trim())) {
        score += 5;
      }
    }

    return Math.min(score, 25);
  }
}
