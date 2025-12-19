import { useState, useRef, useCallback } from 'react';
import { trimAudioSilence } from '@/lib/audioUtils';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            // If we don't have a stream yet, we need to get it
            if (!streamRef.current) {
                setIsInitializing(true);
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
            }

            const mediaRecorder = new MediaRecorder(streamRef.current);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstart = () => {
                setIsRecording(true);
                setIsInitializing(false);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current);
                try {
                    const trimmedBlob = await trimAudioSilence(blob, 0.01);
                    setAudioBlob(trimmedBlob);
                    const url = URL.createObjectURL(trimmedBlob);
                    setAudioUrl(url);
                } catch (error) {
                    console.error('Error trimming audio:', error);
                    setAudioBlob(blob);
                    const url = URL.createObjectURL(blob);
                    setAudioUrl(url);
                }
                setIsRecording(false);
            };

            mediaRecorder.start(200);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setIsInitializing(false);
        }
    }, []);

    const prepareRecorder = useCallback(async () => {
        if (streamRef.current) return;
        try {
            setIsInitializing(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setIsInitializing(false);
        } catch (err) {
            console.error('Error preparing microphone:', err);
            setIsInitializing(false);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
        // Clean up tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const clearAudio = useCallback(() => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setAudioBlob(null);
    }, [audioUrl]);

    const resetAudio = useCallback(() => {
        setAudioUrl(null);
        setAudioBlob(null);
    }, []);

    return {
        isRecording,
        isInitializing,
        startRecording,
        prepareRecorder,
        stopRecording,
        audioUrl,
        audioBlob,
        clearAudio,
        resetAudio
    };
};
