import { Volume2, Maximize2 } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

export default function Mixer() {
  const { tracks, updateTrack } = useDAW();

  const getPanLabel = (pan: number) => {
    if (pan < -0.1) return `L${Math.abs(Math.round(pan * 100))}`;
    if (pan > 0.1) return `R${Math.round(pan * 100)}`;
    return 'C';
  };

  return (
    <div className="h-80 bg-gradient-to-b from-gray-900 to-gray-950 border-t border-gray-700 overflow-x-auto">
      <div className="flex h-full p-4 space-x-3">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="w-28 flex flex-col bg-gray-800 rounded-lg p-2 border border-gray-700 space-y-2"
          >
            {/* Plugin Slots (placeholder) */}
            <div className="flex space-x-1">
              <button className="flex-1 h-6 bg-gray-900 border border-gray-600 rounded hover:border-gray-500 text-xs text-gray-500 flex items-center justify-center" title="Insert Slot 1">
                [+]
              </button>
              <button className="flex-1 h-6 bg-gray-900 border border-gray-600 rounded hover:border-gray-500 text-xs text-gray-500 flex items-center justify-center" title="Insert Slot 2">
                [+]
              </button>
            </div>

            {/* Metering */}
            <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" style={{ width: '45%' }} />
            </div>

            {/* Volume Fader */}
            <div className="flex-1 flex flex-col items-center space-y-1">
              <input
                type="range"
                min="-60"
                max="12"
                value={track.volume}
                onChange={(e) => updateTrack(track.id, { volume: parseFloat(e.target.value) })}
                orient="vertical"
                className="flex-1 slider-vertical"
                title={`Volume: ${track.volume}dB`}
              />
              <div className="text-xs text-center text-gray-300 font-mono w-full">
                {track.volume > 0 ? '+' : ''}{track.volume.toFixed(1)}dB
              </div>
            </div>

            {/* Pan Fader */}
            <div className="space-y-1">
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={track.pan}
                onChange={(e) => updateTrack(track.id, { pan: parseFloat(e.target.value) })}
                className="w-full"
                title={`Pan: ${getPanLabel(track.pan)}`}
              />
              <div className="text-xs text-center text-gray-400">
                Pan: {getPanLabel(track.pan)}
              </div>
            </div>

            {/* Stereo Width */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={track.stereoWidth || 100}
                onChange={(e) => updateTrack(track.id, { stereoWidth: parseFloat(e.target.value) })}
                className="w-full"
                title={`Stereo Width: ${(track.stereoWidth || 100).toFixed(0)}%`}
              />
              <div className="text-xs text-center text-gray-400">
                <Maximize2 className="w-3 h-3 inline mr-1" /> {(track.stereoWidth || 100).toFixed(0)}%
              </div>
            </div>

            {/* Automation Mode */}
            <div className="space-y-1">
              <select
                value={track.automationMode || 'off'}
                onChange={(e) => updateTrack(track.id, { automationMode: e.target.value as any })}
                className="w-full bg-gray-900 border border-gray-600 rounded text-xs text-gray-300 p-1 hover:border-gray-500"
              >
                <option value="off">Off</option>
                <option value="read">Read</option>
                <option value="write">Write</option>
                <option value="touch">Touch</option>
                <option value="latch">Latch</option>
              </select>
              <div className="text-xs text-center text-gray-500">Automation</div>
            </div>

            {/* Control Buttons */}
            <div className="space-y-1">
              <div className="flex justify-center space-x-1">
                {/* Phase Flip */}
                <button
                  onClick={() => updateTrack(track.id, { phaseFlip: !track.phaseFlip })}
                  className={`px-2 py-1 text-xs rounded flex-1 font-mono ${
                    track.phaseFlip ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                  title="Phase Flip"
                >
                  Φ
                </button>
                <button
                  onClick={() => updateTrack(track.id, { muted: !track.muted })}
                  className={`px-2 py-1 text-xs rounded flex-1 ${
                    track.muted ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                  title="Mute"
                >
                  M
                </button>
                <button
                  onClick={() => updateTrack(track.id, { soloed: !track.soloed })}
                  className={`px-2 py-1 text-xs rounded flex-1 ${
                    track.soloed ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                  title="Solo"
                >
                  S
                </button>
              </div>

              {/* Track Label */}
              <div className="text-xs text-center text-white truncate font-medium" title={track.name}>
                {track.name.length > 12 ? track.name.substring(0, 10) + '..' : track.name}
              </div>

              {/* Track Color Indicator */}
              <div style={{ backgroundColor: track.color }} className="h-1 rounded-full" />
            </div>
          </div>
        ))}

        {tracks.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Volume2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No tracks yet. Add tracks to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
