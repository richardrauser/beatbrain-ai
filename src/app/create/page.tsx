'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
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
          console.log(`Syncing track ${t.label}:`, { hasNotes: !!rec.notes, instrument: rec.instrument, noteCount: rec.notes?.length });
          return {
            ...t,
            sampleUrl: rec.url,
            notes: rec.notes,
            instrument: rec.instrument
          };
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

  // Track active synths for cleanup
  const activeSynthsRef = useRef<any[]>([]);
  const activeTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Play transformed instruments continuously when sequencer is playing
  useEffect(() => {
    // Cleanup function
    const cleanup = () => {
      activeSynthsRef.current.forEach(synth => {
        try {
          synth.dispose();
        } catch (e) {
          console.error('Error disposing synth:', e);
        }
      });
      activeSynthsRef.current = [];

      activeTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      activeTimeoutsRef.current = [];
    };

    if (!isPlaying) {
      cleanup();
      return;
    }

    const playTransformedTracks = async () => {
      const Tone = await import('tone');
      await Tone.start();

      validTracks.forEach(async (track) => {
        if (track.notes && track.notes.length > 0 && track.instrument) {
          // Play the full melody on loop
          const playMelody = async () => {
            if (!isPlaying) return; // Check if still playing

            let synth: any;

            switch (track.instrument) {
              case 'juno':
                synth = new Tone.PolySynth(Tone.Synth, {
                  oscillator: { type: "pulse", width: 0.2 },
                  envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 }
                }).toDestination();
                break;
              case 'guitar':
                synth = new Tone.PluckSynth({
                  attackNoise: 1,
                  dampening: 4000,
                  resonance: 0.7
                }).toDestination();
                break;
              case 'bass':
                synth = new Tone.MonoSynth({
                  oscillator: { type: "square" },
                  filter: { Q: 6, type: "lowpass", rolloff: -24 },
                  envelope: { attack: 0.005, decay: 0.1, sustain: 0.9, release: 1 },
                  filterEnvelope: { attack: 0.06, decay: 0.2, sustain: 0.5, release: 2, baseFrequency: 200, octaves: 7, exponent: 2 }
                }).toDestination();
                break;
              case '909':
                synth = new Tone.MembraneSynth({
                  pitchDecay: 0.05,
                  octaves: 10,
                  oscillator: { type: "sine" },
                  envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: "exponential" }
                }).toDestination();
                break;
              case 'trumpet':
              default:
                synth = new Tone.Synth({
                  oscillator: { type: "sawtooth" },
                  envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 }
                }).toDestination();
                break;
            }

            // Track this synth for cleanup
            activeSynthsRef.current.push(synth);

            // Calculate the total duration of the melody
            let maxEndTime = 0;
            track.notes!.forEach(note => {
              const endTime = note.startTime + (note.duration || 0.1);
              if (endTime > maxEndTime) maxEndTime = endTime;
            });

            // Play all notes with their timing
            const now = Tone.now();
            track.notes!.forEach(note => {
              const startTime = now + note.startTime;
              const duration = note.duration || 0.1;

              if (track.instrument === '909') {
                synth.triggerAttackRelease(note.note, duration, startTime);
              } else if (track.instrument === 'juno') {
                synth.triggerAttackRelease(note.note, duration, startTime);
              } else if (track.instrument === 'guitar') {
                synth.triggerAttackRelease(note.note, startTime);
              } else if (track.instrument === 'bass') {
                synth.triggerAttackRelease(note.note, duration, startTime);
              } else {
                synth.triggerAttackRelease(note.note, duration, startTime);
              }
            });

            // Schedule next loop
            const timeout = setTimeout(() => {
              // Remove this synth from tracking
              activeSynthsRef.current = activeSynthsRef.current.filter(s => s !== synth);
              synth.dispose();

              if (isPlaying) {
                playMelody();
              }
            }, maxEndTime * 1000);

            activeTimeoutsRef.current.push(timeout);
          };

          playMelody();
        }
      });
    };

    playTransformedTracks();

    return cleanup;
  }, [isPlaying, validTracks]);


  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-2 sm:p-4 md:p-8 pt-20 sm:pt-24">
      {/* Device Frame */}
      <main className="
        relative w-full max-w-4xl p-0.5 sm:p-1 rounded-xl sm:rounded-2xl
        bg-gradient-to-br from-neutral-800 to-neutral-900 
        shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]
      ">
        {/* Inner Device Surface */}
        <div className="bg-[#121212] rounded-lg sm:rounded-xl p-3 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6 shadow-inner border border-black">

          <div className="flex flex-row justify-between items-center border-b border-white/5 pb-3 sm:pb-4 mb-2 mx-2 sm:m-4 gap-2 sm:gap-4">
            <div className="flex-shrink min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-neutral-200 tracking-tight flex items-center gap-1.5 sm:gap-2">
                <span className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]" />
                <span className="truncate">Music <span className="text-neutral-600">Grid</span></span>
              </h1>
            </div>
            <div className="flex-shrink-0">
              <TempoControl tempo={tempo} onTempoChange={setTempo} />
            </div>
          </div>

          <div className="flex flex-col mx-2 sm:mx-4">
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

          <div className="mx-2 sm:m-4">
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
        <div className="m-2 sm:m-4">
          <div className="mt-4">
            {recordings.length === 0 ? (
              <div className="p-6 sm:p-8 bg-[#151515] rounded-xl border border-[#222] text-center">
                <div className="flex flex-col items-center gap-4">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-neutral-300 mb-2">
                      No Recordings Yet
                    </h3>
                    <p className="text-sm sm:text-base text-neutral-400 mb-4">
                      You haven't recorded any instruments yet! Go to the{' '}
                      <Link
                        href="/record"
                        className="text-emerald-400 hover:text-emerald-300 underline transition-colors"
                      >
                        Record
                      </Link>
                      {' '}page and create some first.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <RecordingList
                recordings={recordings.filter(r => !tracks.some(t => t.id === r.id))}
                onAdd={handleAddRecording}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
