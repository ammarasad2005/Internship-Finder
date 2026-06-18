import { InternshipNormalizer } from './InternshipNormalizer.service';

export class CanonicalKeyGenerator {
  /**
   * Generates a deterministic hash/string based on normalized core fields.
   * This prevents database collisions for identical internships posted across multiple boards.
   */
  static generate(company: string, title: string, location: string): string {
    const c = InternshipNormalizer.normalizeCompany(company);
    const t = InternshipNormalizer.normalizeTitle(title);
    const l = InternshipNormalizer.normalizeLocation(location);

    // Creates a slug-like key: "devsinc:software_engineer_intern:lahore"
    const key = `${c}:${t}:${l}`.replace(/\s+/g, '_');
    return key;
  }
}
