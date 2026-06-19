import 'server-only';
import { z } from 'zod';
import { GeminiService } from '@/features/brain/services/gemini.service';
import { ActiveProfileData, InternshipData } from '../types';

const ExplanationSchema = z.object({
  score_boost: z.number().min(0).max(15).describe('An AI-determined boost based on deep semantic alignment. Range 0 to 15.'),
  explanation: z.string().describe('A 1-2 sentence personalized explanation of why this internship is a great fit for the user.')
});

type ExplanationResult = z.infer<typeof ExplanationSchema>;

export class MatchExplanationService {
  /**
   * Generates a personalized explanation and semantic score boost for a match.
   * Runs only for the top N matches to save budget.
   */
  public static async generateExplanation(
    profile: ActiveProfileData,
    internship: InternshipData
  ): Promise<ExplanationResult> {
    const gemini = GeminiService.getInstance();

    const systemInstruction = `You are a career advisor algorithm. Your goal is to evaluate a software engineering internship against a candidate's profile and explain why it is a good fit.
    You must output strictly JSON matching the requested schema.
    Provide an explanation that references their skills or projects if relevant, and the role's description. Keep it concise.
    Evaluate the 'score_boost' (0-15) based on how perfectly the unmentioned implicit requirements of the job match the user's project descriptions.`;

    const prompt = `Candidate Profile:
Name: ${profile.first_name} ${profile.last_name || ''}
Skills: ${profile.skills.join(', ')}
Projects:
${profile.projects.map(p => `- ${p.name}: ${p.description || ''} (Tech: ${p.technologies?.join(', ') || 'N/A'})`).join('\n')}

Internship:
Company: ${internship.company_name}
Role: ${internship.role_title}
Description: ${internship.description}

Analyze the fit and generate the required JSON.`;

    try {
      const result = await gemini.executeStructuredPrompt(
        systemInstruction,
        prompt,
        ExplanationSchema
      );
      return result;
    } catch (error) {
      console.warn(`[MatchExplanationService] Failed to generate explanation for profile ${profile.profile_id} and internship ${internship.id}. Falling back to deterministic baseline.`);
      // Deterministic fallback if API fails or quota exceeded
      return {
        score_boost: 0,
        explanation: 'We matched this role based on an alignment between your preferred technologies and the job requirements.'
      };
    }
  }
}
