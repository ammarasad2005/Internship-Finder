export class InternshipNormalizer {
  /**
   * Cleans a raw string for canonical matching.
   * Lowercases, trims, and removes all punctuation.
   */
  private static clean(str: string): string {
    return str.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
  }

  static normalizeTitle(title: string): string {
    let t = this.clean(title);
    
    // Normalize common abbreviations
    const replacements: Record<string, string> = {
      'engineering': 'engineer',
      'software engineering': 'software engineer',
      'sde': 'software engineer',
      'swe': 'software engineer',
      'frontend': 'front end',
      'backend': 'back end',
      'internship': 'intern' // Force internship to intern
    };

    for (const [key, value] of Object.entries(replacements)) {
      t = t.replace(new RegExp(`\\b${key}\\b`, 'gi'), value);
    }
    
    return t;
  }

  static normalizeCompany(company: string): string {
    let c = this.clean(company);
    
    // Remove ONLY specific legal entities
    const suffixes = ['ltd', 'llc', 'corp', 'inc', 'pvt', 'private limited', 'corporation', 'limited'];
    suffixes.forEach(suffix => {
      c = c.replace(new RegExp(`\\b${suffix}\\b`, 'gi'), '');
    });

    return c.trim();
  }

  static normalizeLocation(location: string): string {
    let l = this.clean(location);
    
    // Exact match for the Phase 9 fallback string after clean()
    if (l === 'remote unspecified' || l === 'unspecified' || l === '') return 'unspecified';
    if (l.includes('hybrid')) return 'hybrid';
    if (l.includes('remote')) return 'remote';
    
    // Pakistani specific normalization
    const replacements: Record<string, string> = {
      'pk': 'pakistan',
      'isb': 'islamabad',
      'khi': 'karachi',
      'lhr': 'lahore',
      'lahore pakistan': 'lahore',
      'karachi pakistan': 'karachi',
      'islamabad pakistan': 'islamabad'
    };

    for (const [key, value] of Object.entries(replacements)) {
      l = l.replace(new RegExp(`\\b${key}\\b`, 'gi'), value);
    }

    return l;
  }
}
