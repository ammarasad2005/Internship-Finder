import { SearchResult } from '@/features/worker/types';
import { InternshipCandidate, PageClassification } from '../types';
import { PageFetcher } from './PageFetcher.service';
import { PageClassifier } from './PageClassifier.service';
import { InternshipExtractor } from './InternshipExtractor.service';
import { ExtractionConfidenceScorer } from './ExtractionConfidenceScorer.service';
import { CandidateValidator } from './CandidateValidator.service';

export class ExtractionEngine {
  /**
   * Orchestrates the entire extraction pipeline.
   * SearchResult -> HTML -> Classification -> Candidate -> Validation
   */
  static async processSearchResult(result: SearchResult): Promise<{
    candidate: InternshipCandidate | null;
    classification: PageClassification;
    reason?: string;
  }> {
    // 1. Fetch HTML
    const html = await PageFetcher.fetchHtml(result.url);
    if (!html) {
      return { candidate: null, classification: 'irrelevant', reason: 'Failed to fetch HTML' };
    }

    // 2. Classify Page
    const classification = PageClassifier.classify(result.url, html);
    
    // We only want to extract from likely internship postings
    if (classification === 'irrelevant' || classification === 'article' || classification === 'company_homepage') {
      return { candidate: null, classification, reason: 'Page classified as not an internship listing' };
    }

    // 3. Extract Data deterministically
    const partialCandidate = InternshipExtractor.extract(result.url, html);

    // Provide fallbacks from the SearchResult if extraction failed
    if (!partialCandidate.title || partialCandidate.title.length < 5) partialCandidate.title = result.title;
    if (!partialCandidate.description || partialCandidate.description.length < 50) partialCandidate.description = result.snippet;

    // 4. Score Confidence
    partialCandidate.confidenceScore = ExtractionConfidenceScorer.score(partialCandidate);

    // 5. Validate Candidate
    const validation = CandidateValidator.validate(partialCandidate);
    
    if (!validation.isValid) {
      return { candidate: null, classification, reason: validation.reason };
    }

    return {
      candidate: partialCandidate as InternshipCandidate,
      classification
    };
  }
}
