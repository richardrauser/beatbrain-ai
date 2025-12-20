import * as Tone from 'tone';
import { InstrumentType, MidiNote } from './types';

export class TonePlayer {
    private activeSynths: Set<Tone.Synth | Tone.PolySynth | Tone.PluckSynth | Tone.MembraneSynth | Tone.MonoSynth> = new Set();
    private playbackTimeouts: Set<NodeJS.Timeout> = new Set();

    // Cleanup function to stop all currently playing sounds managed by this instance
    public stopAll() {
        this.activeSynths.forEach(synth => {
            try {
                synth.dispose();
            } catch (e) {
                console.warn("Failed to dispose synth", e);
            }
        });
        this.activeSynths.clear();

        this.playbackTimeouts.forEach(timeout => clearTimeout(timeout));
        this.playbackTimeouts.clear();
    }

    private createSynth(instrument: InstrumentType): Tone.Synth | Tone.PolySynth | Tone.PluckSynth | Tone.MembraneSynth | Tone.MonoSynth {
        let synth: Tone.Synth | Tone.PolySynth | Tone.PluckSynth | Tone.MembraneSynth | Tone.MonoSynth;

        switch (instrument) {
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
        return synth;
    }

    public async playSequence(
        instrument: InstrumentType,
        notes: MidiNote[],
        onComplete?: () => void
    ) {
        // Ensure Tone is started
        await Tone.start();

        const synth = this.createSynth(instrument);
        this.activeSynths.add(synth);

        const now = Tone.now();
        let maxEndTime = 0;

        notes.forEach(note => {
            const time = 'time' in note ? note.time : (note as any).startTime;
            const startTime = now + time;

            const noteValue = 'midi' in note
                ? Tone.Frequency(note.midi, "midi")
                : (note as any).note;

            const duration = note.duration || 0.1;
            const velocity = 'velocity' in note ? note.velocity : 1;

            const endTime = time + duration;
            if (endTime > maxEndTime) maxEndTime = endTime;

            if (instrument === '909') {
                (synth as Tone.MembraneSynth).triggerAttackRelease(noteValue, duration, startTime, velocity);
            } else if (instrument === 'juno') {
                (synth as Tone.PolySynth).triggerAttackRelease(noteValue, duration, startTime, velocity);
            } else if (instrument === 'guitar') {
                // PluckSynth special handling
                (synth as Tone.PluckSynth).triggerAttackRelease(noteValue, duration, startTime, velocity);
            } else {
                (synth as Tone.Synth).triggerAttackRelease(noteValue, duration, startTime, velocity);
            }
        });

        // Schedule cleanup
        const timeout = setTimeout(() => {
            synth.dispose();
            this.activeSynths.delete(synth);
            this.playbackTimeouts.delete(timeout);
            if (onComplete) onComplete();
        }, (maxEndTime + 0.5) * 1000);

        this.playbackTimeouts.add(timeout);
    }

    // Static helper for single note playback (fire and forget)
    public static async playOneShot(instrument: InstrumentType, notes: MidiNote[]) {
        if (!notes || notes.length === 0) return;

        await Tone.start();
        // Since this is static/one-shot without state tracking, we create a temporary player instance just for this? 
        // Or just duplicate logic? 
        // Let's use a transient instance but correctly manage it.
        // ACTUALLY, strict static method avoids state, but we need to dispose.

        const player = new TonePlayer();
        // We'll trust the internal timeout to dispose.
        // We don't expose 'player' so it can't be stopped externally easily unless we return it.
        // For Grid hits (one shots), we usually don't need to stop them prematurely.
        player.playSequence(instrument, notes);
    }
}
