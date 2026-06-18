import { InternshipCandidate } from '@/features/extraction/types';

export interface CanonicalInternship {
  canonicalKey: string;
  title: string;
  company: string;
  location: string;
  description: string;
  applicationUrl: string | null;
  sourceCount: number;
  sourceUrls: string[];
  confidenceScore: number;
  extractedCandidates: InternshipCandidate[];
}
