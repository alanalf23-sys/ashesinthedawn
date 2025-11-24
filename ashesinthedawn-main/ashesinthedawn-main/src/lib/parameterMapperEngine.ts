/**
 * Plugin Parameter Mapper - Maps MIDI CC controllers to plugin parameters
 * Supports learning-based assignment and custom mapping configurations
 */

export interface ParameterMapping {
  id: string;
  pluginId: string;
  parameterId: string;
  midiChannel: number;
  midiCC: number; // MIDI Control Change (0-127)
  minValue: number; // Plugin parameter min
  maxValue: number; // Plugin parameter max
  midiMin: number; // MIDI min (0-127)
  midiMax: number; // MIDI max (0-127)
  enabled: boolean;
  name: string;
}

export class ParameterMapperEngine {
  private mappings: Map<string, ParameterMapping> = new Map();
  private learningMode: boolean = false;
  private learningMappingId: string | null = null;

  /**
   * Add a new parameter mapping
   */
  addMapping(mapping: Omit<ParameterMapping, 'id'>): string {
    const id = `mapping-${Date.now()}`;
    const fullMapping: ParameterMapping = { ...mapping, id };
    this.mappings.set(id, fullMapping);
    console.log(`Added parameter mapping: ${mapping.name}`);
    return id;
  }

  /**
   * Remove a parameter mapping
   */
  removeMapping(mappingId: string): void {
    this.mappings.delete(mappingId);
    if (this.learningMappingId === mappingId) {
      this.learningMode = false;
      this.learningMappingId = null;
    }
    console.log(`Removed mapping: ${mappingId}`);
  }

  /**
   * Get all mappings for a plugin
   */
  getMappingsForPlugin(pluginId: string): ParameterMapping[] {
    return Array.from(this.mappings.values()).filter(
      m => m.pluginId === pluginId
    );
  }

  /**
   * Get mapping by MIDI CC
   */
  getMappingByMidiCC(
    midiChannel: number,
    midiCC: number
  ): ParameterMapping | undefined {
    return Array.from(this.mappings.values()).find(
      m => m.midiChannel === midiChannel && m.midiCC === midiCC && m.enabled
    );
  }

  /**
   * Enable learning mode for a mapping
   */
  startLearning(mappingId: string): void {
    this.learningMode = true;
    this.learningMappingId = mappingId;
    console.log(`Learning mode started for mapping: ${mappingId}`);
  }

  /**
   * Stop learning mode
   */
  stopLearning(): void {
    this.learningMode = false;
    this.learningMappingId = null;
    console.log('Learning mode stopped');
  }

  /**
   * Process MIDI CC input and map to parameter value
   */
  processMidiCC(
    midiChannel: number,
    cc: number,
    value: number // 0-127
  ): { parameterId: string; pluginId: string; value: number } | null {
    // If in learning mode, assign CC to mapping
    if (this.learningMode && this.learningMappingId) {
      const mapping = this.mappings.get(this.learningMappingId);
      if (mapping) {
        // Update mapping with learned CC
        const updatedMapping: ParameterMapping = {
          ...mapping,
          midiChannel,
          midiCC: cc,
        };
        this.mappings.set(this.learningMappingId, updatedMapping);
        console.log(`Learned CC ${cc} on channel ${midiChannel}`);
        this.stopLearning();
        return null; // Don't process during learning
      }
    }

    // Find applicable mapping
    const mapping = this.getMappingByMidiCC(midiChannel, cc);
    if (!mapping) return null;

    // Map MIDI value (0-127) to parameter range
    const midiRange = mapping.midiMax - mapping.midiMin;
    const paramRange = mapping.maxValue - mapping.minValue;
    const normalizedMidi = (value - mapping.midiMin) / midiRange;
    const paramValue = mapping.minValue + normalizedMidi * paramRange;

    return {
      pluginId: mapping.pluginId,
      parameterId: mapping.parameterId,
      value: Math.max(mapping.minValue, Math.min(mapping.maxValue, paramValue)),
    };
  }

  /**
   * Update a mapping
   */
  updateMapping(
    mappingId: string,
    updates: Partial<ParameterMapping>
  ): void {
    const mapping = this.mappings.get(mappingId);
    if (mapping) {
      this.mappings.set(mappingId, { ...mapping, ...updates });
      console.log(`Updated mapping: ${mappingId}`);
    }
  }

  /**
   * Get all mappings
   */
  getAllMappings(): ParameterMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Clear all mappings
   */
  clearAllMappings(): void {
    this.mappings.clear();
    this.learningMode = false;
    this.learningMappingId = null;
    console.log('Cleared all mappings');
  }

  /**
   * Export mappings to JSON
   */
  exportMappings(): string {
    return JSON.stringify(Array.from(this.mappings.values()), null, 2);
  }

  /**
   * Import mappings from JSON
   */
  importMappings(json: string): void {
    try {
      const mappings: ParameterMapping[] = JSON.parse(json);
      this.clearAllMappings();
      mappings.forEach(mapping => {
        this.mappings.set(mapping.id, mapping);
      });
      console.log(`Imported ${mappings.length} mappings`);
    } catch (error) {
      console.error('Failed to import mappings:', error);
    }
  }

  /**
   * Check if currently in learning mode
   */
  isLearning(): boolean {
    return this.learningMode;
  }

  /**
   * Get current learning mapping
   */
  getLearningMapping(): ParameterMapping | undefined {
    return this.learningMappingId
      ? this.mappings.get(this.learningMappingId)
      : undefined;
  }
}

// Singleton instance
let mapperInstance: ParameterMapperEngine | null = null;

export function getParameterMapperEngine(): ParameterMapperEngine {
  if (!mapperInstance) {
    mapperInstance = new ParameterMapperEngine();
  }
  return mapperInstance;
}
