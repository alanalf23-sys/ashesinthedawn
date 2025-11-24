/**
 * Waveform Worker - Process waveform data in a Web Worker
 * Handles downsampling and peak detection for large audio files
 */

interface WaveformRequest {
  id: string;
  audioBuffer: Float32Array;
  targetResolution: number; // pixels width
  pixelsPerSecond: number;
}

interface WaveformResponse {
  id: string;
  peakData: number[];
  rmsData: number[];
  timestamp: number;
}

/**
 * Downsample audio data to fit the available pixels
 */
function downsampleWaveform(
  audioData: Float32Array,
  targetResolution: number
): { peaks: number[]; rms: number[] } {
  const peaks: number[] = [];
  const rms: number[] = [];

  const samplesPerPixel = Math.floor(audioData.length / targetResolution);
  if (samplesPerPixel < 1) {
    return {
      peaks: Array.from(audioData),
      rms: Array.from(audioData.map(v => Math.abs(v))),
    };
  }

  for (let i = 0; i < targetResolution; i++) {
    const startIdx = i * samplesPerPixel;
    const endIdx = Math.min(startIdx + samplesPerPixel, audioData.length);

    let peak = 0;
    let sumSquares = 0;

    for (let j = startIdx; j < endIdx; j++) {
      const sample = Math.abs(audioData[j]);
      if (sample > peak) peak = sample;
      sumSquares += sample * sample;
    }

    peaks.push(peak);
    rms.push(Math.sqrt(sumSquares / (endIdx - startIdx)));
  }

  return { peaks, rms };
}

/**
 * Process waveform request from main thread
 */
self.addEventListener('message', (event: MessageEvent<WaveformRequest>) => {
  const { id, audioBuffer, targetResolution } = event.data;

  const { peaks, rms } = downsampleWaveform(audioBuffer, targetResolution);

  const response: WaveformResponse = {
    id,
    peakData: peaks,
    rmsData: rms,
    timestamp: Date.now(),
  };

  self.postMessage(response);
});

export {};
