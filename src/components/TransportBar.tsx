import { SkipBack, Play, Pause, SkipForward, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDAW } from "../contexts/DAWContext";

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
  const daw = useDAW();

  const resolvedIsPlaying = isPlaying ?? daw.isPlaying;
  const resolvedCurrentTime = useMemo(() => currentTime ?? daw.currentTime ?? 0, [currentTime, daw.currentTime]);
  const resolvedDuration = duration ?? 0;

  const resolvedOnPlay = onPlay ?? daw.togglePlay;
  const resolvedOnPause = onPause ?? daw.togglePlay;
  const resolvedOnStop = onStop ?? daw.stop;
  const resolvedOnSkipBack = onSkipBack ?? (() => daw.seek?.(0));
  const resolvedOnSkipForward = onSkipForward ?? (() => daw.seek?.(resolvedCurrentTime + 5));

  const [localIsPlaying, setLocalIsPlaying] = useState(resolvedIsPlaying);

  useEffect(() => {
    setLocalIsPlaying(resolvedIsPlaying);
  }, [resolvedIsPlaying]);

  const handlePlayPause = () => {
    if (localIsPlaying) {
      resolvedOnPause?.();
      setLocalIsPlaying(false);
    } else {
      resolvedOnPlay?.();
      setLocalIsPlaying(true);
    }
  };

  const handleStop = () => {
    resolvedOnStop?.();
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
    <div className="flex items-center justify-between bg-slate-950 text-slate-100 p-3 px-4 rounded-md shadow-sm border border-slate-800 gap-4">
      {/* Transport Controls */}
      <div className="flex gap-1">
        {/* Skip Back */}
        <button
          onClick={resolvedOnSkipBack}
          className="p-2 hover:bg-slate-800 rounded transition-all duration-150 text-slate-400 hover:text-slate-100 hover:shadow-md hover:shadow-cyan-500/20 hover:scale-110 transform active:scale-95"
          title="Skip back (Ctrl+Left)"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          className={`p-2 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 ${
            localIsPlaying
              ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-md shadow-cyan-500/30 hover:shadow-cyan-500/50"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:shadow-md hover:shadow-cyan-500/20"
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
          className="p-2 hover:bg-slate-800 rounded transition-all duration-150 text-slate-400 hover:text-slate-100 hover:shadow-md hover:shadow-cyan-500/20 hover:scale-110 transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          title="Stop (0)"
        >
          <Square className="w-4 h-4" />
        </button>

        {/* Skip Forward */}
        <button
          onClick={resolvedOnSkipForward}
          className="p-2 hover:bg-slate-800 rounded transition-all duration-150 text-slate-400 hover:text-slate-100 hover:shadow-md hover:shadow-cyan-500/20 hover:scale-110 transform active:scale-95"
          title="Skip forward (Ctrl+Right)"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Timecode Display */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-cyan-400">{formatTime(resolvedCurrentTime)}</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-500">{formatTime(resolvedDuration)}</span>
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
