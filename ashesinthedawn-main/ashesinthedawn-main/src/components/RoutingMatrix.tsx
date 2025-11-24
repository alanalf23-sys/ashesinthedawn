import { useState } from 'react';
import { GitBranch, Plus, Trash2, Volume2 } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

export default function RoutingMatrix() {
  const { buses, selectedTrack, createBus, deleteBus, addTrackToBus, removeTrackFromBus, createSidechain } = useDAW();
  const [newBusName, setNewBusName] = useState('');
  const [showNewBusForm, setShowNewBusForm] = useState(false);
  const [expandedBus, setExpandedBus] = useState<string | null>(null);

  const handleCreateBus = () => {
    if (newBusName.trim()) {
      createBus(newBusName);
      setNewBusName('');
      setShowNewBusForm(false);
    }
  };

  const handleAddTrackToBus = (busId: string) => {
    if (selectedTrack) {
      addTrackToBus(selectedTrack.id, busId);
    }
  };

  const handleCreateSidechain = (busId: string) => {
    if (selectedTrack) {
      createSidechain(selectedTrack.id, busId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-4 h-4 text-green-500" />
          <h2 className="text-sm font-semibold text-gray-100">Routing Matrix</h2>
        </div>
        <p className="text-xs text-gray-500">Manage buses and routing</p>
      </div>

      {/* Selected Track Info */}
      {selectedTrack ? (
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Current Track</p>
          <p className="text-sm font-medium text-gray-100">{selectedTrack.name}</p>
        </div>
      ) : (
        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <p className="text-xs text-gray-500">Select a track to route</p>
        </div>
      )}

      {/* Buses List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {buses.map(bus => (
          <div key={bus.id} className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
            {/* Bus Header */}
            <button
              onClick={() => setExpandedBus(expandedBus === bus.id ? null : bus.id)}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-750 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: bus.color }}
                />
                <span className="text-sm font-medium text-gray-100">{bus.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBus(bus.id);
                  }}
                  className="p-1 hover:bg-red-600/20 rounded"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </button>

            {/* Bus Details */}
            {expandedBus === bus.id && (
              <div className="bg-gray-900 border-t border-gray-700 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Tracks: {bus.trackIds.length}</span>
                  <button
                    onClick={() => handleAddTrackToBus(bus.id)}
                    disabled={!selectedTrack}
                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded text-white transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>

                {/* Volume Control */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Volume</label>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    defaultValue={bus.volume}
                    className="w-full"
                  />
                </div>

                {/* Sidechain Options */}
                <div className="pt-2 border-t border-gray-700">
                  <button
                    onClick={() => handleCreateSidechain(bus.id)}
                    disabled={!selectedTrack}
                    className="w-full px-2 py-1.5 text-xs bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 text-purple-300 rounded border border-purple-500/50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    Create Sidechain
                  </button>
                </div>

                {/* Tracks in Bus */}
                {bus.trackIds.length > 0 && (
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-1">Routed Tracks</p>
                    <div className="space-y-1">
                      {bus.trackIds.map((trackId: string) => (
                        <div key={trackId} className="flex items-center justify-between bg-gray-800 p-1 rounded">
                          <span className="text-xs text-gray-300 truncate">{trackId}</span>
                          <button
                            onClick={() => removeTrackFromBus(trackId, bus.id)}
                            className="p-0.5 hover:bg-red-600/20 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Bus Button */}
      <div className="border-t border-gray-700 bg-gray-800 p-3">
        {!showNewBusForm ? (
          <button
            onClick={() => setShowNewBusForm(true)}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Bus
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Bus name..."
              value={newBusName}
              onChange={(e) => setNewBusName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBus()}
              className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-500"
              autoFocus
            />
            <div className="flex gap-1">
              <button
                onClick={handleCreateBus}
                className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewBusForm(false)}
                className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
