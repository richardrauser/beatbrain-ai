import React from 'react';
import { Slider } from '@mantine/core';

interface TempoControlProps {
    tempo: number;
    onTempoChange: (tempo: number) => void;
}

export function TempoControl({ tempo, onTempoChange }: TempoControlProps) {
    const handleChange = (newTempo: number) => {
        onTempoChange(Math.min(200, Math.max(60, newTempo)));
    };

    return (
        <div className="flex items-center gap-6 bg-black/40 p-3 rounded-xl border border-white/5">
            {/* Decrease Button */}
            <button
                onClick={() => handleChange(tempo - 1)}
                className="w-16 h-16 bg-neutral-800 rounded-lg shadow-[0_4px_0_#262626] active:translate-y-[2px] active:shadow-[0_2px_0_#262626] border-t border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-colors group"
                aria-label="Decrease Tempo"
            >
                <svg width="20" height="4" viewBox="0 0 10 2" fill="currentColor" className="group-hover:text-cyan-400 transition-colors"><rect width="10" height="2" rx="1" /></svg>
            </button>

            {/* Display */}
            <div className="flex flex-col items-center gap-1 min-w-[80px]">
                <span className="text-[10px] text-neutral-500 font-bold tracking-widest leading-none">BPM</span>
                <div className="bg-black border border-neutral-800 px-4 py-2 rounded-md text-cyan-400 font-mono text-3xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] text-shadow-neon w-full text-center">
                    {tempo}
                </div>
            </div>

            {/* Increase Button */}
            <button
                onClick={() => handleChange(tempo + 1)}
                className="w-16 h-16 bg-neutral-800 rounded-lg shadow-[0_4px_0_#262626] active:translate-y-[2px] active:shadow-[0_2px_0_#262626] border-t border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-colors group"
                aria-label="Increase Tempo"
            >
                <svg width="20" height="20" viewBox="0 0 10 10" fill="currentColor" className="group-hover:text-cyan-400 transition-colors">
                    <rect y="4" width="10" height="2" rx="1" />
                    <rect x="4" width="2" height="10" rx="1" />
                </svg>
            </button>

            {/* Fader */}
            <div className="w-48 ml-4 mr-2">
                <Slider
                    value={tempo}
                    onChange={handleChange}
                    min={60}
                    max={200}
                    label={null}
                    color="cyan"
                    size="lg"
                    styles={{
                        track: { backgroundColor: '#000', borderColor: '#262626', borderWidth: 1, borderStyle: 'solid' },
                        bar: { backgroundColor: 'rgb(22, 78, 99)' }, // cyan-900
                        thumb: { height: 24, width: 24, backgroundColor: '#404040', borderColor: '#000', borderWidth: 1 }
                    }}
                />
            </div>
        </div>
    );
}
