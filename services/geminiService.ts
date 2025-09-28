
import { GoogleGenAI } from "@google/genai";

// FIX: API key is now sourced from environment variables per guidelines.
// The apiKey parameter has been removed.
export const callGeminiAPI = async (prompt: string, maxTokens: number = 2048): Promise<string> => {
  try {
    // FIX: Initialize with API key from environment variables.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: maxTokens,
        }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred with the Gemini API.");
  }
};
