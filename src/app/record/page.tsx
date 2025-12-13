'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { RecordingControls } from '@/components/RecordingControls';
import { RecordingList, Recording, InstrumentType } from '@/components/RecordingList';
import { Navigation } from '@/components/Navigation';

export default function RecordPage() {
    const { isRecording, startRecording, stopRecording, audioUrl, resetAudio } = useAudioRecorder();
    const [recordings, setRecordings] = useState<Recording[]>([]);

    useEffect(() => {
        if (audioUrl) {
            const newRecording: Recording = {
                id: crypto.randomUUID(),
                title: `Recording ${recordings.length + 1}`,
                url: audioUrl,
                timestamp: Date.now(),
            };
            setRecordings(prev => [newRecording, ...prev]);
            resetAudio();
        }
    }, [audioUrl, resetAudio]);

    // Cleanup audio URLs when component unmounts to avoid memory leaks
    // Note: This is tricky because if we revoke them, the list won't play.
    // Ideally we'd persist these or handle them better, but for this simple demo:
    // We'll rely on browser cleanup for now or the useAudioRecorder cleanup if it was single instance.
    // Since useAudioRecorder creates a new URL each time, we should be storing these URLs.

    const handleTransform = async (recording: Recording, instrument: InstrumentType) => {
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
                setRecordings(prev => prev.map(r =>
                    r.id === recording.id ? { ...r, notes: data.notes, instrument: instrument } : r
                ));
            }
        } catch (error: any) {
            console.error("Error transforming audio:", error);
            toast.error(`Failed to transform audio: ${error.message || "Unknown error"}`);
        }
    };

    // Changed from handleRename to handleUpdate to support generic updates
    const handleUpdate = (id: string, updates: Partial<Recording>) => {
        setRecordings(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
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
                        Record your voice, samples, or ideas directly from your browser.
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
                        onUpdate={handleUpdate}
                    />
                </div>
            </div>
        </main>
    );
}
