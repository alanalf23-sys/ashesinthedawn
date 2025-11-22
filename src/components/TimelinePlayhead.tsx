import { useState } from "react";
import { useTransportClock, useTransportAPI } from "../hooks/useTransportClock";

export default function TimelinePlayhead() {
  const { state: transport, connected, error } = useTransportClock();
  const api = useTransportAPI();
  const [pixelsPerSecond, setPixelsPerSecond] = useState(100);

  // Calculate playhead position
  const playheadX = transport.time_seconds * pixelsPerSecond;

  return (
    <div className="flex flex-col h-full">
      {/* Timeline header with ruler */}
      <div className="bg-gray-950 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-400">
            {formatTime(transport.time_seconds)} / {transport.bpm.toFixed(1)}{" "}
            BPM
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
              title={connected ? "Connected" : "Disconnected"}
            />
            <span className="text-xs text-gray-500">
              {connected ? "Sync" : error || "Offline"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Zoom:</label>
          <input
            type="range"
            min="50"
            max="400"
            step="10"
            value={pixelsPerSecond}
            onChange={(e) => setPixelsPerSecond(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-gray-400 w-8">{pixelsPerSecond}%</span>
        </div>
      </div>

      {/* Timeline canvas */}
      <div className="flex-1 relative bg-gray-900 overflow-x-auto overflow-y-hidden border-r border-gray-700">
        {/* Ruler marks */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gray-950 border-b border-gray-700 flex">
          {renderRulerMarks(pixelsPerSecond)}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-8 bottom-0 w-px bg-blue-500 pointer-events-none shadow-lg"
          style={{ left: `${playheadX}px` }}
        >
          {/* Playhead indicator dot */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full" />
        </div>

        {/* Beat subdivision marks */}
        <div className="absolute top-8 left-0 right-0 bottom-0">
          {renderBeatMarks(transport.bpm, pixelsPerSecond)}
        </div>

        {/* Click area for seeking */}
        <div
          className="absolute top-8 left-0 right-0 bottom-0 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={(e) => {
            const rect = (
              e.currentTarget as HTMLDivElement
            ).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const timeSeconds = x / pixelsPerSecond;
            api.seek(timeSeconds);
          }}
        />
      </div>

      {/* Transport controls */}
      <div className="bg-gray-950 border-t border-gray-700 px-4 py-2 flex gap-2">
        <button
          onClick={() => api.play()}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          ▶️ Play
        </button>
        <button
          onClick={() => api.pause()}
          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
        >
          ⏸️ Pause
        </button>
        <button
          onClick={() => api.stop()}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
        >
          ⏹️ Stop
        </button>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-gray-400">Tempo:</label>
          <input
            type="number"
            min="30"
            max="300"
            step="1"
            defaultValue={transport.bpm}
            onChange={(e) => api.setTempo(Number(e.target.value))}
            className="w-12 px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs rounded"
          />
          <span className="text-xs text-gray-400">BPM</span>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

function renderRulerMarks(pixelsPerSecond: number) {
  const marks = [];
  const interval = pixelsPerSecond > 200 ? 1 : pixelsPerSecond > 100 ? 5 : 10;

  for (let i = 0; i < 1000; i += interval) {
    const x = i * pixelsPerSecond;
    marks.push(
      <div
        key={i}
        className="absolute text-xs text-gray-500 font-mono"
        style={{ left: `${x}px`, paddingLeft: "4px" }}
      >
        {i}s
      </div>
    );
  }

  return marks;
}

function renderBeatMarks(bpm: number, pixelsPerSecond: number) {
  const beatsPerSecond = bpm / 60;
  const beatWidth = pixelsPerSecond / beatsPerSecond;
  const marks = [];

  for (let i = 0; i < 1000; i++) {
    const x = i * beatWidth;
    const isBigBeat = i % 4 === 0;

    marks.push(
      <div
        key={`beat-${i}`}
        className={`absolute bg-gray-700 ${
          isBigBeat ? "w-px h-4" : "w-px h-2"
        }`}
        style={{
          left: `${x}px`,
          top: isBigBeat ? "0px" : "6px",
        }}
      />
    );
  }

  return marks;
}
