import React, { useEffect, useState } from 'react';

const FACTS = [
    {
        title: "Did you know? MIDI",
        content: "MIDI (Musical Instrument Digital Interface) is a protocol that allows electronic instruments and computers to communicate. It sends note data, not actual audio!",
        icon: "🎹"
    },
    {
        title: "Quantization",
        content: "Quantization is the process of aligning musical notes to a precise rhythmic grid. It removes human timing imperfections to create a 'tighter' beat.",
        icon: "⏱️"
    },
    {
        title: "Digital Signal Processing (DSP)",
        content: "DSP involves manipulating audio signals using mathematics. Effects like reverb, delay, and EQ are all built on complex DSP algorithms.",
        icon: "🎛️"
    },
    {
        title: "ADSR Envelopes",
        content: "Every synth sound interacts with time using ADSR: Attack (start), Decay (initial drop), Sustain (held volume), and Release (fade out).",
        icon: "📉"
    },
    {
        title: "The Nyquist Theorem",
        content: "To accurately capture digital audio, we must sample at least twice the highest frequency we want to hear. That's why 44.1kHz is standard (capturing up to ~22kHz).",
        icon: "📊"
    },
    {
        title: "Low Frequency Oscillators (LFO)",
        content: "An LFO operates below human hearing (under 20Hz) to modulate parameters like pitch (vibrato) or volume (tremolo) rhythmically.",
        icon: "〰️"
    }
];

interface MusicFactPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MusicFactPopup({ isOpen, onClose }: MusicFactPopupProps) {
    const [fact, setFact] = useState(FACTS[0]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFact(FACTS[Math.floor(Math.random() * FACTS.length)]);
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

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
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{fact.icon}</span>
                        <h4 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">{fact.title}</h4>
                    </div>
                    <p className="text-neutral-300 text-sm leading-relaxed">
                        {fact.content}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        <span className="text-[10px] text-cyan-500/70 font-mono uppercase">Processing Audio...</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
