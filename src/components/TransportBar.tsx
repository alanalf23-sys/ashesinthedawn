import { SkipBack, Play, Pause, SkipForward, Square } from "lucide-react";
import { useState } from "react";

interface TransportBarProps {
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
}

/**
 * TransportBar - Professional DAW transport controls
 *
 * Features:
 * - Play/Pause/Stop controls
 * - Skip back/forward buttons
 * - Real-time timecode display
 * - Keyboard shortcuts support
 */
export function TransportBar({
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  onPlay,
  onPause,
  onStop,
  onSkipBack,
  onSkipForward,
}: TransportBarProps) {
  const [localIsPlaying, setLocalIsPlaying] = useState(isPlaying);

  const handlePlayPause = () => {
    if (localIsPlaying) {
      onPause?.();
      setLocalIsPlaying(false);
    } else {
      onPlay?.();
      setLocalIsPlaying(true);
    }
  };

  const handleStop = () => {
    onStop?.();
    setLocalIsPlaying(false);
  };

  // Format time as MM:SS.mmm
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}.${String(ms).padStart(3, "0")}`;
  };

  return (
    <div className="flex items-center justify-between bg-gray-800 text-gray-300 p-3 px-4 rounded-lg shadow-lg border border-gray-700 gap-4">
      {/* Transport Controls */}
      <div className="flex gap-1">
        {/* Skip Back */}
        <button
          onClick={onSkipBack}
          className="p-2 hover:bg-gray-700 rounded transition-all duration-150 text-gray-400 hover:text-gray-200 hover:shadow-md hover:shadow-blue-500/20 hover:scale-110 transform active:scale-95"
          title="Skip back (Ctrl+Left)"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          className={`p-2 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 ${
            localIsPlaying
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:shadow-md hover:shadow-blue-500/20"
          }`}
          title={localIsPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {localIsPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>

        {/* Stop */}
        <button
          onClick={handleStop}
          className="p-2 hover:bg-gray-700 rounded transition-all duration-150 text-gray-400 hover:text-gray-200 hover:shadow-md hover:shadow-blue-500/20 hover:scale-110 transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          title="Stop (0)"
        >
          <Square className="w-4 h-4" />
        </button>

        {/* Skip Forward */}
        <button
          onClick={onSkipForward}
          className="p-2 hover:bg-gray-700 rounded transition-all duration-150 text-gray-400 hover:text-gray-200 hover:shadow-md hover:shadow-blue-500/20 hover:scale-110 transform active:scale-95"
          title="Skip forward (Ctrl+Right)"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Timecode Display */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-blue-400">{formatTime(currentTime)}</span>
        <span className="text-gray-600">/</span>
        <span className="text-gray-500">{formatTime(duration)}</span>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        {localIsPlaying && (
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-400 font-semibold">REC</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransportBar;
