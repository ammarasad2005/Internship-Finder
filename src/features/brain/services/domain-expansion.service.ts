import { ExpandedDomain } from '../types';

export class DomainExpansionService {
  /**
   * Deterministic mock implementation of AI domain expansion.
   * FUTURE AI INTEGRATION: Replace this dictionary with a Gemini prompt that takes the user's
   * skills and outputs a structured JSON mapping of related fields.
   */
  static async expandProfile(skills: string[], projects: string[]): Promise<ExpandedDomain[]> {
    const expansions: ExpandedDomain[] = [];
    const allInputs = [...skills, ...projects].map(s => s.toLowerCase());

    if (allInputs.some(s => s.includes('full stack') || s.includes('web') || s.includes('react'))) {
      expansions.push({
        originalTerm: 'Full Stack Development',
        relatedTerms: ['Frontend', 'Backend', 'Web Development', 'Software Engineering'],
        roles: ['Frontend Developer', 'Backend Engineer', 'Full Stack Intern', 'Web Developer'],
        technologies: ['React', 'Next.js', 'Node.js', 'TypeScript', 'PostgreSQL']
      });
    }

    if (allInputs.some(s => s.includes('data') || s.includes('python'))) {
      expansions.push({
        originalTerm: 'Data Science',
        relatedTerms: ['Machine Learning', 'Data Analysis', 'AI', 'Deep Learning'],
        roles: ['Data Science Intern', 'Data Analyst', 'Machine Learning Engineer', 'AI Intern'],
        technologies: ['Python', 'Pandas', 'TensorFlow', 'PyTorch', 'SQL']
      });
    }

    // Default fallback if no specific keywords hit
    if (expansions.length === 0) {
      expansions.push({
        originalTerm: 'Software Engineering',
        relatedTerms: ['Software Development', 'Programming', 'IT'],
        roles: ['Software Engineering Intern', 'Software Developer Intern'],
        technologies: []
      });
    }

    return expansions;
  }
}
