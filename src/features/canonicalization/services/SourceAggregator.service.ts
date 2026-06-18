export class SourceAggregator {
  /**
   * Appends a new URL to the existing set of sources, ensuring uniqueness.
   */
  static aggregate(existingUrls: string[], newUrl: string): string[] {
    const set = new Set(existingUrls);
    
    // Normalize URL slightly (remove trailing slash, simple query params)
    let cleanUrl = newUrl.split('?')[0];
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    
    set.add(cleanUrl);
    return Array.from(set);
  }
}
