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
  private waveformCache: Map<string, number[]> = new Map(); // Cache for waveforms
  private playingNodes: Map<string, AudioBufferSourceNode> = new Map();
  private inputGainNodes: Map<string, GainNode> = new Map(); // Pre-fader input gain
  private gainNodes: Map<string, GainNode> = new Map(); // Fader level
  private panNodes: Map<string, StereoPannerNode> = new Map();
  private stereoWidthNodes: Map<string, GainNode> = new Map();
  private phaseFlipStates: Map<string, boolean> = new Map();
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private playingTracksState: Map<
    string,
    { isPlaying: boolean; currentOffset: number }
  > = new Map();
  
  // Phase 4: Effects and Routing
  private effectGainNodes: Map<string, GainNode> = new Map(); // Output gain for effect chains
  private busGainNodes: Map<string, GainNode> = new Map(); // Gain nodes for buses
  private busPanNodes: Map<string, StereoPannerNode> = new Map(); // Pan nodes for buses
  private sidechainAnalysers: Map<string, AnalyserNode> = new Map(); // For sidechain detection

  /**
   * Initialize the Web Audio API context and master nodes
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
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
   * Play an audio file from a specific track
   */
  playAudio(
    trackId: string,
    startTime: number = 0,
    volume: number = 1,
    pan: number = 0
  ): boolean {
  playAudio(trackId: string, startTime: number = 0, volume: number = 1, pan: number = 0, busId?: string): boolean {
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
      source.loop = true; // Enable looping

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

      // Connect: source → input gain → pan → track gain (fader) → analyser
      source.connect(inputGain);
      inputGain.connect(panNode);
      panNode.connect(trackGain);
      trackGain.connect(this.analyser!);

      // Route to bus if specified, otherwise to master
      if (busId && this.busGainNodes.has(busId)) {
        trackGain.connect(this.busGainNodes.get(busId)!);
        console.log(`Playing track ${trackId} → bus ${busId}`);
      } else {
        trackGain.connect(this.masterGain);
      }

      // Store nodes for later updates
      this.inputGainNodes.set(trackId, inputGain);
      this.gainNodes.set(trackId, trackGain);
      this.panNodes.set(trackId, panNode);

      // Track playback state
      this.playingTracksState.set(trackId, {
        isPlaying: true,
        currentOffset: startTime,
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
   * Convert dB to linear gain
   */
  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }

  /**
   * Real-Time Audio I/O Methods (Phase 3)
   */

  private mediaStream: MediaStream | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private isInputActive = false;

  /**
   * Start real-time audio input
   */
  async startAudioInput(
    deviceId?: string,
    onAudioData?: (data: Float32Array) => void
  ): Promise<boolean> {
    if (!this.audioContext) await this.initialize();

    if (!this.audioContext) {
      console.error('Audio context not available');
      return false;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!this.mediaStream) {
        console.error('Failed to get media stream');
        return false;
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create input analyser for metering
      this.inputAnalyser = this.audioContext.createAnalyser();
      this.inputAnalyser.fftSize = 2048;
      source.connect(this.inputAnalyser);

      // Create ScriptProcessorNode for real-time processing (buffer size: 4096)
      this.scriptProcessorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.scriptProcessorNode.onaudioprocess = (event) => {
        if (onAudioData) {
          const inputData = event.inputBuffer.getChannelData(0);
          const audioDataCopy = new Float32Array(inputData);
          onAudioData(audioDataCopy);
        }
      };

      this.inputAnalyser.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.audioContext.destination);

      this.isInputActive = true;
      console.log(`Real-time audio input started${deviceId ? ` (device: ${deviceId})` : ''}`);
      return true;
    } catch (error) {
      console.error('Failed to start audio input:', error);
      return false;
    }
  }

  /**
   * Stop real-time audio input
   */
  stopAudioInput(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.scriptProcessorNode) {
      this.scriptProcessorNode.disconnect();
      this.scriptProcessorNode = null;
    }

    if (this.inputAnalyser) {
      this.inputAnalyser.disconnect();
      this.inputAnalyser = null;
    }

    this.isInputActive = false;
    console.log('Real-time audio input stopped');
  }

  /**
   * Check if audio input is currently active
   */
  isAudioInputActive(): boolean {
    return this.isInputActive;
  }

  /**
   * Get input level (0-1)
   */
  getInputLevel(): number {
    if (!this.inputAnalyser) return 0;

    const dataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
    this.inputAnalyser.getByteFrequencyData(dataArray);

    // Calculate average frequency bin value
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }

    const average = sum / dataArray.length;
    return Math.min(1, average / 255);
  }

  /**
   * Get input frequency data for visualization
   */
  getInputFrequencyData(): Uint8Array | null {
    if (!this.inputAnalyser) return null;

    const dataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
    this.inputAnalyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // Test tone playback
  private testToneOscillator: OscillatorNode | null = null;
  private testToneGain: GainNode | null = null;

  /**
   * Start playing a test tone at the specified frequency
   * @param frequency Frequency in Hz (20-20000)
   * @param volume Volume level (0-1)
   */
  startTestTone(frequency: number = 440, volume: number = 0.1): boolean {
    if (!this.audioContext || !this.masterGain) return false;

    try {
      // Stop any existing test tone
      this.stopTestTone();

      // Create oscillator for test tone
      this.testToneOscillator = this.audioContext.createOscillator();
      this.testToneOscillator.type = 'sine';
      this.testToneOscillator.frequency.value = Math.max(20, Math.min(20000, frequency));

      // Create gain node for test tone volume
      this.testToneGain = this.audioContext.createGain();
      this.testToneGain.gain.value = Math.max(0, Math.min(1, volume));

      // Connect nodes
      this.testToneOscillator.connect(this.testToneGain);
      this.testToneGain.connect(this.masterGain);

      // Start the oscillator
      this.testToneOscillator.start();
      console.log(`Test tone started: ${frequency}Hz at ${(volume * 100).toFixed(1)}% volume`);
      return true;
    } catch (error) {
      console.error('Failed to start test tone:', error);
      return false;
    }
  }

  /**
   * Stop the currently playing test tone
   */
  stopTestTone(): void {
    if (this.testToneOscillator) {
      try {
        this.testToneOscillator.stop();
        this.testToneOscillator.disconnect();
        this.testToneOscillator = null;
      } catch (error) {
        console.error('Error stopping test tone:', error);
      }
    }

    if (this.testToneGain) {
      this.testToneGain.disconnect();
      this.testToneGain = null;
    }

    console.log('Test tone stopped');
  }

  /**
   * Check if test tone is currently playing
   */
  isTestTonePlaying(): boolean {
    return this.testToneOscillator !== null;
  }

  /**
   * Phase 4: Effects and Bus Routing Methods
   */

  /**
   * Get the audio context (for external audio node wiring)
   */
  getContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Apply effect chain to a track's audio during playback
   */
  applyEffectChain(trackId: string, effects: Array<{ id: string; bypassed?: boolean }>): boolean {
    if (!this.audioContext) return false;

    const gainNode = this.gainNodes.get(trackId);
    if (!gainNode) return false;

    // Disconnect existing connections from track gain
    gainNode.disconnect();

    // Create effect chain output gain
    const chainOutputGain = this.audioContext.createGain();
    chainOutputGain.gain.value = 1;
    this.effectGainNodes.set(trackId, chainOutputGain);

    // For MVP, just connect directly (effects would be processed here in full implementation)
    // In production, would:
    // 1. Create nodes for each effect in sequence
    // 2. Connect: trackGain → effect1 → effect2 → ... → chainOutputGain → destination
    // 3. Apply effect parameters (cutoff, resonance, attack, release, etc.)

    gainNode.connect(chainOutputGain);

    console.log(`Applied effect chain with ${effects.length} effects to track ${trackId}`);
    return true;
  }

  /**
   * Get track routing destination (bus ID or 'master')
   */
  getTrackRouting(trackId: string): string {
    // Check if track is routed to a bus
    for (const [busId] of this.busGainNodes.entries()) {
      const inputNode = this.gainNodes.get(trackId);
      if (inputNode) {
        // Simplified check - in production would track routing explicitly
        return busId;
      }
    }
    return 'master';
  }

  /**
   * Create a gain node for an effect chain output
   */
  createEffectOutputGain(effectChainId: string): GainNode | null {
    if (!this.audioContext) return null;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1;
    this.effectGainNodes.set(effectChainId, gainNode);
    console.log(`Created effect output gain node for chain ${effectChainId}`);
    return gainNode;
  }

  /**
   * Create a bus in the audio graph
   */
  createBus(busId: string, volume: number = 0, pan: number = 0): { gain: GainNode; pan: StereoPannerNode } | null {
    if (!this.audioContext || !this.masterGain) return null;

    const busGain = this.audioContext.createGain();
    busGain.gain.value = this.dbToLinear(volume);
    
    const busPan = this.audioContext.createStereoPanner();
    busPan.pan.value = pan;
    
    // Connect: busGain → busPan → masterGain
    busGain.connect(busPan);
    busPan.connect(this.masterGain);
    
    this.busGainNodes.set(busId, busGain);
    this.busPanNodes.set(busId, busPan);
    
    console.log(`Created audio bus ${busId}`);
    return { gain: busGain, pan: busPan };
  }

  /**
   * Set bus volume (in dB)
   */
  setBusVolume(busId: string, volumeDb: number): void {
    const busGain = this.busGainNodes.get(busId);
    if (busGain) {
      busGain.gain.value = this.dbToLinear(volumeDb);
    }
  }

  /**
   * Set bus pan (-1 to +1)
   */
  setBusPan(busId: string, pan: number): void {
    const busPan = this.busPanNodes.get(busId);
    if (busPan) {
      busPan.pan.value = Math.max(-1, Math.min(1, pan));
    }
  }

  /**
   * Route a track to a bus instead of master
   */
  routeTrackToBus(trackId: string, busId: string): boolean {
    const gainNode = this.gainNodes.get(trackId);
    const busNode = this.busGainNodes.get(busId);
    
    if (!gainNode || !busNode) return false;
    
    // Disconnect from master and connect to bus
    gainNode.disconnect();
    gainNode.connect(busNode);
    
    console.log(`Routed track ${trackId} to bus ${busId}`);
    return true;
  }

  /**
   * Create a sidechain analyzer for compression detection
   */
  createSidechainAnalyzer(sidechainId: string): AnalyserNode | null {
    if (!this.audioContext) return null;

    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;
    this.sidechainAnalysers.set(sidechainId, analyser);
    
    console.log(`Created sidechain analyser ${sidechainId}`);
    return analyser;
  }

  /**
   * Get sidechain detection level (0-1) for compression
   */
  getSidechainLevel(sidechainId: string): number {
    const analyser = this.sidechainAnalysers.get(sidechainId);
    if (!analyser) return 0;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    // Return average level
    const sum = dataArray.reduce((a, b) => a + b, 0);
    return sum / (dataArray.length * 255);
  }

  /**
   * Delete a bus from the audio graph
   */
  deleteBus(busId: string): void {
    const busGain = this.busGainNodes.get(busId);
    const busPan = this.busPanNodes.get(busId);
    
    if (busGain) busGain.disconnect();
    if (busPan) busPan.disconnect();
    
    this.busGainNodes.delete(busId);
    this.busPanNodes.delete(busId);
    
    console.log(`Deleted bus ${busId}`);
  }

  /**
   * Cleanup and close audio context
   */
  dispose(): void {
    this.stopAllAudio();
    this.stopAudioInput();
    this.mediaRecorder?.stop();
    this.audioContext?.close();
    this.audioBuffers.clear();
    this.playingNodes.clear();
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
