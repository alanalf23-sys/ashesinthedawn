/**
 * Audio Utilities - Helper functions for audio processing and analysis
 */

/**
 * Calculate RMS (Root Mean Square) level from audio data
 */
export function calculateRMSLevel(audioData: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    const normalized = audioData[i] / 255;
    sum += normalized * normalized;
  }
  const rms = Math.sqrt(sum / audioData.length);
  return rms;
}

/**
 * Convert linear gain (0-1) to dB (-∞ to 0)
 */
export function linearToDb(linear: number): number {
  if (linear <= 0) return -Infinity;
  return 20 * Math.log10(linear);
}

/**
 * Convert dB to linear gain
 */
export function dbToLinear(db: number): number {
  if (!isFinite(db)) return 0;
  return Math.pow(10, db / 20);
}

/**
 * Normalize audio data to 0-1 range
 */
export function normalizeAudioData(audioData: Uint8Array): number[] {
  return Array.from(audioData).map(val => val / 255);
}

/**
 * Get peak level from audio data
 */
export function getPeakLevel(audioData: Uint8Array): number {
  return Math.max(...audioData) / 255;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Create a simple test tone (sine wave)
 */
export function generateTestTone(frequency: number = 440, duration: number = 1, sampleRate: number = 44100): AudioBuffer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    data[i] = Math.sin(2 * Math.PI * frequency * t) * 0.3; // 0.3 volume to prevent clipping
  }

  return buffer;
}

/**
 * Format time in seconds to MM:SS:MS format
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
}

/**
 * Calculate loudness in LUFS (Loudness Units relative to Full Scale)
 * This is a simplified calculation
 */
export function calculateLUFS(audioData: Uint8Array): number {
  const rms = calculateRMSLevel(audioData);
  const db = linearToDb(rms);
  return db - 23; // LUFS offset
}

/**
 * Check if audio context is available
 */
export function isAudioContextAvailable(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window.AudioContext || (window as any).webkitAudioContext);
}

/**
 * Get audio context (with vendor prefix fallback)
 */
export function getAudioContext(): AudioContext | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext as typeof AudioContext;
    return new AudioContextClass();
  } catch (error) {
    console.error('AudioContext not supported:', error);
    return null;
  }
}

/**
 * Convert blob to ArrayBuffer
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Analyze audio frequency spectrum
 */
export function analyzeFrequencySpectrum(audioData: Uint8Array): {
  bass: number;
  mid: number;
  treble: number;
} {
  const third = Math.floor(audioData.length / 3);
  
  const bassBucket = audioData.slice(0, third);
  const midBucket = audioData.slice(third, third * 2);
  const trebleBucket = audioData.slice(third * 2);

  const bass = bassBucket.reduce((a: number, b: number) => a + b, 0) / bassBucket.length / 255;
  const mid = midBucket.reduce((a: number, b: number) => a + b, 0) / midBucket.length / 255;
  const treble = trebleBucket.reduce((a: number, b: number) => a + b, 0) / trebleBucket.length / 255;

  return { bass, mid, treble };
}

/**
 * Apply gain smoothing for fadeIn/fadeOut
 */
export function smoothGain(fromGain: number, toGain: number, duration: number): number[] {
  const samples = Math.floor(duration * 44100); // Assuming 44.1kHz
  const gainValues: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const t = i / samples;
    gainValues.push(fromGain + (toGain - fromGain) * t);
  }

  return gainValues;
}
