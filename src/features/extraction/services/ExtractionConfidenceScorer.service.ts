import { InternshipCandidate } from '../types';

export class ExtractionConfidenceScorer {
  /**
   * Scores the extracted candidate from 0 to 100 based on data quality.
   */
  static score(candidate: Partial<InternshipCandidate>): number {
    let score = 0;

    // Title checks
    if (candidate.title) {
      score += 20;
      const lowerTitle = candidate.title.toLowerCase();
      if (lowerTitle.includes('intern') || lowerTitle.includes('trainee') || lowerTitle.includes('student')) {
        score += 15; // High confidence it's actually an internship
      }
    }

    // Company checks
    if (candidate.company && candidate.company !== 'Unknown Company') {
      score += 20;
    }

    // Location checks
    if (candidate.location && candidate.location !== 'Remote / Unspecified') {
      score += 10;
    }

    // Description checks
    if (candidate.description && candidate.description.length > 50) {
      score += 25;
      
      const lowerDesc = candidate.description.toLowerCase();
      if (lowerDesc.includes('requirements') || lowerDesc.includes('qualifications')) {
        score += 10;
      }
    }

    return Math.min(score, 100);
  }
}
