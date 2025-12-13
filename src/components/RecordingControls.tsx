import React from 'react';

interface RecordingControlsProps {
    isRecording: boolean;
    onRecordToggle: () => void;
}

export function RecordingControls({ isRecording, onRecordToggle }: RecordingControlsProps) {
    return (
        <div className="w-full p-4 bg-[#151515] rounded-xl border border-[#222] flex items-center justify-between group-hover:border-[#333] transition-colors">

            <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col flex-1">
                    <span className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mb-1">
                        Status
                    </span>
                    <div className="flex items-center gap-2">
                        {isRecording ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-sm text-neutral-300 font-medium">Recording...</span>
                            </>
                        ) : (
                            <span className="text-sm text-neutral-400 font-medium">Ready to record</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Visualizer when recording */}
                {isRecording && (
                    <div className="flex items-center gap-1 h-8 px-2 mx-4">
                        <div className="w-1 h-3 bg-red-500 animate-pulse" />
                        <div className="w-1 h-5 bg-red-500 animate-pulse delay-75" />
                        <div className="w-1 h-4 bg-red-500 animate-pulse delay-150" />
                        <div className="w-1 h-6 bg-red-500 animate-pulse delay-100" />
                        <div className="w-1 h-3 bg-red-500 animate-pulse delay-200" />
                    </div>
                )}

                {/* Record Button */}
                <button
                    onClick={onRecordToggle}
                    className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all bg-[#0a0a0a] border border-[#222]
                         active:scale-95
                        ${isRecording
                            ? 'shadow-[0_0_15px_rgba(220,38,38,0.5)] border-red-900/50'
                            : 'hover:border-red-900/30'
                        }
                    `}
                    title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                    <span className={`
                        transition-all duration-200 block
                        ${isRecording
                            ? 'w-4 h-4 bg-red-500 rounded-sm'
                            : 'w-4 h-4 bg-red-600 rounded-full group-hover:bg-red-500'
                        }
                    `} />
                </button>
            </div>
        </div>
    );
}
