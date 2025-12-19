
import { useState, useEffect } from 'react';
import { Track } from '@/lib/types';

const STORAGE_KEY = 'beatbrain_project_state';

const DEFAULT_TRACKS: Track[] = [];

const DEFAULT_PATTERN: boolean[][] = [];

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
                    // Migration: Pad patterns to 32 steps if they are formatted for 16
                    const paddedPattern = parsed.pattern.map((row: boolean[]) => {
                        if (row.length < 32) {
                            return [...row, ...Array(32 - row.length).fill(false)];
                        }
                        return row;
                    });
                    setPattern(paddedPattern);
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

    const addTrack = (track: Track, initialPattern?: boolean[]) => {
        setTracks(prev => [...prev, track]);
        setPattern(prev => [...prev, initialPattern || Array(32).fill(false)]);
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
