import { Midi } from '@tonejs/midi';
import { Note, MidiNote, MidiTrackData, InstrumentType } from './types';
import * as Tone from 'tone';

/**
 * Converts a note name (e.g., "C4") to a MIDI number (e.g., 60)
 */
export function noteNameToMidi(noteName: string): number {
    try {
        return Tone.Frequency(noteName).toMidi();
    } catch (e) {
        console.warn(`Invalid note name: ${noteName}, defaulting to 60`);
        return 60; // Default to Middle C
    }
}

/**
 * Converts a MIDI number to a note name
 */
export function midiToNoteName(midi: number): string {
    return Tone.Frequency(midi, "midi").toNote();
}

/**
 * Converts legacy Note array to MIDI Track Data
 */
export function notesToMidi(notes: Note[], instrument: InstrumentType = 'trumpet'): MidiTrackData {
    const midiNotes: MidiNote[] = notes.map(note => ({
        midi: noteNameToMidi(note.note),
        name: note.note,
        time: note.startTime,
        duration: note.duration,
        velocity: 0.8 // Default velocity
    }));

    return {
        notes: midiNotes,
        instrument,
        name: `${instrument} Track`
    };
}

/**
 * Converts MIDI Track Data to legacy Note array
 */
export function midiToNotes(midiData: MidiTrackData): Note[] {
    return midiData.notes.map(note => ({
        note: note.name,
        startTime: note.time,
        duration: note.duration
    }));
}

/**
 * Generates a MIDI file Blob from MIDI Track Data
 */
export function createMidiFile(tracks: MidiTrackData[]): Blob {
    const midi = new Midi();

    tracks.forEach(trackData => {
        const track = midi.addTrack();
        track.name = trackData.name;
        track.instrument.name = trackData.instrument;

        trackData.notes.forEach(note => {
            track.addNote({
                midi: note.midi,
                time: note.time,
                duration: note.duration,
                velocity: note.velocity
            });
        });
    });

    return new Blob([midi.toArray() as any], { type: 'audio/midi' });
}

/**
 * Parses a MIDI file Blob into MIDI Track Data
 */
export async function parseMidiFile(file: Blob): Promise<MidiTrackData[]> {
    const arrayBuffer = await file.arrayBuffer();
    const midi = new Midi(arrayBuffer);

    return midi.tracks.map((track, index) => {
        // Map track instrument or Name to our InstrumentType if possible, else default
        // This is a simplification; in a real app we might attempt to map MIDI program numbers
        let instrument: InstrumentType = 'trumpet';
        const trackName = track.name.toLowerCase();

        if (trackName.includes('piano') || trackName.includes('juno')) instrument = 'juno';
        else if (trackName.includes('guitar')) instrument = 'guitar';
        else if (trackName.includes('bass')) instrument = 'bass';
        else if (trackName.includes('drum') || trackName.includes('909')) instrument = '909';

        const notes: MidiNote[] = track.notes.map(note => ({
            midi: note.midi,
            name: note.name,
            time: note.time,
            duration: note.duration,
            velocity: note.velocity
        }));

        return {
            notes,
            instrument,
            name: track.name || `Track ${index + 1}`
        };
    });
}
