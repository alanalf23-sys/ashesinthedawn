/**
 * Automation Recording Engine
 * Records and playback parameter automation for tracks and effects
 */

import { AutomationCurve, AutomationPoint } from '../types';

interface RecordingState {
  isRecording: boolean;
  startTime: number;
  trackId: string;
  parameter: string;
  points: AutomationPoint[];
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  trackId: string;
  curve: AutomationCurve;
}

type AutomationMode = 'off' | 'read' | 'write' | 'touch' | 'latch';

class AutomationRecordingEngine {
  private recordingStates: Map<string, RecordingState> = new Map();
  private playbackStates: Map<string, PlaybackState> = new Map();
  private automationCurves: Map<string, AutomationCurve> = new Map();
  private minimumRecordingInterval = 20; // ms between recorded points

  /**
   * Start recording automation for a parameter
   */
  public startRecording(
    trackId: string,
    parameter: string,
    initialValue: number,
    currentTime: number = 0
  ) {
    const key = `${trackId}:${parameter}`;

    // Create or retrieve automation curve
    if (!this.automationCurves.has(key)) {
      const curve: AutomationCurve = {
        id: `curve-${trackId}-${parameter}`,
        trackId,
        parameter,
        points: [
          { time: 0, value: initialValue, curveType: 'linear' }
        ],
        mode: 'write',
        recording: true
      };
      this.automationCurves.set(key, curve);
    } else {
      const curve = this.automationCurves.get(key)!;
      curve.recording = true;
      curve.mode = 'write';
    }

    this.recordingStates.set(key, {
      isRecording: true,
      startTime: currentTime,
      trackId,
      parameter,
      points: []
    });
  }

  /**
   * Stop recording automation
   */
  public stopRecording(trackId: string, parameter: string) {
    const key = `${trackId}:${parameter}`;
    const state = this.recordingStates.get(key);

    if (state) {
      const curve = this.automationCurves.get(key);
      if (curve) {
        curve.recording = false;
        curve.mode = 'read';
        // Add recorded points to curve
        curve.points.push(...state.points);
        // Sort by time
        curve.points.sort((a, b) => a.time - b.time);
      }

      this.recordingStates.delete(key);
    }
  }

  /**
   * Record an automation value at current time
   */
  public recordValue(
    trackId: string,
    parameter: string,
    value: number,
    currentTime: number
  ) {
    const key = `${trackId}:${parameter}`;
    const state = this.recordingStates.get(key);

    if (!state || !state.isRecording) return;

    const timeSinceStart = (currentTime - state.startTime) * 1000; // Convert to ms

    // Only record if enough time has passed since last point
    const lastPoint = state.points[state.points.length - 1];
    if (!lastPoint || (timeSinceStart - (lastPoint.time * 1000)) >= this.minimumRecordingInterval) {
      state.points.push({
        time: currentTime,
        value: Math.max(0, Math.min(1, value)),
        curveType: 'linear'
      });
    }
  }

  /**
   * Start playback of automation
   */
  public startPlayback(trackId: string, parameter: string, currentTime: number = 0) {
    const key = `${trackId}:${parameter}`;
    const curve = this.automationCurves.get(key);

    if (!curve) return;

    this.playbackStates.set(key, {
      isPlaying: true,
      currentTime,
      trackId,
      curve
    });
  }

  /**
   * Stop playback of automation
   */
  public stopPlayback(trackId: string, parameter: string) {
    const key = `${trackId}:${parameter}`;
    this.playbackStates.delete(key);
  }

  /**
   * Get current automation value for playback
   */
  public getPlaybackValue(trackId: string, parameter: string, currentTime: number): number | null {
    const key = `${trackId}:${parameter}`;
    const curve = this.automationCurves.get(key);

    if (!curve || curve.mode === 'off') return null;

    // Find surrounding points for interpolation
    let point1: AutomationPoint | null = null;
    let point2: AutomationPoint | null = null;

    for (let i = 0; i < curve.points.length; i++) {
      if (curve.points[i].time <= currentTime) {
        point1 = curve.points[i];
      }
      if (curve.points[i].time > currentTime && !point2) {
        point2 = curve.points[i];
        break;
      }
    }

    if (!point1) {
      return curve.points.length > 0 ? curve.points[0].value : 0;
    }

    if (!point2) {
      return point1.value;
    }

    // Interpolate between points
    return this.interpolateValue(point1, point2, currentTime);
  }

  /**
   * Interpolate between two automation points
   */
  private interpolateValue(point1: AutomationPoint, point2: AutomationPoint, currentTime: number): number {
    const timeDiff = point2.time - point1.time;
    if (timeDiff === 0) return point1.value;

    const timeRatio = (currentTime - point1.time) / timeDiff;

    switch (point1.curveType) {
      case 'linear':
        return point1.value + (point2.value - point1.value) * timeRatio;

      case 'exponential': {
        // Exponential interpolation
        const expFactor = Math.exp((timeRatio - 1) * 2);
        return point1.value + (point2.value - point1.value) * (1 - expFactor) / (1 - Math.exp(-2));
      }

      case 'logarithmic': {
        // Logarithmic interpolation
        const logFactor = Math.log(timeRatio + 1) / Math.log(2);
        return point1.value + (point2.value - point1.value) * logFactor;
      }

      default:
        return point1.value;
    }
  }

  /**
   * Set automation mode for a parameter
   */
  public setAutomationMode(trackId: string, parameter: string, mode: AutomationMode) {
    const key = `${trackId}:${parameter}`;
    const curve = this.automationCurves.get(key);

    if (curve) {
      curve.mode = mode;
    }
  }

  /**
   * Get automation curve for a parameter
   */
  public getAutomationCurve(trackId: string, parameter: string): AutomationCurve | null {
    const key = `${trackId}:${parameter}`;
    return this.automationCurves.get(key) || null;
  }

  /**
   * Get all automation curves for a track
   */
  public getTrackAutomation(trackId: string): AutomationCurve[] {
    const curves: AutomationCurve[] = [];
    this.automationCurves.forEach((curve) => {
      if (curve.trackId === trackId) {
        curves.push(curve);
      }
    });
    return curves;
  }

  /**
   * Create automation curve from array of points
   */
  public createCurve(
    trackId: string,
    parameter: string,
    points: AutomationPoint[],
    mode: AutomationMode = 'read'
  ): AutomationCurve {
    const key = `${trackId}:${parameter}`;
    const curve: AutomationCurve = {
      id: `curve-${trackId}-${parameter}-${Date.now()}`,
      trackId,
      parameter,
      points: [...points].sort((a, b) => a.time - b.time),
      mode,
      recording: false
    };

    this.automationCurves.set(key, curve);
    return curve;
  }

  /**
   * Delete automation curve
   */
  public deleteCurve(trackId: string, parameter: string) {
    const key = `${trackId}:${parameter}`;
    this.automationCurves.delete(key);
    this.playbackStates.delete(key);
  }

  /**
   * Clear all automation for a track
   */
  public clearTrackAutomation(trackId: string) {
    const keysToDelete: string[] = [];
    this.automationCurves.forEach((curve, key) => {
      if (curve.trackId === trackId) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.automationCurves.delete(key));
  }

  /**
   * Edit automation point
   */
  public editPoint(trackId: string, parameter: string, pointIndex: number, newValue: number, newTime?: number) {
    const key = `${trackId}:${parameter}`;
    const curve = this.automationCurves.get(key);

    if (!curve || pointIndex < 0 || pointIndex >= curve.points.length) return;

    const point = curve.points[pointIndex];
    point.value = Math.max(0, Math.min(1, newValue));
    if (newTime !== undefined) {
      point.time = newTime;
    }

    // Re-sort if time was changed
    if (newTime !== undefined) {
      curve.points.sort((a, b) => a.time - b.time);
    }
  }

  /**
   * Delete automation point
   */
  public deletePoint(trackId: string, parameter: string, pointIndex: number) {
    const key = `${trackId}:${parameter}`;
    const curve = this.automationCurves.get(key);

    if (!curve || pointIndex < 0 || pointIndex >= curve.points.length) return;

    // Keep at least one point
    if (curve.points.length > 1) {
      curve.points.splice(pointIndex, 1);
    }
  }

  /**
   * Add automation point
   */
  public addPoint(trackId: string, parameter: string, time: number, value: number, curveType: 'linear' | 'exponential' | 'logarithmic' = 'linear') {
    const key = `${trackId}:${parameter}`;
    let curve = this.automationCurves.get(key);

    if (!curve) {
      curve = this.createCurve(trackId, parameter, []);
    }

    curve.points.push({
      time,
      value: Math.max(0, Math.min(1, value)),
      curveType
    });

    // Sort by time
    curve.points.sort((a, b) => a.time - b.time);
  }

  /**
   * Get statistics about automation
   */
  public getAutomationStats(trackId: string, parameter: string) {
    const curve = this.getAutomationCurve(trackId, parameter);
    if (!curve || curve.points.length === 0) {
      return null;
    }

    const values = curve.points.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const pointCount = values.length;

    return { min, max, average, pointCount };
  }

  /**
   * Export automation to JSON
   */
  public exportAutomation(trackId: string, parameter: string): string {
    const curve = this.getAutomationCurve(trackId, parameter);
    if (!curve) return '';

    return JSON.stringify({
      parameter: curve.parameter,
      mode: curve.mode,
      points: curve.points
    }, null, 2);
  }

  /**
   * Import automation from JSON
   */
  public importAutomation(trackId: string, parameter: string, jsonData: string) {
    try {
      const data = JSON.parse(jsonData);
      this.createCurve(trackId, parameter, data.points, data.mode);
    } catch (e) {
      console.error('Failed to import automation:', e);
    }
  }

  /**
   * Set minimum recording interval in milliseconds
   */
  public setRecordingInterval(intervalMs: number) {
    this.minimumRecordingInterval = Math.max(1, intervalMs);
  }

  /**
   * Get all automation curves
   */
  public getAllCurves(): AutomationCurve[] {
    return Array.from(this.automationCurves.values());
  }
}

// Singleton instance
let automationEngineInstance: AutomationRecordingEngine | null = null;

export function getAutomationRecordingEngine(): AutomationRecordingEngine {
  if (!automationEngineInstance) {
    automationEngineInstance = new AutomationRecordingEngine();
  }
  return automationEngineInstance;
}

export { AutomationRecordingEngine };
