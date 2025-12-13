import React, { useEffect, useRef } from 'react';

interface WaveformProps {
    audioUrl: string;
    isPlaying: boolean;
    width?: number; // Optional custom width
    height?: number; // Optional custom height
}

export function Waveform({ audioUrl, isPlaying, width = 120, height = 32 }: WaveformProps) {
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

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                if (!isMounted) {
                    audioContext.close();
                    return;
                }

                const canvas = canvasRef.current!;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Use the props or canvas dimensions
                const canvasWidth = width;
                const canvasHeight = height;

                // We use a smaller buffer for visualization
                const data = audioBuffer.getChannelData(0);
                const step = Math.ceil(data.length / canvasWidth);
                const amp = canvasHeight / 2;

                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                ctx.fillStyle = isPlaying ? '#ec4899' : '#525252'; // Pink if playing, neutral if not
                ctx.beginPath();

                for (let i = 0; i < canvasWidth; i++) {
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
                // Silently handle fetch errors (likely revoked blob URLs)
                // Draw a placeholder waveform instead
                if (canvasRef.current && isMounted) {
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, width, height);
                        ctx.fillStyle = '#333';
                        // Draw simple bars as placeholder
                        for (let i = 0; i < width; i += 4) {
                            const barHeight = Math.random() * height * 0.5 + height * 0.25;
                            ctx.fillRect(i, (height - barHeight) / 2, 2, barHeight);
                        }
                    }
                }
                if (audioContext) audioContext.close();
            }
        };

        drawWaveform();

        return () => {
            isMounted = false;
        };
    }, [audioUrl, isPlaying, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="rounded opacity-80"
        />
    );
}
