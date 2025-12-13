import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Track } from '@/lib/types';
import { Waveform } from '@/components/Waveform';

interface MusicGridProps {
    currentBeat?: number; // 0-15
    tracks: Track[];
    pattern: boolean[][];
    onToggleNote: (row: number, col: number) => void;
    onRemoveTrack?: (id: string) => void;
}

export interface MusicGridRef {
    resume: () => Promise<void>;
}

export const MusicGrid = forwardRef<MusicGridRef, MusicGridProps>(({ currentBeat = -1, tracks, pattern, onToggleNote, onRemoveTrack }, ref) => {
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
                        const response = await fetch(track.sampleUrl);
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                        audioBuffersRef.current[track.sampleUrl] = audioBuffer;
                    } catch (e) {
                        console.error(`Failed to load sample for ${track.label}`, e);
                    }
                }
            }
        };
        loadSamples();
    }, [tracks]);

    const playSound = (trackIndex: number) => {
        if (!audioCtxRef.current) return;
        const track = tracks[trackIndex];
        if (!track) return;

        // Resume context if suspended
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        const ctx = audioCtxRef.current;

        if (track.type === 'sample' && track.sampleUrl) {
            const buffer = audioBuffersRef.current[track.sampleUrl];
            if (buffer) {
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
            }
        } else {
            // Simple synths for defaults (Legacy)
            // ... (synth logic remains same)
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            const rowIndex = track.rowId;

            if (rowIndex === 0) { // Kick
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                gainNode.gain.setValueAtTime(1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            } else if (rowIndex === 1) { // Snare
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            } else if (rowIndex === 2) { // Hats
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            } else { // Synth (or fallback)
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            }

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        }
    };

    // ... (note triggering useEffect remains same)
    useEffect(() => {
        if (currentBeat !== -1 && pattern.length > 0) {
            pattern.forEach((row, rowIndex) => {
                if (row && row[currentBeat]) {
                    playSound(rowIndex);
                }
            });
        }
    }, [currentBeat, pattern, tracks]);

    if (!pattern || pattern.length === 0) return null; // Loading

    return (
        <div className="flex flex-col gap-3 p-6 bg-[#1a1a1a] rounded-xl border-t border-white/10 shadow-2xl relative">
            {/* Screw decoration */}
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-neutral-700 shadow-inner" />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neutral-700 shadow-inner" />
            <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-neutral-700 shadow-inner" />
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-neutral-700 shadow-inner" />

            {pattern.map((row, rowIndex) => {
                const track = tracks[rowIndex];
                if (!track) return null;

                return (
                    <div key={track.id} className="flex items-center gap-4 group/row">
                        {/* Track Label area */}
                        <button
                            onClick={() => playSound(rowIndex)}
                            className="w-24 flex flex-col items-end justify-center gap-1 shrink-0 overflow-hidden relative cursor-pointer hover:bg-white/5 rounded p-1 transition-colors text-right"
                            title="Play Track"
                        >
                            <span className="text-[10px] font-bold tracking-widest text-neutral-500 truncate w-full">{track.label}</span>
                            {track.type === 'sample' && track.sampleUrl && (
                                <div className="opacity-50">
                                    <Waveform
                                        audioUrl={track.sampleUrl}
                                        isPlaying={currentBeat !== -1 && row[currentBeat]}
                                        width={80}
                                        height={20}
                                    />
                                </div>
                            )}
                        </button>

                        <div className="flex gap-1.5 flex-1">
                            {row.map((isActive, colIndex) => {
                                const isCurrent = colIndex === currentBeat;
                                const isBarStart = colIndex % 4 === 0 && colIndex !== 0; // Divider

                                return (
                                    <React.Fragment key={colIndex}>
                                        {isBarStart && <div className="w-2" />}
                                        <button
                                            onClick={() => onToggleNote(rowIndex, colIndex)}
                                            className={`
                        relative flex-1 h-14 rounded-[4px] transition-all duration-75 group
                        border border-b-[3px]
                        ${isActive
                                                    ? `${track.color} border-transparent ${isCurrent ? 'brightness-150' : ''} ${track.shadow}`
                                                    : 'bg-[#2a2a2a] border-[#1a1a1a] hover:bg-[#333]'
                                                }
                        ${isCurrent && !isActive ? 'bg-[#333] border-[#444]' : ''}
                        active:translate-y-[1px] active:border-b
                        `}
                                        >
                                            {/* LED Indicator for active step */}
                                            {isActive && (
                                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-1 bg-white/40 blur-[1px] rounded-full" />
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
                                className="w-8 h-8 rounded-md flex items-center justify-center text-neutral-600 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 border border-transparent transition-all opacity-0 group-hover/row:opacity-100 shrink-0"
                                title="Remove Track"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
});

MusicGrid.displayName = 'MusicGrid';
