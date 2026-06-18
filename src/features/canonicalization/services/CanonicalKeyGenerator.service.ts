import { InternshipNormalizer } from './InternshipNormalizer.service';

export class CanonicalKeyGenerator {
  /**
   * Generates a deterministic hash/string based on normalized core fields.
   * This prevents database collisions for identical internships posted across multiple boards.
   */
  static generate(company: string, title: string, location: string, sourceUrl: string): { key: string; requiresReview: boolean; reason?: string } {
    const c = InternshipNormalizer.normalizeCompany(company);
    const t = InternshipNormalizer.normalizeTitle(title);
    const l = InternshipNormalizer.normalizeLocation(location);

    let requiresReview = false;
    let reason = undefined;
    let keySuffix = '';

    // 1. Unknown Company Protection
    if (c === 'unknown company' || c === 'unknowncompany' || c === 'unknown') {
      requiresReview = true;
      reason = 'Unknown company';
      keySuffix = `:${this.hashString(sourceUrl)}`;
    }

    // 2. Generic Title Protection
    if (t === 'intern' || t === 'internship' || t === 'trainee') {
      requiresReview = true;
      reason = reason ? `${reason}; Generic title` : 'Generic title';
      if (!keySuffix) keySuffix = `:${this.hashString(sourceUrl)}`;
    }

    // Creates a slug-like key: "devsinc:software_engineer_intern:lahore"
    const key = `${c}:${t}:${l}${keySuffix}`.replace(/\s+/g, '_');
    return { key, requiresReview, reason };
  }

  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
