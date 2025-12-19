import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSecret } from "./secrets";

// Centralized model configuration
export const GEMINI_MODELS = {
    PRO: "gemini-3-pro-preview",
    FLASH: "gemini-3-flash-preview",
    // Adding preview versions for backward compatibility or testing
};

// Default models for different tasks
export const DEFAULT_MODELS = {
    TEXT_GENERATION: GEMINI_MODELS.FLASH,
    AGENTIC_WORKFLOWS: GEMINI_MODELS.PRO,
    AUDIO_PROCESSING: GEMINI_MODELS.FLASH,
    ICON_GENERATION: GEMINI_MODELS.PRO,
};

let genAI: GoogleGenerativeAI | null = null;

export async function getGeminiClient() {
    if (genAI) return genAI;

    const apiKey = await getSecret("GEMINI_API_KEY");
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured in Secret Manager or env.");
    }

    genAI = new GoogleGenerativeAI(apiKey);
    return genAI;
}

export async function getGeminiModel(modelName: string = DEFAULT_MODELS.TEXT_GENERATION) {
    const client = await getGeminiClient();
    return client.getGenerativeModel({ model: modelName });
}
