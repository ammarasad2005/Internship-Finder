import { z } from 'zod';

export const ExpandedDomainSchema = z.object({
  originalTerm: z.string(),
  relatedTerms: z.array(z.string()).max(5),
  roles: z.array(z.string()).max(5),
  technologies: z.array(z.string()).max(5)
});

export const DomainExpansionResponseSchema = z.object({
  expansions: z.array(ExpandedDomainSchema)
});

export type DomainExpansionResponse = z.infer<typeof DomainExpansionResponseSchema>;

export const SearchQuerySchema = z.object({
  text: z.string(),
  category: z.enum(['skill_based', 'role_based', 'technology_based', 'location_based', 'company_based']),
  priorityScore: z.number().min(0).max(100)
});

export const QueryGenerationResponseSchema = z.object({
  queries: z.array(SearchQuerySchema).max(15)
});

export type QueryGenerationResponse = z.infer<typeof QueryGenerationResponseSchema>;
