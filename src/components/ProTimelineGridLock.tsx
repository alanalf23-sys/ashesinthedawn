import { useState } from "react";
import { Lock, Unlock } from "lucide-react";

/**
 * 🎚️ Pro DAW Timeline with Tooltip Pulse Glow
 * - Tooltip above lock icon with subtle shimmer pulse
 * - Stays visible while hovered
 * - Professional DAW aesthetic
 */

export default function ProTimelineGridLock() {
  const [gridLocked, setGridLocked] = useState(false);
  const [lockedDivision, setLockedDivision] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Human-readable label for grid divisions
  const getDivisionLabel = (d: number) => {
    const map: Record<number, string> = {
      1: "1/1 Notes",
      0.5: "1/2 Notes",
      0.25: "1/4 Notes",
      0.125: "1/8 Notes",
      0.0625: "1/16 Notes",
      0.03125: "1/32 Notes",
    };
    return map[d] || "Free";
  };

  const division = lockedDivision || 0.125; // example default grid setting

  return (
    <div className="relative h-20 bg-gradient-to-b from-slate-900 via-slate-950 to-black border-b border-slate-800 select-none overflow-hidden rounded-lg shadow-2xl flex items-center justify-end pr-4">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 8px 1px rgba(56, 189, 248, 0.3);
          }
          50% {
            box-shadow: 0 0 12px 3px rgba(56, 189, 248, 0.5);
          }
        }

        .tooltip-pulse {
          animation: pulse-glow 0.8s ease-in-out infinite;
        }

        .tooltip-enter {
          animation: tooltip-in 0.3s ease-out forwards;
        }

        @keyframes tooltip-in {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(5px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .tooltip-exit {
          animation: tooltip-out 0.3s ease-out forwards;
        }

        @keyframes tooltip-out {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.9) translateY(5px);
          }
        }
      `}</style>

      <div
        className="relative flex items-center"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          onClick={() => {
            if (gridLocked) {
              setGridLocked(false);
              setLockedDivision(null);
            } else {
              setGridLocked(true);
              setLockedDivision(division);
            }
          }}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 transition-colors duration-200"
        >
          {gridLocked ? <Lock size={16} /> : <Unlock size={16} />}
          {gridLocked ? "Locked" : "Auto"}
        </button>

        {showTooltip && (
          <div
            className={`absolute bottom-6 right-0 bg-slate-900/95 text-cyan-200 text-[11px] px-3 py-1 rounded-md border border-cyan-500/40 backdrop-blur-md tooltip-pulse tooltip-enter whitespace-nowrap z-50`}
          >
            {gridLocked
              ? `Unlock grid for auto quantization`
              : `Lock grid to ${getDivisionLabel(division)}`}
            <div className="absolute bottom-[-6px] right-3 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-cyan-400/60"></div>
          </div>
        )}
      </div>
    </div>
  );
}
