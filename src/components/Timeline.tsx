import React from 'react';

interface TimelineProps {
    progress: number; // 0 to 1
}

export function Timeline({ progress }: TimelineProps) {
    // MusicGrid responsive layout calculations:
    // Mobile (default):
    //   - padding: 12px (p-3)
    //   - label width: 64px (w-16)
    //   - gap: 8px (gap-2)
    //   - delete button: 24px (w-6)
    //   Left offset: 12 + 64 + 8 = 84px
    //   Right offset: 8 + 24 + 12 = 44px
    //
    // Tablet (sm: 640px+):
    //   - padding: 16px (p-4)
    //   - label width: 80px (w-20)
    //   - gap: 16px (gap-4)
    //   - delete button: 28px (w-7)
    //   Left offset: 16 + 80 + 16 = 112px
    //   Right offset: 16 + 28 + 16 = 60px
    //
    // Desktop (md: 768px+):
    //   - padding: 24px (p-6)
    //   - label width: 96px (w-24)
    //   - gap: 16px (gap-4)
    //   - delete button: 32px (w-8)
    //   Left offset: 24 + 96 + 16 = 136px
    //   Right offset: 16 + 32 + 24 = 72px

    return (
        <div className="w-full relative h-6 mb-1">
            {/* Playable area container for Ruler and Cursor */}
            <div
                className="absolute top-0 bottom-0 left-[84px] right-[44px] sm:left-[112px] sm:right-[60px] md:left-[136px] md:right-[72px]"
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
