import { useState } from "react";

/**
 * SimpleLoopControl - Basic loop on/off with preset regions
 *
 * Features:
 * - Toggle loop on/off
 * - Set common loop regions (8 bars, 16 bars, 32 bars)
 * - Display current loop region
 * - Compact UI
 */
export default function SimpleLoopControl() {
  const [looping, setLooping] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(8); // 8 bars by default

  const BPM = 120;
  const secondsPerBeat = 60 / BPM;
  const secondsPerBar = secondsPerBeat * 4;

  // Common loop presets (in bars)
  const presets = [
    { label: "8 bars", bars: 8 },
    { label: "16 bars", bars: 16 },
    { label: "32 bars", bars: 32 },
  ];

  const handleToggleLoop = async () => {
    try {
      if (looping) {
        // Disable loop
        await fetch("http://localhost:8000/transport/loop/disable", {
          method: "POST",
        });
        setLooping(false);
      } else {
        // Enable loop
        await fetch(
          `http://localhost:8000/transport/loop?start=${loopStart}&end=${loopEnd}&enabled=true`,
          { method: "POST" }
        );
        setLooping(true);
      }
    } catch (err) {
      console.error("Failed to toggle loop:", err);
    }
  };

  const handlePreset = async (bars: number) => {
    const start = 0;
    const end = bars * secondsPerBar;
    setLoopStart(start);
    setLoopEnd(end);

    try {
      await fetch(
        `http://localhost:8000/transport/loop?start=${start}&end=${end}&enabled=${looping}`,
        { method: "POST" }
      );
    } catch (err) {
      console.error("Failed to set loop preset:", err);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s.toFixed(1)).padStart(
      4,
      "0"
    )}`;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border border-gray-700 rounded">
      {/* Loop toggle button */}
      <button
        onClick={handleToggleLoop}
        className={`px-3 py-1.5 rounded text-sm font-medium transition ${
          looping
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`}
      >
        🔁 {looping ? "ON" : "OFF"}
      </button>

      {/* Loop region display */}
      <div className="text-xs text-gray-400 font-mono">
        {formatTime(loopStart)} → {formatTime(loopEnd)}
      </div>

      {/* Preset buttons */}
      <div className="flex gap-1 border-l border-gray-700 pl-2">
        {presets.map((preset) => (
          <button
            key={preset.bars}
            onClick={() => handlePreset(preset.bars)}
            className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition"
            title={`Set loop to ${preset.label}`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
