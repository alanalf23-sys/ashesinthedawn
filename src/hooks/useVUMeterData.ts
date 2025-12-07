/**
 * Hook to connect VU Meter GFX with audio engine data
 * Provides real-time audio level data for VU meter visualization
 */

import { useState, useEffect, useCallback } from 'react';
import { getAudioEngine } from '../lib/audioEngine';

interface VUMeterData {
  leftLevel: number;
  rightLevel: number;
  leftRms: number;
  rightRms: number;
  leftPeak: number;
  rightPeak: number;
}

/**
 * Hook to get real-time audio levels for VU meter
 * @param trackId Optional track ID for track-specific metering (if not provided, uses master output)
 * @returns VUMeterData with left/right levels, RMS, and peaks
 */
export function useVUMeterData(trackId?: string): VUMeterData {
  const [data, setData] = useState<VUMeterData>({
    leftLevel: 0,
    rightLevel: 0,
    leftRms: 0,
    rightRms: 0,
    leftPeak: 0,
    rightPeak: 0,
  });

  const updateLevels = useCallback(() => {
    const audioEngine = getAudioEngine();
    
    if (trackId) {
      // Per-track metering using getTrackLevel()
      const level = audioEngine.getTrackLevel(trackId);
      
      // For mono tracks or simplified display, use same value for both channels
      // In a real stereo implementation, you'd need separate L/R analysers
      setData({
        leftLevel: level,
        rightLevel: level,
        leftRms: level * 0.707, // RMS approximation (0.707 = 1/sqrt(2))
        rightRms: level * 0.707,
        leftPeak: level,
        rightPeak: level,
      });
    } else {
      // Master output metering using getAudioLevels()
      const levels = audioEngine.getAudioLevels();
      
      if (levels && levels.length > 0) {
        const halfLength = Math.floor(levels.length / 2);
        
        // Calculate RMS and peak for left channel
        let leftSum = 0;
        let leftPeak = 0;
        for (let i = 0; i < halfLength; i++) {
          const normalized = levels[i] / 255;
          leftSum += normalized * normalized;
          leftPeak = Math.max(leftPeak, normalized);
        }
        const leftRms = Math.sqrt(leftSum / halfLength);
        
        // Calculate RMS and peak for right channel
        let rightSum = 0;
        let rightPeak = 0;
        for (let i = halfLength; i < levels.length; i++) {
          const normalized = levels[i] / 255;
          rightSum += normalized * normalized;
          rightPeak = Math.max(rightPeak, normalized);
        }
        const rightRms = Math.sqrt(rightSum / (levels.length - halfLength));

        setData({
          leftLevel: leftPeak,
          rightLevel: rightPeak,
          leftRms,
          rightRms,
          leftPeak,
          rightPeak,
        });
      }
    }
  }, [trackId]);

  useEffect(() => {
    let animationId: number;

    const animate = () => {
      updateLevels();
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [updateLevels]);

  return data;
}

export default useVUMeterData;
