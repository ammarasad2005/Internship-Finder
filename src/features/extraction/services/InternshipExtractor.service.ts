import * as cheerio from 'cheerio';
import { InternshipCandidate } from '../types';

export class InternshipExtractor {
  /**
   * Deterministically extracts internship metadata using Cheerio heuristics.
   */
  static extract(url: string, html: string): Partial<InternshipCandidate> {
    const $ = cheerio.load(html);
    
    // 1. Extract Title
    let title = $('h1').first().text().trim() || $('title').text().trim();
    // Clean up generic titles
    title = title.replace(/Careers \| .*/i, '').replace(/Job Application for .*/i, 'Job Application').trim();

    // 2. Extract Company
    let company = '';
    // Look for standard structured data (JSON-LD)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        if (json['@type'] === 'JobPosting' && json.hiringOrganization) {
          company = json.hiringOrganization.name;
          if (!title || title.length > 50) title = json.title;
        }
      } catch (e) {
        // ignore
      }
    });

    // Fallback company extraction (meta tags or domain)
    if (!company) {
      company = $('meta[property="og:site_name"]').attr('content') || '';
    }
    if (!company) {
      try {
        company = new URL(url).hostname.replace('www.', '').split('.')[0];
        // Capitalize first letter
        company = company.charAt(0).toUpperCase() + company.slice(1);
      } catch {
        company = 'Unknown Company';
      }
    }

    // 3. Extract Location
    let location = 'Remote / Unspecified';
    const possibleLocationSelects = $('.location, .job-location, [data-qa="job-location"]').text().trim();
    if (possibleLocationSelects) {
      location = possibleLocationSelects;
    }

    // 4. Extract Application URL
    let applicationUrl = null;
    const applyBtn = $('a:contains("Apply"), a:contains("Submit")').first();
    if (applyBtn.length > 0) {
      applicationUrl = applyBtn.attr('href') || null;
      // Resolve relative URLs
      if (applicationUrl && applicationUrl.startsWith('/')) {
        try {
          const baseUrl = new URL(url);
          applicationUrl = `${baseUrl.protocol}//${baseUrl.host}${applicationUrl}`;
        } catch {
          // ignore
        }
      }
    }

    // 5. Extract Description
    let description = '';
    const descEl = $('.job-description, .description, #content, main').first();
    if (descEl.length > 0) {
      description = descEl.text().trim();
    } else {
      // Fallback: grab all paragraphs
      description = $('p').text().trim();
    }
    
    // Truncate description to a reasonable length (e.g., first 1000 chars) to save DB space
    if (description.length > 1000) {
      description = description.substring(0, 1000) + '...';
    }

    // 6. Source Domain
    let sourceDomain = 'unknown';
    try {
      sourceDomain = new URL(url).hostname;
    } catch {
      // ignore
    }

    return {
      title,
      company,
      location,
      sourceUrl: url,
      sourceDomain,
      applicationUrl,
      description,
      extractionSource: 'deterministic'
    };
  }
}
