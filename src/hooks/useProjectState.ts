
import { useState, useEffect } from 'react';
import { Track } from '@/lib/types';

const STORAGE_KEY = 'beatbrain_project_state';

const DEFAULT_TRACKS: Track[] = [
    { id: 'kick', label: 'KICK', color: 'bg-pink-500', shadow: 'shadow-[0_0_10px_rgba(236,72,153,0.5)]', type: 'synth', rowId: 0 },
    { id: 'snare', label: 'SNARE', color: 'bg-cyan-500', shadow: 'shadow-[0_0_10px_rgba(6,182,212,0.5)]', type: 'synth', rowId: 1 },
    { id: 'hats', label: 'HATS', color: 'bg-yellow-500', shadow: 'shadow-[0_0_10px_rgba(234,179,8,0.5)]', type: 'synth', rowId: 2 },
    { id: 'synth', label: 'SYNTH', color: 'bg-purple-500', shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]', type: 'synth', rowId: 3 },
];

const DEFAULT_PATTERN = [
    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], // Kick
    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
    [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false], // Hats
    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Synth
];

export function useProjectState() {
    // We load from localStorage initially, or fall back to defaults
    const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
    const [pattern, setPattern] = useState<boolean[][]>(DEFAULT_PATTERN);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.tracks && parsed.pattern) {
                    setTracks(parsed.tracks);
                    setPattern(parsed.pattern);
                }
            } catch (e) {
                console.error("Failed to parse project state", e);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        const state = { tracks, pattern };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [tracks, pattern, isLoaded]);

    const addTrack = (track: Track) => {
        setTracks(prev => [...prev, track]);
        setPattern(prev => [...prev, Array(16).fill(false)]);
    };

    const removeTrack = (trackId: string) => {
        setTracks(prev => {
            const index = prev.findIndex(t => t.id === trackId);
            if (index === -1) return prev;
            return prev.filter(t => t.id !== trackId);
        });
        setPattern(prev => {
            const index = tracks.findIndex(t => t.id === trackId);
            if (index === -1) return prev;
            // Remove the corresponding row
            return prev.filter((_, i) => i !== index);
        });
    };

    const toggleNote = (rowIndex: number, colIndex: number) => {
        setPattern(prev => {
            const newPattern = prev.map(row => [...row]);
            if (newPattern[rowIndex]) {
                newPattern[rowIndex][colIndex] = !newPattern[rowIndex][colIndex];
            }
            return newPattern;
        });
    };

    return {
        tracks,
        pattern,
        addTrack,
        removeTrack,
        toggleNote,
        isLoaded
    };
}
