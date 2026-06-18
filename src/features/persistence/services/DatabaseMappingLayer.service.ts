import { CanonicalInternship } from '@/features/canonicalization/types';
import { InternshipRow, InternshipSourceRow } from '../types';

export class DatabaseMappingLayer {
  /**
   * Maps an in-memory CanonicalInternship to a Supabase-compatible row.
   */
  static toInternshipRow(canonical: CanonicalInternship): InternshipRow {
    return {
      canonical_key: canonical.canonicalKey,
      company_name: canonical.company,
      role_title: canonical.title,
      location: canonical.location,
      description: canonical.description,
      application_url: canonical.applicationUrl,
      // Provide basic deterministic tags to save AI processing later
      tags: this.generateDeterministicTags(canonical),
      is_active: true // Always true on first discovery or subsequent updates
    };
  }

  /**
   * Generates an array of source rows for a given internship ID.
   */
  static toSourceRows(internshipId: string, canonical: CanonicalInternship): InternshipSourceRow[] {
    return canonical.sourceUrls.map(url => ({
      internship_id: internshipId,
      source_url: url,
      source_type: this.determineSourceType(url, canonical.company),
      is_primary: this.determineSourceType(url, canonical.company) === 'official_career_page'
    }));
  }

  private static determineSourceType(url: string, company: string): InternshipSourceRow['source_type'] {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('linkedin.com')) return 'linkedin';
    if (lowerUrl.includes('rozee.pk') || lowerUrl.includes('indeed.com') || lowerUrl.includes('glassdoor.com')) return 'job_board';
    
    // Simple heuristic: if the URL contains the company name or known ATS, it's likely official
    const normalizedCompany = company.toLowerCase().replace(/\s+/g, '');
    if (lowerUrl.includes(normalizedCompany) || lowerUrl.includes('greenhouse.io') || lowerUrl.includes('lever.co')) {
      return 'official_career_page';
    }
    
    return 'other';
  }

  private static generateDeterministicTags(canonical: CanonicalInternship): string[] {
    const tags = new Set<string>();
    const text = `${canonical.title} ${canonical.description}`.toLowerCase();

    if (text.includes('software') || text.includes('developer') || text.includes('engineer')) tags.add('engineering');
    if (text.includes('data') || text.includes('analytics')) tags.add('data');
    if (text.includes('design') || text.includes('ui/ux')) tags.add('design');
    if (text.includes('marketing') || text.includes('seo')) tags.add('marketing');
    if (canonical.location.toLowerCase().includes('remote')) tags.add('remote');

    return Array.from(tags);
  }
}
