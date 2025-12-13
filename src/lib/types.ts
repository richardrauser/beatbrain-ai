
export type InstrumentType = 'trumpet' | 'juno' | 'guitar' | 'bass' | '909';

export interface Note {
    note: string;
    duration: number;
    startTime: number;
}

export interface Recording {
    id: string;
    title: string;
    url: string; // Blob URL for playback
    timestamp: number;
    notes?: Note[];
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
}
