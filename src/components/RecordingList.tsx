import React, { useState, useRef, useEffect } from 'react';

export interface Recording {
    id: string;
    title: string;
    url: string;
    timestamp: number;
}

interface RecordingListProps {
    recordings: Recording[];
}

export function RecordingList({ recordings }: RecordingListProps) {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Effect to handle switching sources if playingId changes to a new non-null value
    // But playingId is set by us.
    // Actually, setting src and calling play() in togglePlay is fine, but we must ensure we pause previous.

    const togglePlay = (id: string, url: string) => {
        if (!audioRef.current) return;

        if (playingId === id) {
            audioRef.current.pause();
            setPlayingId(null);
        } else {
            audioRef.current.src = url;
            audioRef.current.play();
            setPlayingId(id);
        }
    };

    const handleEnded = () => {
        setPlayingId(null);
    };

    if (recordings.length === 0) return null;

    return (
        <div className="w-full flex flex-col gap-2 p-4 bg-[#151515] rounded-xl border border-[#222]">
            <h3 className="text-xs text-neutral-500 font-bold tracking-widest uppercase mb-2">Recordings</h3>

            {/* Shared Audio Element */}
            <audio ref={audioRef} onEnded={handleEnded} className="hidden" />

            <div className="flex flex-col gap-2">
                {recordings.map(rec => (
                    <div key={rec.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#333] hover:border-[#444] transition-colors group">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => togglePlay(rec.id, rec.url)}
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center transition-all border border-transparent
                                    ${playingId === rec.id
                                        ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)] border-red-400'
                                        : 'bg-[#222] text-neutral-400 hover:text-white hover:bg-[#333] hover:border-[#444]'
                                    }
                                `}
                            >
                                {playingId === rec.id ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                )}
                            </button>
                            <div className="flex flex-col">
                                <span className="text-sm text-neutral-200 font-medium">{rec.title}</span>
                                <span className="text-[10px] text-neutral-500 font-mono">{new Date(rec.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
