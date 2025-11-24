import { useState, useEffect } from 'react';
import { Zap, MoreVertical, ChevronDown } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

interface MIDIInputDevice {
  id: string;
  name: string;
  kind: string;
}

export default function MIDISettings() {
  const { createMIDIRoute, deleteMIDIRoute, getMIDIRoutesForTrack, selectedTrack } = useDAW();
  const [availableInputs, setAvailableInputs] = useState<MIDIInputDevice[]>([]);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, enumerate MIDI input devices
    // For now, show placeholder devices
    setAvailableInputs([
      { id: 'midi-in-1', name: 'USB MIDI Controller', kind: 'input' },
      { id: 'midi-in-2', name: 'Keyboard', kind: 'input' },
      { id: 'midi-in-3', name: 'Drum Machine', kind: 'input' },
    ]);
  }, []);

  const trackRoutes = selectedTrack ? getMIDIRoutesForTrack(selectedTrack.id) : [];

  const handleAddRoute = (deviceId: string) => {
    if (!selectedTrack) {
      alert('Please select a track first');
      return;
    }

    const device = availableInputs.find(d => d.id === deviceId);
    if (device) {
      createMIDIRoute(device.id, selectedTrack.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <h2 className="text-sm font-semibold text-gray-100">MIDI Settings</h2>
        </div>
        <p className="text-xs text-gray-500">Configure MIDI input routing</p>
      </div>

      {/* Selected Track */}
      {selectedTrack ? (
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Current Track</p>
          <p className="text-sm font-medium text-gray-100">{selectedTrack.name}</p>
        </div>
      ) : (
        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <p className="text-xs text-gray-500">Select a track to configure MIDI</p>
        </div>
      )}

      {/* Available Devices */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs font-semibold text-gray-400 mb-3">Available Inputs</p>
        <div className="space-y-2">
          {availableInputs.map(device => (
            <div key={device.id} className="bg-gray-800 rounded border border-gray-700 p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-300">{device.name}</span>
                <span className="text-xs text-green-500">● Connected</span>
              </div>
              <button
                onClick={() => handleAddRoute(device.id)}
                disabled={!selectedTrack}
                className="w-full px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs rounded font-medium transition-colors"
              >
                Route to Track
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Active Routes */}
      {trackRoutes.length > 0 && (
        <div className="border-t border-gray-700 bg-gray-800 p-4">
          <p className="text-xs font-semibold text-gray-400 mb-3">Active Routes</p>
          <div className="space-y-2">
            {trackRoutes.map(route => (
              <div key={route.id} className="bg-gray-900 rounded border border-gray-600 p-2">
                <button
                  onClick={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={`w-3 h-3 text-gray-500 transition-transform ${
                        expandedRoute === route.id ? 'rotate-180' : ''
                      }`}
                    />
                    <span className="text-xs text-gray-300">{route.sourceDeviceId}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMIDIRoute(route.id);
                    }}
                    className="p-1 hover:bg-red-600/20 rounded transition-colors"
                  >
                    <MoreVertical className="w-3 h-3 text-red-400" />
                  </button>
                </button>

                {expandedRoute === route.id && (
                  <div className="mt-2 pt-2 border-t border-gray-700 space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Channel</p>
                      <select
                        value={route.channel}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300"
                      >
                        {Array.from({ length: 16 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Channel {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
