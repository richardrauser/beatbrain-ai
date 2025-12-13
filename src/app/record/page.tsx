'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useRecordings } from '@/hooks/useRecordings';
import { RecordingControls } from '@/components/RecordingControls';
import { RecordingList } from '@/components/RecordingList';
import { Navigation } from '@/components/Navigation';
import { Recording, InstrumentType } from '@/lib/types';
import { MusicFactPopup } from '@/components/MusicFactPopup';

export default function RecordPage() {
    const { isRecording, startRecording, stopRecording, audioUrl, clearAudio } = useAudioRecorder();
    const { recordings, addRecording, updateRecording, deleteRecording } = useRecordings();
    const [isTransforming, setIsTransforming] = useState(false);

    useEffect(() => {
        const saveAudio = async () => {
            if (audioUrl) {
                try {
                    const response = await fetch(audioUrl);
                    const blob = await response.blob();
                    await addRecording(blob, `Recording ${recordings.length + 1}`);
                    clearAudio();
                } catch (e) {
                    console.error("Failed to save recording", e);
                    toast.error("Failed to save recording");
                }
            }
        };
        saveAudio();
    }, [audioUrl, clearAudio, addRecording, recordings.length]);

    const handleTransform = async (recording: Recording, instrument: InstrumentType) => {
        setIsTransforming(true);
        try {
            const blobResponse = await fetch(recording.url);
            const blob = await blobResponse.blob();

            const formData = new FormData();
            formData.append("file", blob, "recording.webm");
            formData.append("instrument", instrument);

            const response = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Transform failed");
            }

            if (data.notes) {
                await updateRecording(recording.id, {
                    notes: data.notes,
                    instrument: instrument
                });
                toast.success("Transformation complete!");
            }
        } catch (error: any) {
            console.error("Error transforming audio:", error);
            toast.error(`Failed to transform audio: ${error.message || "Unknown error"}`);
        } finally {
            setIsTransforming(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            <Navigation />

            <div className="pt-24 px-6 max-w-4xl mx-auto flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">
                        Voice Recorder
                    </h1>
                    <p className="text-neutral-400">
                        Record your voice directly from your browser and transform it into an instrument.
                    </p>
                </div>

                <div className="flex flex-col gap-6">
                    <RecordingControls
                        isRecording={isRecording}
                        onRecordToggle={isRecording ? stopRecording : startRecording}
                    />

                    <RecordingList
                        recordings={recordings}
                        onTransform={handleTransform}
                        onUpdate={updateRecording}
                        onDelete={deleteRecording}
                    />
                </div>
            </div>

            <MusicFactPopup isOpen={isTransforming} onClose={() => setIsTransforming(false)} />
        </main>
    );
}
