import { PluginParameter, AutomationCurve } from '../types';

/**
 * PluginHost manages VST/AU plugin instances and effect chains
 * Handles plugin loading, parameter management, and audio processing
 */

export class PluginInstance {
  id: string;
  name: string;
  version: string;
  type: 'vst2' | 'vst3' | 'au' | 'internal';
  enabled: boolean;
  parameters: PluginParameter[] = [];
  currentValues: Record<string, number> = {};
  automationCurve?: AutomationCurve;
  audioNode?: AudioWorkletNode;

  constructor(
    id: string,
    name: string,
    version: string = '1.0',
    type: 'vst2' | 'vst3' | 'au' | 'internal' = 'internal'
  ) {
    this.id = id;
    this.name = name;
    this.version = version;
    this.type = type;
    this.enabled = true;
  }

  /**
   * Add a parameter to this plugin
   */
  addParameter(param: PluginParameter): void {
    this.parameters.push(param);
    this.currentValues[param.id] = param.default;
  }

  /**
   * Set parameter value
   */
  setParameter(parameterId: string, value: number): boolean {
    const param = this.parameters.find(p => p.id === parameterId);
    if (!param) return false;

    const clampedValue = Math.max(param.min, Math.min(param.max, value));
    this.currentValues[parameterId] = clampedValue;
    return true;
  }

  /**
   * Get parameter value
   */
  getParameter(parameterId: string): number {
    return this.currentValues[parameterId] ?? 0;
  }

  /**
   * Get all parameters
   */
  getParameters(): PluginParameter[] {
    return this.parameters;
  }

  /**
   * Enable/disable plugin
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get plugin state for serialization
   */
  getState(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      values: { ...this.currentValues },
    };
  }

  /**
   * Restore plugin state
   */
  setState(state: Record<string, unknown>): void {
    if (typeof state.enabled === 'boolean') {
      this.enabled = state.enabled;
    }
    if (typeof state.values === 'object' && state.values !== null) {
      this.currentValues = { ...state.values as Record<string, number> };
    }
  }
}

export class EffectChain {
  id: string;
  trackId: string;
  plugins: PluginInstance[] = [];
  bypass: boolean = false;
  outputGain: number = 1;

  constructor(id: string, trackId: string) {
    this.id = id;
    this.trackId = trackId;
  }

  /**
   * Add plugin to end of chain
   */
  addPlugin(plugin: PluginInstance): void {
    this.plugins.push(plugin);
  }

  /**
   * Insert plugin at specific index
   */
  insertPlugin(plugin: PluginInstance, index: number): void {
    if (index < 0 || index > this.plugins.length) return;
    this.plugins.splice(index, 0, plugin);
  }

  /**
   * Remove plugin from chain
   */
  removePlugin(pluginId: string): boolean {
    const index = this.plugins.findIndex(p => p.id === pluginId);
    if (index === -1) return false;
    this.plugins.splice(index, 1);
    return true;
  }

  /**
   * Move plugin to new position
   */
  movePlugin(pluginId: string, newIndex: number): boolean {
    const currentIndex = this.plugins.findIndex(p => p.id === pluginId);
    if (currentIndex === -1 || newIndex < 0 || newIndex >= this.plugins.length) return false;

    const plugin = this.plugins.splice(currentIndex, 1)[0];
    this.plugins.splice(newIndex, 0, plugin);
    return true;
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.find(p => p.id === pluginId);
  }

  /**
   * Get all plugins
   */
  getPlugins(): PluginInstance[] {
    return [...this.plugins];
  }

  /**
   * Set parameter on plugin in chain
   */
  setPluginParameter(pluginId: string, parameterId: string, value: number): boolean {
    const plugin = this.getPlugin(pluginId);
    return plugin ? plugin.setParameter(parameterId, value) : false;
  }

  /**
   * Get plugin parameter
   */
  getPluginParameter(pluginId: string, parameterId: string): number | undefined {
    const plugin = this.getPlugin(pluginId);
    return plugin ? plugin.getParameter(parameterId) : undefined;
  }

  /**
   * Enable/disable entire chain
   */
  setBypass(bypass: boolean): void {
    this.bypass = bypass;
  }

  /**
   * Check if chain is bypassed
   */
  isBypassed(): boolean {
    return this.bypass;
  }

  /**
   * Set output gain
   */
  setOutputGain(gain: number): void {
    this.outputGain = Math.max(0, gain);
  }

  /**
   * Get output gain
   */
  getOutputGain(): number {
    return this.outputGain;
  }

  /**
   * Get enabled plugin count
   */
  getEnabledPluginCount(): number {
    return this.plugins.filter(p => p.isEnabled()).length;
  }

  /**
   * Get total plugin count
   */
  getPluginCount(): number {
    return this.plugins.length;
  }

  /**
   * Get chain state for serialization
   */
  getState(): Record<string, unknown> {
    return {
      id: this.id,
      trackId: this.trackId,
      bypass: this.bypass,
      outputGain: this.outputGain,
      plugins: this.plugins.map(p => p.getState()),
    };
  }

  /**
   * Restore chain state
   */
  setState(state: Record<string, unknown>): void {
    if (typeof state.bypass === 'boolean') {
      this.bypass = state.bypass;
    }
    if (typeof state.outputGain === 'number') {
      this.outputGain = state.outputGain;
    }
    // Note: Plugin restoration would require plugin instances to be pre-created
  }

  /**
   * Clear all plugins from chain
   */
  clear(): void {
    this.plugins = [];
  }
}

/**
 * PluginHostManager - Singleton for managing all plugin instances
 */
export class PluginHostManager {
  private static instance: PluginHostManager;
  private effectChains: Map<string, EffectChain> = new Map();
  private plugins: Map<string, PluginInstance> = new Map();

  private constructor() {
    // Singleton - no initialization needed
  }

  static getInstance(): PluginHostManager {
    if (!PluginHostManager.instance) {
      PluginHostManager.instance = new PluginHostManager();
    }
    return PluginHostManager.instance;
  }

  /**
   * Create new effect chain for track
   */
  createEffectChain(trackId: string): EffectChain {
    const chainId = `chain-${trackId}-${Date.now()}`;
    const chain = new EffectChain(chainId, trackId);
    this.effectChains.set(chainId, chain);
    return chain;
  }

  /**
   * Get effect chain by ID
   */
  getEffectChain(chainId: string): EffectChain | undefined {
    return this.effectChains.get(chainId);
  }

  /**
   * Get all effect chains
   */
  getAllEffectChains(): EffectChain[] {
    return Array.from(this.effectChains.values());
  }

  /**
   * Delete effect chain
   */
  deleteEffectChain(chainId: string): boolean {
    return this.effectChains.delete(chainId);
  }

  /**
   * Create plugin instance
   */
  createPluginInstance(
    name: string,
    type: 'vst2' | 'vst3' | 'au' | 'internal' = 'internal',
    version: string = '1.0'
  ): PluginInstance {
    const pluginId = `plugin-${name}-${Date.now()}`;
    const plugin = new PluginInstance(pluginId, name, version, type);
    this.plugins.set(pluginId, plugin);
    return plugin;
  }

  /**
   * Get plugin instance by ID
   */
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugin instances
   */
  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Delete plugin instance
   */
  deletePlugin(pluginId: string): boolean {
    // Remove from all effect chains first
    for (const chain of this.effectChains.values()) {
      chain.removePlugin(pluginId);
    }
    return this.plugins.delete(pluginId);
  }

  /**
   * Get chains for specific track
   */
  getChainsForTrack(trackId: string): EffectChain[] {
    return Array.from(this.effectChains.values()).filter(
      chain => chain.trackId === trackId
    );
  }

  /**
   * Get total CPU usage estimate (0-100%)
   */
  estimateCPUUsage(): number {
    let total = 0;
    for (const plugin of this.plugins.values()) {
      if (plugin.isEnabled()) {
        // Simple estimation: 2-3% per enabled plugin
        total += Math.random() * 2 + 1.5;
      }
    }
    return Math.min(100, total);
  }

  /**
   * Get manager state for serialization
   */
  getState(): Record<string, unknown> {
    return {
      chains: Array.from(this.effectChains.values()).map(c => c.getState()),
      plugins: Array.from(this.plugins.values()).map(p => p.getState()),
    };
  }

  /**
   * Clear all plugins and chains
   */
  clear(): void {
    this.effectChains.clear();
    this.plugins.clear();
  }
}

/**
 * Get or create singleton plugin host manager
 */
export function getPluginHostManager(): PluginHostManager {
  return PluginHostManager.getInstance();
}
