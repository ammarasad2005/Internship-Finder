import { GoogleGenAI } from '@google/genai';
import { ZodSchema } from 'zod';

export class GeminiService {
  private static instance: GeminiService;
  private ai?: GoogleGenAI;
  private apiKey?: string;

  private constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Core execution method with retry and Zod validation.
   */
  public async executeStructuredPrompt<T>(
    systemInstruction: string,
    prompt: string,
    schema: ZodSchema<T>,
    maxRetries = 2
  ): Promise<T> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY_MISSING');
    }

    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.2 // Keep deterministic
          }
        });

        const text = response.text;
        if (!text) throw new Error('Empty response from Gemini');

        const parsedJson = JSON.parse(text);
        
        // Throw if schema validation fails
        return schema.parse(parsedJson);

      } catch (error) {
        if (error instanceof Error && error.message === 'GEMINI_API_KEY_MISSING') {
          throw error; // Fail immediately, skip retries
        }

        attempt++;
        if (attempt > maxRetries) {
          console.error(`[GeminiService] Fatal failure after ${maxRetries} retries:`, error);
          throw error;
        }
        console.warn(`[GeminiService] Attempt ${attempt} failed, retrying...`, error);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
    throw new Error('Unreachable code block');
  }
}
