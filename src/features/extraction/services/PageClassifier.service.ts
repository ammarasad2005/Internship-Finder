import { PageClassification } from '../types';

export class PageClassifier {
  /**
   * Deterministically classifies a page based on its URL and HTML content.
   */
  static classify(url: string, html: string): PageClassification {
    const lowerUrl = url.toLowerCase();
    const lowerHtml = html.toLowerCase();

    // 1. Check for specific job boards
    if (
      lowerUrl.includes('linkedin.com/jobs') || 
      lowerUrl.includes('rozee.pk') || 
      lowerUrl.includes('mustakbil.com') ||
      lowerUrl.includes('indeed.com') ||
      lowerUrl.includes('glassdoor.com')
    ) {
      // It's a job board. Is it a specific listing or a search page?
      if (lowerUrl.includes('/view/') || lowerUrl.includes('/job/') || lowerUrl.includes('/detail/')) {
        return 'job_board_listing';
      }
      return 'irrelevant'; // E.g., a search results page
    }

    // 2. Check for generic articles/blogs
    if (lowerUrl.includes('/blog/') || lowerUrl.includes('/article/') || lowerUrl.includes('medium.com')) {
      return 'article';
    }

    // 3. Check for specific career listing patterns on official domains
    if (
      lowerUrl.includes('/careers/') || 
      lowerUrl.includes('/jobs/') || 
      lowerUrl.includes('lever.co') || 
      lowerUrl.includes('greenhouse.io') ||
      lowerUrl.includes('workable.com')
    ) {
      // Does it look like a specific job posting?
      const isSpecificPosting = 
        lowerHtml.includes('apply now') || 
        lowerHtml.includes('submit application') ||
        lowerHtml.includes('job description');
        
      if (isSpecificPosting) {
        return 'internship_listing';
      }
      return 'career_page';
    }

    // 4. Heuristic Fallback based on content
    if (lowerHtml.includes('internship') || lowerHtml.includes('intern')) {
      if (lowerHtml.includes('apply now') || lowerHtml.includes('responsibilities') || lowerHtml.includes('requirements')) {
        return 'internship_listing';
      }
    }

    // 5. If it's just the root domain, it's likely a company homepage
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.pathname === '/' || parsedUrl.pathname === '') {
        return 'company_homepage';
      }
    } catch {
      // Ignore URL parse errors
    }

    return 'irrelevant';
  }
}
