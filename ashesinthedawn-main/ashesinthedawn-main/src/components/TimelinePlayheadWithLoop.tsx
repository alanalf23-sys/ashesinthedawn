import { useState } from "react";
import { useTransportClock, useTransportAPI } from "../hooks/useTransportClock";

/**
 * TimelinePlayheadWithLoop - Full-featured timeline with loop support
 *
 * Features:
 * - Real-time playhead sync from WebSocket
 * - Loop region visualization and editing
 * - Click-to-seek functionality
 * - Drag loop handles to resize region
 * - Zoom controls (50% - 400%)
 * - Beat markers with measures
 * - Connection status indicator
 */
export default function TimelinePlayheadWithLoop() {
  const { state: transport, connected, error } = useTransportClock();
  const api = useTransportAPI();
  const [pixelsPerSecond, setPixelsPerSecond] = useState(100);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(
    transport.loop_enabled ?? false
  );
  const [loopStart, setLoopStart] = useState(transport.loop_start_seconds ?? 0);
  const [loopEnd, setLoopEnd] = useState(transport.loop_end_seconds ?? 10);
  const [isDraggingLoopStart, setIsDraggingLoopStart] = useState(false);
  const [isDraggingLoopEnd, setIsDraggingLoopEnd] = useState(false);

  // Calculate playhead position
  const playheadX = transport.time_seconds * pixelsPerSecond;
  const loopStartX = loopStart * pixelsPerSecond;
  const loopEndX = loopEnd * pixelsPerSecond;

  // Handle click-to-seek
  const handleTimelineClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingLoopStart || isDraggingLoopEnd) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekSeconds = clickX / pixelsPerSecond;
    await api.seek(seekSeconds);
  };

  // Toggle loop
  const handleToggleLoop = async () => {
    try {
      if (loopEnabled) {
        await fetch("http://localhost:8000/transport/loop/disable", {
          method: "POST",
        });
        setLoopEnabled(false);
      } else {
        await fetch(
          `http://localhost:8000/transport/loop?start=${loopStart}&end=${loopEnd}`,
          { method: "POST" }
        );
        setLoopEnabled(true);
      }
    } catch (err) {
      console.error("Failed to toggle loop:", err);
    }
  };

  // Update loop region
  const handleLoopUpdate = async (start: number, end: number) => {
    setLoopStart(start);
    setLoopEnd(end);
    try {
      await fetch(
        `http://localhost:8000/transport/loop?start=${start}&end=${end}&enabled=${loopEnabled}`,
        { method: "POST" }
      );
    } catch (err) {
      console.error("Failed to update loop:", err);
    }
  };

  // Handle loop start drag
  const handleLoopStartMouseDown = () => {
    setIsDraggingLoopStart(true);
  };

  const handleLoopEndMouseDown = () => {
    setIsDraggingLoopEnd(true);
  };

  // Global mouse up handler (would be added to document in real component)
  const handleMouseUp = () => {
    setIsDraggingLoopStart(false);
    setIsDraggingLoopEnd(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingLoopStart && !isDraggingLoopEnd) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const moveSeconds = moveX / pixelsPerSecond;

    if (isDraggingLoopStart && moveSeconds < loopEnd) {
      handleLoopUpdate(moveSeconds, loopEnd);
    } else if (isDraggingLoopEnd && moveSeconds > loopStart) {
      handleLoopUpdate(loopStart, moveSeconds);
    }
  };

  // Format time as MM:SS.mm
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      secs.toFixed(2)
    ).padStart(5, "0")}`;
  };

  // Generate beat markers
  const secondsPerBeat = 60 / transport.bpm;
  const beatMarkers = [];
  const maxTime = 300;

  for (let beat = 0; beat * secondsPerBeat < maxTime; beat++) {
    const beatTime = beat * secondsPerBeat;
    const isMeasure = beat % 4 === 0;
    beatMarkers.push({
      time: beatTime,
      x: beatTime * pixelsPerSecond,
      isMeasure,
    });
  }

  return (
    <div className="flex flex-col h-full bg-gray-950 border-b border-gray-700">
      {/* Header with info and controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700">
        {/* Left: Time and status */}
        <div className="flex items-center gap-4">
          <div className="font-mono text-sm text-gray-300">
            {formatTime(transport.time_seconds)}
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full transition ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
              title={connected ? "Synced with backend" : "Connection error"}
            />
            <span className="text-xs text-gray-500">
              {connected ? "Sync" : error ? error : "Offline"}
            </span>
          </div>

          <div className="text-xs text-gray-400">
            {transport.bpm.toFixed(1)} BPM
          </div>
        </div>

        {/* Center: Loop controls and zoom */}
        <div className="flex items-center gap-4">
          {/* Loop toggle button */}
          <button
            onClick={handleToggleLoop}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              loopEnabled
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            title={`${loopEnabled ? "Disable" : "Enable"} loop`}
          >
            🔁 Loop {loopEnabled ? "ON" : "OFF"}
          </button>

          {/* Loop range display */}
          {loopEnabled && (
            <div className="text-xs text-gray-400">
              {formatTime(loopStart)} - {formatTime(loopEnd)}
            </div>
          )}

          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400 whitespace-nowrap">
              Zoom:
            </label>
            <input
              type="range"
              min="50"
              max="400"
              step="10"
              value={pixelsPerSecond}
              onChange={(e) => setPixelsPerSecond(Number(e.target.value))}
              className="w-32 accent-blue-500"
            />
            <span className="text-xs text-gray-400 w-12 text-right">
              {pixelsPerSecond}
            </span>
          </div>
        </div>

        {/* Right: Time hover preview */}
        {hoveredTime !== null && (
          <div className="text-xs text-gray-400">{formatTime(hoveredTime)}</div>
        )}
      </div>

      {/* Timeline canvas */}
      <div
        className="flex-1 relative bg-gray-950 overflow-x-auto overflow-y-hidden cursor-pointer select-none"
        onClick={handleTimelineClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHoveredTime(null);
          setIsDraggingLoopStart(false);
          setIsDraggingLoopEnd(false);
        }}
      >
        {/* Ruler background with grid */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            width: `${Math.max(window.innerWidth, playheadX + 100)}px`,
            height: "100%",
          }}
        >
          {/* Beat markers */}
          {beatMarkers.map((marker) => (
            <g key={marker.time}>
              {marker.isMeasure && (
                <>
                  <line
                    x1={marker.x}
                    y1={0}
                    x2={marker.x}
                    y2={24}
                    stroke="#374151"
                    strokeWidth={2}
                  />
                  <text x={marker.x + 2} y={18} fontSize={10} fill="#6B7280">
                    {Math.floor(marker.time / 4)}
                  </text>
                </>
              )}
              {!marker.isMeasure && (
                <line
                  x1={marker.x}
                  y1={18}
                  x2={marker.x}
                  y2={24}
                  stroke="#4B5563"
                  strokeWidth={1}
                />
              )}
            </g>
          ))}
        </svg>

        {/* Loop region background (if enabled) */}
        {loopEnabled && (
          <div
            className="absolute top-0 bottom-0 bg-blue-500/10 border-x border-blue-500/50 pointer-events-none"
            style={{
              left: `${loopStartX}px`,
              width: `${loopEndX - loopStartX}px`,
            }}
          />
        )}

        {/* Loop start handle */}
        {loopEnabled && (
          <div
            onMouseDown={handleLoopStartMouseDown}
            className="absolute top-0 bottom-0 w-1 bg-blue-400 hover:bg-blue-300 cursor-col-resize z-20"
            style={{
              left: `${loopStartX}px`,
              transform: "translateX(-50%)",
            }}
            title={`Loop start: ${formatTime(loopStart)}`}
          />
        )}

        {/* Loop end handle */}
        {loopEnabled && (
          <div
            onMouseDown={handleLoopEndMouseDown}
            className="absolute top-0 bottom-0 w-1 bg-blue-400 hover:bg-blue-300 cursor-col-resize z-20"
            style={{
              left: `${loopEndX}px`,
              transform: "translateX(-50%)",
            }}
            title={`Loop end: ${formatTime(loopEnd)}`}
          />
        )}

        {/* Playhead */}
        <div
          style={{ transform: `translateX(${playheadX}px)` }}
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
        />

        {/* Playhead cap */}
        <div
          style={{ transform: `translateX(${playheadX - 6}px)` }}
          className="absolute top-0 w-3 h-6 bg-red-500 rounded-b pointer-events-none z-10"
        />
      </div>

      {/* Bottom info bar */}
      <div className="px-4 py-2 bg-gray-900 border-t border-gray-700 text-xs text-gray-500 flex justify-between">
        <div>
          Sample: {transport.sample_pos.toLocaleString()} | Beat:{" "}
          {transport.beat_pos.toFixed(2)}
        </div>
        <div>
          {loopEnabled
            ? `Loop: ${formatTime(loopStart)} → ${formatTime(loopEnd)}`
            : "Click timeline to seek"}
        </div>
      </div>
    </div>
  );
}
