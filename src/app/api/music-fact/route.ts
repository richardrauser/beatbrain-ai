import { NextResponse } from "next/server";
import { getGeminiModel, DEFAULT_MODELS } from "@/lib/gemini";

export async function GET() {
    try {
        const model = await getGeminiModel(DEFAULT_MODELS.TEXT_GENERATION);

        const prompt = `
            Generate a unique, surprising, and educational "Did you know?" fact about music production, audio engineering, digital music creation or electronic music history.
            
            Return strictly a JSON object with:
            - "title": A short catchy title (max 5 words)
            - "content": An interesting fact (1-2 sentences)
            - "icon": A single relevant emoji
            
            Example:
            {
                "title": "The First Synthesizer",
                "content": "The Telharmonium, created in 1897, weighed 210 tons and occupied an entire floor of an office building in New York.",
                "icon": "🎹"
            }
            
            Do not explain. Return ONLY the JSON object.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up response if it contains markdown code blocks
        let cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const parsedData = JSON.parse(cleanJson);
            return NextResponse.json(parsedData);
        } catch (e) {
            console.error("Failed to parse JSON:", e, "Raw response:", responseText);
            return NextResponse.json({ error: "Failed to parse Gemini response" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Error generating music fact:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.toString() }, { status: 500 });
    }
}
