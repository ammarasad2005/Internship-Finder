import { InternshipCandidate } from '@/features/extraction/types';
import { CanonicalInternship } from '../types';
import { CanonicalKeyGenerator } from './CanonicalKeyGenerator.service';
import { InternshipMergeStrategy } from './InternshipMergeStrategy.service';
import { SourceAggregator } from './SourceAggregator.service';

export class DeduplicationEngine {
  private memoryStore: Map<string, CanonicalInternship> = new Map();

  /**
   * Processes a new candidate, merging it if it exists or creating a new record.
   */
  process(candidate: InternshipCandidate): CanonicalInternship {
    const key = CanonicalKeyGenerator.generate(candidate.company, candidate.title, candidate.location);

    if (this.memoryStore.has(key)) {
      // Merge
      const existing = this.memoryStore.get(key)!;
      
      const mergedCandidate = InternshipMergeStrategy.merge(existing.extractedCandidates[0], candidate);
      
      existing.title = mergedCandidate.title || existing.title;
      existing.description = mergedCandidate.description || existing.description;
      existing.applicationUrl = mergedCandidate.applicationUrl || existing.applicationUrl;
      existing.confidenceScore = mergedCandidate.confidenceScore || existing.confidenceScore;
      
      existing.sourceUrls = SourceAggregator.aggregate(existing.sourceUrls, candidate.sourceUrl);
      existing.sourceCount = existing.sourceUrls.length;
      
      existing.extractedCandidates.push(candidate);
      
      this.memoryStore.set(key, existing);
      return existing;
    }

    // New Record
    const newCanonical: CanonicalInternship = {
      canonicalKey: key,
      title: candidate.title,
      company: candidate.company,
      location: candidate.location,
      description: candidate.description,
      applicationUrl: candidate.applicationUrl,
      sourceCount: 1,
      sourceUrls: [candidate.sourceUrl.split('?')[0]],
      confidenceScore: candidate.confidenceScore,
      extractedCandidates: [candidate]
    };

    this.memoryStore.set(key, newCanonical);
    return newCanonical;
  }

  getResults(): CanonicalInternship[] {
    return Array.from(this.memoryStore.values());
  }
}
