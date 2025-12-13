export default function About() {
    return (
        <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-8 pt-24">
            <main className="max-w-3xl w-full flex flex-col gap-12 text-center items-center">
                <div className="flex flex-col gap-4">
                    <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-cyan-400 to-slate-200 tracking-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                        About BeatBrain
                    </h1>
                    <p className="text-2xl text-neutral-300 font-light">
                        The next evolution in AI-powered music creation.
                    </p>
                </div>

                <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/5 shadow-2xl text-left flex flex-col gap-6">
                    <p className="text-neutral-400 leading-relaxed">
                        BeatBrain is a hackathon project built to demonstrate the power of generative AI in modern creative workflows.
                        It combines a classic step sequencer interface with advanced AI models to help musicians sketch ideas faster.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                            <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-wider text-sm">Features</h3>
                            <ul className="text-neutral-500 text-sm space-y-2 list-disc pl-4">
                                <li>Classic 16-step sequencer</li>
                                <li>Real-time audio recording</li>
                                <li>AI-powered sound generation (coming soon)</li>
                                <li>Responsive, futuristic UI</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                            <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-wider text-sm">Tech Stack</h3>
                            <ul className="text-neutral-500 text-sm space-y-2 list-disc pl-4">
                                <li>Next.js 14 App Router</li>
                                <li>Tailwind CSS & Mantine</li>
                                <li>Web Audio API</li>
                                <li>Google Gemini API (integration in progress)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
