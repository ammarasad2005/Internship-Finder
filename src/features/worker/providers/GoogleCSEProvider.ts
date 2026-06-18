import { SearchProvider } from './SearchProvider.interface';
import { SearchResult } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class GoogleCSEProvider implements SearchProvider {
  name = 'google_cse';
  private apiKey: string;
  private engineId: string;

  constructor() {
    const key = process.env.GOOGLE_CSE_API_KEY;
    const engineId = process.env.GOOGLE_CSE_ENGINE_ID;

    if (!key || !engineId) {
      throw new Error("Google CSE configuration missing. Ensure GOOGLE_CSE_API_KEY and GOOGLE_CSE_ENGINE_ID are set in your environment.");
    }

    this.apiKey = key;
    this.engineId = engineId;
  }

  async search(query: string, depth: number = 1): Promise<SearchResult[]> {
    const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.engineId}&q=${encodeURIComponent(query)}&num=10`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(`[GoogleCSEProvider] 429 Quota Exceeded. Daily limit reached or rate limit hit for query: "${query}"`);
      }
      throw new Error(`[GoogleCSEProvider] HTTP ${response.status} failed for query: "${query}"`);
    }

    const data = await response.json();
    
    // Store raw search responses for debugging
    try {
      const debugDir = path.join(process.cwd(), '.debug', 'search_responses');
      await fs.mkdir(debugDir, { recursive: true });
      const filename = `google_cse_${Date.now()}_${query.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.json`;
      await fs.writeFile(path.join(debugDir, filename), JSON.stringify(data, null, 2));
    } catch (debugErr) {
      console.warn('[GoogleCSEProvider] Failed to write debug response:', debugErr);
    }
    
    if (!data.items || data.items.length === 0) {
      return []; // No results found
    }

    return data.items.map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      source: item.displayLink || 'google_cse',
      sourceType: this.inferSourceType(item.link),
      query: query
    }));
  }

  /**
   * Naively categorizes the source type based on the URL domain.
   */
  private inferSourceType(url: string): SearchResult['sourceType'] {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('linkedin.com')) return 'linkedin';
    if (lowerUrl.includes('rozee.pk') || lowerUrl.includes('mustakbil.com') || lowerUrl.includes('glassdoor.com') || lowerUrl.includes('indeed.com')) {
      return 'job_board';
    }
    // Google CSE mostly indexes official company domains if excluding major job boards
    return 'official_career_page'; 
  }
}
