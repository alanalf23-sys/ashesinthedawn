import { useState } from "react";
import { useTransportClock, useTransportAPI } from "../hooks/useTransportClock";

/**
 * TimelinePlayheadWebSocket - Real-time playhead synchronized with Python backend
 *
 * Features:
 * - Smooth 30 Hz playhead animation from WebSocket
 * - Zoom controls (50% - 400%)
 * - Time display and sync status
 * - Click-to-seek functionality
 * - Real-time BPM display
 * - Ruler with beat markers
 */
export default function TimelinePlayheadWebSocket() {
  const { state: transport, connected, error } = useTransportClock();
  const api = useTransportAPI();
  const [pixelsPerSecond, setPixelsPerSecond] = useState(100);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);

  // Calculate playhead position
  const playheadX = transport.time_seconds * pixelsPerSecond;

  // Handle click-to-seek
  const handleTimelineClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekSeconds = clickX / pixelsPerSecond;
    await api.seek(seekSeconds);
  };

  // Handle mouse hover for time preview
  const handleTimelineHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    setHoveredTime(hoverX / pixelsPerSecond);
  };

  // Format time as MM:SS.mm
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      secs.toFixed(2)
    ).padStart(5, "0")}`;
  };

  // Generate beat markers (every beat)
  const secondsPerBeat = 60 / transport.bpm;
  const beatMarkers = [];
  const maxTime = 300; // Show up to 5 minutes

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

        {/* Center: Zoom slider */}
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
            title={`${pixelsPerSecond} px/sec`}
          />
          <span className="text-xs text-gray-400 w-12 text-right">
            {pixelsPerSecond}
          </span>
        </div>

        {/* Right: Time hover preview */}
        {hoveredTime !== null && (
          <div className="text-xs text-gray-400">{formatTime(hoveredTime)}</div>
        )}
      </div>

      {/* Timeline canvas */}
      <div
        className="flex-1 relative bg-gray-950 overflow-x-auto overflow-y-hidden cursor-pointer"
        onClick={handleTimelineClick}
        onMouseMove={handleTimelineHover}
        onMouseLeave={() => setHoveredTime(null)}
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
              {/* Measure line (every 4 beats) */}
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
              {/* Beat line */}
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

        {/* Playhead */}
        <div
          style={{ transform: `translateX(${playheadX}px)` }}
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none transition-transform duration-50 ease-linear"
        />

        {/* Playhead cap */}
        <div
          style={{ transform: `translateX(${playheadX - 6}px)` }}
          className="absolute top-0 w-3 h-6 bg-red-500 rounded-b pointer-events-none z-10 transition-transform duration-50 ease-linear"
        />
      </div>

      {/* Bottom info bar */}
      <div className="px-4 py-2 bg-gray-900 border-t border-gray-700 text-xs text-gray-500 flex justify-between">
        <div>
          Sample: {transport.sample_pos.toLocaleString()} | Beat:{" "}
          {transport.beat_pos.toFixed(2)}
        </div>
        <div>Click timeline to seek | Scroll to zoom</div>
      </div>
    </div>
  );
}
