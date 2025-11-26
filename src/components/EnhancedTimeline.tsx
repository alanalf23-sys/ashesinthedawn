import { useEffect, useRef, useState, useCallback } from "react";
import { useDAW } from "../contexts/DAWContext";
import WaveformAdjuster from "./WaveformAdjuster";

interface TimelineProps {
  onSeek?: (timeSeconds: number) => void;
}

/**
 * Enhanced Timeline Component
 * Features:
 * - Real-time waveform display with WaveformAdjuster
 * - Click-to-seek functionality
 * - Precise time tracking with millisecond precision
 * - Playhead position indicator
 * - Duration display
 * - Selected track visualization
 */
export default function Timeline({ onSeek }: TimelineProps) {
  const { 
    selectedTrack, 
    seek, 
    currentTime, 
    isPlaying,
    getAudioDuration,
    tracks
  } = useDAW();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [timeInput, setTimeInput] = useState("0:00.000");

  const duration = selectedTrack ? getAudioDuration(selectedTrack.id) : 0;

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
    return `${minutes}:${secs.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(3, "0")}`;
  }, []);

  // Parse time input
  const parseTime = (input: string): number => {
    const parts = input.split(":");
    if (parts.length !== 2) return currentTime;
    const mins = parseInt(parts[0]) || 0;
    const secParts = parts[1].split(".");
    const secs = parseInt(secParts[0]) || 0;
    const ms = parseInt((secParts[1] || "0").padEnd(3, "0")) || 0;
    return mins * 60 + secs + ms / 1000;
  };

  // Handle timeline click for seeking
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !selectedTrack || duration === 0) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = Math.max(0, Math.min(percentage * duration, duration));

    seek(newTime);
    onSeek?.(newTime);
  };

  // Handle drag seeking
  const handleMouseDown = () => {
    if (selectedTrack && duration > 0) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !timelineRef.current || !selectedTrack || duration === 0) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
    const newTime = percentage * duration;

    seek(newTime);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, duration, selectedTrack]);

  // Update time input when currentTime changes
  useEffect(() => {
    setTimeInput(formatTime(currentTime));
  }, [currentTime, formatTime]);

  // No selected track message
  if (!selectedTrack) {
    return (
      <div className="w-full h-full bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-2">Select a track to view timeline</p>
          <p className="text-xs text-gray-500">
            {tracks.length === 0 ? "Create a track first" : `${tracks.length} track(s) available`}
          </p>
        </div>
      </div>
    );
  }

  // Calculate percentage for progress bar
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full space-y-2">
      {/* Time Display */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold text-blue-400">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-gray-500">/</span>
          <span className="text-sm font-mono text-gray-400">
            {formatTime(duration)}
          </span>
        </div>

        {/* Time Input */}
        <div className="flex items-center gap-1">
          {showTimeInput ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const newTime = parseTime(timeInput);
                    seek(Math.max(0, Math.min(newTime, duration)));
                    setShowTimeInput(false);
                  } else if (e.key === "Escape") {
                    setShowTimeInput(false);
                  }
                }}
                className="w-20 px-1 py-0.5 text-xs bg-gray-700 rounded border border-blue-500 text-gray-100 font-mono"
                autoFocus
              />
              <button
                onClick={() => setShowTimeInput(false)}
                className="px-1.5 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition"
              >
                ✓
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTimeInput(true)}
              className="px-1.5 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition"
              title="Click to enter time"
            >
              Go to...
            </button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500">
          {isPlaying ? "▶ Playing" : "⏸ Stopped"} • {selectedTrack.name}
        </div>
      </div>

      {/* Waveform Display with Real-Time Accuracy */}
      <div
        ref={timelineRef}
        className="w-full cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onClick={handleTimelineClick}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <WaveformAdjuster
          trackId={selectedTrack.id}
          height={150}
          showControls={true}
        />
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 transition-all duration-75"
          style={{
            width: `${progressPercentage}%`,
            boxShadow: "0 0 8px rgba(59, 130, 246, 0.5)",
          }}
        />
      </div>

      {/* Timeline Ruler */}
      <div className="flex items-end h-6 gap-1 px-2 py-1 bg-gray-900 rounded-lg border border-gray-700 overflow-x-auto">
        {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => {
          const isMainTick = i % 5 === 0;
          return (
            <div
              key={i}
              className="flex flex-col items-center flex-shrink-0"
              style={{ flex: "0 0 auto", width: "40px" }}
            >
              <div
                className={`w-0.5 ${
                  isMainTick ? "h-3 bg-blue-500" : "h-1.5 bg-gray-600"
                }`}
              />
              {isMainTick && (
                <span className="text-xs text-gray-500 mt-0.5">{i}s</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Status */}
      <div className="text-xs text-gray-600 px-2">
        {isDragging && "Scrubbing..."}
        {!isDragging && currentTime > 0 && (
          <>
            <span className="text-blue-400">
              {Math.round((currentTime / duration) * 100)}%
            </span>{" "}
            complete
          </>
        )}
      </div>
    </div>
  );
}
