import React from 'react';

interface RecordingControlsProps {
    isRecording: boolean;
    isInitializing?: boolean;
    onRecordToggle: () => void;
}

export function RecordingControls({ isRecording, isInitializing = false, onRecordToggle }: RecordingControlsProps) {
    return (
        <div className="w-full p-4 bg-[#151515] rounded-xl border border-[#222] flex items-center justify-between group-hover:border-[#333] transition-colors">

            <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col flex-1">
                    <span className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mb-1">
                        Status
                    </span>
                    <div className="flex items-center gap-2">
                        {isInitializing ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm text-yellow-400 font-medium">Initializing...</span>
                            </>
                        ) : isRecording ? (
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
                    disabled={isInitializing}
                    className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all bg-[#0a0a0a] border border-[#222]
                         active:scale-95
                        ${isInitializing
                            ? 'opacity-50 cursor-not-allowed'
                            : isRecording
                                ? 'shadow-[0_0_15px_rgba(220,38,38,0.5)] border-red-900/50'
                                : 'hover:border-red-900/30'
                        }
                    `}
                    title={isInitializing ? "Initializing..." : isRecording ? "Stop Recording" : "Start Recording"}
                >
                    {isInitializing ? (
                        <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <span className={`
                            transition-all duration-200 block
                            ${isRecording
                                ? 'w-4 h-4 bg-red-500 rounded-sm'
                                : 'w-4 h-4 bg-red-600 rounded-full group-hover:bg-red-500'
                            }
                        `} />
                    )}
                </button>
            </div>
        </div>
    );
}
