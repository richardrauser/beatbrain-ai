import React, { useEffect, useRef } from 'react';

interface WaveformProps {
    audioUrl: string;
    isPlaying: boolean;
}

export function Waveform({ audioUrl, isPlaying }: WaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

    useEffect(() => {
        if (!audioUrl || !canvasRef.current || !AudioContext) return;

        let audioContext: AudioContext;
        let isMounted = true;

        const drawWaveform = async () => {
            try {
                audioContext = new AudioContext();
                const response = await fetch(audioUrl);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                if (!isMounted) {
                    audioContext.close();
                    return;
                }

                const canvas = canvasRef.current!;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const width = canvas.width;
                const height = canvas.height;

                // We use a smaller buffer for visualization
                const data = audioBuffer.getChannelData(0);
                const step = Math.ceil(data.length / width);
                const amp = height / 2;

                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = isPlaying ? '#ec4899' : '#525252'; // Pink if playing, neutral if not
                ctx.beginPath();

                for (let i = 0; i < width; i++) {
                    let min = 1.0;
                    let max = -1.0;
                    for (let j = 0; j < step; j++) {
                        const datum = data[(i * step) + j];
                        if (datum < min) min = datum;
                        if (datum > max) max = datum;
                    }

                    // Sanity check
                    if (min === 1.0 && max === -1.0) { min = 0; max = 0; }

                    ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
                }

                audioContext.close();

            } catch (e) {
                console.error("Error generating waveform:", e);
                if (audioContext) audioContext.close();
            }
        };

        drawWaveform();

        return () => {
            isMounted = false;
        };
    }, [audioUrl, isPlaying]);

    return (
        <canvas
            ref={canvasRef}
            width={120}
            height={32}
            className="rounded opacity-80"
        />
    );
}
