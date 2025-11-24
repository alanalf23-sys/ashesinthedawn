import { FrequencyBucket, SpectrumData } from '../types';

/**
 * SpectrumAnalyzer extracts and analyzes frequency data from audio
 * Provides FFT visualization and frequency band analysis
 */

export class SpectrumAnalyzer {
  private analyser?: AnalyserNode;
  private dataArray?: Uint8Array | null;
  private fftSize: number = 256;
  private smoothing: number = 0.85;
  private sampleRate: number = 48000;
  private frequencies: number[] = [];
  private history: SpectrumData[] = [];
  private maxHistoryLength: number = 60; // 1 second at 60fps

  constructor(audioContext: AudioContext | null = null, fftSize: number = 256) {
    this.fftSize = fftSize;

    if (audioContext && audioContext.state === 'running') {
      this.analyser = audioContext.createAnalyser();
      this.analyser.fftSize = fftSize;
      this.analyser.smoothingTimeConstant = this.smoothing;
      this.sampleRate = audioContext.sampleRate;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Generate frequency labels for each bin
      this.generateFrequencyLabels();
    }
  }

  /**
   * Set up analyser with audio context
   */
  setAudioContext(audioContext: AudioContext): void {
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = this.smoothing;
    this.sampleRate = audioContext.sampleRate;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.generateFrequencyLabels();
  }

  /**
   * Generate frequency labels for each FFT bin
   */
  private generateFrequencyLabels(): void {
    if (!this.analyser) return;

    const nyquistFrequency = this.sampleRate / 2;
    const binCount = this.analyser.frequencyBinCount;

    this.frequencies = [];
    for (let i = 0; i < binCount; i++) {
      const frequency = (i / binCount) * nyquistFrequency;
      this.frequencies.push(frequency);
    }
  }

  /**
   * Get current spectrum data
   */
  getSpectrumData(): SpectrumData | null {
    if (!this.analyser || !this.dataArray) return null;

    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(frequencyData);

    const buckets: FrequencyBucket[] = [];
    let maxMagnitude = 0;
    let peakFrequency = 0;
    let sum = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i];
      const normalized = magnitude / 255;

      buckets.push({
        frequency: this.frequencies[i],
        magnitude,
        normalized,
      });

      sum += normalized;

      if (magnitude > maxMagnitude) {
        maxMagnitude = magnitude;
        peakFrequency = this.frequencies[i];
      }
    }

    const average = sum / buckets.length;

    const spectrumData: SpectrumData = {
      timestamp: Date.now(),
      buckets,
      peakFrequency,
      peakMagnitude: maxMagnitude / 255,
      average,
    };

    this.history.push(spectrumData);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }

    return spectrumData;
  }

  /**
   * Get frequency band (e.g., bass, mids, treble)
   */
  getFrequencyBand(startFreq: number, endFreq: number): number {
    if (!this.analyser) return 0;

    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(frequencyData);

    let sum = 0;
    let count = 0;

    for (let i = 0; i < this.frequencies.length; i++) {
      if (this.frequencies[i] >= startFreq && this.frequencies[i] <= endFreq) {
        sum += frequencyData[i];
        count++;
      }
    }

    return count > 0 ? sum / count / 255 : 0;
  }

  /**
   * Get bass frequencies (20Hz-250Hz)
   */
  getBass(): number {
    return this.getFrequencyBand(20, 250);
  }

  /**
   * Get mids (250Hz-2kHz)
   */
  getMids(): number {
    return this.getFrequencyBand(250, 2000);
  }

  /**
   * Get treble (2kHz-20kHz)
   */
  getTreble(): number {
    return this.getFrequencyBand(2000, 20000);
  }

  /**
   * Get presense peak (3kHz-6kHz)
   */
  getPresence(): number {
    return this.getFrequencyBand(3000, 6000);
  }

  /**
   * Get spectrum history
   */
  getHistory(): SpectrumData[] {
    return [...this.history];
  }

  /**
   * Get average spectrum over history
   */
  getAverageSpectrum(): SpectrumData | null {
    if (this.history.length === 0) return null;

    const bucketCount = this.history[0].buckets.length;
    const avgBuckets: FrequencyBucket[] = [];

    for (let i = 0; i < bucketCount; i++) {
      let sumMagnitude = 0;
      let sumNormalized = 0;

      for (const data of this.history) {
        if (i < data.buckets.length) {
          sumMagnitude += data.buckets[i].magnitude;
          sumNormalized += data.buckets[i].normalized;
        }
      }

      const count = this.history.length;
      avgBuckets.push({
        frequency: this.history[0].buckets[i].frequency,
        magnitude: sumMagnitude / count,
        normalized: sumNormalized / count,
      });
    }

    // Find peak
    let peakFrequency = 0;
    let peakMagnitude = 0;
    let sum = 0;

    for (const bucket of avgBuckets) {
      sum += bucket.normalized;
      if (bucket.normalized > peakMagnitude) {
        peakMagnitude = bucket.normalized;
        peakFrequency = bucket.frequency;
      }
    }

    return {
      timestamp: Date.now(),
      buckets: avgBuckets,
      peakFrequency,
      peakMagnitude,
      average: sum / avgBuckets.length,
    };
  }

  /**
   * Set FFT size
   */
  setFFTSize(size: number): void {
    const validSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
    if (!validSizes.includes(size)) return;

    this.fftSize = size;
    if (this.analyser) {
      this.analyser.fftSize = size;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.generateFrequencyLabels();
    }
  }

  /**
   * Set smoothing constant (0-1)
   */
  setSmoothing(value: number): void {
    this.smoothing = Math.max(0, Math.min(1, value));
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = this.smoothing;
    }
  }

  /**
   * Get analyser node for connection to audio graph
   */
  getAnalyserNode(): AnalyserNode | undefined {
    return this.analyser;
  }

  /**
   * Get frequency resolution (Hz per bin)
   */
  getFrequencyResolution(): number {
    return this.sampleRate / this.fftSize;
  }

  /**
   * Get Nyquist frequency
   */
  getNyquistFrequency(): number {
    return this.sampleRate / 2;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get analyzer state
   */
  getState(): Record<string, unknown> {
    return {
      fftSize: this.fftSize,
      smoothing: this.smoothing,
      sampleRate: this.sampleRate,
      historyLength: this.history.length,
      frequencyResolution: this.getFrequencyResolution(),
    };
  }
}

/**
 * Get or create spectrum analyzer
 */
export function getSpectrumAnalyzer(audioContext?: AudioContext, fftSize?: number): SpectrumAnalyzer {
  return new SpectrumAnalyzer(audioContext || null, fftSize);
}

/**
 * Frequency band constants
 */
export const FREQUENCY_BANDS = {
  SUB_BASS: { start: 20, end: 60, label: 'Sub Bass' },
  BASS: { start: 60, end: 250, label: 'Bass' },
  LOW_MIDS: { start: 250, end: 500, label: 'Low Mids' },
  MIDS: { start: 500, end: 2000, label: 'Mids' },
  HIGH_MIDS: { start: 2000, end: 4000, label: 'High Mids' },
  PRESENCE: { start: 4000, end: 6000, label: 'Presence' },
  BRILLIANCE: { start: 6000, end: 20000, label: 'Brilliance' },
};
