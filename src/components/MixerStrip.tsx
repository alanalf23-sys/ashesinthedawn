import { useState } from "react";

interface MixerStripProps {
  name: string;
  level?: number;
  onLevelChange?: (level: number) => void;
}

/**
 * MixerStrip - Compact mixer channel strip with animated level metering
 *
 * Features:
 * - Minimal, clean design
 * - Vertical level meter
 * - Range slider for level control
 * - Smooth transitions
 */
export default function MixerStrip({
  name,
  level = 0.7,
  onLevelChange,
}: MixerStripProps) {
  const [displayLevel, setDisplayLevel] = useState(level);

  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLevel = parseFloat(e.target.value);
    setDisplayLevel(newLevel);
    onLevelChange?.(newLevel);
  };

  return (
    <div className="flex flex-col items-center bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm hover:shadow-md hover:shadow-cyan-500/20 p-3 w-20 transition-all duration-200 group cursor-pointer hover:scale-105 transform">
      {/* Label */}
      <p className="text-xs font-semibold text-slate-400 group-hover:text-cyan-400 mb-2 text-center truncate w-full transition-colors duration-200 animate-fade-in">
        {name}
      </p>

      {/* Meter bar */}
      <div className="relative w-2 h-40 bg-slate-950 rounded overflow-hidden mb-2 border border-slate-700 group-hover:border-cyan-600 shadow-inner group-hover:shadow-inner group-hover:shadow-cyan-500/30 transition-all duration-200">
        <div
          className="absolute bottom-0 w-full bg-cyan-600 group-hover:bg-cyan-500 transition-all duration-100 ease-linear animate-level-update"
          style={{
            height: `${displayLevel * 100}%`,
            boxShadow: `0 0 ${Math.min(
              displayLevel * 20,
              15
            )}px rgba(6, 182, 212, ${0.6 + (displayLevel > 0.7 ? 0.2 : 0)})`,
          }}
        />
      </div>

      {/* Fader */}
      <label htmlFor={`mixer-fader-${name}`} className="sr-only">Fader for {name}</label>
      <input
        id={`mixer-fader-${name}`}
        name={`fader-${name}`}
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={displayLevel}
        onChange={handleLevelChange}
        className="w-full accent-cyan-600 cursor-pointer transition-all duration-200 group-hover:accent-cyan-500 animate-fader-drag"
        title={`${name}: ${(displayLevel * 100).toFixed(0)}%`}
      />
    </div>
  );
}
