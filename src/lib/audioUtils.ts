/**
 * Trims silence from the beginning and end of an audio blob
 * @param audioBlob - The audio blob to trim
 * @param threshold - The silence threshold (0-1), default 0.01
 * @returns Promise<Blob> - The trimmed audio blob
 */
export async function trimAudioSilence(audioBlob: Blob, threshold: number = 0.01): Promise<Blob> {
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get the audio data from the first channel
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Find the start of audio (first non-silent sample)
    let start = 0;
    for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) > threshold) {
            start = i;
            break;
        }
    }

    // Find the end of audio (last non-silent sample)
    let end = channelData.length - 1;
    for (let i = channelData.length - 1; i >= 0; i--) {
        if (Math.abs(channelData[i]) > threshold) {
            end = i;
            break;
        }
    }

    // If the entire audio is silent, return a minimal blob
    if (start >= end) {
        // Create a very short silent audio
        const silentBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            sampleRate * 0.1, // 100ms
            sampleRate
        );
        return await audioBufferToBlob(silentBuffer, audioBlob.type);
    }

    // Add a small padding (50ms) to avoid cutting too aggressively
    const padding = Math.floor(sampleRate * 0.05);
    start = Math.max(0, start - padding);
    end = Math.min(channelData.length - 1, end + padding);

    // Create a new buffer with the trimmed audio
    const trimmedLength = end - start + 1;
    const trimmedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        trimmedLength,
        sampleRate
    );

    // Copy data for all channels
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const sourceData = audioBuffer.getChannelData(channel);
        const targetData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < trimmedLength; i++) {
            targetData[i] = sourceData[start + i];
        }
    }

    // Convert the trimmed buffer back to a blob
    return await audioBufferToBlob(trimmedBuffer, audioBlob.type);
}

/**
 * Converts an AudioBuffer to a Blob
 */
async function audioBufferToBlob(audioBuffer: AudioBuffer, mimeType: string): Promise<Blob> {
    // Create an offline context to render the audio
    const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
    );

    // Create a buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    // Render the audio
    const renderedBuffer = await offlineContext.startRendering();

    // Convert to WAV format (most compatible)
    const wavBlob = audioBufferToWav(renderedBuffer);

    return wavBlob;
}

/**
 * Converts an AudioBuffer to WAV format blob
 */
function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const data = interleave(audioBuffer);
    const dataLength = data.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // byte rate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    floatTo16BitPCM(view, 44, data);

    return new Blob([view], { type: 'audio/wav' });
}

function interleave(audioBuffer: AudioBuffer): Float32Array {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels;
    const result = new Float32Array(length);

    let offset = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            result[offset++] = audioBuffer.getChannelData(channel)[i];
        }
    }

    return result;
}

function writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array): void {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}
