import React from 'react';

interface TimelineProps {
    progress: number; // 0 to 1
}

export function Timeline({ progress }: TimelineProps) {
    return (
        <div className="w-full relative h-6 mb-1 pl-[80px]"> {/* Left padding to align with grid pads (64px label + 16px gap) */}
            {/* Ruler marks */}
            <div className="absolute bottom-0 left-0 w-full flex justify-between px-1">
                {Array.from({ length: 17 }).map((_, i) => (
                    <div key={i} className={`w-[1px] bg-neutral-600 ${i % 4 === 0 ? 'h-3' : 'h-1.5'}`} />
                ))}
            </div>

            {/* Playhead */}
            {/* Need to account for the gaps in the grid if I want perfect alignment visually? 
          The grid has gaps. A simple percentage bar works OK, but precise alignment requires calculating gaps.
          For a "jazzed up" look, a simple smooth cursor is often enough if the grid is uniform.
      */}
            <div
                className="absolute top-0 bottom-0 pointer-events-none z-20"
                style={{
                    left: `calc(80px + (100% - 80px) * ${progress})`
                }}
            >
                <div className="w-[2px] h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" />
                <div className="absolute top-0 -translate-x-[5px] -translate-y-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500" />
            </div>
        </div>
    );
}
