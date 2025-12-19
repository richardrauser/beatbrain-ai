'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useMusicFact } from './MusicFactContext';

export function Navigation() {
    const [isOpen, setIsOpen] = useState(false);
    const { showFact } = useMusicFact();

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 h-16">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group" onClick={() => setIsOpen(false)}>
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                        <Image
                            src="/BeatBrainHeadLogo.png"
                            alt="BeatBrain Logo"
                            fill
                            sizes="32px"
                            className="object-contain"
                        />
                    </div>
                    <span className="font-bold text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-cyan-400 to-slate-200 font-[family-name:var(--font-orbitron)]">
                        BeatBrain.ai
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6 lg:gap-8">
                    <button
                        onClick={showFact}
                        className="flex items-center gap-1.5 text-neutral-400 hover:text-cyan-400 transition-colors text-xs font-semibold tracking-wider uppercase group"
                        title="Show a random music fact"
                    >
                        <span className="text-base group-hover:scale-110 transition-transform">💡</span>
                        <span className="hidden lg:inline">Did you know?</span>
                    </button>
                    <Link
                        href="/record"
                        className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide uppercase"
                    >
                        Record
                    </Link>
                    <Link
                        href="/create"
                        className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide uppercase"
                    >
                        Create
                    </Link>
                    <Link
                        href="/about"
                        className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide uppercase"
                    >
                        About
                    </Link>
                </div>

                {/* Mobile Hamburger */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
                    aria-label="Toggle menu"
                >
                    <span className={`w-6 h-0.5 bg-current transition-transform ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
                    <span className={`w-6 h-0.5 bg-current transition-opacity ${isOpen ? 'opacity-0' : ''}`} />
                    <span className={`w-6 h-0.5 bg-current transition-transform ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
                    <div className="flex flex-col p-4 gap-2">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                showFact();
                            }}
                            className="flex items-center gap-3 text-neutral-400 hover:text-cyan-400 transition-colors text-sm font-medium tracking-wide uppercase py-3 px-4 hover:bg-white/5 rounded-lg text-left"
                        >
                            <span className="text-base">💡</span>
                            Music Facts
                        </button>
                        <Link
                            href="/record"
                            onClick={() => setIsOpen(false)}
                            className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide uppercase py-3 px-4 hover:bg-white/5 rounded-lg"
                        >
                            Record
                        </Link>
                        <Link
                            href="/create"
                            onClick={() => setIsOpen(false)}
                            className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide uppercase py-3 px-4 hover:bg-white/5 rounded-lg"
                        >
                            Create
                        </Link>
                        <Link
                            href="/about"
                            onClick={() => setIsOpen(false)}
                            className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide uppercase py-3 px-4 hover:bg-white/5 rounded-lg"
                        >
                            About
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
