/**
 * Clip Processor - Handles time-stretch, pitch-shift, and fade operations
 * Uses Web Audio API for audio manipulation
 */

export interface ClipProcessor {
  id: string;
  audioBuffer: AudioBuffer;
  playbackRate: number; // 0.5 - 2.0
  pitchShift: number; // -12 to +12 semitones
  fadeInMs: number;
  fadeOutMs: number;
  startTime: number;
  duration: number;
}

export class AudioClipProcessor {
  /**
   * Time-stretch audio without changing pitch using simple playback rate
   * (Note: Real pitch-independent time-stretch requires more complex algorithms)
   */
  static createStretchedBuffer(
    audioBuffer: AudioBuffer,
    playbackRate: number
  ): AudioBuffer {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const newLength = Math.round(audioBuffer.length / playbackRate);
    const stretchedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const source = audioBuffer.getChannelData(channel);
      const target = stretchedBuffer.getChannelData(channel);

      for (let i = 0; i < newLength; i++) {
        const sourceIndex = (i * playbackRate) % source.length;
        const floor = Math.floor(sourceIndex);
        const ceil = Math.ceil(sourceIndex) % source.length;
        const frac = sourceIndex - floor;

        // Linear interpolation
        target[i] = source[floor] * (1 - frac) + source[ceil] * frac;
      }
    }

    return stretchedBuffer;
  }

  /**
   * Pitch-shift by changing playback rate (simplified version)
   * Formula: newPlaybackRate = 2^(semitones/12)
   */
  static calculatePitchShiftRate(semitones: number): number {
    return Math.pow(2, semitones / 12);
  }

  /**
   * Apply fade-in envelope
   */
  static applyFadeIn(
    audioBuffer: AudioBuffer,
    fadeInMs: number,
    sampleRate: number = audioBuffer.sampleRate
  ): AudioBuffer {
    const fadeInSamples = (fadeInMs / 1000) * sampleRate;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const fadedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const source = audioBuffer.getChannelData(channel);
      const target = fadedBuffer.getChannelData(channel);

      for (let i = 0; i < audioBuffer.length; i++) {
        if (i < fadeInSamples) {
          target[i] = source[i] * (i / fadeInSamples);
        } else {
          target[i] = source[i];
        }
      }
    }

    return fadedBuffer;
  }

  /**
   * Apply fade-out envelope
   */
  static applyFadeOut(
    audioBuffer: AudioBuffer,
    fadeOutMs: number,
    sampleRate: number = audioBuffer.sampleRate
  ): AudioBuffer {
    const fadeOutSamples = (fadeOutMs / 1000) * sampleRate;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const fadedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const fadeOutStart = audioBuffer.length - fadeOutSamples;

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const source = audioBuffer.getChannelData(channel);
      const target = fadedBuffer.getChannelData(channel);

      for (let i = 0; i < audioBuffer.length; i++) {
        if (i < fadeOutStart) {
          target[i] = source[i];
        } else {
          const fadeProgress = (i - fadeOutStart) / fadeOutSamples;
          target[i] = source[i] * (1 - fadeProgress);
        }
      }
    }

    return fadedBuffer;
  }

  /**
   * Apply both fade-in and fade-out
   */
  static applyFades(
    audioBuffer: AudioBuffer,
    fadeInMs: number,
    fadeOutMs: number
  ): AudioBuffer {
    let result = audioBuffer;
    if (fadeInMs > 0) {
      result = this.applyFadeIn(result, fadeInMs);
    }
    if (fadeOutMs > 0) {
      result = this.applyFadeOut(result, fadeOutMs);
    }
    return result;
  }

  /**
   * Combine all transformations: stretch, pitch-shift, and fades
   */
  static processClip(
    audioBuffer: AudioBuffer,
    playbackRate: number = 1.0,
    pitchShift: number = 0,
    fadeInMs: number = 0,
    fadeOutMs: number = 0
  ): AudioBuffer {
    let result = audioBuffer;

    // Apply pitch-shift by adjusting playback rate
    if (pitchShift !== 0) {
      const pitchRate = this.calculatePitchShiftRate(pitchShift);
      const combinedRate = playbackRate * pitchRate;
      result = this.createStretchedBuffer(result, combinedRate);
    } else if (playbackRate !== 1.0) {
      result = this.createStretchedBuffer(result, playbackRate);
    }

    // Apply fades
    if (fadeInMs > 0 || fadeOutMs > 0) {
      result = this.applyFades(result, fadeInMs, fadeOutMs);
    }

    return result;
  }

  /**
   * Get processed duration
   */
  static getProcessedDuration(
    originalDuration: number,
    playbackRate: number,
    pitchShift: number
  ): number {
    const pitchRate = this.calculatePitchShiftRate(pitchShift);
    const combinedRate = playbackRate * pitchRate;
    return originalDuration / combinedRate;
  }
}

/**
 * Simplified FormantPreserver for basic pitch-shift
 * (Full implementation would use FFT-based PSOLA or PhaseVocoder)
 */
export class PitchShiftProcessor {
  /**
   * Basic pitch-shift detection
   */
  static detectPitchShiftRange(): { min: number; max: number } {
    return { min: -12, max: 12 }; // Semitones
  }

  /**
   * Smooth pitch transitions using ramps
   */
  static calculateSmoothPitchRamp(
    fromPitch: number,
    toPitch: number,
    durationMs: number
  ): number[] {
    const steps = Math.floor((durationMs / 10) * 2); // 10ms intervals
    const ramp: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pitch = fromPitch + (toPitch - fromPitch) * t;
      ramp.push(pitch);
    }
    return ramp;
  }
}
