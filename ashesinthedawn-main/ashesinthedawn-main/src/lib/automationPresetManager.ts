/**
 * Automation Preset Manager
 * Handles export/import of automation curves as JSON presets
 */

export interface AutomationPoint {
  time: number;
  value: number;
}

export interface AutomationCurveData {
  trackId: string;
  trackName: string;
  parameterName: string;
  curveType: 'linear' | 'exponential' | 'logarithmic';
  points: AutomationPoint[];
  minValue: number;
  maxValue: number;
}

export interface AutomationPreset {
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  curves: AutomationCurveData[];
  metadata?: {
    projectName?: string;
    tempo?: number;
    timeSignature?: string;
  };
}

export class AutomationPresetManager {
  /**
   * Export automation curves to JSON preset
   */
  static exportPreset(
    curves: AutomationCurveData[],
    presetName: string,
    description?: string,
    metadata?: AutomationPreset['metadata']
  ): AutomationPreset {
    return {
      name: presetName,
      description,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      curves,
      metadata,
    };
  }

  /**
   * Export preset as JSON file (trigger download)
   */
  static downloadPreset(preset: AutomationPreset): void {
    const dataStr = JSON.stringify(preset, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${preset.name.replace(/\s+/g, '_')}_automation.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import preset from JSON file
   */
  static async importPreset(file: File): Promise<AutomationPreset> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const preset = JSON.parse(content) as AutomationPreset;
          
          // Validate preset structure
          if (!preset.name || !Array.isArray(preset.curves)) {
            throw new Error('Invalid preset format');
          }

          // Validate curves
          preset.curves.forEach((curve) => {
            if (!curve.trackId || !curve.parameterName || !Array.isArray(curve.points)) {
              throw new Error('Invalid curve format in preset');
            }
            curve.points.forEach((point) => {
              if (typeof point.time !== 'number' || typeof point.value !== 'number') {
                throw new Error('Invalid automation point format');
              }
            });
          });

          resolve(preset);
        } catch (error) {
          reject(new Error(`Failed to parse preset: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * Validate preset compatibility
   */
  static validatePresetCompatibility(preset: AutomationPreset, targetVersion: string = '1.0.0'): boolean {
    const [presetMajor] = preset.version.split('.').map(Number);
    const [targetMajor] = targetVersion.split('.').map(Number);
    return presetMajor === targetMajor;
  }

  /**
   * Merge multiple presets
   */
  static mergePresets(presets: AutomationPreset[], mergeName: string): AutomationPreset {
    const allCurves = presets.flatMap(p => p.curves);
    return {
      name: mergeName,
      description: `Merged from ${presets.length} presets`,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      curves: allCurves,
      metadata: presets[0]?.metadata,
    };
  }

  /**
   * Filter curves by parameter
   */
  static filterCurvesByParameter(preset: AutomationPreset, parameterName: string): AutomationCurveData[] {
    return preset.curves.filter(c => c.parameterName === parameterName);
  }

  /**
   * Scale curve values (useful for normalization)
   */
  static scaleCurve(curve: AutomationCurveData, fromMin: number, fromMax: number, toMin: number, toMax: number): AutomationCurveData {
    const range = fromMax - fromMin;
    const targetRange = toMax - toMin;

    return {
      ...curve,
      points: curve.points.map(point => ({
        ...point,
        value: toMin + ((point.value - fromMin) / range) * targetRange,
      })),
      minValue: toMin,
      maxValue: toMax,
    };
  }

  /**
   * Time-shift all points in a curve
   */
  static shiftCurveTime(curve: AutomationCurveData, timeOffset: number): AutomationCurveData {
    return {
      ...curve,
      points: curve.points.map(point => ({
        ...point,
        time: point.time + timeOffset,
      })),
    };
  }

  /**
   * Compress/expand curve time range
   */
  static compressTime(curve: AutomationCurveData, factor: number): AutomationCurveData {
    if (factor <= 0) throw new Error('Time compression factor must be positive');
    
    return {
      ...curve,
      points: curve.points.map(point => ({
        ...point,
        time: point.time / factor,
      })),
    };
  }

  /**
   * Get curve statistics
   */
  static getCurveStats(curve: AutomationCurveData): {
    pointCount: number;
    minValue: number;
    maxValue: number;
    avgValue: number;
    duration: number;
  } {
    const values = curve.points.map(p => p.value);
    const times = curve.points.map(p => p.time);

    return {
      pointCount: curve.points.length,
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      avgValue: values.reduce((a, b) => a + b, 0) / values.length || 0,
      duration: Math.max(...times) - Math.min(...times) || 0,
    };
  }

  /**
   * Generate preset library from multiple presets
   */
  static createLibrary(presets: AutomationPreset[]): {
    presets: AutomationPreset[];
    totalCurves: number;
    categories: Map<string, number>;
  } {
    const categories = new Map<string, number>();
    let totalCurves = 0;

    presets.forEach(preset => {
      preset.curves.forEach(curve => {
        totalCurves++;
        const param = curve.parameterName;
        categories.set(param, (categories.get(param) || 0) + 1);
      });
    });

    return {
      presets,
      totalCurves,
      categories,
    };
  }
}
