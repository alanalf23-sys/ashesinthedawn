import MixerStrip from "./MixerStrip";

interface MixerViewProps {
  tracks?: string[];
  onLevelChange?: (trackName: string, level: number) => void;
}

/**
 * MixerView - Grid layout for multiple mixer strips
 *
 * Features:
 * - Displays multiple channel strips in a row
 * - Responsive layout with consistent spacing
 * - Professional mixer aesthetics
 */
export default function MixerView({
  tracks = ["Master", "Track 1", "Track 2", "Track 3", "Track 4"],
  onLevelChange,
}: MixerViewProps) {
  const handleLevelChange = (trackName: string, level: number) => {
    onLevelChange?.(trackName, level);
  };

  return (
    <div className="flex gap-3 p-4 bg-slate-950 hover:bg-slate-900 rounded-md shadow-sm hover:shadow-md hover:shadow-cyan-500/10 border border-slate-800 hover:border-cyan-600/50 overflow-x-auto transition-all duration-300">
      {tracks.map((trackName) => (
        <MixerStrip
          key={trackName}
          name={trackName}
          level={trackName === "Master" ? 0.8 : 0.6}
          onLevelChange={(level) => handleLevelChange(trackName, level)}
        />
      ))}
    </div>
  );
}
