import { useState } from "react";
import { Trash2, Plus, Lock, Unlock, Flag } from "lucide-react";
import { useDAW } from "../contexts/DAWContext";

export default function MarkerPanel() {
  const { markers, currentTime, addMarker, deleteMarker, updateMarker, seek } =
    useDAW();
  const [markerName, setMarkerName] = useState("");

  const handleAddMarker = () => {
    const name = markerName.trim() || `Marker ${markers.length + 1}`;
    addMarker(currentTime, name);
    setMarkerName("");
  };

  const handleMarkerClick = (markerTime: number) => {
    seek(markerTime);
  };

  const handleToggleLock = (markerId: string, locked: boolean) => {
    updateMarker(markerId, { locked: !locked });
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-3 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Flag className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-200">Markers</h3>
      </div>

      {/* Add new marker */}
      <div className="flex gap-2">
        <input
          id="marker-name-input"
          name="marker-name"
          type="text"
          value={markerName}
          onChange={(e) => setMarkerName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddMarker()}
          placeholder="Marker name..."
          autoComplete="off"
          className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-500"
        />
        <button
          onClick={handleAddMarker}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1 flex items-center gap-1 text-xs"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      {/* Markers list */}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {markers.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No markers yet</p>
        ) : (
          markers.map((marker) => (
            <div
              key={marker.id}
              className="flex items-center gap-2 bg-gray-800 p-2 rounded text-xs hover:bg-gray-750 group"
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: marker.color }}
              />
              <button
                onClick={() => handleMarkerClick(marker.time)}
                className="flex-1 text-left text-gray-300 hover:text-blue-400 truncate"
              >
                <span className="font-medium">{marker.name}</span>
                <span className="text-gray-500 ml-2">
                  {marker.time.toFixed(2)}s
                </span>
              </button>
              <button
                onClick={() => handleToggleLock(marker.id, marker.locked)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-yellow-400"
              >
                {marker.locked ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Unlock className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => deleteMarker(marker.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
