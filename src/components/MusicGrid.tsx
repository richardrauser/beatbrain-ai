import React, { useState } from 'react';

interface MusicGridProps {
    currentBeat?: number; // 0-15
}

export function MusicGrid({ currentBeat = -1 }: MusicGridProps) {
    // Mock State for "active" notes to make it look functional
    // In a real app, this would be passed down or use a context.
    const [gridState, setGridState] = useState(() => {
        // Randomize some initial notes for demo purposes
        const initial = Array(4).fill(null).map(() => Array(16).fill(false));
        initial[0][0] = true; initial[0][4] = true; initial[0][8] = true; initial[0][12] = true; // Kick
        initial[1][4] = true; initial[1][12] = true; // Snare
        initial[2][2] = true; initial[2][6] = true; initial[2][10] = true; initial[2][14] = true; // Hats
        return initial;
    });

    const toggleNote = (row: number, col: number) => {
        const newGrid = [...gridState];
        newGrid[row][col] = !newGrid[row][col];
        setGridState(newGrid);
    };

    const rowLabels = ['KICK', 'SNARE', 'HATS', 'SYNTH'];
    const rowColors = ['bg-pink-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-purple-500'];
    const rowShadows = ['shadow-[0_0_10px_rgba(236,72,153,0.5)]', 'shadow-[0_0_10px_rgba(6,182,212,0.5)]', 'shadow-[0_0_10px_rgba(234,179,8,0.5)]', 'shadow-[0_0_10px_rgba(168,85,247,0.5)]'];

    return (
        <div className="flex flex-col gap-3 p-6 bg-[#1a1a1a] rounded-xl border-t border-white/10 shadow-2xl relative">
            {/* Screw decoration */}
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-neutral-700 shadow-inner" />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neutral-700 shadow-inner" />
            <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-neutral-700 shadow-inner" />
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-neutral-700 shadow-inner" />

            {gridState.map((row, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-4">
                    {/* Track Label */}
                    <div className="w-16 flex justify-end">
                        <span className="text-[10px] font-bold tracking-widest text-neutral-500">{rowLabels[rowIndex]}</span>
                    </div>

                    <div className="flex gap-1.5 flex-1">
                        {row.map((isActive, colIndex) => {
                            const isCurrent = colIndex === currentBeat;
                            const isBarStart = colIndex % 4 === 0 && colIndex !== 0; // Divider

                            return (
                                <React.Fragment key={colIndex}>
                                    {isBarStart && <div className="w-2" />}
                                    <button
                                        onClick={() => toggleNote(rowIndex, colIndex)}
                                        className={`
                      relative flex-1 h-14 rounded-[4px] transition-all duration-75 group
                      border border-b-[3px]
                      ${isActive
                                                ? `${rowColors[rowIndex]} border-transparent ${isCurrent ? 'brightness-150' : ''} ${rowShadows[rowIndex]}`
                                                : 'bg-[#2a2a2a] border-[#1a1a1a] hover:bg-[#333]'
                                            }
                      ${isCurrent && !isActive ? 'bg-[#333] border-[#444]' : ''}
                      active:translate-y-[1px] active:border-b
                    `}
                                    >
                                        {/* LED Indicator for active step */}
                                        {isActive && (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-1 bg-white/40 blur-[1px] rounded-full" />
                                        )}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
