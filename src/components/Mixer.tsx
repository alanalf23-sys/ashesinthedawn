import { useDAW } from '../contexts/DAWContext';

export default function Mixer() {
  const { selectedTrack, updateTrack, setTrackInputGain } = useDAW();

  if (!selectedTrack) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-xs">
        Select a track to edit
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-4 px-4 pt-3 border-b border-gray-700 text-xs">
        <button className="pb-2 border-b-2 border-blue-500 text-gray-100 font-semibold">
          Insert 1
        </button>
        <button className="pb-2 border-b-2 border-gray-700 text-gray-400 hover:text-gray-300">
          Insert 2
        </button>
        <button className="pb-2 border-b-2 border-gray-700 text-gray-400 hover:text-gray-300">
          Send
        </button>
        <button className="pb-2 border-b-2 border-gray-700 text-gray-400 hover:text-gray-300">
          Master
        </button>
      </div>

      {/* Mixer Controls */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-6 min-w-max">
          {/* Input Gain */}
          <div className="flex flex-col items-center gap-2 min-w-32">
            <label className="text-xs font-semibold text-gray-400">Input Gain</label>
            <input
              type="range"
              min="-60"
              max="12"
              value={selectedTrack.inputGain || 0}
              onChange={(e) => setTrackInputGain(selectedTrack.id, parseFloat(e.target.value))}
              className="w-24 h-6 accent-blue-500"
            />
            <span className="text-xs text-gray-300 font-mono">
              {selectedTrack.inputGain || 0}dB
            </span>
          </div>

          {/* Volume/Fader */}
          <div className="flex flex-col items-center gap-2 min-w-32">
            <label className="text-xs font-semibold text-gray-400">Volume</label>
            <input
              type="range"
              min="-60"
              max="12"
              value={selectedTrack.volume || 0}
              onChange={(e) =>
                updateTrack(selectedTrack.id, { volume: parseFloat(e.target.value) })
              }
              className="w-24 h-6 accent-blue-500"
            />
            <span className="text-xs text-gray-300 font-mono">
              {selectedTrack.volume || 0}dB
            </span>
          </div>

          {/* Pan */}
          <div className="flex flex-col items-center gap-2 min-w-32">
            <label className="text-xs font-semibold text-gray-400">Pan</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={selectedTrack.pan || 0}
              onChange={(e) =>
                updateTrack(selectedTrack.id, { pan: parseFloat(e.target.value) })
              }
              className="w-24 h-6 accent-blue-500"
            />
            <span className="text-xs text-gray-300 font-mono">
              {selectedTrack.pan === 0 ? 'C' : selectedTrack.pan! < 0 ? 'L' : 'R'}
            </span>
          </div>

          {/* Stereo Width */}
          <div className="flex flex-col items-center gap-2 min-w-32">
            <label className="text-xs font-semibold text-gray-400">Width</label>
            <input
              type="range"
              min="0"
              max="200"
              value={selectedTrack.stereoWidth || 100}
              onChange={(e) =>
                updateTrack(selectedTrack.id, { stereoWidth: parseFloat(e.target.value) })
              }
              className="w-24 h-6 accent-blue-500"
            />
            <span className="text-xs text-gray-300 font-mono">
              {selectedTrack.stereoWidth || 100}%
            </span>
          </div>

          {/* Mute/Solo/Record Buttons */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-semibold text-gray-400">Controls</label>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  updateTrack(selectedTrack.id, { muted: !selectedTrack.muted })
                }
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  selectedTrack.muted
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                M
              </button>
              <button
                onClick={() =>
                  updateTrack(selectedTrack.id, { soloed: !selectedTrack.soloed })
                }
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  selectedTrack.soloed
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                S
              </button>
              <button
                onClick={() =>
                  updateTrack(selectedTrack.id, { armed: !selectedTrack.armed })
                }
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  selectedTrack.armed
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                R
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
