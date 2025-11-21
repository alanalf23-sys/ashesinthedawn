/**
 * Audio Engine - Handles Web Audio API playback, recording, and mixing
 * Provides core audio functionality for CoreLogic Studio
 */

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private waveformCache: Map<string, number[]> = new Map();
  private playingNodes: Map<string, AudioBufferSourceNode> = new Map();
  private inputGainNodes: Map<string, GainNode> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  private panNodes: Map<string, StereoPannerNode> = new Map();
  private stereoWidthNodes: Map<string, GainNode> = new Map();
  private phaseFlipStates: Map<string, boolean> = new Map();
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  /** NEW: per-track analysers for metering */
  private trackAnalysers: Map<string, AnalyserNode> = new Map();
  private trackLevelCache: Map<string, number> = new Map();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.audioContext.destination);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.connect(this.masterGain);
      this.analyser.fftSize = 2048;
      this.isInitialized = true;
      console.log('Audio Engine initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  async loadAudioFile(trackId: string, file: File): Promise<boolean> {
    if (!this.audioContext) await this.initialize();
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(trackId, audioBuffer);
      const waveformData = this.getWaveformData(trackId, 1024);
      this.waveformCache.set(trackId, waveformData);
      console.log(`Loaded audio file for track ${trackId}`);
      return true;
    } catch (error) {
      console.error(`Failed to load audio file for track ${trackId}:`, error);
      return false;
    }
  }

  playAudio(trackId: string, startTime: number = 0, volume: number = 1, pan: number = 0): boolean {
    if (!this.audioContext || !this.masterGain) return false;
    const audioBuffer = this.audioBuffers.get(trackId);
    if (!audioBuffer) return false;

    try {
      this.stopAudio(trackId);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      const inputGain = this.audioContext.createGain();
      inputGain.gain.value = 1;

      const panNode = this.audioContext.createStereoPanner();
      panNode.pan.value = Math.max(-1, Math.min(1, pan));

      const trackGain = this.audioContext.createGain();
      trackGain.gain.value = this.dbToLinear(volume);

      /** NEW: per-track analyser */
      const trackAnalyser = this.audioContext.createAnalyser();
      trackAnalyser.fftSize = 512;
      this.trackAnalysers.set(trackId, trackAnalyser);

      // Connect: source → inputGain → pan → fader → analyser → master analyser → master gain
      source.connect(inputGain);
      inputGain.connect(panNode);
      panNode.connect(trackGain);
      trackGain.connect(trackAnalyser);
      trackAnalyser.connect(this.analyser!); // aggregate to master

      this.inputGainNodes.set(trackId, inputGain);
      this.gainNodes.set(trackId, trackGain);
      this.panNodes.set(trackId, panNode);

      source.start(0, startTime);
      this.playingNodes.set(trackId, source);

      console.log(`Playing track ${trackId}`);
      return true;
    } catch (error) {
      console.error(`Failed to play track ${trackId}:`, error);
      return false;
    }
  }

  stopAudio(trackId: string): void {
    const source = this.playingNodes.get(trackId);
    if (source) {
      try {
        source.stop();
        this.playingNodes.delete(trackId);
      } catch (err) {
        console.warn(`Stop failed for ${trackId}`, err);
      }
    }
  }

  stopAllAudio(): void {
    this.playingNodes.forEach((src, id) => {
      try { src.stop(); } catch {}
    });
    this.playingNodes.clear();
  }

  // ---- existing controls omitted for brevity ----

  /**
   * NEW: Get live RMS level for a specific track (0–1 linear)
   */
  getTrackLevel(trackId: string): number {
    const analyser = this.trackAnalysers.get(trackId);
    if (!analyser) return 0;

    const buffer = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = (buffer[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buffer.length);
    const prev = this.trackLevelCache.get(trackId) ?? 0;
    const smoothed = 0.6 * prev + 0.4 * rms; // gentle smoothing
    this.trackLevelCache.set(trackId, smoothed);
    return smoothed;
  }

  /**
   * Optionally get overall master RMS (averaged across tracks)
   */
  getMasterLevel(): number {
    if (this.trackAnalysers.size === 0) return 0;
    let total = 0;
    this.trackAnalysers.forEach((_, id) => (total += this.getTrackLevel(id)));
    return total / this.trackAnalysers.size;
  }

  // keep the rest of your class as-is …
  // (dispose, dbToLinear, setPhaseFlip, etc.)
}

// Singleton
let audioEngineInstance: AudioEngine | null = null;
export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) audioEngineInstance = new AudioEngine();
  return audioEngineInstance;
}