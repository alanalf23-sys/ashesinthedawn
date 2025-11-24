import { Repeat2, X } from "lucide-react";
import { useDAW } from "../contexts/DAWContext";

export default function LoopControl() {
  const {
    loopRegion,
    currentTime,
    setLoopRegion,
    toggleLoop,
    clearLoopRegion,
  } = useDAW();

  const handleSetStart = () => {
    setLoopRegion(
      currentTime,
      loopRegion.endTime === 0 ? currentTime + 5 : loopRegion.endTime
    );
  };

  const handleSetEnd = () => {
    setLoopRegion(
      loopRegion.startTime === 0 ? currentTime - 5 : loopRegion.startTime,
      currentTime
    );
  };

  const loopDuration = loopRegion.endTime - loopRegion.startTime;
  const loopIsValid = loopDuration > 0;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-3 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Repeat2 className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-gray-200">Loop</h3>
      </div>

      {/* Loop status */}
      <div className="flex items-center gap-2 bg-gray-800 p-2 rounded text-xs">
        <input
          type="checkbox"
          checked={loopRegion.enabled && loopIsValid}
          onChange={toggleLoop}
          disabled={!loopIsValid}
          className="w-3 h-3 cursor-pointer"
        />
        <span className="text-gray-400">
          {loopIsValid
            ? `${loopRegion.startTime.toFixed(
                2
              )}s - ${loopRegion.endTime.toFixed(2)}s (${loopDuration.toFixed(
                2
              )}s)`
            : "Set loop points"}
        </span>
      </div>

      {/* Loop controls */}
      <div className="flex gap-2">
        <button
          onClick={handleSetStart}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1 text-xs font-medium"
        >
          Set Start
        </button>
        <button
          onClick={handleSetEnd}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1 text-xs font-medium"
        >
          Set End
        </button>
        <button
          onClick={clearLoopRegion}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded px-2 py-1"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Loop info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Start: {loopRegion.startTime.toFixed(2)}s</div>
        <div>End: {loopRegion.endTime.toFixed(2)}s</div>
        <div>Duration: {loopDuration.toFixed(2)}s</div>
      </div>
    </div>
  );
}
