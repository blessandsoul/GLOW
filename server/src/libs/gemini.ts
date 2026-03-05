import { GoogleGenAI } from '@google/genai';
import { env } from '@/config/env.js';

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    _client = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
      httpOptions: { timeout: 120_000 },
    });
  }
  return _client;
}
