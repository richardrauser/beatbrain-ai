
import { useState, useEffect, useCallback, useRef } from 'react';
import { Recording, DBRecording } from '@/lib/types';
import { saveRecordingToDB, getRecordingsFromDB, deleteRecordingFromDB, updateRecordingInDB } from '@/lib/db';

export function useRecordings() {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const createdUrls = useRef<Set<string>>(new Set());

    const loadRecordings = useCallback(async () => {
        try {
            const dbRecordings = await getRecordingsFromDB();

            // Clean up old URLs
            createdUrls.current.forEach(url => URL.revokeObjectURL(url));
            createdUrls.current.clear();

            // Convert to app recordings (create URLs)
            const appRecordings = dbRecordings
                .filter(r => {
                    // Filter out legacy transformed recordings (have notes but no MIDI data)
                    // Keep raw audio (no notes) and new transformed (midiData)
                    if (!r.midiData) return false;
                    return true;
                })
                .map(r => {
                    const url = URL.createObjectURL(r.blob);
                    createdUrls.current.add(url);
                    return {
                        ...r,
                        url
                    };
                });
            // Sort by timestamp desc
            appRecordings.sort((a, b) => b.timestamp - a.timestamp);
            setRecordings(appRecordings);
        } catch (error) {
            console.error('Failed to load recordings:', error);
        }
    }, []);

    useEffect(() => {
        loadRecordings();
        return () => {
            createdUrls.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, [loadRecordings]);

    const addRecording = useCallback(async (blob: Blob, title: string) => {
        const id = crypto.randomUUID();
        const timestamp = Date.now();

        const newRecording: DBRecording = {
            id,
            title,
            blob,
            timestamp
        };

        await saveRecordingToDB(newRecording);

        const url = URL.createObjectURL(blob);
        createdUrls.current.add(url);

        const appRec: Recording = { ...newRecording, url };
        setRecordings(prev => [appRec, ...prev]);
        return appRec;
    }, []);

    const updateRecording = async (id: string, updates: Partial<Recording>) => {
        // Exclude ephemeral fields if any, but currently only URL is ephemeral and it's not in DBRecording type effectively
        // We cast to any to allow stripping url
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { url, ...dbUpdates } = updates;

        await updateRecordingInDB(id, dbUpdates as Partial<DBRecording>);
        setRecordings(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const deleteRecording = async (id: string) => {
        await deleteRecordingFromDB(id);
        setRecordings(prev => prev.filter(r => r.id !== id));
    };

    return {
        recordings,
        addRecording,
        updateRecording,
        deleteRecording,
        refreshRecordings: loadRecordings
    };
}
