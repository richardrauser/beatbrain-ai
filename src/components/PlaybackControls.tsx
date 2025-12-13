import React from 'react';

interface PlaybackControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onReset: () => void;
}

export function PlaybackControls({ isPlaying, onPlayPause, onReset }: PlaybackControlsProps) {
    return (
        <div className="flex items-center justify-center w-full p-4 bg-[#151515] rounded-lg border border-[#222]">
            {/* Transport */}
            <div className="flex gap-4">
                {/* Return to Start Button */}
                <button
                    onClick={onReset}
                    className="w-12 h-12 bg-neutral-800 rounded shadow-[0_4px_0_#262626,0_5px_10px_rgba(0,0,0,0.5)] active:translate-y-[2px] active:shadow-[0_2px_0_#262626] border-t border-white/5 flex items-center justify-center group hover:text-white text-neutral-400 transition-colors"
                    title="Return to Start"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                </button>

                {/* Play/Pause Button */}
                <button
                    onClick={onPlayPause}
                    className={`
              w-12 h-12 rounded flex items-center justify-center transition-all
              ${isPlaying
                            ? 'bg-green-900/50 shadow-[0_2px_0_#064e3b,inset_0_0_10px_rgba(34,197,94,0.5)] translate-y-[2px]'
                            : 'bg-neutral-800 shadow-[0_4px_0_#262626,0_5px_10px_rgba(0,0,0,0.5)] active:translate-y-[2px] active:shadow-[0_2px_0_#262626]'
                        }
              border-t border-white/5
            `}
                >
                    {isPlaying ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#22c55e" className="drop-shadow-glow">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#22c55e">
                            <path d="M5 3L19 12L5 21V3Z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
