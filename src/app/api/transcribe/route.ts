import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const instrument = formData.get("instrument") as string || "synthesizer";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured. Please add GEMINI_API_KEY to .env.local" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString("base64");

        let contextPrompt = "Identify the musical notes in the main melody.";
        if (instrument === "909") {
            contextPrompt = "Identify the rhythmic hits (kick, snare, hi-hat). Map them to approximate notes (e.g. C2 for Kick, D2 for Snare) or just the timing.";
        } else if (instrument === "bass") {
            contextPrompt = "Identify the bassline notes.";
        }

        const prompt = `
      Listen to this audio recording. 
      I want to replay this using a ${instrument}.
      ${contextPrompt}
      Return strictly a JSON array of note objects.
      Each object should have:
      - "note": The note name with octave (e.g., "C4", "G#3", "Bb4").
      - "duration": The duration of the note in seconds (float).
      - "startTime": The start time of the note in seconds relative to the beginning (float).
      
      Do not explain anything. Return ONLY the JSON array.
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: file.type || "audio/wav", // Fallback if type is missing
                    data: base64Audio
                }
            }
        ]);

        const responseText = result.response.text();
        console.log("Gemini Response:", responseText);

        // Clean up response if it contains markdown code blocks
        let cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        // Attempt parsing
        try {
            const notes = JSON.parse(cleanJson);
            return NextResponse.json({ notes });
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            return NextResponse.json({ error: "Failed to parse Gemini response", raw: responseText }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Error processing audio:", error);

        let errorMessage = "Internal Server Error";
        if (error.message) {
            errorMessage = error.message;
        }

        // Check for specific Google AI errors
        if (error.toString().includes("API key")) {
            return NextResponse.json({ error: "Invalid API Key or API Key rejected." }, { status: 500 });
        }

        return NextResponse.json({ error: errorMessage, details: error.toString() }, { status: 500 });
    }
}
