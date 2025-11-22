import { useState, useEffect, useRef } from "react";
import { getAudioEngine } from "../lib/audioEngine";
import { motionPresets } from "../lib/motionPresets";
import Tooltip from "./Tooltip";

interface VolumeFaderProps {
  trackId: string;
  currentVolume: number; // in dB
  onVolumeChange: (volume: number) => void;
  label?: string;
  height?: number;
  showLabel?: boolean;
  showValue?: boolean;
}

// dB range: -60 to +12 (typical for DAW)
const MIN_DB = -60;
const MAX_DB = 12;
const RANGE = MAX_DB - MIN_DB;

// Convert dB to percentage (0-100)
const dbToPercent = (db: number): number => {
  return ((db - MIN_DB) / RANGE) * 100;
};

// Convert percentage (0-100) to dB
const percentToDb = (percent: number): number => {
  return (percent / 100) * RANGE + MIN_DB;
};

/**
 * VolumeFader - Professional fader component synced with Web Audio API
 *
 * Features:
 * - Vertical fader with smooth dragging
 * - dB display with real-time sync to audioEngine
 * - Click-to-set positioning
 * - Mouse wheel fine-tuning
 * - Double-click to reset to unity gain (0dB)
 */
export default function VolumeFader({
  trackId,
  currentVolume,
  onVolumeChange,
  label = "Volume",
  height = 200,
  showLabel = true,
  showValue = true,
}: VolumeFaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [displayVolume, setDisplayVolume] = useState(currentVolume);
  const faderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const audioEngine = getAudioEngine();

  // Get color based on volume level
  const getVolumeColor = (db: number): string => {
    if (db > 0) return "#ef4444"; // Red (clipping risk)
    if (db > -6) return "#f59e0b"; // Amber (hot)
    if (db > -20) return "#10b981"; // Green (good)
    if (db > -40) return "#6b7280"; // Gray (quiet)
    return "#4b5563"; // Dark gray (silent)
  };

  // Update audioEngine when volume changes
  useEffect(() => {
    audioEngine.setTrackVolume(trackId, displayVolume);
  }, [displayVolume, trackId, audioEngine]);

  // Sync with external currentVolume prop
  useEffect(() => {
    setDisplayVolume(currentVolume);
  }, [currentVolume]);

  // Mouse drag handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      const percent = Math.max(
        0,
        Math.min(100, ((rect.height - mouseY) / rect.height) * 100)
      );
      const newDb = percentToDb(percent);

      setDisplayVolume(Math.round(newDb * 10) / 10); // Round to 0.1dB
      onVolumeChange(newDb);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, onVolumeChange]);

  // Click-to-set handler
  const handleTrackClick = (e: React.MouseEvent) => {
    if (e.target === thumbRef.current) return;
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const percent = Math.max(
      0,
      Math.min(100, ((rect.height - mouseY) / rect.height) * 100)
    );
    const newDb = percentToDb(percent);

    setDisplayVolume(Math.round(newDb * 10) / 10);
    onVolumeChange(newDb);
  };

  // Scroll wheel fine-tuning
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1; // Invert for intuitive scroll
    const newDb = Math.max(
      MIN_DB,
      Math.min(MAX_DB, displayVolume + delta * 0.5)
    );
    setDisplayVolume(Math.round(newDb * 10) / 10);
    onVolumeChange(newDb);
  };

  // Double-click to reset to 0dB (unity gain)
  const handleDoubleClick = () => {
    setDisplayVolume(0);
    onVolumeChange(0);
  };

  const thumbPercent = dbToPercent(displayVolume);
  const volumeColor = getVolumeColor(displayVolume);

  // Calculate glow intensity based on volume level
  // Normalized to 0-1 range for motionPresets.meterGlow
  const normalizedLevel = (displayVolume - MIN_DB) / RANGE;
  const glowEffect = motionPresets.meterGlow(normalizedLevel);

  return (
    <Tooltip content={`${label}: ${displayVolume.toFixed(1)}dB`}>
      <div className="flex flex-col items-center gap-2 select-none">
        {/* Label */}
        {showLabel && (
          <div className="text-xs font-semibold text-gray-300 text-center">
            {label}
          </div>
        )}

        {/* Fader Track */}
        <div
          ref={faderRef}
          className="flex flex-col-reverse gap-0 group cursor-pointer"
          style={{ height: `${height}px` }}
        >
          <div
            ref={trackRef}
            className="relative w-8 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
            style={{ height: "100%" }}
            onClick={handleTrackClick}
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
          >
            {/* Background fill (volume visualization) */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-b opacity-30 transition-all pointer-events-none"
              style={{
                height: `${thumbPercent}%`,
                backgroundColor: volumeColor,
              }}
            />

            {/* Center reference line (0dB unity gain) */}
            <div
              className="absolute left-0 right-0 h-px bg-gray-600 opacity-50"
              style={{ top: `${100 - dbToPercent(0)}%` }}
            />

            {/* Thumb/Handle */}
            <div
              ref={thumbRef}
              className="absolute left-1/2 w-6 h-4 -translate-x-1/2 rounded shadow-lg hover:shadow-xl hover:shadow-blue-500/50 cursor-grab active:cursor-grabbing transition-all duration-100 border border-gray-400 hover:border-blue-400 hover:scale-110"
              style={{
                bottom: `calc(${thumbPercent}% - 8px)`,
                backgroundColor: volumeColor,
                boxShadow: glowEffect.boxShadow,
              }}
              onMouseDown={handleMouseDown}
              onDoubleClick={handleDoubleClick}
            />
          </div>
        </div>

        {/* Value Display */}
        {showValue && (
          <div
            className="text-xs font-mono text-center px-2 py-1 rounded bg-gray-800 border border-gray-700 min-w-12"
            style={{ color: volumeColor }}
          >
            {displayVolume > 0 ? "+" : ""}
            {displayVolume.toFixed(1)}
            <span className="text-gray-500">dB</span>
          </div>
        )}

        {/* Info Text */}
        <div className="text-xs text-gray-500 text-center h-4">
          {displayVolume === 0 ? (
            <span>Unity</span>
          ) : displayVolume > 0 ? (
            <span className="text-amber-400">
              +{Math.abs(displayVolume).toFixed(0)}%
            </span>
          ) : (
            <span className="text-blue-400">
              -{Math.abs(displayVolume).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </Tooltip>
  );
}
