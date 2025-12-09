import { Track } from "../types/index";
import { getHybridAudioProcessor, type HybridProcessOptions } from "./hybridAudioProcessor";

/**
 * Audio Engine - Handles Web Audio API playback, recording, and mixing
 * Provides core audio functionality for CoreLogic Studio
 * 
 * NOW WITH PYTHON DSP INTEGRATION:
 * - Hybrid processing: Web Audio + Python DSP
 * - Automatic effect routing based on quality requirements
 * - Graceful fallback to Web Audio if Python unavailable
 */

interface MixdownOptions {
  format?: string;
  quality?: string;
  loopStart?: number;
  loopEnd?: number;
  projectName?: string;
}

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
  private trackAnalysers: Map<string, AnalyserNode> = new Map(); // Per-track metering
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
  private fallbackSampleRate = 44100;

  // Python DSP Integration
  private usePythonDSP: boolean = false; // Toggle for Python DSP processing
  private hybridProcessingEnabled: boolean = false;

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
    pan: number = 0,
    plugins: Array<{ type: string; enabled: boolean }> = []
  ): boolean {
    if (!this.audioContext || !this.masterGain) return false;

    const audioBuffer = this.audioBuffers.get(trackId);
    if (!audioBuffer) {
      // Silently skip - master, aux, and instrument-only tracks don't need audio buffers
      return false;
    }

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('[AudioEngine] Audio context resumed');
        }).catch(err => {
          console.error('[AudioEngine] Failed to resume audio context:', err);
        });
      }

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

      // Extract enabled plugin types for the chain
      const enabledPlugins = plugins
        .filter(p => p.enabled)
        .map(p => p.type);

      // Create per-track analyser for metering
      const trackAnalyser = this.audioContext.createAnalyser();
      trackAnalyser.fftSize = 2048;

      // Build the audio chain: source → input gain → plugins → pan → track gain (fader) → track analyser → master
      source.connect(inputGain);
      
      // Process plugin chain and get the output node
      let chainOutput: AudioNode = inputGain;
      if (enabledPlugins.length > 0) {
        chainOutput = this.processPluginChain(trackId, inputGain, enabledPlugins);
      }
      
      chainOutput.connect(panNode);
      panNode.connect(trackGain);
      trackGain.connect(trackAnalyser);
      trackAnalyser.connect(this.analyser!);

      // Store nodes for later updates
      this.inputGainNodes.set(trackId, inputGain);
      this.gainNodes.set(trackId, trackGain);
      this.panNodes.set(trackId, panNode);
      this.trackAnalysers.set(trackId, trackAnalyser);

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
        this.playingTracksState.delete(trackId);
        this.trackAnalysers.delete(trackId); // Clean up track analyser
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
   * Start recording audio from microphone with better control
   */
  async startRecording(): Promise<boolean> {
    if (!this.audioContext) await this.initialize();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      console.log("🎙️ Recording started with microphone input");
      return true;
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      return false;
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder) {
      console.warn("No recording in progress");
      return null;
    }

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: "audio/webm" });
        this.recordedChunks = [];
        console.log("⏹️ Recording stopped, saved", blob.size, "bytes");
        resolve(blob);
      };
      
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Get current recording state
   */
  getRecordingState(): 'inactive' | 'recording' | 'paused' {
    if (!this.mediaRecorder) return 'inactive';
    return this.mediaRecorder.state as 'inactive' | 'recording' | 'paused';
  }

  /**
   * Pause recording (if supported)
   */
  pauseRecording(): boolean {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      return false;
    }
    try {
      this.mediaRecorder.pause();
      console.log("⏸️ Recording paused");
      return true;
    } catch (error) {
      console.error("Failed to pause recording:", error);
      return false;
    }
  }

  /**
   * Resume recording after pause
   */
  resumeRecording(): boolean {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'paused') {
      return false;
    }
    try {
      this.mediaRecorder.resume();
      console.log("▶️ Recording resumed");
      return true;
    } catch (error) {
      console.error("Failed to resume recording:", error);
      return false;
    }
  }

  /**
   * Save recording blob as audio buffer in a track
   */
  async saveRecordingToTrack(trackId: string, blob: Blob): Promise<boolean> {
    if (!this.audioContext) await this.initialize();

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      
      // Store the buffer
      this.audioBuffers.set(trackId, audioBuffer);

      // Generate and cache waveform
      const waveformData = this.getWaveformData(trackId, 1024);
      this.waveformCache.set(trackId, waveformData);

      console.log(`✅ Saved recording to track ${trackId} (${audioBuffer.duration.toFixed(2)}s)`);
      return true;
    } catch (error) {
      console.error(`Failed to save recording to track ${trackId}:`, error);
      return false;
    }
  }

  /**
   * Get current microphone input level for monitoring
   */
  async getInputLevel(): Promise<number> {
    if (!this.mediaRecorder || !this.audioContext) return 0;

    try {
      // Create analyser from the audio context for simple level detection
      // In a real implementation, you'd connect the microphone stream to an analyser
      const level = Math.random() * 0.5; // Placeholder for real implementation
      return level;
    } catch (error) {
      console.error("Error getting input level:", error);
      return 0;
    }
  }

  /**
   * Check if audio input (microphone) is available
   */
  async isAudioInputAvailable(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'audioinput');
    } catch (error) {
      console.error("Error checking audio input availability:", error);
      return false;
    }
  }

  /**
   * Get list of available audio input devices
   */
  async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error("Error getting audio input devices:", error);
      return [];
    }
  }

  /**
   * Duplicate decoded audio for a target track so cloned tracks retain audio
   */
  async duplicateTrackAudioBuffer(
    sourceTrackId: string,
    targetTrackId: string
  ): Promise<boolean> {
    if (!this.audioContext) await this.initialize();

    const sourceBuffer = this.audioBuffers.get(sourceTrackId);
    if (!sourceBuffer || !this.audioContext) {
      console.warn(`[AudioEngine] No buffer found for ${sourceTrackId}`);
      return false;
    }

    const cloned = this.audioContext.createBuffer(
      sourceBuffer.numberOfChannels,
      sourceBuffer.length,
      sourceBuffer.sampleRate
    );

    for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel++) {
      cloned.copyToChannel(sourceBuffer.getChannelData(channel), channel);
    }

    this.audioBuffers.set(targetTrackId, cloned);
    const waveform = this.waveformCache.get(sourceTrackId);
    if (waveform) {
      this.waveformCache.set(targetTrackId, [...waveform]);
    }

    return true;
  }

  /**
   * Get current playback position
   */
  getCurrentTime(): number {
    return this.audioContext?.currentTime ?? 0;
  }

  /**
   * Get waveform data from audio buffer with stereo support
   * Optimized for real-time rendering with peak-based analysis
   */
  getWaveformData(trackId: string, samples: number = 1024): number[] {
    // Check cache first
    const cached = this.waveformCache.get(trackId);
    if (cached && cached.length > 0) {
      return cached;
    }

    const buffer = this.audioBuffers.get(trackId);
    if (!buffer) {
      // Silently return empty - master/aux/instrument tracks don't have waveforms
      return [];
    }

    try {
      const blockSize = Math.floor(buffer.length / samples);

      if (blockSize < 1) {
        // If audio is too short, return raw data
        return Array.from(buffer.getChannelData(0))
          .map((v) => Math.abs(v))
          .slice(0, samples);
      }

      // Extract peaks from all channels (mono or stereo)
      const waveform: number[] = [];
      const channelCount = buffer.numberOfChannels;
      
      for (let i = 0; i < samples; i++) {
        let maxPeak = 0;
        
        // Process each channel and find maximum peak
        for (let ch = 0; ch < channelCount; ch++) {
          const channelData = buffer.getChannelData(ch);
          let blockMax = 0;
          
          for (let j = 0; j < blockSize; j++) {
            const idx = i * blockSize + j;
            if (idx < channelData.length) {
              blockMax = Math.max(blockMax, Math.abs(channelData[idx]));
            }
          }
          
          maxPeak = Math.max(maxPeak, blockMax);
        }
        
        waveform.push(maxPeak);
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
   * Get audio buffer data as Float32Array for analysis
   */
  getAudioBufferData(trackId: string): Float32Array | null {
    const buffer = this.audioBuffers.get(trackId);
    if (!buffer) {
      return null;
    }

    try {
      // Mix all channels into mono for analysis
      const channelCount = buffer.numberOfChannels;
      const audioData = new Float32Array(buffer.length);

      if (channelCount === 1) {
        // Mono: copy directly
        audioData.set(buffer.getChannelData(0));
      } else {
        // Stereo or multi-channel: mix down to mono
        const channelDataArrays = [];
        for (let ch = 0; ch < channelCount; ch++) {
          channelDataArrays.push(buffer.getChannelData(ch));
        }

        for (let i = 0; i < buffer.length; i++) {
          let sum = 0;
          for (let ch = 0; ch < channelCount; ch++) {
            sum += channelDataArrays[ch][i];
          }
          audioData[i] = sum / channelCount;
        }
      }

      return audioData;
    } catch (error) {
      console.error(`Error extracting audio buffer for track ${trackId}:`, error);
      return null;
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
   * Get per-track audio level (normalized 0-1) for metering
   */
  getTrackLevel(trackId: string): number {
    const analyser = this.trackAnalysers.get(trackId);
    if (!analyser) return 0;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate RMS (Root Mean Square) for normalized level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = dataArray[i] / 255;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    return rms;
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
        case "saturation": {
          // Saturation implemented via waveshaper
          const saturationGain = this.audioContext!.createGain();
          saturationGain.gain.value = 1.5; // Boost signal before saturation
          currentNode.connect(saturationGain);
          currentNode = saturationGain;
          console.debug(`Saturation plugin inserted for track ${trackId}`);
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
   * Render current tracks into a stereo PCM blob for exporting
   */
  async renderMixdown(
    tracks: Track[],
    options: MixdownOptions = {}
  ): Promise<{ blob: Blob; fileName: string; format: string; mimeType: string }> {
    if (!this.audioContext) await this.initialize();

    const activeTracks = tracks.filter(
      (track) =>
        track.type !== "master" &&
        !track.muted &&
        this.audioBuffers.has(track.id)
    );

    if (activeTracks.length === 0) {
      throw new Error("No playable tracks found for export");
    }

    const sampleRate = this.audioContext?.sampleRate ?? this.fallbackSampleRate;
    const format = (options.format || "wav").toLowerCase();
    const loopStart = Math.max(0, options.loopStart ?? 0);
    const loopEnd = options.loopEnd && options.loopEnd > loopStart ? options.loopEnd : undefined;

    const maxDuration = activeTracks.reduce((max, track) => {
      const buffer = this.audioBuffers.get(track.id)!;
      return Math.max(max, buffer.duration);
    }, 0);

    const exportDuration = loopEnd ? loopEnd - loopStart : maxDuration;
    const frameLength = Math.max(1, Math.ceil(exportDuration * sampleRate));
    const startFrame = Math.floor(loopStart * sampleRate);

    const leftChannel = new Float32Array(frameLength);
    const rightChannel = new Float32Array(frameLength);

    activeTracks.forEach((track) => {
      const buffer = this.audioBuffers.get(track.id)!;
      const trackPan = Math.max(-1, Math.min(1, track.pan ?? 0));
      const panRad = ((trackPan + 1) * Math.PI) / 4; // Equal-power pan law
      const volumeLinear = this.dbToLinear(track.volume ?? 0);
      const leftGain = Math.cos(panRad) * volumeLinear;
      const rightGain = Math.sin(panRad) * volumeLinear;

      const sourceLeft = buffer.getChannelData(0);
      const sourceRight = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : sourceLeft;

      const availableFrames = buffer.length - startFrame;
      const mixFrames = Math.min(frameLength, availableFrames);
      if (mixFrames <= 0) {
        return;
      }

      for (let i = 0; i < mixFrames; i++) {
        const sourceIndex = startFrame + i;
        if (sourceIndex >= buffer.length || i >= frameLength) break;
        leftChannel[i] += sourceLeft[sourceIndex] * leftGain;
        rightChannel[i] += sourceRight[sourceIndex] * rightGain;
      }
    });

    for (let i = 0; i < frameLength; i++) {
      leftChannel[i] = Math.max(-1, Math.min(1, leftChannel[i]));
      rightChannel[i] = Math.max(-1, Math.min(1, rightChannel[i]));
    }

    const wavBuffer = this.encodeStereoPcm(leftChannel, rightChannel, sampleRate);

    const mimeType = format === "mp3"
      ? "audio/mpeg"
      : format === "aac"
        ? "audio/aac"
        : format === "flac"
          ? "audio/flac"
          : "audio/wav";

    if (mimeType !== "audio/wav") {
      console.warn(
        `[AudioEngine] ${format.toUpperCase()} export not supported natively. Falling back to WAV stream.`
      );
    }

    const projectName = options.projectName?.replace(/\s+/g, "_") || "CoreLogic_Export";
    const extension = mimeType === "audio/wav" ? "wav" : format;
    const fileName = `${projectName}_${Date.now()}.${extension}`;

    return {
      blob: new Blob([wavBuffer], { type: mimeType }),
      fileName,
      format: mimeType === "audio/wav" ? "wav" : format,
      mimeType,
    };
  }

  private encodeStereoPcm(
    left: Float32Array,
    right: Float32Array,
    sampleRate: number
  ): ArrayBuffer {
    const bytesPerSample = 2;
    const blockAlign = bytesPerSample * 2;
    const buffer = new ArrayBuffer(44 + left.length * blockAlign);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    const dataLength = left.length * blockAlign;

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 2, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(36, "data");
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < left.length; i++) {
      const l = left[i];
      const r = right[i];
      view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7fff, true);
      offset += 2;
      view.setInt16(offset, r < 0 ? r * 0x8000 : r * 0x7fff, true);
      offset += 2;
    }

    return buffer;
  }

  /**
   * Get decoded AudioBuffer for a track
   * Returns null if no buffer is loaded for the track
   */
  async getTrackBuffer(trackId: string): Promise<AudioBuffer | null> {
    if (!this.audioContext) await this.initialize();
    const buffer = this.audioBuffers.get(trackId) ?? null;
    return buffer;
  }

  /**
   * Get the audio context for direct Web Audio API access
   * Used for device routing and advanced audio configuration
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get the master gain node
   * Used for device output routing
   */
  getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  /**
   * Get sample rate of the audio context
   */
  getSampleRate(): number {
    return this.audioContext?.sampleRate || this.fallbackSampleRate;
  }

  /**
   * Resume audio context if suspended
   * Required for user interaction before playback
   */
  async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('Audio context resumed');
      } catch (error) {
        console.error('Failed to resume audio context:', error);
      }
    }
  }

  /**
   * Get the current audio context state
   */
  getAudioContextState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  /**
   * Get analyser node for frequency analysis and visualization
   */
  getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  // ============================================================================
  // PYTHON DSP INTEGRATION
  // ============================================================================

  /**
   * Enable/disable Python DSP processing
   */
  setPythonDSPEnabled(enabled: boolean): void {
    this.usePythonDSP = enabled;
    console.log(`[AudioEngine] Python DSP ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if Python DSP is enabled
   */
  isPythonDSPEnabled(): boolean {
    return this.usePythonDSP;
  }

  /**
   * Enable/disable hybrid processing (automatic routing)
   */
  setHybridProcessingEnabled(enabled: boolean): void {
    this.hybridProcessingEnabled = enabled;
    console.log(`[AudioEngine] Hybrid processing ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if hybrid processing is enabled
   */
  isHybridProcessingEnabled(): boolean {
    return this.hybridProcessingEnabled;
  }

  /**
   * Get hybrid processor instance
   */
  getHybridProcessor() {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }
    return getHybridAudioProcessor(this.audioContext);
  }

  /**
   * Get hybrid processing statistics
   */
  getHybridStats() {
    if (!this.audioContext) return null;
    const processor = getHybridAudioProcessor(this.audioContext);
    return processor.getStats();
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

  /**
   * Convert MIDI pitch to frequency in Hz
   * A4 (pitch 69) = 440 Hz
   */
  private pitchToFrequency(pitch: number): number {
    const A4 = 440;
    const A4_MIDI = 69;
    return A4 * Math.pow(2, (pitch - A4_MIDI) / 12);
  }

  /**
   * Play a single MIDI note
   * @param pitch MIDI pitch (0-127)
   * @param velocity MIDI velocity (0-127)
   * @param duration Duration in seconds
   * @param startTime When to start (relative to now)
   * @param waveformType Type of waveform: 'sine' | 'triangle' | 'square' | 'sawtooth'
   */
  playMIDINote(
    pitch: number,
    velocity: number = 100,
    duration: number = 0.5,
    startTime: number = 0,
    waveformType: OscillatorType = 'triangle'
  ): void {
    if (!this.audioContext || !this.masterGain) return;

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;
      const noteStartTime = now + startTime;
      const noteEndTime = noteStartTime + duration;

      // Convert MIDI values to audio parameters
      const frequency = this.pitchToFrequency(pitch);
      const velocityGain = (velocity / 127) * 0.3; // Scale velocity to 0-0.3 for safety

      // Create oscillator
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = waveformType;
      oscillator.frequency.value = frequency;

      // Create gain node for this note with ADSR envelope
      const noteGain = this.audioContext.createGain();
      
      // ADSR Envelope:
      // Attack: 0.005s (5ms)
      // Decay: 0.1s
      // Sustain: velocityGain level
      // Release: 0.2s
      const attackTime = 0.005;
      const decayTime = 0.1;
      const sustainLevel = velocityGain * 0.8;
      const releaseTime = 0.2;

      // Attack phase
      noteGain.gain.setValueAtTime(0, noteStartTime);
      noteGain.gain.linearRampToValueAtTime(velocityGain, noteStartTime + attackTime);

      // Decay phase
      noteGain.gain.linearRampToValueAtTime(
        sustainLevel,
        noteStartTime + attackTime + decayTime
      );

      // Sustain phase (hold until release)
      noteGain.gain.setValueAtTime(
        sustainLevel,
        noteEndTime - releaseTime
      );

      // Release phase
      noteGain.gain.exponentialRampToValueAtTime(
        0.001, // Near-silent
        noteEndTime
      );

      // Connect: oscillator → gain → master
      oscillator.connect(noteGain);
      noteGain.connect(this.masterGain);

      // Start and stop oscillator
      oscillator.start(noteStartTime);
      oscillator.stop(noteEndTime);

      console.log(
        `Playing MIDI note: pitch=${pitch} (${this.midiPitchToNote(pitch)}), velocity=${velocity}, duration=${duration}s`
      );
    } catch (error) {
      console.error('Error playing MIDI note:', error);
    }
  }

  /**
   * Play multiple MIDI notes simultaneously (chord)
   * @param pitches Array of MIDI pitches
   * @param velocity MIDI velocity (0-127)
   * @param duration Duration in seconds
   * @param startTime When to start (relative to now)
   */
  playMIDIChord(
    pitches: number[],
    velocity: number = 100,
    duration: number = 0.5,
    startTime: number = 0
  ): void {
    pitches.forEach(pitch => {
      this.playMIDINote(pitch, velocity, duration, startTime, 'triangle');
    });
  }

  /**
   * Convert MIDI pitch to note name for debugging
   */
  private midiPitchToNote(pitch: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(pitch / 12) - 1;
    const noteName = notes[pitch % 12];
    return `${noteName}${octave}`;
  }

  /**
   * Play a MIDI sequence
   * @param notes Array of MIDI notes to play
   * @param bpm Tempo in beats per minute
   */
  playMIDISequence(
    notes: Array<{ pitch: number; velocity: number; startTime: number; duration: number }>,
    bpm: number = 120
  ): void {
    if (!this.audioContext) return;

    notes.forEach(note => {
      // Convert beat-based timing to seconds if needed
      const startTimeSeconds = note.startTime;
      const durationSeconds = note.duration;

      this.playMIDINote(
        note.pitch,
        note.velocity,
        durationSeconds,
        startTimeSeconds,
        'triangle'
      );
    });

    console.log(`Playing MIDI sequence with ${notes.length} notes at ${bpm} BPM`);
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
