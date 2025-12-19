
export type InstrumentType = 'trumpet' | 'juno' | 'guitar' | 'bass' | '909';

export interface Note {
    note: string;
    duration: number;
    startTime: number;
}

// Enhanced note with MIDI properties
export interface MidiNote {
    midi: number;        // MIDI note number (0-127)
    name: string;        // Note name (e.g., "C4")
    time: number;        // Start time in seconds
    duration: number;    // Duration in seconds
    velocity: number;    // Velocity (0-1)
    quantizedStep?: number; // The grid step (0-31) this note maps to
}

// MIDI track data
export interface MidiTrackData {
    notes: MidiNote[];
    instrument: InstrumentType;
    name: string;
}

export interface Recording {
    id: string;
    title: string;
    url: string; // Blob URL for playback
    timestamp: number;
    notes?: Note[];           // Legacy format
    midiData?: MidiTrackData; // New MIDI format
    instrument?: InstrumentType;
    icon?: string;
}

export interface DBRecording extends Omit<Recording, 'url'> {
    blob: Blob;
}

export interface Track {
    id: string;
    label: string;
    color: string;
    shadow: string;
    type: 'synth' | 'sample';
    sampleUrl?: string;
    rowId: number; // To map to legacy synth logic 0-3
    notes?: Note[]; // For transformed recordings
    midiData?: MidiTrackData; // New MIDI format
    instrument?: InstrumentType; // For transformed recordings
}
