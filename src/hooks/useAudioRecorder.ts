import { useState, useRef, useCallback } from 'react';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                // Do not specify type, let browser detect from chunks or default
                const blob = new Blob(chunksRef.current);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                // Clean up tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(200);
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
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
        startRecording,
        stopRecording,
        audioUrl,
        clearAudio,
        resetAudio
    };
};
