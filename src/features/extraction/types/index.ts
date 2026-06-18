export type PageClassification = 
  | 'internship_listing'
  | 'career_page'
  | 'job_board_listing'
  | 'company_homepage'
  | 'article'
  | 'irrelevant';

export interface InternshipCandidate {
  title: string;
  company: string;
  location: string;
  sourceUrl: string;
  sourceDomain: string;
  applicationUrl: string | null;
  description: string;
  confidenceScore: number;
  extractionSource: 'deterministic' | 'llm';
}
