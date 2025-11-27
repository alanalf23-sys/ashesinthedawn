// Phase 3: Metronome component
import { Music2, Volume2 } from "lucide-react";
import { useDAW } from "../contexts/DAWContext";

export default function MetronomeControl() {
  const {
    metronomeSettings,
    toggleMetronome,
    setMetronomeVolume,
    setMetronomeBeatSound,
  } = useDAW();

  const beatSounds: Array<typeof metronomeSettings.beatSound> = [
    "click",
    "cowbell",
    "woodblock",
  ];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-3 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Music2 className="w-4 h-4 text-green-400" />
        <h3 className="text-sm font-semibold text-gray-200">Metronome</h3>
      </div>

      {/* Metronome enable toggle */}
      <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
        <input
          id="metronome-toggle"
          name="metronome-enabled"
          type="checkbox"
          checked={metronomeSettings.enabled}
          onChange={toggleMetronome}
          className="w-4 h-4 cursor-pointer"
        />
        <label htmlFor="metronome-toggle" className="text-sm text-gray-300">
          {metronomeSettings.enabled ? "Enabled" : "Disabled"}
        </label>
      </div>

      {/* Volume control */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <label htmlFor="metronome-volume" className="text-xs text-gray-400">Volume</label>
          <span className="ml-auto text-xs text-gray-500">
            {Math.round(metronomeSettings.volume * 100)}%
          </span>
        </div>
        <input
          id="metronome-volume"
          name="metronome-volume"
          type="range"
          min="0"
          max="100"
          value={metronomeSettings.volume * 100}
          onChange={(e) => setMetronomeVolume(parseFloat(e.target.value) / 100)}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Beat sound selector */}
      <div className="space-y-2">
        <label htmlFor="beat-sound-selector" className="text-xs text-gray-400">Beat Sound</label>
        <div className="flex gap-1">
          {beatSounds.map((sound) => (
            <button
              key={sound}
              onClick={() => setMetronomeBeatSound(sound)}
              className={`flex-1 text-xs py-1 px-2 rounded capitalize transition-colors ${
                metronomeSettings.beatSound === sound
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {sound}
            </button>
          ))}
        </div>
      </div>

      {/* Accent first beat toggle */}
      <div className="flex items-center gap-2 bg-gray-800 p-2 rounded text-xs">
        <input
          id="accent-first-beat"
          name="accent-first"
          type="checkbox"
          checked={metronomeSettings.accentFirst}
          onChange={(e) => {
            // This would need to be added to context
            console.log("Toggle accent first:", e.target.checked);
          }}
          className="w-3 h-3 cursor-pointer"
        />
        <label htmlFor="accent-first-beat" className="text-gray-300">Accent first beat</label>
      </div>
    </div>
  );
}
