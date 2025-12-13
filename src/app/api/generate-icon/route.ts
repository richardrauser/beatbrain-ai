import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getSecret } from "@/lib/secrets";

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

        // Try Imagen 3 first for a PNG
        try {
            const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;
            const imagenResponse = await fetch(imagenUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    instances: [{ prompt: `A colorful, vibrant, modern app icon for a recording named "${text}". High quality, abstract, gradient colors, 3d render style.` }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "1:1",
                    }
                })
            });

            if (imagenResponse.ok) {
                const data = await imagenResponse.json();
                if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
                    const pngBase64 = data.predictions[0].bytesBase64Encoded;
                    return NextResponse.json({
                        svg: null, // Client expects svg property? Let's use a generic image property or reuse svg
                        image: `data:image/png;base64,${pngBase64}`
                    });
                }
            } else {
                console.warn("Imagen generation failed, falling back to SVG. Status:", imagenResponse.status);
            }
        } catch (imagenError) {
            console.warn("Imagen error:", imagenError);
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

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
