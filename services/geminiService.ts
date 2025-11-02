import { GoogleGenAI, Content } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function* generateCodeStream(
    systemInstructionWithFiles: string,
    history: Content[]
): AsyncGenerator<string> {
    
    const model = 'gemini-2.5-pro';

    try {
        const response = await ai.models.generateContentStream({
            model: model,
            contents: history,
            config: {
                systemInstruction: { parts: [{ text: systemInstructionWithFiles }] },
                temperature: 0.2,
                topP: 0.9,
                topK: 40,
            }
        });
        
        for await (const chunk of response) {
            yield chunk.text;
        }

    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Failed to get response from AI. Check console for details.");
    }
}