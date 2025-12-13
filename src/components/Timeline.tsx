import React from 'react';

interface TimelineProps {
    progress: number; // 0 to 1
}

export function Timeline({ progress }: TimelineProps) {
    // MusicGrid layout:
    // p-6 (24px) padding
    // w-24 (96px) label
    // gap-4 (16px) label-track gap
    // So track starts at 24 + 96 + 16 = 136px
    // Right side: gap-4 (16px) + delete button w-8 (32px) + padding (24px) = 72px

    const leftOffset = '136px';
    const rightOffset = '72px';

    return (
        <div className="w-full relative h-6 mb-1">
            {/* Playable area container for Ruler and Cursor */}
            <div
                className="absolute top-0 bottom-0"
                style={{
                    left: leftOffset,
                    right: rightOffset
                }}
            >
                {/* Ruler marks - distributed across the playable area */}
                <div className="w-full h-full flex justify-between items-end">
                    {Array.from({ length: 17 }).map((_, i) => (
                        <div key={i} className={`w-[1px] bg-neutral-600 ${i % 4 === 0 ? 'h-3' : 'h-1.5'}`} />
                    ))}
                </div>

                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-0 pointer-events-none z-20"
                    style={{
                        left: `${progress * 100}%`
                    }}
                >
                    <div className="absolute left-0 -translate-x-1/2 w-[2px] h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" />
                    <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500" />
                </div>
            </div>
        </div>
    );
}
