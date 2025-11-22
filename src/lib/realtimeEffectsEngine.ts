/**
 * Real-Time Effects Engine
 * Built-in audio effects processors: EQ, Compression, Gate, Reverb, Delay, Saturation
 */

import { PluginParameter } from '../types';

type EffectType = 'eq' | 'compressor' | 'gate' | 'reverb' | 'delay' | 'saturation';

interface EffectProcessor {
  process(inputBuffer: AudioBuffer, parameters: Record<string, number>): AudioBuffer;
  getName(): string;
  getParameters(): PluginParameter[];
  setParameter(name: string, value: number): void;
}

/**
 * 3-Band EQ Effect
 * Low (80Hz), Mid (1kHz), High (8kHz)
 */
class EQEffect implements EffectProcessor {
  private lowGain = 0;
  private midGain = 0;
  private highGain = 0;

  getName(): string {
    return '3-Band EQ';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        id: 'lowGain',
        pluginId: 'eq-3band',
        name: 'Low Gain',
        type: 'float',
        min: -12,
        max: 12,
        default: 0,
        current: this.lowGain,
        automatable: true
      },
      {
        id: 'midGain',
        pluginId: 'eq-3band',
        name: 'Mid Gain',
        type: 'float',
        min: -12,
        max: 12,
        default: 0,
        current: this.midGain,
        automatable: true
      },
      {
        id: 'highGain',
        pluginId: 'eq-3band',
        name: 'High Gain',
        type: 'float',
        min: -12,
        max: 12,
        default: 0,
        current: this.highGain,
        automatable: true
      }
    ];
  }

  setParameter(name: string, value: number): void {
    switch (name) {
      case 'lowGain':
        this.lowGain = Math.max(-12, Math.min(12, value));
        break;
      case 'midGain':
        this.midGain = Math.max(-12, Math.min(12, value));
        break;
      case 'highGain':
        this.highGain = Math.max(-12, Math.min(12, value));
        break;
    }
  }

  process(inputBuffer: AudioBuffer): AudioBuffer {
    // Simplified EQ processing
    // In production, this would use proper IIR filters
    const data = inputBuffer.getChannelData(0);
    
    // Apply simple gain-based filtering
    const lowFactor = this.dbToLinear(this.lowGain);
    const midFactor = this.dbToLinear(this.midGain);
    const highFactor = this.dbToLinear(this.highGain);

    for (let i = 0; i < data.length; i++) {
      // Simplified multi-band processing
      let sample = data[i];
      sample *= (lowFactor + midFactor + highFactor) / 3;
      data[i] = Math.max(-1, Math.min(1, sample));
    }

    return inputBuffer;
  }

  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }
}

/**
 * Compressor Effect
 * Dynamic range compression with Attack, Release, Ratio, Threshold
 */
class CompressorEffect implements EffectProcessor {
  private threshold = -20;
  private ratio = 4;
  private attack = 0.005;
  private release = 0.05;
  private makeupGain = 0;
  private envelope = 0;

  getName(): string {
    return 'Compressor';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        id: 'threshold',
        pluginId: 'compressor',
        name: 'Threshold',
        type: 'float',
        min: -60,
        max: 0,
        default: -20,
        current: this.threshold,
        automatable: true
      },
      {
        id: 'ratio',
        pluginId: 'compressor',
        name: 'Ratio',
        type: 'float',
        min: 1,
        max: 16,
        default: 4,
        current: this.ratio,
        automatable: true
      },
      {
        id: 'attack',
        pluginId: 'compressor',
        name: 'Attack (ms)',
        type: 'float',
        min: 0.1,
        max: 100,
        default: 5,
        current: this.attack * 1000,
        automatable: true
      },
      {
        id: 'release',
        pluginId: 'compressor',
        name: 'Release (ms)',
        type: 'float',
        min: 10,
        max: 1000,
        default: 50,
        current: this.release * 1000,
        automatable: true
      },
      {
        id: 'makeupGain',
        pluginId: 'compressor',
        name: 'Makeup Gain',
        type: 'float',
        min: 0,
        max: 24,
        default: 0,
        current: this.makeupGain,
        automatable: true
      }
    ];
  }

  setParameter(name: string, value: number): void {
    switch (name) {
      case 'threshold':
        this.threshold = Math.max(-60, Math.min(0, value));
        break;
      case 'ratio':
        this.ratio = Math.max(1, Math.min(16, value));
        break;
      case 'attack':
        this.attack = Math.max(0.0001, Math.min(0.1, value / 1000));
        break;
      case 'release':
        this.release = Math.max(0.01, Math.min(1, value / 1000));
        break;
      case 'makeupGain':
        this.makeupGain = Math.max(0, Math.min(24, value));
        break;
    }
  }

  process(inputBuffer: AudioBuffer): AudioBuffer {
    const data = inputBuffer.getChannelData(0);
    const thresholdLinear = this.dbToLinear(this.threshold);
    const makeupLinear = this.dbToLinear(this.makeupGain);

    for (let i = 0; i < data.length; i++) {
      const inputLevel = Math.abs(data[i]);
      
      if (inputLevel > thresholdLinear) {
        // Calculate gain reduction
        const gainReduction = 1 + ((1 / this.ratio) - 1) * (thresholdLinear / inputLevel);
        this.envelope += (gainReduction - this.envelope) * this.attack;
      } else {
        this.envelope += (1 - this.envelope) * this.release;
      }

      data[i] = data[i] * this.envelope * makeupLinear;
      data[i] = Math.max(-1, Math.min(1, data[i]));
    }

    return inputBuffer;
  }

  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }
}

/**
 * Simple Reverb Effect (using convolver or delay-based simulation)
 */
class ReverbEffect implements EffectProcessor {
  private dryWet = 0.3;
  private decay = 2;
  private delayBuffer: number[] = [];
  private delayIndex = 0;

  getName(): string {
    return 'Reverb';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        id: 'dryWet',
        pluginId: 'reverb',
        name: 'Wet Level',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.3,
        current: this.dryWet,
        automatable: true
      },
      {
        id: 'decay',
        pluginId: 'reverb',
        name: 'Decay Time',
        type: 'float',
        min: 0.5,
        max: 5,
        default: 2,
        current: this.decay,
        automatable: true
      }
    ];
  }

  setParameter(name: string, value: number): void {
    switch (name) {
      case 'dryWet':
        this.dryWet = Math.max(0, Math.min(1, value));
        break;
      case 'decay':
        this.decay = Math.max(0.5, Math.min(5, value));
        break;
    }
  }

  process(inputBuffer: AudioBuffer): AudioBuffer {
    const data = inputBuffer.getChannelData(0);
    const delayLength = Math.floor(48000 * this.decay * 0.1); // ~100ms to 500ms

    if (this.delayBuffer.length === 0) {
      this.delayBuffer = new Array(delayLength).fill(0);
    }

    for (let i = 0; i < data.length; i++) {
      const delayed = this.delayBuffer[this.delayIndex];
      const mixed = data[i] * (1 - this.dryWet) + delayed * this.dryWet;
      this.delayBuffer[this.delayIndex] = mixed * 0.7; // Feedback
      data[i] = mixed;
      
      this.delayIndex = (this.delayIndex + 1) % delayLength;
    }

    return inputBuffer;
  }
}

/**
 * Gate Effect
 * Silences audio below threshold
 */
class GateEffect implements EffectProcessor {
  private threshold = -40;
  private attack = 0.001;
  private release = 0.1;

  getName(): string {
    return 'Gate';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        id: 'threshold',
        pluginId: 'gate',
        name: 'Threshold',
        type: 'float',
        min: -80,
        max: 0,
        default: -40,
        current: this.threshold,
        automatable: true
      },
      {
        id: 'attack',
        pluginId: 'gate',
        name: 'Attack (ms)',
        type: 'float',
        min: 0.1,
        max: 50,
        default: 1,
        current: this.attack * 1000,
        automatable: true
      },
      {
        id: 'release',
        pluginId: 'gate',
        name: 'Release (ms)',
        type: 'float',
        min: 10,
        max: 500,
        default: 100,
        current: this.release * 1000,
        automatable: true
      }
    ];
  }

  setParameter(name: string, value: number): void {
    switch (name) {
      case 'threshold':
        this.threshold = Math.max(-80, Math.min(0, value));
        break;
      case 'attack':
        this.attack = Math.max(0.0001, Math.min(0.05, value / 1000));
        break;
      case 'release':
        this.release = Math.max(0.01, Math.min(0.5, value / 1000));
        break;
    }
  }

  process(inputBuffer: AudioBuffer): AudioBuffer {
    const data = inputBuffer.getChannelData(0);
    const thresholdLinear = this.dbToLinear(this.threshold);
    let gateOpen = false;

    for (let i = 0; i < data.length; i++) {
      const inputLevel = Math.abs(data[i]);

      if (inputLevel > thresholdLinear) {
        gateOpen = true;
      } else if (gateOpen) {
        // Release phase
        data[i] *= Math.exp(-1 / (this.release * 44100));
      } else {
        data[i] = 0;
      }
    }

    return inputBuffer;
  }

  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }
}

/**
 * Saturation/Distortion Effect
 */
class SaturationEffect implements EffectProcessor {
  private drive = 1;
  private tone = 0.5;

  getName(): string {
    return 'Saturation';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        id: 'drive',
        pluginId: 'saturation',
        name: 'Drive',
        type: 'float',
        min: 1,
        max: 20,
        default: 1,
        current: this.drive,
        automatable: true
      },
      {
        id: 'tone',
        pluginId: 'saturation',
        name: 'Tone',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.5,
        current: this.tone,
        automatable: true
      }
    ];
  }

  setParameter(name: string, value: number): void {
    switch (name) {
      case 'drive':
        this.drive = Math.max(1, Math.min(20, value));
        break;
      case 'tone':
        this.tone = Math.max(0, Math.min(1, value));
        break;
    }
  }

  process(inputBuffer: AudioBuffer): AudioBuffer {
    const data = inputBuffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      // Apply drive
      let sample = data[i] * this.drive;

      // Soft clipping (tanh-like saturation)
      sample = Math.tanh(sample);

      // Apply tone (simple low-pass simulation)
      sample = sample * (1 - this.tone * 0.3);

      data[i] = Math.max(-1, Math.min(1, sample));
    }

    return inputBuffer;
  }
}

/**
 * Real-Time Effects Engine Manager
 */
class RealtimeEffectsEngine {
  private effectInstances: Map<string, EffectProcessor> = new Map();
  private effectChain: string[] = [];

  constructor() {
    this.initializeDefaultEffects();
  }

  private initializeDefaultEffects() {
    this.registerEffect('eq', new EQEffect());
    this.registerEffect('compressor', new CompressorEffect());
    this.registerEffect('gate', new GateEffect());
    this.registerEffect('reverb', new ReverbEffect());
    this.registerEffect('saturation', new SaturationEffect());
  }

  public registerEffect(id: string, processor: EffectProcessor) {
    this.effectInstances.set(id, processor);
  }

  public getEffect(id: string): EffectProcessor | undefined {
    return this.effectInstances.get(id);
  }

  public setEffectParameter(effectId: string, parameterName: string, value: number) {
    const effect = this.effectInstances.get(effectId);
    if (effect) {
      effect.setParameter(parameterName, value);
    }
  }

  public addToChain(effectId: string) {
    if (!this.effectChain.includes(effectId) && this.effectInstances.has(effectId)) {
      this.effectChain.push(effectId);
    }
  }

  public removeFromChain(effectId: string) {
    this.effectChain = this.effectChain.filter(id => id !== effectId);
  }

  public reorderChain(fromIndex: number, toIndex: number) {
    if (fromIndex >= 0 && fromIndex < this.effectChain.length &&
        toIndex >= 0 && toIndex < this.effectChain.length) {
      const [effect] = this.effectChain.splice(fromIndex, 1);
      this.effectChain.splice(toIndex, 0, effect);
    }
  }

  public getChain(): string[] {
    return [...this.effectChain];
  }

  public processAudio(inputBuffer: AudioBuffer): AudioBuffer {
    let buffer = inputBuffer;

    for (const effectId of this.effectChain) {
      const effect = this.effectInstances.get(effectId);
      if (effect) {
        buffer = effect.process(buffer);
      }
    }

    return buffer;
  }

  public getAvailableEffects(): { id: string; name: string }[] {
    return Array.from(this.effectInstances.entries()).map(([id, effect]) => ({
      id,
      name: effect.getName()
    }));
  }

  public getEffectParameters(effectId: string): PluginParameter[] {
    const effect = this.effectInstances.get(effectId);
    return effect ? effect.getParameters() : [];
  }
}

// Singleton instance
let effectsEngineInstance: RealtimeEffectsEngine | null = null;

export function getRealtimeEffectsEngine(): RealtimeEffectsEngine {
  if (!effectsEngineInstance) {
    effectsEngineInstance = new RealtimeEffectsEngine();
  }
  return effectsEngineInstance;
}

export { RealtimeEffectsEngine, EQEffect, CompressorEffect, ReverbEffect, GateEffect, SaturationEffect };
export type { EffectProcessor, EffectType };
