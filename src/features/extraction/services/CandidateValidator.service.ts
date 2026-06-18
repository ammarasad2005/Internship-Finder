import { InternshipCandidate } from '../types';

export class CandidateValidator {
  /**
   * Validates if the extracted candidate is viable enough to store in the database.
   */
  static validate(candidate: Partial<InternshipCandidate>): { isValid: boolean; reason?: string } {
    if (!candidate.title || candidate.title.length < 3) {
      return { isValid: false, reason: 'Missing or invalid title' };
    }

    if (!candidate.company) {
      return { isValid: false, reason: 'Missing company' };
    }

    if (!candidate.description || candidate.description.length < 50) {
      return { isValid: false, reason: 'Description too short or missing' };
    }

    if (candidate.confidenceScore !== undefined && candidate.confidenceScore < 40) {
      return { isValid: false, reason: `Confidence score too low (${candidate.confidenceScore})` };
    }

    // Ensure it's somewhat related to internships to prevent saving senior roles
    const combinedText = `${candidate.title} ${candidate.description}`.toLowerCase();
    const isInternship = combinedText.includes('intern') || 
                         combinedText.includes('trainee') || 
                         combinedText.includes('student') ||
                         combinedText.includes('fresh graduate') ||
                         combinedText.includes('entry level');

    if (!isInternship) {
      return { isValid: false, reason: 'Does not appear to be an internship (no relevant keywords found)' };
    }

    return { isValid: true };
  }
}
