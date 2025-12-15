export default function About() {
    return (
        <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-8 pt-24">
            <main className="max-w-3xl w-full flex flex-col gap-12 text-center items-center">
                <div className="flex flex-col gap-4">
                    <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-cyan-400 to-slate-200 tracking-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                        About BeatBrain.ai
                    </h1>
                    <p className="text-2xl text-neutral-300 font-light">
                        BeatBrain.ai allows you to express your music ideas with only your voice, while learning about digital music creation!

                    </p>
                </div>

                <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/5 shadow-2xl text-left flex flex-col gap-6">
                    <p className="text-neutral-400 leading-relaxed">
                        BeatBrain.ai allows you to express each layer of a track by humming, singing, whistling or speaking. Then it will translate your vocalisations into the instruments of your choice.
                        While AI magic makes this happen, BeatBrain.ai educatates you about digital music production, filling the void while you wait for your results!
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                            <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-wider text-sm">Features</h3>
                            <ul className="text-neutral-500 text-sm space-y-2 list-disc pl-4">
                                <li>Real-time audio recording from any device</li>
                                <li>AI-powered voice-to-instrument translation</li>
                                <li>Quantization, beat matching and pitch correction</li>
                                <li>Classic 16-step sequencer</li>
                                <li>Responsive, futuristic UI</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                            <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-wider text-sm">Tech Stack</h3>
                            <ul className="text-neutral-500 text-sm space-y-2 list-disc pl-4">
                                <li>Built entirely using Google Antigravity, from dev to test to prod release!</li>
                                <li>Nano Banana Pro for design elements</li>
                                <li>Google Gemini 3 for voice-to-instrument transformation, music data generation, AI powered music education and more</li>
                                <li>Google Firebase for app hosting and Google Cloud for secret management</li>
                                <li>Next.js 16 + React 19</li>
                                <li>Tailwind CSS & Mantine</li>
                                <li>Web Audio API</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 md:col-span-2">
                            <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-wider text-sm">Created By</h3>
                            <p className="text-neutral-500 text-sm mb-3">
                                BeatBrain.ai was created by <span className="text-cyan-400 font-semibold">Richard Rauser</span> at the <span className="text-cyan-400 font-semibold">Google Gemini 3 Hackathon</span> on December 13, 2025 in London.
                            </p>
                            <div className="flex flex-col gap-2">
                                <p className="text-neutral-500 text-sm">To reach out, find me here:</p>
                                <div className="flex flex-wrap gap-3">
                                    <a
                                        href="https://github.com/richardrauser"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 bg-black/40 hover:bg-black/60 border border-cyan-400/30 hover:border-cyan-400/60 rounded-lg text-cyan-400 text-sm transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                                    >
                                        GitHub
                                    </a>
                                    <a
                                        href="https://linkedin.com/in/richardrauser"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 bg-black/40 hover:bg-black/60 border border-cyan-400/30 hover:border-cyan-400/60 rounded-lg text-cyan-400 text-sm transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                                    >
                                        LinkedIn
                                    </a>
                                    <a
                                        href="https://twitter.com/richardrauser"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 bg-black/40 hover:bg-black/60 border border-cyan-400/30 hover:border-cyan-400/60 rounded-lg text-cyan-400 text-sm transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                                    >
                                        Twitter/X
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
