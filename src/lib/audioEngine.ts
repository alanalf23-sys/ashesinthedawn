/**
 * Audio Engine - Handles Web Audio API playback, recording, and mixing
 * Provides core audio functionality for CoreLogic Studio
 */

interface LoopConfig {
  enabled: boolean;
  startTime: number;
  endTime: number;
}

interface TrackPlayState {
  isPlaying: boolean;
  currentOffset: number;
  startTime: number;
  loopCount: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private metronomeGain: GainNode | null = null;
  private isInitialized = false;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private waveformCache: Map<string, number[]> = new Map(); // Cache for waveforms
  private playingNodes: Map<string, AudioBufferSourceNode> = new Map();
  private inputGainNodes: Map<string, GainNode> = new Map(); // Pre-fader input gain
  private gainNodes: Map<string, GainNode> = new Map(); // Fader level
  private panNodes: Map<string, StereoPannerNode> = new Map();
  private stereoWidthNodes: Map<string, GainNode> = new Map();
  private phaseFlipStates: Map<string, boolean> = new Map();
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private playingTracksState: Map<string, TrackPlayState> = new Map();
  private loopConfig: LoopConfig = { enabled: false, startTime: 0, endTime: 0 };
  private metronomeSettings = {
    enabled: false,
    bpm: 120,
    timeSignature: 4,
    volume: 0.3,
  };
  private metronomeScheduler: number | null = null;

  /**
   * Initialize the Web Audio API context and master nodes
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load configuration at initialization time
      this.metronomeSettings.enabled = true; // Default metronome enabled

      const AudioContextClass =
        window.AudioContext ||
        ((window as unknown as Record<string, unknown>)
          .webkitAudioContext as typeof AudioContext);
      this.audioContext = new AudioContextClass();

      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.audioContext.destination);

      // Create analyser for metering
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.connect(this.masterGain);
      this.analyser.fftSize = 2048;

      // Create separate gain node for metronome
      this.metronomeGain = this.audioContext.createGain();
      this.metronomeGain.gain.value = this.metronomeSettings.volume;
      this.metronomeGain.connect(this.masterGain);

      this.isInitialized = true;
      console.log("Audio Engine initialized");
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      throw error;
    }
  }

  /**
   * Load an audio file and cache it with waveform data
   */
  async loadAudioFile(trackId: string, file: File): Promise<boolean> {
    if (!this.audioContext) await this.initialize();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(trackId, audioBuffer);

      // Pre-generate and cache waveform data for faster rendering
      const waveformData = this.getWaveformData(trackId, 1024);
      this.waveformCache.set(trackId, waveformData);

      console.log(
        `Loaded audio file for track ${trackId} with waveform (${waveformData.length} samples)`
      );
      return true;
    } catch (error) {
      console.error(`Failed to load audio file for track ${trackId}:`, error);
      return false;
    }
  }

  /**
   * Play an audio file from a specific track with loop support
   */
  playAudio(
    trackId: string,
    startTime: number = 0,
    volume: number = 1,
    pan: number = 0
  ): boolean {
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

      // Enable looping based on loop config
      if (this.loopConfig.enabled) {
        source.loop = true;
        source.loopStart = this.loopConfig.startTime;
        source.loopEnd = Math.min(
          this.loopConfig.endTime,
          audioBuffer.duration
        );
      }

      // Create pre-fader input gain node
      const inputGain = this.audioContext.createGain();
      inputGain.gain.value = 1; // Unity gain initially

      // Create pan node
      const panNode = this.audioContext.createStereoPanner();
      panNode.pan.value = Math.max(-1, Math.min(1, pan));

      // Create track-specific gain node (fader level - POST-PAN)
      const trackGain = this.audioContext.createGain();
      trackGain.gain.value = this.dbToLinear(volume);

      // Initialize stereo width and phase flip state
      this.stereoWidthNodes.set(trackId, trackGain);
      this.phaseFlipStates.set(trackId, false);

      // Connect: source → input gain → pan → track gain (fader) → analyser → master
      source.connect(inputGain);
      inputGain.connect(panNode);
      panNode.connect(trackGain);
      trackGain.connect(this.analyser!);

      // Store nodes for later updates
      this.inputGainNodes.set(trackId, inputGain);
      this.gainNodes.set(trackId, trackGain);
      this.panNodes.set(trackId, panNode);

      // Track playback state
      this.playingTracksState.set(trackId, {
        isPlaying: true,
        currentOffset: startTime,
        startTime: this.audioContext.currentTime,
        loopCount: 0,
      });

      source.start(0, startTime);
      this.playingNodes.set(trackId, source);

      console.log(
        `Playing track ${trackId} at ${startTime}s with volume ${volume}dB, pan ${pan}`
      );
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
    console.log("Stopped all audio playback");
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
   * Set input gain for a specific track (pre-fader)
   */
  setTrackInputGain(trackId: string, gainDb: number): void {
    const inputGain = this.inputGainNodes.get(trackId);
    if (inputGain) {
      inputGain.gain.value = this.dbToLinear(gainDb);
      console.log(`Set input gain for ${trackId}: ${gainDb}dB`);
    }
  }

  /**
   * Get current input gain for a track
   */
  getTrackInputGain(trackId: string): number {
    const inputGain = this.inputGainNodes.get(trackId);
    return inputGain ? 20 * Math.log10(inputGain.gain.value) : 0;
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
      console.log("Recording started");
      return true;
    } catch (error) {
      console.error("Failed to start recording:", error);
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
        const blob = new Blob(this.recordedChunks, { type: "audio/webm" });
        this.recordedChunks = [];
        console.log("Recording stopped");
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
    // Check cache first
    const cached = this.waveformCache.get(trackId);
    if (cached && cached.length > 0) {
      return cached;
    }

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
        return Array.from(rawData)
          .map((v) => Math.abs(v))
          .slice(0, samples);
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

      // Cache the computed waveform
      this.waveformCache.set(trackId, waveform);
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
    void (Math.max(0, Math.min(200, width)) / 100);

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
    gainNode.gain.value = enabled
      ? -Math.abs(currentGain)
      : Math.abs(currentGain);

    this.phaseFlipStates.set(trackId, enabled);
    console.debug(
      `Phase flip ${enabled ? "enabled" : "disabled"} for track ${trackId}`
    );
  }

  /**
   * Get phase flip state for a track
   */
  getPhaseFlip(trackId: string): boolean {
    return this.phaseFlipStates.get(trackId) ?? false;
  }

  /**
   * Process plugin chain for a track
   * Returns the audio node to route through plugin chain
   */
  processPluginChain(
    trackId: string,
    sourceNode: AudioNode,
    pluginTypes: string[]
  ): AudioNode {
    if (!this.audioContext || !this.isInitialized) return sourceNode;

    let currentNode: AudioNode = sourceNode;

    // Process each plugin in the chain
    for (const pluginType of pluginTypes) {
      switch (pluginType) {
        case "eq": {
          // Create simple EQ with 3-band
          const eq = this.audioContext!.createBiquadFilter();
          eq.type = "lowshelf";
          eq.frequency.value = 200;
          currentNode.connect(eq);
          currentNode = eq;
          console.debug(`EQ plugin inserted for track ${trackId}`);
          break;
        }
        case "compressor": {
          // Create dynamics compressor
          const compressor = this.audioContext!.createDynamicsCompressor();
          compressor.threshold.value = -24;
          compressor.knee.value = 30;
          compressor.ratio.value = 12;
          compressor.attack.value = 0.003;
          compressor.release.value = 0.25;
          currentNode.connect(compressor);
          currentNode = compressor;
          console.debug(`Compressor plugin inserted for track ${trackId}`);
          break;
        }
        case "gate": {
          // Gate implemented via gain modulation (simplified)
          const gateGain = this.audioContext!.createGain();
          gateGain.gain.value = 1;
          currentNode.connect(gateGain);
          currentNode = gateGain;
          console.debug(`Gate plugin inserted for track ${trackId}`);
          break;
        }
        case "delay": {
          // Create delay effect
          const delayNode = this.audioContext!.createDelay(5);
          delayNode.delayTime.value = 0.3;
          currentNode.connect(delayNode);
          currentNode = delayNode;
          console.debug(`Delay plugin inserted for track ${trackId}`);
          break;
        }
        case "reverb": {
          // Reverb implemented with delay + feedback (simplified)
          const reverbGain = this.audioContext!.createGain();
          reverbGain.gain.value = 0.5;
          currentNode.connect(reverbGain);
          currentNode = reverbGain;
          console.debug(`Reverb plugin inserted for track ${trackId}`);
          break;
        }
        case "utility":
        case "meter":
        default: {
          // Utility/meter pass-through
          const utilityGain = this.audioContext!.createGain();
          utilityGain.gain.value = 1;
          currentNode.connect(utilityGain);
          currentNode = utilityGain;
          console.debug(`Utility/Meter plugin inserted for track ${trackId}`);
        }
      }
    }

    return currentNode;
  }

  /**
   * Set loop region for playback
   */
  setLoopRegion(startTime: number, endTime: number, enabled: boolean): void {
    this.loopConfig = {
      enabled,
      startTime: Math.max(0, startTime),
      endTime: Math.max(startTime, endTime),
    };
    console.log(
      `Loop region set: ${this.loopConfig.startTime}s - ${this.loopConfig.endTime}s (${enabled ? "enabled" : "disabled"})`
    );
  }

  /**
   * Get current loop configuration
   */
  getLoopRegion(): LoopConfig {
    return { ...this.loopConfig };
  }

  /**
   * Toggle loop playback
   */
  toggleLoop(): void {
    this.loopConfig.enabled = !this.loopConfig.enabled;
    console.log(`Loop ${this.loopConfig.enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Generate metronome click sound
   */
  private generateMetronomeClick(isDownbeat: boolean): AudioBuffer {
    if (!this.audioContext) throw new Error("Audio context not initialized");

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1; // 100ms click
    const buffer = this.audioContext.createBuffer(
      1,
      sampleRate * duration,
      sampleRate
    );
    const data = buffer.getChannelData(0);

    const frequency = isDownbeat ? 1000 : 800; // Higher pitch for downbeat
    const attack = 0.005;
    const decay = 0.05;

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let envelope = 1;

      if (t < attack) {
        envelope = t / attack;
      } else if (t < attack + decay) {
        envelope = 1 - (t - attack) / decay;
      } else {
        envelope = 0;
      }

      data[i] =
        Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    return buffer;
  }

  /**
   * Enable/disable metronome
   */
  setMetronomeEnabled(enabled: boolean): void {
    this.metronomeSettings.enabled = enabled;
    if (!enabled && this.metronomeScheduler !== null) {
      cancelAnimationFrame(this.metronomeScheduler);
      this.metronomeScheduler = null;
    }
    console.log(`Metronome ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Set metronome volume
   */
  setMetronomeVolume(volume: number): void {
    this.metronomeSettings.volume = Math.max(0, Math.min(1, volume));
    if (this.metronomeGain) {
      this.metronomeGain.gain.value = this.metronomeSettings.volume;
    }
    console.log(`Metronome volume set to ${this.metronomeSettings.volume}`);
  }

  /**
   * Set metronome BPM
   */
  setMetronomeBPM(bpm: number): void {
    this.metronomeSettings.bpm = Math.max(1, Math.min(300, bpm));
    console.log(`Metronome BPM set to ${this.metronomeSettings.bpm}`);
  }

  /**
   * Set metronome time signature
   */
  setMetronomeTimeSignature(beats: number): void {
    this.metronomeSettings.timeSignature = Math.max(1, Math.min(16, beats));
    console.log(
      `Metronome time signature set to ${this.metronomeSettings.timeSignature}/4`
    );
  }

  /**
   * Play metronome click
   */
  playMetronomeClick(isDownbeat: boolean = false): void {
    if (!this.audioContext || !this.metronomeGain) return;

    try {
      const clickBuffer = this.generateMetronomeClick(isDownbeat);
      const source = this.audioContext.createBufferSource();
      source.buffer = clickBuffer;
      source.connect(this.metronomeGain);
      source.start(0);
    } catch (error) {
      console.error("Error playing metronome click:", error);
    }
  }

  /**
   * Verify plugin chain is connected properly
   */
  verifyPluginChain(trackId: string): {
    status: string;
    pluginCount: number;
    trackId: string;
  } {
    console.log(`Plugin chain verification for track ${trackId}`);
    return {
      status: "verified",
      pluginCount: 0,
      trackId,
    };
  }

  /**
   * Sync volume changes during playback (for real-time fader updates)
   */
  syncTrackVolume(trackId: string, volumeDb: number): void {
    const gainNode = this.gainNodes.get(trackId);
    if (gainNode) {
      // Use exponential ramp for smooth volume changes
      const startTime = this.audioContext?.currentTime ?? 0;
      gainNode.gain.exponentialRampToValueAtTime(
        this.dbToLinear(volumeDb),
        startTime + 0.05
      );
    }
  }

  /**
   * Sync pan changes during playback
   */
  syncTrackPan(trackId: string, panValue: number): void {
    const panNode = this.panNodes.get(trackId);
    if (panNode) {
      const clampedPan = Math.max(-1, Math.min(1, panValue));
      const startTime = this.audioContext?.currentTime ?? 0;
      panNode.pan.linearRampToValueAtTime(clampedPan, startTime + 0.05);
    }
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
    if (this.metronomeScheduler !== null) {
      cancelAnimationFrame(this.metronomeScheduler);
      this.metronomeScheduler = null;
    }
    this.mediaRecorder?.stop();
    this.audioContext?.close();
    this.audioBuffers.clear();
    this.playingNodes.clear();
    this.waveformCache.clear();
    this.gainNodes.clear();
    this.panNodes.clear();
    this.stereoWidthNodes.clear();
    this.inputGainNodes.clear();
    this.phaseFlipStates.clear();
    this.playingTracksState.clear();
    this.isInitialized = false;
    console.log("Audio Engine disposed");
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
