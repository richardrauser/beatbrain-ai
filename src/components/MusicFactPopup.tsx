'use client';
import React, { useEffect, useState } from 'react';

interface MusicFact {
    title: string;
    content: string;
    icon: string;
}

const DEFAULT_FACT: MusicFact = {
    title: "Musical Harmony",
    content: "Harmony occurs when two or more notes are played together, creating a depth and richness to the melody.",
    icon: "🎵"
};

interface MusicFactPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MusicFactPopup({ isOpen, onClose }: MusicFactPopupProps) {
    const [fact, setFact] = useState<MusicFact | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchFact();
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setFact(null); // Reset fact when closed
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const fetchFact = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/music-fact');
            if (!response.ok) throw new Error('Failed to fetch fact');
            const data = await response.json();
            setFact(data);
        } catch (error) {
            console.error('Error fetching music fact:', error);
            setFact(DEFAULT_FACT);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
        >
            <div className="bg-[#151515] border border-cyan-500/30 rounded-lg p-5 w-80 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden group">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl -mr-10 -mt-10" />

                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-neutral-500 hover:text-white transition-colors p-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>

                <div className="relative z-10">
                    {isLoading || !fact ? (
                        <div className="animate-pulse">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-neutral-800 rounded-full" />
                                <div className="h-4 bg-neutral-800 rounded w-24" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-neutral-800 rounded w-full" />
                                <div className="h-3 bg-neutral-800 rounded w-5/6" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">{fact.icon}</span>
                                <h4 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">{fact.title}</h4>
                            </div>
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                {fact.content}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
