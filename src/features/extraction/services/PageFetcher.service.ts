export class PageFetcher {
  /**
   * Fetches the raw HTML content of a given URL.
   * Uses browser-like headers to avoid basic bot blocks.
   */
  static async fetchHtml(url: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`[PageFetcher] HTTP ${response.status} for ${url}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('text/html')) {
        throw new Error(`[PageFetcher] Expected text/html but got ${contentType} for ${url}`);
      }

      return await response.text();
    } catch (error: any) {
      console.warn(`[PageFetcher] Failed to fetch ${url}: ${error.message}`);
      return '';
    }
  }
}
