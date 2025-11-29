import { useRef, useState, useCallback } from "react";
import { useTransportClock } from "../hooks/useTransportClock";

/**
 * TimelineWithLoopMarkers - Clean, minimal loop timeline with drag handles
 *
 * Features:
 * - WebSocket sync from backend
 * - Draggable loop start/end markers
 * - Real-time playhead animation
 * - Automatic backend sync on loop change
 * - Clean minimal UI
 */
export default function TimelineWithLoopMarkers() {
  const { state: transport, connected } = useTransportClock();

  const [loopRange, setLoopRange] = useState<[number, number]>([5, 10]);
  const [dragging, setDragging] = useState<null | "start" | "end">(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const scale = 10; // px per second
  const time = transport.time_seconds;
  const [loopStart, loopEnd] = loopRange.map((t) => t * scale);

  // Update backend when loop range changes
  const handleLoopChange = useCallback(async (start: number, end: number) => {
    setLoopRange([start, end]);
    try {
      await fetch(
        `http://localhost:8000/transport/loop?start=${start}&end=${end}`,
        { method: "POST" }
      );
    } catch (err) {
      console.error("Failed to update loop:", err);
    }
  }, []);

  // Drag handlers
  const handleMouseDown = (marker: "start" | "end") => {
    setDragging(marker);
  };

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragging || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const seconds = Math.max(0, clickX / scale);

      if (dragging === "start") {
        const newStart = Math.min(seconds, loopRange[1] - 0.1);
        handleLoopChange(newStart, loopRange[1]);
      } else if (dragging === "end") {
        const newEnd = Math.max(seconds, loopRange[0] + 0.1);
        handleLoopChange(loopRange[0], newEnd);
      }
    },
    [dragging, loopRange, scale, handleLoopChange]
  );

  // Format time as MM:SS.mm
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      secs.toFixed(1)
    ).padStart(4, "0")}`;
  };

  return (
    <div
      ref={timelineRef}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      className="relative h-32 bg-gray-900 overflow-hidden border-b border-gray-700 select-none cursor-default"
    >
      {/* Connection status */}
      <div className="absolute top-2 left-2 flex items-center gap-2 text-xs z-20">
        <div
          className={`w-2 h-2 rounded-full ${
            connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-gray-400">{connected ? "Sync" : "Offline"}</span>
      </div>

      {/* Loop region background */}
      <div
        className="absolute top-0 bottom-0 bg-blue-500/10 border-x border-blue-500/30"
        style={{ left: loopStart, width: loopEnd - loopStart }}
      />

      {/* Draggable loop start marker */}
      <div
        onMouseDown={() => handleMouseDown("start")}
        className="absolute top-0 bottom-0 w-1 bg-blue-400 hover:bg-blue-300 cursor-col-resize z-10 transition"
        style={{ left: loopStart, transform: "translateX(-50%)" }}
        title={`Loop start: ${formatTime(loopRange[0])}`}
      />

      {/* Draggable loop end marker */}
      <div
        onMouseDown={() => handleMouseDown("end")}
        className="absolute top-0 bottom-0 w-1 bg-blue-400 hover:bg-blue-300 cursor-col-resize z-10 transition"
        style={{ left: loopEnd, transform: "translateX(-50%)" }}
        title={`Loop end: ${formatTime(loopRange[1])}`}
      />

      {/* Playhead */}
      <div
        style={{ transform: `translateX(${time * scale}px)` }}
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 transition-transform duration-50 ease-linear"
      />

      {/* Playhead cap */}
      <div
        style={{ transform: `translateX(${time * scale - 6}px)` }}
        className="absolute top-0 w-3 h-6 bg-red-500 rounded-b z-20 pointer-events-none transition-transform duration-50 ease-linear"
      />

      {/* Time labels */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between text-xs text-gray-400 px-3 py-1 bg-gray-800/50 pointer-events-none">
        <span className="font-mono">
          {formatTime(loopRange[0])} → {formatTime(loopRange[1])}
        </span>
        <span className="font-mono text-gray-500">{formatTime(time)}</span>
      </div>
    </div>
  );
}
