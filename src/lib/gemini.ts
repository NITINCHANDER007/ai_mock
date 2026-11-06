import { GoogleGenAI } from '@google/genai';

// Active Gemini Flash models prioritized for high availability and low latency
export const GEMINI_MODEL = 'gemini-3.1-flash-lite';
export const FALLBACK_GEMINI_MODEL = 'gemini-3.5-flash-lite';

const FLASH_MODELS = [
  GEMINI_MODEL,
  FALLBACK_GEMINI_MODEL,
];

let aiInstance: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in process.env');
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export type GeminiTurnPart = {
  text: string;
};

export type GeminiContentTurn = {
  role: 'user' | 'model';
  parts: GeminiTurnPart[];
};

export type GeminiContents = string | GeminiContentTurn[];

// 14s timeout per model for fast turns without premature timeouts on detailed summaries
const MODEL_TIMEOUT_MS = 14000;

export async function generateWithFlash(
  contents: GeminiContents,
  systemInstruction?: string
): Promise<string> {
  const ai = getGenAI();
  let lastError: unknown = null;

  for (const model of FLASH_MODELS) {
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents,
        config: systemInstruction
          ? {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            }
          : {
              temperature: 0.7,
            },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout after ${MODEL_TIMEOUT_MS}ms on model ${model}`)),
          MODEL_TIMEOUT_MS
        )
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const text = response.text?.trim();

      // Validate response: if text is empty or missing, treat as error
      if (!text) {
        throw new Error(`Gemini model ${model} returned an empty or missing response`);
      }

      return text;
    } catch (err: unknown) {
      console.warn(`[Gemini Flash] Model ${model} failed or timed out, trying next fallback:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini Flash models failed to respond.');
}
