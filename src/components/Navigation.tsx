import Link from 'next/link';
import Image from 'next/image';

export function Navigation() {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 h-16">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                        <Image
                            src="/BeatBrainHeadLogo.png"
                            alt="BeatBrain Logo"
                            fill
                            sizes="32px"
                            className="object-contain"
                        />
                    </div>
                    <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-cyan-400 to-slate-200 font-[family-name:var(--font-orbitron)]">
                        BeatBrain.AI
                    </span>
                </Link>

                <div className="flex items-center gap-8">
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
            </div>
        </nav>
    );
}
