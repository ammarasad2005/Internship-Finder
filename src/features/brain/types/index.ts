export type QueryCategory = 'skill_based' | 'role_based' | 'technology_based' | 'location_based' | 'company_based';

export interface SearchQuery {
  text: string;
  category: QueryCategory;
  priorityScore: number;
}

export interface ExpandedDomain {
  originalTerm: string;
  relatedTerms: string[];
  roles: string[];
  technologies: string[];
}

export interface ResearchPlan {
  profileId: string;
  sessionId: string;
  expandedDomains: ExpandedDomain[];
  queries: SearchQuery[];
  totalQueriesGenerated: number;
  estimatedTokensRequired: number;
}
