
import { GoogleGenAI, Content } from "@google/genai";
import type { ModelId, StreamGenerateContentResult } from '../types';
import { getClientApiKey } from '../utils/storage';

const FALLBACK_API_KEY = process.env.API_KEY;

export async function generateCodeStream(
    systemInstructionWithFiles: string,
    history: Content[],
    model: ModelId
): Promise<StreamGenerateContentResult> {
    const clientApiKey = getClientApiKey();
    const apiKeyToUse = clientApiKey || FALLBACK_API_KEY;

    if (!apiKeyToUse) {
        throw new Error("API key is not configured. Please set your API key in the settings or configure the fallback key.");
    }

    // Create a new instance for each call to ensure the latest key is used.
    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    
    try {
        // The GoogleGenAI SDK's `generateContentStream` method returns an object that is both
        // an async iterable (the stream) and has a `response` property (a promise for the full response).
        // This structure directly matches our `StreamGenerateContentResult` type.
        const result = await ai.models.generateContentStream({
            model: model,
            contents: history,
            config: {
                systemInstruction: systemInstructionWithFiles,
                temperature: 0.2,
                topP: 0.9,
                topK: 40,
            }
        });
        
        // The result object from the SDK directly matches our expected interface, so we return it.
        return result;

    } catch (error) {
        console.error("Gemini API call failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Failed to get response from AI: ${errorMessage}`);
    }
}