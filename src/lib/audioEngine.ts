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
  private playingNodes: Map<string, AudioBufferSourceNode> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  private panNodes: Map<string, StereoPannerNode> = new Map();
  private stereoWidthNodes: Map<string, GainNode> = new Map();
  private phaseFlipStates: Map<string, boolean> = new Map();
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  /**
   * Initialize the Web Audio API context and master nodes
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.audioContext.destination);

      // Create analyser for metering
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

  /**
   * Load an audio file and cache it
   */
  async loadAudioFile(trackId: string, file: File): Promise<boolean> {
    if (!this.audioContext) await this.initialize();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(trackId, audioBuffer);
      console.log(`Loaded audio file for track ${trackId}`);
      return true;
    } catch (error) {
      console.error(`Failed to load audio file for track ${trackId}:`, error);
      return false;
    }
  }

  /**
   * Play an audio file from a specific track
   */
  playAudio(trackId: string, startTime: number = 0, volume: number = 1, pan: number = 0): boolean {
    if (!this.audioContext || !this.masterGain) return false;

    const audioBuffer = this.audioBuffers.get(trackId);
    if (!audioBuffer) {
      console.warn(`No audio buffer found for track ${trackId}`);
      return false;
    }

    try {
      // Stop any existing playback for this track
      this.stopAudio(trackId);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Create track-specific gain node
      const trackGain = this.audioContext.createGain();
      trackGain.gain.value = this.dbToLinear(volume);

      // Create pan node
      const panNode = this.audioContext.createStereoPanner();
      panNode.pan.value = Math.max(-1, Math.min(1, pan));

      // Initialize stereo width and phase flip state
      this.stereoWidthNodes.set(trackId, trackGain);
      this.phaseFlipStates.set(trackId, false);

      // Connect: source → gain → pan → analyser → master
      source.connect(trackGain);
      trackGain.connect(panNode);
      panNode.connect(this.analyser!);

      // Store nodes for later updates
      this.gainNodes.set(trackId, trackGain);
      this.panNodes.set(trackId, panNode);

      source.start(0, startTime);
      this.playingNodes.set(trackId, source);

      console.log(`Playing track ${trackId} at ${startTime}s with volume ${volume}dB, pan ${pan}`);
      return true;
    } catch (error) {
      console.error(`Failed to play audio for track ${trackId}:`, error);
      return false;
    }
  }

  /**
   * Stop playback of an audio file
   */
  stopAudio(trackId: string): void {
    const source = this.playingNodes.get(trackId);
    if (source) {
      try {
        source.stop();
        this.playingNodes.delete(trackId);
        console.log(`Stopped playback for track ${trackId}`);
      } catch (error) {
        console.error(`Error stopping audio for track ${trackId}:`, error);
      }
    }
  }

  /**
   * Stop all audio playback
   */
  stopAllAudio(): void {
    this.playingNodes.forEach((source, trackId) => {
      try {
        source.stop();
      } catch (error) {
        console.warn(`Error stopping track ${trackId}:`, error);
      }
    });
    this.playingNodes.clear();
    console.log('Stopped all audio playback');
  }

  /**
   * Set volume for a specific track
   */
  setTrackVolume(trackId: string, volumeDb: number): void {
    const gainNode = this.gainNodes.get(trackId);
    if (gainNode) {
      gainNode.gain.value = this.dbToLinear(volumeDb);
      console.log(`Set volume for ${trackId}: ${volumeDb}dB`);
    }
  }

  /**
   * Set pan for a specific track
   */
  setTrackPan(trackId: string, panValue: number): void {
    const panNode = this.panNodes.get(trackId);
    if (panNode) {
      panNode.pan.value = Math.max(-1, Math.min(1, panValue));
      console.log(`Set pan for ${trackId}: ${panValue}`);
    }
  }

  /**
   * Set volume for master output
   */
  setMasterVolume(volumeDb: number): void {
    if (!this.masterGain) return;
    this.masterGain.gain.value = this.dbToLinear(volumeDb);
  }

  /**
   * Set volume for a specific track (legacy - kept for compatibility)
   */
  setTrackVolumeCompat(trackId: string, volumeDb: number): void {
    this.setTrackVolume(trackId, volumeDb);
  }

  /**
   * Start recording audio from microphone
   */
  async startRecording(): Promise<boolean> {
    if (!this.audioContext) await this.initialize();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      console.log('Recording started');
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder) return null;

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordedChunks = [];
        console.log('Recording stopped');
        resolve(blob);
      };
      this.mediaRecorder!.stop();
    });
  }

  /**
   * Get current playback position
   */
  getCurrentTime(): number {
    return this.audioContext?.currentTime ?? 0;
  }

  /**
   * Get waveform data from audio buffer
   */
  getWaveformData(trackId: string, samples: number = 1024): number[] {
    const buffer = this.audioBuffers.get(trackId);
    if (!buffer) {
      console.debug(`No audio buffer found for track ${trackId}`);
      return [];
    }

    try {
      const rawData = buffer.getChannelData(0);
      const blockSize = Math.floor(rawData.length / samples);
      
      if (blockSize < 1) {
        // If audio is too short, just return raw data
        return Array.from(rawData).map(v => Math.abs(v)).slice(0, samples);
      }

      const waveform: number[] = [];
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          const idx = i * blockSize + j;
          if (idx < rawData.length) {
            sum += Math.abs(rawData[idx]);
          }
        }
        waveform.push(sum / blockSize);
      }

      return waveform;
    } catch (error) {
      console.error(`Error extracting waveform for track ${trackId}:`, error);
      return [];
    }
  }

  /**
   * Get duration of loaded audio
   */
  getAudioDuration(trackId: string): number {
    const buffer = this.audioBuffers.get(trackId);
    return buffer ? buffer.duration : 0;
  }

  /**
   * Get audio level data for metering
   */
  getAudioLevels(): Uint8Array | null {
    if (!this.analyser) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.playingNodes.size > 0;
  }

  /**
   * Set stereo width for a track (0-200, where 100 is normal)
   */
  setStereoWidth(trackId: string, width: number): void {
    if (!this.isInitialized) return;

    const gainNode = this.gainNodes.get(trackId);
    if (!gainNode) return;

    // Mid-side stereo width processing
    // Width < 100: reduces stereo (more mono)
    // Width = 100: normal stereo
    // Width > 100: increases stereo width
    // Normalized value will be used for future DSP implementation
    Math.max(0, Math.min(200, width)) / 100;
    
    // Store for later use in audio graph optimization
    this.stereoWidthNodes.set(trackId, gainNode);
    
    console.debug(`Stereo width set for track ${trackId}: ${width}%`);
  }

  /**
   * Set phase flip for a track
   */
  setPhaseFlip(trackId: string, enabled: boolean): void {
    if (!this.isInitialized) return;

    const gainNode = this.gainNodes.get(trackId);
    if (!gainNode) return;

    // Apply phase flip by multiplying gain by -1
    const currentGain = gainNode.gain.value;
    gainNode.gain.value = enabled ? -Math.abs(currentGain) : Math.abs(currentGain);
    
    this.phaseFlipStates.set(trackId, enabled);
    console.debug(`Phase flip ${enabled ? 'enabled' : 'disabled'} for track ${trackId}`);
  }

  /**
   * Get phase flip state for a track
   */
  getPhaseFlip(trackId: string): boolean {
    return this.phaseFlipStates.get(trackId) ?? false;
  }

  /**
   * Convert dB to linear gain
   */
  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }

  /**
   * Cleanup and close audio context
   */
  dispose(): void {
    this.stopAllAudio();
    this.mediaRecorder?.stop();
    this.audioContext?.close();
    this.audioBuffers.clear();
    this.playingNodes.clear();
    this.isInitialized = false;
    console.log('Audio Engine disposed');
  }
}

// Singleton instance
let audioEngineInstance: AudioEngine | null = null;

/**
 * Get or create audio engine instance
 */
export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
}
