import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Track } from '@/lib/types';
import { Waveform } from '@/components/Waveform';

interface MusicGridProps {
    currentBeat?: number; // 0-31
    isPlaying?: boolean;
    progress?: number; // 0-1 for timeline playback
    tracks: Track[];
    pattern: boolean[][];
    onToggleNote: (row: number, col: number) => void;
    onRemoveTrack?: (id: string) => void;
}

export interface MusicGridRef {
    resume: () => Promise<void>;
}

export const MusicGrid = forwardRef<MusicGridRef, MusicGridProps>(({ currentBeat = -1, isPlaying = false, progress = 0, tracks, pattern, onToggleNote, onRemoveTrack }, ref) => {
    // Audio Context
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioBuffersRef = useRef<Record<string, AudioBuffer>>({});

    useImperativeHandle(ref, () => ({
        resume: async () => {
            if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
                await audioCtxRef.current.resume();
            }
        }
    }));

    // Initialize AudioContext
    useEffect(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }, []);

    // Load samples
    useEffect(() => {
        const loadSamples = async () => {
            if (!audioCtxRef.current) return;
            const ctx = audioCtxRef.current;

            for (const track of tracks) {
                if (track.type === 'sample' && track.sampleUrl && !audioBuffersRef.current[track.sampleUrl]) {
                    try {
                        console.log(`Loading sample for ${track.label} from ${track.sampleUrl}`);
                        const response = await fetch(track.sampleUrl);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                        audioBuffersRef.current[track.sampleUrl] = audioBuffer;
                        console.log(`Successfully loaded sample for ${track.label}`);
                    } catch (e) {
                        console.error(`Failed to load sample for ${track.label}:`, e);
                    }
                }
            }
        };
        loadSamples();
    }, [tracks]);

    // Play sound for a specific track at a specific step
    const playSound = async (trackIndex: number, stepIndex: number) => {
        if (!audioCtxRef.current) return;
        const track = tracks[trackIndex];
        if (!track) return;

        // Resume context if suspended
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        // If track has notes (transformed recording), use Tone.js to play the instrument
        if ((track.notes || track.midiData) && track.instrument) {
            try {
                const Tone = await import('tone');
                await Tone.start();

                let synth: any;
                // Reuse synths? For now, create/dispose per hit is safest for avoid leaks if not managed globally,
                // but might be clicky. Ideally use a persistent poly synth.
                // Given the architecture, we instantiate here. 
                // Optimization: In a real app, these should be refs.

                switch (track.instrument) {
                    case 'juno':
                        synth = new Tone.PolySynth(Tone.Synth, {
                            oscillator: { type: "pulse", width: 0.2 },
                            envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 }
                        }).toDestination();
                        break;
                    case 'guitar':
                        synth = new Tone.PluckSynth({
                            attackNoise: 1,
                            dampening: 4000,
                            resonance: 0.7
                        }).toDestination();
                        break;
                    case 'bass':
                        synth = new Tone.MonoSynth({
                            oscillator: { type: "square" },
                            filter: { Q: 6, type: "lowpass", rolloff: -24 },
                            envelope: { attack: 0.005, decay: 0.1, sustain: 0.9, release: 1 },
                            filterEnvelope: { attack: 0.06, decay: 0.2, sustain: 0.5, release: 2, baseFrequency: 200, octaves: 7, exponent: 2 }
                        }).toDestination();
                        break;
                    case '909':
                        synth = new Tone.MembraneSynth({
                            pitchDecay: 0.05,
                            octaves: 10,
                            oscillator: { type: "sine" },
                            envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: "exponential" }
                        }).toDestination();
                        break;
                    case 'trumpet':
                    default:
                        synth = new Tone.Synth({
                            oscillator: { type: "sawtooth" },
                            envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 }
                        }).toDestination();
                        break;
                }

                // Find notes that map to this step
                // Prefer midiData with quantizedStep
                let notesToPlay: any[] = [];

                if (track.midiData && track.midiData.notes) {
                    notesToPlay = track.midiData.notes.filter(n => n.quantizedStep === stepIndex);
                } else if (track.notes) {
                    // Fallback for legacy data without quantized info
                    // Just try to play something if the pattern is active
                    notesToPlay = track.notes.slice(0, 1);
                }

                const now = Tone.now();

                notesToPlay.forEach(note => {
                    const noteValue = note.midi ? Tone.Frequency(note.midi, "midi") : note.note || "C4";
                    const duration = note.duration || 0.1;
                    const velocity = note.velocity || 1;

                    if (track.instrument === 'guitar') {
                        synth.triggerAttackRelease(noteValue, now);
                    } else {
                        synth.triggerAttackRelease(noteValue, duration, now, velocity);
                    }
                });

                // Cleanup
                setTimeout(() => {
                    synth.dispose();
                }, 1000); // 1s fixed cleanup

            } catch (e) {
                console.error(`Failed to play notes for ${track.label}:`, e);
            }
        }
        // Handle Sample Playback (if it's a sample track AND triggered)
        // Note: The original logic for 'sample' tracks (rowId >= 0) was using AudioBuffers.
        // If it's a 'sample' type track but has `sampleUrl`, we used `loadSamples`.
        // We should maintain that logic.
        else if (track.type === 'sample' && track.sampleUrl) {
            const buffer = audioBuffersRef.current[track.sampleUrl];
            if (buffer) {
                const source = audioCtxRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioCtxRef.current.destination);
                source.start();
            }
        }
    };

    // Trigger playback when currentBeat changes and pattern is active
    useEffect(() => {
        if (isPlaying && currentBeat !== -1 && pattern.length > 0) {
            pattern.forEach((row, rowIndex) => {
                if (row && row[currentBeat]) {
                    playSound(rowIndex, currentBeat);
                }
            });
        }
    }, [currentBeat, pattern, tracks, isPlaying]);

    if (!pattern || pattern.length === 0) return null; // Loading

    return (
        <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 bg-[#1a1a1a] rounded-xl border-t border-white/10 shadow-2xl relative overflow-x-auto">
            {/* Screw decoration */}
            <div className="absolute top-2 left-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neutral-700 shadow-inner" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neutral-700 shadow-inner" />
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neutral-700 shadow-inner" />
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neutral-700 shadow-inner" />

            {/* Timeline Row - Integrated for perfect alignment */}
            <div className="flex items-end gap-2 sm:gap-4 min-w-max mb-1">
                {/* Empty Label Placeholder */}
                <div className="w-16 sm:w-20 md:w-24 shrink-0" />

                {/* Timeline Ruler */}
                <div className="flex-1 relative flex h-6">
                    {/* Render matching grid steps just for alignment reference if needed, 
                        but we can simpler use a relative container for the progress bar 
                        that spans the exact same width as the flex children below. 
                        
                        ACTUALLY, the Playhead needs to align with the buttons which have gaps.
                        A simple 0-100% linear progress bar will drift if we just use a single div,
                        UNTLESS the buttons + gaps are perfectly distributed.
                        With flex-1 and gap, they SHOULD be perfectly distributed.
                    */}
                    <div className="absolute inset-0 z-10">
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_10px_red] z-20 transition-transform duration-75 ease-linear will-change-transform"
                            style={{
                                left: `${progress * 100}%`,
                                transform: 'translateX(-50%)'
                            }}
                        >
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500" />
                        </div>
                    </div>

                    {/* Ruler Marks */}
                    {Array.from({ length: 32 }).map((_, i) => (
                        <div key={i} className={`flex-1 flex flex-col justify-end items-start mr-0.5 sm:mr-1 md:mr-1.5`}>
                            <div className={`w-px bg-neutral-600 ${i % 4 === 0 ? 'h-full' : 'h-1/2 opacity-30'} ${i % 8 === 0 ? 'bg-white/50 h-full' : ''}`} />
                        </div>
                    ))}
                    {/* End of Loop Marker */}
                    <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-end items-center">
                        <div className="w-px bg-white/50 h-full" />
                    </div>
                </div>

                {/* Empty Delete Placeholder */}
                {onRemoveTrack && <div className="w-6 sm:w-7 md:w-8 shrink-0" />}
            </div>
            {pattern.map((row, rowIndex) => {
                const track = tracks[rowIndex];
                if (!track) return null;

                return (
                    <div key={track.id} className="flex items-center gap-2 sm:gap-4 group/row min-w-max">
                        {/* Track Label area */}
                        <button
                            onClick={() => playSound(rowIndex, 0)} // Preview first beat? or just play
                            className="w-16 sm:w-20 md:w-24 flex flex-col items-end justify-center gap-0.5 sm:gap-1 shrink-0 overflow-hidden relative cursor-pointer hover:bg-white/5 rounded p-1 transition-colors text-right"
                            title="Play Track"
                        >
                            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-widest text-neutral-500 truncate w-full">{track.label}</span>
                            {track.type === 'sample' && track.sampleUrl && (
                                <div className="opacity-50">
                                    <Waveform
                                        audioUrl={track.sampleUrl}
                                        isPlaying={currentBeat !== -1 && row[currentBeat]}
                                        width={64}
                                        height={16}
                                    />
                                </div>
                            )}
                        </button>

                        <div className="flex flex-1">
                            {row.map((isActive, colIndex) => {
                                const isCurrent = colIndex === currentBeat;
                                // Removed isBarStart visual gap spacer logic from here

                                // Check if a note actually exists for this step
                                let hasNote = false;
                                if (track.midiData && track.midiData.notes) {
                                    hasNote = track.midiData.notes.some(n => n.quantizedStep === colIndex);
                                } else if (track.notes && track.notes.length > 0) {
                                    hasNote = true;
                                } else {
                                    hasNote = true;
                                }

                                return (
                                    <React.Fragment key={colIndex}>
                                        <button
                                            onClick={() => hasNote && onToggleNote(rowIndex, colIndex)}
                                            disabled={!hasNote}
                                            // Add visual divider for bar starts (every 8 steps) via styling instead of element
                                            className={`
                        relative flex-1 h-10 sm:h-12 md:h-14 rounded-[3px] sm:rounded-[4px] transition-all duration-75 group
                        border-t border-b-2 sm:border-b-[3px]
                        mr-0.5 sm:mr-1 md:mr-1.5
                        ${!hasNote ? 'opacity-10 cursor-not-allowed bg-[#151515] border-t-transparent border-b-transparent shadow-none' : ''}
                        ${hasNote && isActive
                                                    ? `${track.color} border-transparent ${isCurrent ? 'brightness-150' : ''} ${track.shadow}`
                                                    : 'bg-[#2a2a2a] border-[#1a1a1a] hover:bg-[#333]'
                                                }
                        ${isCurrent && !isActive ? 'bg-[#333] border-[#444]' : ''}
                        active:translate-y-[1px] active:border-b
                        `}
                                        >
                                            {/* LED Indicator for active step */}
                                            {isActive && (
                                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 sm:w-4 sm:h-1 bg-white/40 blur-[1px] rounded-full" />
                                            )}
                                        </button>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* Delete Button (Right Side) */}
                        {onRemoveTrack && (
                            <button
                                onClick={() => onRemoveTrack(track.id)}
                                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md flex items-center justify-center text-neutral-600 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 border border-transparent transition-all shrink-0"
                                title="Remove Track"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
});

MusicGrid.displayName = 'MusicGrid';
