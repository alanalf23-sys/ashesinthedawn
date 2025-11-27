import { useDAW } from '../contexts/DAWContext';
import { Volume2, Zap, Link2, GitBranch, Settings2, Droplet } from 'lucide-react';
import { useState } from 'react';

export default function TrackDetailsPanel() {
  const {
    selectedTrack,
    updateTrack,
    buses,
    addTrackToBus,
  } = useDAW();

  const [showBusOptions, setShowBusOptions] = useState(false);
  const [showSidechainOptions, setShowSidechainOptions] = useState(false);

  if (!selectedTrack) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Select a track to view advanced properties
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 text-xs">
      {/* Track Name */}
      <div>
        <label className="text-gray-400 font-semibold">Track Name</label>
        <input
          type="text"
          value={selectedTrack.name}
          onChange={(e) =>
            updateTrack(selectedTrack.id, { name: e.target.value })
          }
          className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Pan Control */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-gray-400 font-semibold flex items-center gap-2">
            <Volume2 className="w-3 h-3" />
            Pan
          </label>
          <span className="text-gray-300 font-mono bg-gray-800 px-2 py-0.5 rounded">
            {(selectedTrack.pan * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={selectedTrack.pan}
          onChange={(e) =>
            updateTrack(selectedTrack.id, { pan: parseFloat(e.target.value) })
          }
          className="w-full mt-2 accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>L</span>
          <span>C</span>
          <span>R</span>
        </div>
      </div>

      {/* Stereo Width Control */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-gray-400 font-semibold flex items-center gap-2">
            <Zap className="w-3 h-3" />
            Stereo Width
          </label>
          <span className="text-gray-300 font-mono bg-gray-800 px-2 py-0.5 rounded">
            {selectedTrack.stereoWidth}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="200"
          step="1"
          value={selectedTrack.stereoWidth}
          onChange={(e) =>
            updateTrack(selectedTrack.id, {
              stereoWidth: parseInt(e.target.value),
            })
          }
          className="w-full mt-2 accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Mono</span>
          <span>Normal</span>
          <span>Wide</span>
        </div>
      </div>

      {/* Phase Flip Toggle */}
      <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
        <label className="text-gray-400 font-semibold flex items-center gap-2">
          <Droplet className="w-3 h-3" />
          Phase Flip
        </label>
        <button
          onClick={() =>
            updateTrack(selectedTrack.id, {
              phaseFlip: !selectedTrack.phaseFlip,
            })
          }
          className={`px-3 py-1 rounded text-xs font-semibold transition ${
            selectedTrack.phaseFlip
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {selectedTrack.phaseFlip ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Input Gain */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-gray-400 font-semibold flex items-center gap-2">
            <Volume2 className="w-3 h-3" />
            Input Gain
          </label>
          <span className="text-gray-300 font-mono bg-gray-800 px-2 py-0.5 rounded">
            {selectedTrack.inputGain.toFixed(1)} dB
          </span>
        </div>
        <input
          type="range"
          min="-48"
          max="48"
          step="0.1"
          value={selectedTrack.inputGain}
          onChange={(e) =>
            updateTrack(selectedTrack.id, {
              inputGain: parseFloat(e.target.value),
            })
          }
          className="w-full mt-2 accent-blue-600 cursor-pointer"
        />
      </div>

      {/* Automation Mode */}
      <div>
        <label htmlFor="automation-mode" className="text-gray-400 font-semibold block mb-2 flex items-center gap-2">
          <Settings2 className="w-3 h-3" />
          Automation
        </label>
        <select
          id="automation-mode"
          name="automation-mode"
          value={selectedTrack.automationMode || 'off'}
          onChange={(e) =>
            updateTrack(selectedTrack.id, {
              automationMode: e.target.value as 'off' | 'read' | 'write' | 'touch' | 'latch',
            })
          }
          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:border-blue-500 focus:outline-none"
        >
          <option value="off">Off</option>
          <option value="read">Read</option>
          <option value="write">Write</option>
          <option value="touch">Touch</option>
          <option value="latch">Latch</option>
        </select>
      </div>

      {/* Bus Assignment */}
      <div>
        <label className="text-gray-400 font-semibold block mb-2 flex items-center gap-2">
          <GitBranch className="w-3 h-3" />
          Bus Routing
        </label>
        <div className="relative">
          <button
            onClick={() => setShowBusOptions(!showBusOptions)}
            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-left text-gray-300 hover:bg-gray-750 transition flex items-center justify-between"
          >
            <span>
              {selectedTrack.routing && selectedTrack.routing !== 'master'
                ? `Bus: ${selectedTrack.routing}`
                : 'Master'}
            </span>
          </button>
          {showBusOptions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded shadow-lg z-50">
              <button
                onClick={() => {
                  updateTrack(selectedTrack.id, { routing: 'master' });
                  setShowBusOptions(false);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-gray-800 text-gray-300"
              >
                Master
              </button>
              {buses.map((bus) => (
                <button
                  key={bus.id}
                  onClick={() => {
                    addTrackToBus(selectedTrack.id, bus.id);
                    updateTrack(selectedTrack.id, { routing: bus.id });
                    setShowBusOptions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-gray-800 text-gray-300"
                >
                  {bus.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidechain Configuration */}
      <div>
        <label className="text-gray-400 font-semibold block mb-2 flex items-center gap-2">
          <Link2 className="w-3 h-3" />
          Sidechain
        </label>
        <button
          onClick={() => setShowSidechainOptions(!showSidechainOptions)}
          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-left text-gray-300 hover:bg-gray-750 transition"
        >
          Create Sidechain
        </button>
        {showSidechainOptions && (
          <div className="mt-2 p-2 bg-gray-800 border border-gray-700 rounded space-y-2">
            <p className="text-gray-500">Route another track's output as sidechain input:</p>
            <div className="space-y-1">
              {/* This would show available tracks to use as sidechain sources */}
              <button
                className="w-full px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition"
              >
                Select Sidechain Source
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Track Duration */}
      {selectedTrack.duration !== undefined && (
        <div className="p-2 bg-gray-800 rounded">
          <div className="text-gray-400 text-xs">Duration</div>
          <div className="text-gray-200 font-mono">
            {selectedTrack.duration.toFixed(2)}s
          </div>
        </div>
      )}
    </div>
  );
}
