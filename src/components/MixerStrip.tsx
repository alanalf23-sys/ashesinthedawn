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
    <div className="flex flex-col items-center bg-gray-800 hover:bg-gray-750 rounded-lg shadow-lg hover:shadow-lg hover:shadow-blue-500/20 p-3 w-20 transition-all duration-200 group cursor-pointer hover:scale-105 transform">
      {/* Label */}
      <p className="text-xs font-semibold text-gray-400 group-hover:text-blue-400 mb-2 text-center truncate w-full transition-colors duration-200 animate-fade-in">
        {name}
      </p>

      {/* Meter bar */}
      <div className="relative w-2 h-40 bg-gray-950 rounded overflow-hidden mb-2 border border-gray-700 group-hover:border-blue-600 shadow-inner group-hover:shadow-inner group-hover:shadow-blue-500/30 transition-all duration-200">
        <div
          className="absolute bottom-0 w-full bg-blue-600 group-hover:bg-blue-500 transition-all duration-100 ease-linear animate-level-update"
          style={{
            height: `${displayLevel * 100}%`,
            boxShadow: `0 0 ${Math.min(
              displayLevel * 20,
              15
            )}px rgba(37, 99, 235, ${0.6 + (displayLevel > 0.7 ? 0.2 : 0)})`,
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
        className="w-full accent-blue-600 cursor-pointer transition-all duration-200 group-hover:accent-blue-500 animate-fader-drag"
        title={`${name}: ${(displayLevel * 100).toFixed(0)}%`}
      />
    </div>
  );
}
