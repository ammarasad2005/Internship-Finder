import { InternshipCandidate } from '@/features/extraction/types';

export class InternshipMergeStrategy {
  /**
   * Merges an incoming candidate into an existing canonical payload.
   * Prefer official career pages over third party job boards.
   */
  static merge(existing: Partial<InternshipCandidate>, incoming: InternshipCandidate): Partial<InternshipCandidate> {
    const isIncomingOfficial = incoming.sourceUrl.includes(incoming.sourceDomain) && !incoming.sourceUrl.includes('linkedin.com');
    const isExistingOfficial = existing.sourceUrl && existing.sourceUrl.includes(existing.sourceDomain || '') && !existing.sourceUrl.includes('linkedin.com');

    const merged = { ...existing };

    // 1. Better Description wins
    if (incoming.description.length > (existing.description?.length || 0)) {
      merged.description = incoming.description;
    }

    // 2. Official Career Page fields override everything
    if (isIncomingOfficial && !isExistingOfficial) {
      merged.title = incoming.title;
      merged.applicationUrl = incoming.applicationUrl;
      merged.sourceUrl = incoming.sourceUrl; // Promote to primary source
    }

    // 3. Keep the highest confidence score
    merged.confidenceScore = Math.max(existing.confidenceScore || 0, incoming.confidenceScore);

    return merged;
  }
}
