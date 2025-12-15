import { useState, useRef, useCallback } from 'react';
import { trimAudioSilence } from '@/lib/audioUtils';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            setIsInitializing(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstart = () => {
                // Recording has actually started
                setIsRecording(true);
                setIsInitializing(false);
            };

            mediaRecorder.onstop = async () => {
                // Create blob from recorded chunks
                const blob = new Blob(chunksRef.current);

                try {
                    // Trim silence from the beginning and end
                    const trimmedBlob = await trimAudioSilence(blob, 0.01);
                    const url = URL.createObjectURL(trimmedBlob);
                    setAudioUrl(url);
                } catch (error) {
                    console.error('Error trimming audio:', error);
                    // Fallback to original audio if trimming fails
                    const url = URL.createObjectURL(blob);
                    setAudioUrl(url);
                }

                setIsRecording(false);
                // Clean up tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(200);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setIsInitializing(false);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const clearAudio = useCallback(() => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
    }, [audioUrl]);

    const resetAudio = useCallback(() => {
        setAudioUrl(null);
    }, []);

    return {
        isRecording,
        isInitializing,
        startRecording,
        stopRecording,
        audioUrl,
        clearAudio,
        resetAudio
    };
};
