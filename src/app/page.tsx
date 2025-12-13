'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@mantine/core';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4 pt-20">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl">
        <div className="relative w-48 h-48 md:w-64 md:h-64 animate-float">
          <Image
            src="/BeatBrainHeadLogo.png"
            alt="BeatBrain Logo"
            fill
            className="object-contain animate-pulse-glow"
            priority
            sizes="(max-width: 768px) 192px, 256px"
          />
        </div>
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-cyan-400 to-slate-200 tracking-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          BeatBrain.AI
        </h1>
        <p className="text-xl text-neutral-400">
          Get music ideas out of your head and into reality!
        </p>

        <Button
          component={Link}
          href="/record"
          size="xl"
          radius="xl"
          variant="gradient"
          gradient={{ from: 'rgba(8, 145, 178, 1)', to: 'rgba(75, 85, 99, 1)', deg: 90 }}
          className="uppercase tracking-widest transition-transform hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] border border-white/20"
          styles={{
            root: { height: '60px', paddingLeft: '40px', paddingRight: '40px', fontSize: '1.125rem' }
          }}
        >
          Start Making Music
        </Button>
      </main>
    </div>
  );
}
