'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MusicGrid, MusicGridRef } from '@/components/MusicGrid';
import { PlaybackControls } from '@/components/PlaybackControls';
import { Timeline } from '@/components/Timeline';
import { TempoControl } from '@/components/TempoControl';
import { RecordingList } from '@/components/RecordingList';
import { useProjectState } from '@/hooks/useProjectState';
import { useRecordings } from '@/hooks/useRecordings';
import { Recording, Track } from '@/lib/types';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(125);
  const [currentStep, setCurrentStep] = useState(0); // 0-15
  const [progress, setProgress] = useState(0); // 0-1 for timeline

  const { tracks, pattern, addTrack, removeTrack, toggleNote } = useProjectState();
  const { recordings, addRecording, updateRecording, deleteRecording } = useRecordings();

  const musicGridRef = useRef<MusicGridRef>(null);

  // Sync track URLs with latest recordings (fixes stale blob URLs on refresh)
  const validTracks = useMemo(() => {
    return tracks.map(t => {
      if (t.type === 'sample') {
        const rec = recordings.find(r => r.id === t.id);
        if (rec) {
          return { ...t, sampleUrl: rec.url };
        }
      }
      return t;
    });
  }, [tracks, recordings]);

  const handleAddRecording = (rec: Recording) => {
    const newTrack: Track = {
      id: rec.id,
      label: rec.title.toUpperCase(),
      color: 'bg-emerald-500',
      shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]',
      type: 'sample',
      sampleUrl: rec.url,
      rowId: -1
    };
    addTrack(newTrack);
  };

  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastStepRef = useRef<number>(-1);

  // 4 bars * 4 notes = 16 steps
  const totalSteps = 16;

  const animate = useCallback((time: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = time;
    }

    // Calculate elapsed time from start (in seconds)
    // We adjust by how much 'progress' we've already made if we pause/resume?
    // For simplicity, let's just reset to 0 on stop, or handle pause properly later.
    // User asked "starts in paused... play button icon changes... timeline cursor starts moving".
    // I will implement simple start/stop for now.

    const secondsPerBeat = 60 / tempo;
    const loopDuration = secondsPerBeat * totalSteps;

    const elapsed = (time - startTimeRef.current) / 1000;
    const currentLoopTime = elapsed % loopDuration;

    // Calculate Progress (0 to 1)
    const newProgress = currentLoopTime / loopDuration;
    setProgress(newProgress);

    // Calculate Step (0 to 15)
    // We want discrete steps
    const step = Math.floor(newProgress * totalSteps);
    if (step !== lastStepRef.current) {
      setCurrentStep(step);
      lastStepRef.current = step;
      // Here we could trigger audio scheduling in the future
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [tempo]);

  useEffect(() => {
    if (isPlaying) {
      // Start or Resume
      // For a simple 'Pause' that resumes, we'd need to track accumulated time.
      // But user said "timeline cursor starts moving from left to right" implies from 0?
      // "starts moving from left to right" = from 0 usually.
      // "paused state" -> "play"
      // If I hit pause, does it reset? "Pause" usually implies stopping in place.
      // I will implement Pause (hold place).
      // To do that, I need to store `offsetTime`.

      startTimeRef.current = performance.now() - (progress * (60 / tempo * totalSteps) * 1000);
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
      startTimeRef.current = 0; // Reset this so next play sets it correctly? 
      // Actually if we pause, we don't clear progress.
    }

    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, tempo, animate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePlayPause = () => {
    if (!isPlaying) {
      // Resume AudioContext when starting playback
      musicGridRef.current?.resume();
    }
    setIsPlaying(prev => !prev);
  };


  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-8 pt-24">
      {/* Device Frame */}
      <main className="
        relative w-full max-w-4xl p-1 rounded-2xl
        bg-gradient-to-br from-neutral-800 to-neutral-900 
        shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]
      ">
        {/* Inner Device Surface */}
        <div className="bg-[#121212] rounded-xl p-8 flex flex-col gap-6 shadow-inner border border-black">

          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-2 m-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-200 tracking-tight flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]" />
                <span>Music <span className="text-neutral-600">Grid</span></span>
              </h1>
            </div>
            <div>
              <TempoControl tempo={tempo} onTempoChange={setTempo} />
            </div>
          </div>

          <div className="flex flex-col mx-4">
            <Timeline progress={progress} />
            <MusicGrid
              ref={musicGridRef}
              currentBeat={currentStep}
              tracks={validTracks}
              pattern={pattern}
              onToggleNote={toggleNote}
              onRemoveTrack={removeTrack}
            />
          </div>

          <div className="m-4">
            <PlaybackControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onReset={() => {
                setIsPlaying(false);
                setProgress(0);
                setCurrentStep(0);
                lastStepRef.current = -1;
              }}
            />
          </div>
        </div>

        {/* Recordings Section */}
        <div className="m-4">
          <div className="mt-4">
            <RecordingList
              recordings={recordings.filter(r => !tracks.some(t => t.id === r.id))}
              onAdd={handleAddRecording}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
