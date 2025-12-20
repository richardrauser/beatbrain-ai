import { NextResponse } from "next/server";
import { getSecret } from "@/lib/secrets";
import { getGeminiModel, DEFAULT_MODELS } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const apiKey = await getSecret("GEMINI_API_KEY");
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured" }, { status: 500 });
        }

        const model = await getGeminiModel(DEFAULT_MODELS.ICON_GENERATION);

        const prompt = `
            You are an expert icon designer.
            Generate a colorful, vibrant icon for the concept: "${text}".
            
            Requirements:
            - Output ONLY the raw SVG string.
            - Do not include markdown code blocks.
            - ViewBox "0 0 64 64".
            - Use distinct, vibrant colors (no "currentColor").
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up response
        let svg = responseText.trim();
        if (svg.startsWith('```')) {
            svg = svg.replace(/^```(svg|xml)?/i, '').replace(/```$/, '');
        }
        svg = svg.trim();

        if (!svg.startsWith('<svg')) {
            throw new Error("Invalid SVG generated");
        }

        return NextResponse.json({ svg });

    } catch (error: any) {
        console.error("Error generating icon:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
