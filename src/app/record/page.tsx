'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useRecordings } from '@/hooks/useRecordings';
import { RecordingControls } from '@/components/RecordingControls';
import { RecordingList } from '@/components/RecordingList';
import { Navigation } from '@/components/Navigation';
import { Recording, InstrumentType } from '@/lib/types';
import { useMusicFact } from '@/components/MusicFactContext';
import Link from 'next/link';

import { useRef, useCallback } from 'react';
import { Timeline } from '@/components/Timeline';
import { TempoControl } from '@/components/TempoControl';

export default function RecordPage() {
    const { isRecording, isInitializing, startRecording, stopRecording, audioBlob, clearAudio, prepareRecorder } = useAudioRecorder();
    const { recordings, addRecording, updateRecording, deleteRecording } = useRecordings();
    const [countdown, setCountdown] = useState<number | null>(null);
    const [generatingIconIds, setGeneratingIconIds] = useState<Set<string>>(new Set());

    // Automatically add recording when available
    useEffect(() => {
        if (audioBlob) {
            const nextNumber = recordings.length + 1;
            addRecording(audioBlob, `Recording ${nextNumber}`);
            clearAudio(); // Clear from recorder state after adding to list
        }
    }, [audioBlob, addRecording, clearAudio, recordings.length]);

    // BPM and Timing State
    const [tempo, setTempo] = useState(120);
    const [progress, setProgress] = useState(0);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    // Recording Wrapper with 3-second countdown
    const startRecordingWrapper = useCallback(async () => {
        if (countdown !== null || isRecording || isInitializing) return;
        setCountdown(3);
        prepareRecorder(); // Pre-warm the microphone
    }, [countdown, isRecording, isInitializing, prepareRecorder]);

    useEffect(() => {
        if (countdown === null) return;

        if (countdown === 0) {
            // Start recording IMMEDIATELY when Go! appears
            startRecording();
            setProgress(0);

            // Show "GO!" for a brief moment then clear countdown
            const timer = setTimeout(() => {
                setCountdown(null);
            }, 800);
            return () => clearTimeout(timer);
        }

        const timer = setTimeout(() => {
            setCountdown(prev => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown, startRecording]);

    const stopRecordingWrapper = useCallback(() => {
        stopRecording();
        // Animation cancellation handled via useEffect
        setProgress(0);
    }, [stopRecording]);

    const animate = useCallback((time: number) => {
        if (!startTimeRef.current) startTimeRef.current = time;

        // Duration of 1 bar (4 beats) in seconds
        // 60 / BPM * 4
        const barDuration = (60 / tempo) * 4;
        const elapsed = (time - startTimeRef.current) / 1000;

        const newProgress = Math.min(elapsed / barDuration, 1);
        setProgress(newProgress);

        if (newProgress >= 1) {
            // Stop automatically
            stopRecording(); // Direct call to avoid circular dependency if wrapper used?
            // Actually stopRecordingWrapper is fine but let's just call stopRecording to be direct.
        } else {
            requestRef.current = requestAnimationFrame(animate);
        }
    }, [tempo, stopRecording]); // Removed stopRecordingWrapper from deps to break potential cycle

    // Watch isRecording state to start/stop animation
    useEffect(() => {
        if (isRecording) {
            // Recording started: Start animation
            startTimeRef.current = performance.now();
            requestRef.current = requestAnimationFrame(animate);
        } else {
            // Recording stopped: Cancel animation
            cancelAnimationFrame(requestRef.current);
            // Optionally reset progress here if desired, but wrapper does it too.
        }

        return () => cancelAnimationFrame(requestRef.current);
    }, [isRecording, animate]);

    const { showFact, hideFact } = useMusicFact();

    const handleTransform = async (recording: Recording, instrument: InstrumentType) => {
        showFact(); // Trigger global popup
        try {

            // Determine new name
            const instrumentLabels: Record<string, string> = {
                'juno': 'Juno',
                'guitar': 'Guitar',
                'bass': 'Bass',
                '909': '909',
                'trumpet': 'Trumpet'
            };
            const label = instrumentLabels[instrument] || 'Instrument';
            let newName = recording.title;
            if (!newName.startsWith(label)) {
                newName = `${label} - ${newName}`;
            }

            // Update with new name immediately
            await updateRecording(recording.id, {
                instrument: instrument,
                title: newName
            });

            // 2. Generate new icon asynchronously
            setGeneratingIconIds(prev => new Set(prev).add(recording.id));
            (async () => {
                try {
                    const iconRes = await fetch('/api/generate-icon', {
                        method: 'POST',
                        body: JSON.stringify({ text: newName }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const iconData = await iconRes.json();
                    let newIcon: string | undefined;
                    if (iconData.image) newIcon = iconData.image;
                    else if (iconData.svg) newIcon = `data:image/svg+xml;base64,${btoa(iconData.svg)}`;

                    if (newIcon) {
                        await updateRecording(recording.id, { icon: newIcon });
                    }
                } catch (e) {
                    console.error("Failed to generate icon during transform:", e);
                } finally {
                    setGeneratingIconIds(prev => {
                        const next = new Set(prev);
                        next.delete(recording.id);
                        return next;
                    });
                }
            })();

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

            if (data.midiData || data.notes) {
                // Repeat MIDI data for 4 bars
                let repeatedMidiData = data.midiData;
                if (data.midiData && data.midiData.notes) {
                    const barDuration = (60 / tempo) * 4;
                    const secondsPerStep = (60 / tempo) * 0.5; // 8th note duration

                    // First, quantize the initial notes
                    const initialNotes = data.midiData.notes.map((note: any) => ({
                        ...note,
                        quantizedStep: Math.min(Math.floor(note.time / secondsPerStep), 7)
                    }));

                    const repeatedNotes = [...initialNotes];

                    // Add 3 more bars
                    for (let i = 1; i < 4; i++) {
                        initialNotes.forEach((note: any) => {
                            repeatedNotes.push({
                                ...note,
                                time: note.time + (barDuration * i),
                                quantizedStep: note.quantizedStep + (i * 8)
                            });
                        });
                    }
                    repeatedMidiData = {
                        ...data.midiData,
                        notes: repeatedNotes
                    };
                }

                // Update with MIDI data and new name immediately
                await updateRecording(recording.id, {
                    midiData: repeatedMidiData,
                });
                toast.success(`Transformed to ${label}!`);
            }
        } catch (error: any) {
            console.error("Error transforming audio:", error);
            toast.error(`Failed to transform audio: ${error.message || "Unknown error"}`);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            <Navigation />

            <div className="pt-24 px-4 sm:px-6 max-w-4xl mx-auto flex flex-col gap-6 sm:gap-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">
                        Voice Recorder
                    </h1>
                    <p className="text-sm sm:text-base text-neutral-400">
                        Record your voice directly from your browser and transform it into an instrument. Once you've created a few, go to{' '}
                        <Link
                            href="/create"
                            className="text-emerald-400 hover:text-emerald-300 underline transition-colors"
                        >
                            Create
                        </Link>
                        {' '}to sequence them into a song!
                    </p>
                </div>



                <div className="flex flex-col gap-4 sm:gap-6">
                    {/* BPM and Timeline Section */}
                    <div className="flex flex-col gap-4 bg-[#111] p-4 rounded-xl border border-white/5">
                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                            <h2 className="text-lg font-semibold text-neutral-300">Recording Settings</h2>
                            <TempoControl tempo={tempo} onTempoChange={setTempo} />
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-xs text-neutral-500 uppercase tracking-wider">
                                <span>Start</span>
                                <span>1 Bar ({((60 / tempo) * 4).toFixed(1)}s)</span>
                            </div>
                            <Timeline progress={progress} variant="standalone" />
                        </div>
                    </div>

                    <RecordingControls
                        isRecording={isRecording}
                        isInitializing={isInitializing}
                        onRecordToggle={isRecording ? stopRecordingWrapper : startRecordingWrapper}
                        currentProgress={progress}
                        countdown={countdown}
                    />

                    <RecordingList
                        recordings={recordings}
                        onTransform={handleTransform}
                        onUpdate={updateRecording}
                        onDelete={deleteRecording}
                        generatingIconIds={generatingIconIds}
                    />
                </div>
            </div>
        </main>
    );
}
