import { NextResponse } from "next/server";
import { getGeminiModel, DEFAULT_MODELS } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const instrument = formData.get("instrument") as string || "synthesizer";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const model = await getGeminiModel(DEFAULT_MODELS.AUDIO_PROCESSING);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString("base64");

        // Detect MIME type from file signature if browser provides generic type
        let mimeType = file.type;

        // Safari often uses application/octet-stream, so we need to detect the actual format
        if (!mimeType || mimeType === 'application/octet-stream' || !mimeType.startsWith('audio/')) {
            // Check file signature (magic numbers) to determine format
            const uint8Array = new Uint8Array(arrayBuffer);

            // WebM signature: 0x1A 0x45 0xDF 0xA3
            if (uint8Array[0] === 0x1A && uint8Array[1] === 0x45 && uint8Array[2] === 0xDF && uint8Array[3] === 0xA3) {
                mimeType = 'audio/webm';
            }
            // MP4/M4A signature: starts with 'ftyp' at offset 4
            else if (uint8Array[4] === 0x66 && uint8Array[5] === 0x74 && uint8Array[6] === 0x79 && uint8Array[7] === 0x70) {
                mimeType = 'audio/mp4';
            }
            // WAV signature: 'RIFF' at start and 'WAVE' at offset 8
            else if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46 &&
                uint8Array[8] === 0x57 && uint8Array[9] === 0x41 && uint8Array[10] === 0x56 && uint8Array[11] === 0x45) {
                mimeType = 'audio/wav';
            }
            // OGG signature: 'OggS'
            else if (uint8Array[0] === 0x4F && uint8Array[1] === 0x67 && uint8Array[2] === 0x67 && uint8Array[3] === 0x53) {
                mimeType = 'audio/ogg';
            }
            // Default fallback for unknown formats
            else {
                mimeType = 'audio/webm'; // Most common for browser recordings
            }

            console.log(`Detected MIME type: ${mimeType} (original: ${file.type})`);
        }

        const prompt = `
            Listen to this audio recording. 
            If the audiio recording approximates percussion, identify the rhythmic hits (kick, snare, hi-hat). Map them to approximate notes (e.g. C2 for Kick, D2 for Snare)
            If the audio recording approximates a bassline, identify the bassline notes.
            If not percussion or bassline, identify the musical notes in the main melody.
            Ignore background noise, and focus on the primary, dominant audio.
            Return strictly a JSON array of note objects.
            Quantize the notes to 8th notes with a maximum of 4 bars.
            Each object should have:
            - "midi": The MIDI note number as an integer (0-127).
            - "velocity": The velocity of the note as a float (0.0 to 1.0), representing dynamics/loudness.
            - "time": The start time of the note in seconds relative to the beginning (float).
            - "duration": The duration of the note in seconds (float).
            - "name": The note name with octave (e.g., "C4", "G#3", "Bb4") for reference.
            
            Do not explain anything. Return ONLY the JSON array.
            `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: mimeType,
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
            const parsedData = JSON.parse(cleanJson);

            // Generate MIDI data structure directly from response
            const midiData = {
                notes: parsedData.map((note: any) => ({
                    midi: note.midi,
                    name: note.name,
                    time: note.time,
                    duration: note.duration,
                    velocity: note.velocity
                })),
                instrument: instrument,
                name: `${instrument} Track`
            };

            return NextResponse.json({ midiData });
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
