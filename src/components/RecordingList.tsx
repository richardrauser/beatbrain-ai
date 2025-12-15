import React, { useState, useRef } from 'react';
import * as Tone from 'tone';
import { Waveform } from './Waveform';
import { Recording, InstrumentType } from '@/lib/types';

interface RecordingListProps {
    recordings: Recording[];
    onTransform?: (recording: Recording, instrument: InstrumentType) => Promise<void>;
    onUpdate?: (id: string, updates: Partial<Recording>) => void;
    onDelete?: (id: string) => Promise<void>;
    onAdd?: (recording: Recording) => void;
}

export function RecordingList({ recordings, onTransform, onUpdate, onDelete, onAdd }: RecordingListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [transcribingIds, setTranscribingIds] = useState<Set<string>>(new Set());
    const [selectedInstruments, setSelectedInstruments] = useState<Record<string, InstrumentType>>({});
    const [generatingIcons, setGeneratingIcons] = useState<Set<string>>(new Set());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Effect to handle switching sources if playingId changes to a new non-null value
    // But playingId is set by us.
    // Actually, setting src and calling play() in togglePlay is fine, but we must ensure we pause previous.

    const togglePlay = async (id: string, url: string) => {
        if (!audioRef.current) return;

        try {
            if (playingId === id) {
                audioRef.current.pause();
                setPlayingId(null);
            } else {
                audioRef.current.src = url;
                await audioRef.current.load(); // Ensure it loads
                await audioRef.current.play();
                setPlayingId(id);
            }
        } catch (error) {
            console.error("Playback failed:", error);
            setPlayingId(null);
        }
    };

    const handleEnded = () => {
        setPlayingId(null);
    };

    const handleTransformClick = async (rec: Recording, instrument: InstrumentType) => {
        if (!onTransform) return;

        setTranscribingIds(prev => new Set(prev).add(rec.id));
        try {
            await onTransform(rec, instrument);
        } catch (err) {
            console.error("Transform failed", err);
        } finally {
            setTranscribingIds(prev => {
                const next = new Set(prev);
                next.delete(rec.id);
                return next;
            });
        }
    };

    const handleInstrumentSelect = (id: string, type: InstrumentType) => {
        setSelectedInstruments(prev => ({
            ...prev,
            [id]: type
        }));
    };

    const startEditing = (rec: Recording) => {
        setEditingId(rec.id);
        setEditName(rec.title);
    };

    const generateIconWithGemini = async (text: string): Promise<string | null> => {
        try {
            const response = await fetch('/api/generate-icon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                console.error("Icon generation failed");
                return null;
            }

            const data = await response.json();
            if (data.image) {
                return data.image; // Already full data URI
            } else if (data.svg) {
                return `data:image/svg+xml;base64,${btoa(data.svg)}`;
            }
            return null;
        } catch (e) {
            console.error("Failed to generate icon with Gemini:", e);
            return null;
        }
    };

    const saveEditing = async (id: string) => {
        const newName = editName.trim();
        if (onUpdate && newName) {
            onUpdate(id, { title: newName });

            // Trigger icon generation
            setGeneratingIcons(prev => new Set(prev).add(id));
            setEditingId(null);
            setEditName("");

            // Async generation
            const icon = await generateIconWithGemini(newName);
            if (icon) {
                onUpdate(id, { icon });
            }
            setGeneratingIcons(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } else {
            setEditingId(null);
            setEditName("");
        }
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName("");
    };

    const getInstrumentIcon = (type?: InstrumentType) => {
        switch (type) {
            case 'juno': return '🎹';
            case 'guitar': return '🎸';
            case 'bass': return '🎸';
            case '909': return '🥁';
            default: return '🎺';
        }
    };

    const getInstrumentLabel = (type?: InstrumentType) => {
        switch (type) {
            case 'juno': return 'Juno';
            case 'guitar': return 'Guitar';
            case 'bass': return 'Bass';
            case '909': return '909';
            default: return 'Trumpet';
        }
    };

    const [playingInstrumentId, setPlayingInstrumentId] = useState<string | null>(null);
    const activeSynthRef = useRef<Tone.Synth | Tone.PolySynth | Tone.PluckSynth | Tone.MembraneSynth | Tone.MonoSynth | null>(null);
    const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const playInstrument = async (rec: Recording) => {
        // Toggle off if already playing
        if (playingInstrumentId === rec.id) {
            if (activeSynthRef.current) {
                activeSynthRef.current.dispose();
                activeSynthRef.current = null;
            }
            if (playbackTimeoutRef.current) {
                clearTimeout(playbackTimeoutRef.current);
                playbackTimeoutRef.current = null;
            }
            setPlayingInstrumentId(null);
            return;
        }

        // Stop any other playing instrument
        if (playingInstrumentId && activeSynthRef.current) {
            activeSynthRef.current.dispose();
            activeSynthRef.current = null;
            if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
            setPlayingInstrumentId(null);
        }

        if (!rec.notes) return;
        await Tone.start();

        const now = Tone.now();
        let synth: Tone.Synth | Tone.PolySynth | Tone.PluckSynth | Tone.MembraneSynth | Tone.MonoSynth;

        switch (rec.instrument) {
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

        // Save reference for stopping
        activeSynthRef.current = synth;
        setPlayingInstrumentId(rec.id);

        let maxEndTime = 0;

        rec.notes.forEach(note => {
            const startTime = now + note.startTime;
            const duration = note.duration || 0.1;
            const endTime = note.startTime + duration;
            if (endTime > maxEndTime) maxEndTime = endTime;

            if (rec.instrument === '909') {
                (synth as Tone.MembraneSynth).triggerAttackRelease(note.note, duration, startTime);
            } else if (rec.instrument === 'juno') {
                (synth as Tone.PolySynth).triggerAttackRelease(note.note, duration, startTime);
            } else if (rec.instrument === 'guitar') {
                (synth as Tone.PluckSynth).triggerAttackRelease(note.note, startTime);
            } else {
                (synth as Tone.Synth).triggerAttackRelease(note.note, duration, startTime);
            }
        });

        // Auto-stop after playback
        playbackTimeoutRef.current = setTimeout(() => {
            if (activeSynthRef.current) {
                activeSynthRef.current.dispose();
                activeSynthRef.current = null;
            }
            setPlayingInstrumentId(null);
        }, (maxEndTime + 0.5) * 1000);
    };

    if (recordings.length === 0) return null;

    // Simplified view for Selection Mode (Add to Grid)
    if (onAdd) {
        return (
            <div className="w-full flex flex-col gap-2 p-4 bg-[#151515] rounded-xl border border-[#222]">
                <h3 className="text-xs text-neutral-500 font-bold tracking-widest uppercase mb-2">Select Recording</h3>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                    {recordings.map(rec => (
                        <div key={rec.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#333] hover:border-[#444] transition-colors group">
                            <div className="flex items-center gap-3 flex-1">
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-md bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0 border border-neutral-700">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={rec.icon || '/BeatBrainHeadLogo.png'}
                                        alt={rec.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-sm text-neutral-200 font-medium truncate">{rec.title}</span>
                                    <span className="text-[10px] text-neutral-500 font-mono">{new Date(rec.timestamp).toLocaleTimeString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => onAdd(rec)}
                                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wide rounded-md transition-colors border border-neutral-700"
                            >
                                Add
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Default View (Record/Manage Mode)
    return (
        <div className="w-full flex flex-col gap-2 p-3 sm:p-4 bg-[#151515] rounded-xl border border-[#222]">
            <h3 className="text-xs text-neutral-500 font-bold tracking-widest uppercase mb-2">Recordings</h3>

            {/* Shared Audio Element */}
            <audio
                ref={audioRef}
                onEnded={handleEnded}
                className="hidden"
                onError={(e) => console.error("Audio Element Error:", e.currentTarget.error)}
            />

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 sm:pr-2">
                {recordings.map(rec => (
                    <div key={rec.id} className="flex flex-row items-center justify-between p-2 sm:p-3 bg-[#1a1a1a] rounded-lg border border-[#333] hover:border-[#444] transition-colors group gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            {/* Icon */}
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0 border border-neutral-700">
                                {generatingIcons.has(rec.id) ? (
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-neutral-500 border-t-white rounded-full animate-spin" />
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={rec.icon || '/BeatBrainHeadLogo.png'}
                                        alt={rec.title}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            <button
                                onClick={() => togglePlay(rec.id, rec.url)}
                                className={`
                                    w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all border border-transparent shrink-0
                                    ${playingId === rec.id
                                        ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)] border-red-400'
                                        : 'bg-[#222] text-neutral-400 hover:text-white hover:bg-[#333] hover:border-[#444]'
                                    }
                                `}
                                title="Play Original"
                            >
                                {playingId === rec.id ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v5 9l11-7z" /></svg>
                                )}
                            </button>

                            <div className="flex flex-col flex-1 min-w-0">
                                {editingId === rec.id ? (
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={() => saveEditing(rec.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveEditing(rec.id);
                                            if (e.key === 'Escape') cancelEditing();
                                        }}
                                        autoFocus
                                        className="bg-[#222] text-white text-xs sm:text-sm px-2 py-0.5 rounded border border-neutral-600 focus:outline-none focus:border-red-500 w-full mb-0.5"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 group/title">
                                        <span className="text-xs sm:text-sm text-neutral-200 font-medium truncate">{rec.title}</span>
                                        <button
                                            onClick={() => startEditing(rec)}
                                            className="opacity-0 group-hover/title:opacity-100 text-neutral-500 hover:text-white transition-opacity p-1"
                                            title="Rename"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </button>
                                    </div>
                                )}
                                <span className="text-[9px] sm:text-[10px] text-neutral-500 font-mono">{new Date(rec.timestamp).toLocaleTimeString()}</span>
                            </div>

                            <div className="ml-2 sm:ml-4 shrink-0">
                                <Waveform audioUrl={rec.url} isPlaying={playingId === rec.id} />
                            </div>
                        </div>

                        {/* Actions - Always on same row */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {rec.notes ? (
                                <button
                                    onClick={() => playInstrument(rec)}
                                    className="px-2 sm:px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap"
                                >
                                    {playingInstrumentId === rec.id ? (
                                        <><span className="hidden sm:inline">⏸️</span> <span className="hidden sm:inline">Pause</span><span className="sm:hidden">⏸</span></>
                                    ) : (
                                        <><span>{getInstrumentIcon(rec.instrument)}</span> <span className="hidden sm:inline">Play {getInstrumentLabel(rec.instrument)}</span><span className="sm:hidden">▶</span></>
                                    )}
                                </button>
                            ) : (
                                <div className={`flex items-center bg-[#222] rounded-md border border-[#333] transition-colors overflow-hidden ${transcribingIds.has(rec.id) ? 'opacity-50 pointer-events-none' : 'hover:border-[#555]'
                                    }`}>
                                    <div className="relative">
                                        <select
                                            className="appearance-none bg-transparent text-neutral-400 text-[10px] sm:text-xs py-1.5 pl-2 sm:pl-3 pr-5 sm:pr-6 focus:outline-none cursor-pointer hover:text-white transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                                const val = e.target.value as InstrumentType;
                                                handleInstrumentSelect(rec.id, val);
                                            }}
                                            value={selectedInstruments[rec.id] || 'trumpet'}
                                            disabled={transcribingIds.has(rec.id)}
                                        >
                                            <option value="trumpet">Trumpet</option>
                                            <option value="juno">Juno 2 synth</option>
                                            <option value="guitar">Guitar</option>
                                            <option value="bass">MOOG Bassline</option>
                                            <option value="909">TR-909 drums</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1">
                                            <svg className="fill-current h-2.5 w-2.5 sm:h-3 sm:w-3 text-neutral-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>

                                    <div className="w-[1px] h-4 bg-[#444]" />

                                    <button
                                        onClick={() => handleTransformClick(rec, selectedInstruments[rec.id] || 'trumpet')}
                                        disabled={transcribingIds.has(rec.id)}
                                        className="px-2 sm:px-3 py-1.5 bg-transparent text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center gap-1 sm:gap-2"
                                    >
                                        {transcribingIds.has(rec.id) ? (
                                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <span>✨</span>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Delete Button */}
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(rec.id);
                                    }}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center text-neutral-600 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 border border-transparent transition-all"
                                    title="Delete Recording"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
