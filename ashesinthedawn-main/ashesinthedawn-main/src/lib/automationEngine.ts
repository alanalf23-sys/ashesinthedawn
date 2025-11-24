/**
 * Automation Engine - Handles automation curves, interpolation, and playback
 * Supports bezier curves with multiple interpolation modes
 */

import { AutomationCurve, AutomationPoint } from '../types';

export class AutomationEngine {
  /**
   * Calculate value at a specific time using automation curve
   * Supports linear, exponential, and logarithmic interpolation
   */
  static getValueAtTime(curve: AutomationCurve, time: number): number {
    if (curve.points.length === 0) return 0;
    if (curve.points.length === 1) return curve.points[0].value;

    // Find surrounding points
    const index = curve.points.findIndex(p => p.time >= time);
    
    if (index === 0) {
      // Before first point
      return curve.points[0].value;
    }
    
    if (index === -1) {
      // After last point
      return curve.points[curve.points.length - 1].value;
    }

    const point1 = curve.points[index - 1];
    const point2 = curve.points[index];

    // Normalize time between two points (0-1)
    const timeDelta = point2.time - point1.time;
    if (timeDelta === 0) return point1.value;
    
    const t = (time - point1.time) / timeDelta;

    // Apply curve type interpolation
    return this.interpolateValue(
      point1.value,
      point2.value,
      t,
      point2.curveType
    );
  }

  /**
   * Interpolate between two values based on curve type
   */
  private static interpolateValue(
    v1: number,
    v2: number,
    t: number,
    curveType: 'linear' | 'exponential' | 'logarithmic'
  ): number {
    const clampedT = Math.max(0, Math.min(1, t));

    switch (curveType) {
      case 'linear':
        return v1 + (v2 - v1) * clampedT;

      case 'exponential': {
        // Exponential easing (ease-out)
        const expT = 1 - Math.pow(1 - clampedT, 2);
        return v1 + (v2 - v1) * expT;
      }

      case 'logarithmic': {
        // Logarithmic easing (ease-in)
        const logT = Math.pow(clampedT, 2);
        return v1 + (v2 - v1) * logT;
      }

      default:
        return v1 + (v2 - v1) * clampedT;
    }
  }

  /**
   * Generate smooth curve data for visualization
   * Returns interpolated values at regular intervals
   */
  static generateCurveData(
    curve: AutomationCurve,
    startTime: number,
    endTime: number,
    resolution: number = 100
  ): { time: number; value: number }[] {
    const data: { time: number; value: number }[] = [];
    const timeStep = (endTime - startTime) / resolution;

    for (let i = 0; i <= resolution; i++) {
      const time = startTime + i * timeStep;
      const value = this.getValueAtTime(curve, time);
      data.push({ time, value });
    }

    return data;
  }

  /**
   * Add or update an automation point
   */
  static updatePoint(
    curve: AutomationCurve,
    point: AutomationPoint
  ): AutomationCurve {
    const existingIndex = curve.points.findIndex(p => p.time === point.time);

    if (existingIndex >= 0) {
      // Update existing point
      const newPoints = [...curve.points];
      newPoints[existingIndex] = point;
      return { ...curve, points: newPoints };
    } else {
      // Insert new point in sorted order
      const newPoints = [...curve.points, point];
      newPoints.sort((a, b) => a.time - b.time);
      return { ...curve, points: newPoints };
    }
  }

  /**
   * Remove an automation point
   */
  static removePoint(
    curve: AutomationCurve,
    time: number
  ): AutomationCurve {
    return {
      ...curve,
      points: curve.points.filter(p => p.time !== time),
    };
  }

  /**
   * Get all points within a time range
   */
  static getPointsInRange(
    curve: AutomationCurve,
    startTime: number,
    endTime: number
  ): AutomationPoint[] {
    return curve.points.filter(
      p => p.time >= startTime && p.time <= endTime
    );
  }

  /**
   * Shift all points by a time offset
   */
  static shiftPoints(
    curve: AutomationCurve,
    timeOffset: number
  ): AutomationCurve {
    return {
      ...curve,
      points: curve.points.map(p => ({
        ...p,
        time: Math.max(0, p.time + timeOffset),
      })),
    };
  }

  /**
   * Scale all values between min and max
   */
  static scaleValues(
    curve: AutomationCurve,
    minValue: number,
    maxValue: number
  ): AutomationCurve {
    if (curve.points.length === 0) return curve;

    const currentMin = Math.min(...curve.points.map(p => p.value));
    const currentMax = Math.max(...curve.points.map(p => p.value));
    const currentRange = currentMax - currentMin;

    if (currentRange === 0) {
      // All points have same value
      const midPoint = (minValue + maxValue) / 2;
      return {
        ...curve,
        points: curve.points.map(p => ({ ...p, value: midPoint })),
      };
    }

    const targetRange = maxValue - minValue;
    const scale = targetRange / currentRange;

    return {
      ...curve,
      points: curve.points.map(p => ({
        ...p,
        value: minValue + (p.value - currentMin) * scale,
      })),
    };
  }

  /**
   * Clear all automation points
   */
  static clear(curve: AutomationCurve): AutomationCurve {
    return { ...curve, points: [] };
  }

  /**
   * Duplicate automation curve
   */
  static duplicate(curve: AutomationCurve, newId: string): AutomationCurve {
    return {
      ...curve,
      id: newId,
      points: [...curve.points],
    };
  }
}
