import { InternshipCandidate } from '@/features/extraction/types';
import { InternshipNormalizer } from './InternshipNormalizer.service';

export class DuplicateConfidenceScorer {
  /**
   * Scores the likelihood (0-100) that two candidates are duplicates,
   * even if their canonical keys didn't match perfectly.
   */
  static scoreSimilarity(a: InternshipCandidate, b: InternshipCandidate): number {
    let score = 0;

    const compA = InternshipNormalizer.normalizeCompany(a.company);
    const compB = InternshipNormalizer.normalizeCompany(b.company);
    
    if (compA === compB) score += 40;

    const titleA = InternshipNormalizer.normalizeTitle(a.title);
    const titleB = InternshipNormalizer.normalizeTitle(b.title);
    
    if (titleA === titleB) score += 40;
    else if (titleA.includes(titleB) || titleB.includes(titleA)) score += 20;

    const locA = InternshipNormalizer.normalizeLocation(a.location);
    const locB = InternshipNormalizer.normalizeLocation(b.location);
    
    if (locA === locB) score += 20;

    return Math.min(score, 100);
  }
}
