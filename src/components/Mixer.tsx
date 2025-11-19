import { useDAW } from '../contexts/DAWContext';
import { Trash2, Sliders } from 'lucide-react';

export default function Mixer() {
  const { tracks, selectedTrack, updateTrack, setTrackInputGain, deleteTrack, selectTrack } = useDAW();

  const getMeterColor = (level: number) => {
    if (level > 0) return 'bg-red-500';
    if (level > -6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const renderChannelStrip = (track: any) => {
    const isSelected = selectedTrack?.id === track.id;
    const volume = track.volume || 0;
    const meterLevel = Math.min(Math.abs(volume) / 60, 1);

    return (
      <div
        key={track.id}
        onClick={() => selectTrack(track.id)}
        className={`flex-shrink-0 w-28 h-full flex flex-col gap-2 p-2 rounded-lg border-2 transition-all cursor-pointer ${
          isSelected
            ? 'border-blue-500 bg-gray-800/50 shadow-lg shadow-blue-500/20'
            : 'border-gray-700 bg-gray-900 hover:border-gray-600'
        }`}
      >
        {/* Channel Name with Color Bar */}
        <div className="flex flex-col items-center gap-1 pb-2 border-b border-gray-700">
          <div
            className="w-6 h-1 rounded-full"
            style={{ backgroundColor: track.color }}
          />
          <div className="text-xs font-semibold text-gray-200 text-center truncate w-full">
            {track.name}
          </div>
          <div className="text-xs text-gray-500">{track.type}</div>
        </div>

        {/* Insert/Send FX Buttons */}
        <div className="flex gap-1 justify-center">
          <button className="px-1.5 py-1 rounded text-xs bg-gray-800 text-gray-400 hover:bg-gray-700 transition border border-gray-700">
            FX
          </button>
          <button className="px-1.5 py-1 rounded text-xs bg-gray-800 text-gray-400 hover:bg-gray-700 transition border border-gray-700">
            Send
          </button>
        </div>

        {/* Pan Control (Centered Dial) */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-gray-500">Pan</div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={track.pan || 0}
            onChange={(e) => updateTrack(track.id, { pan: parseFloat(e.target.value) })}
            className="w-full h-2 accent-cyan-500 rounded"
          />
          <div className="text-xs text-gray-400 font-mono">
            {track.pan === 0 ? 'C' : track.pan! < 0 ? `L${Math.abs(Math.round(track.pan! * 100))}` : `R${Math.round(track.pan! * 100)}`}
          </div>
        </div>

        {/* Vertical Volume Fader with dB Scale */}
        <div className="flex-1 flex flex-col items-center justify-end gap-1 py-2">
          {/* dB Scale Labels */}
          <div className="text-xs text-gray-600 h-6 flex items-center">+12</div>
          <div className="text-xs text-gray-600 h-6 flex items-center">0</div>
          <div className="text-xs text-gray-600 h-6 flex items-center">-12</div>

          {/* Vertical Fader */}
          <input
            type="range"
            min="-60"
            max="12"
            value={volume}
            onChange={(e) => updateTrack(track.id, { volume: parseFloat(e.target.value) })}
            className="w-2 h-32 appearance-none bg-gray-800 rounded-full accent-amber-500 rotation-90 origin-center"
            style={{
              WebkitAppearance: 'slider-vertical',
              writingMode: 'bt-lr',
            }}
          />

          {/* Volume Display */}
          <div className="text-xs font-mono text-gray-300 font-semibold mt-2">
            {volume.toFixed(1)}dB
          </div>
        </div>

        {/* Level Meter (Green → Yellow → Red) */}
        <div className="flex flex-col items-center gap-1 py-2">
          <div className="text-xs text-gray-500">Meter</div>
          <div className="w-3 h-24 bg-gray-950 rounded border border-gray-700 overflow-hidden flex flex-col-reverse">
            <div
              className={`w-full transition-all ${getMeterColor(volume)}`}
              style={{ height: `${meterLevel * 100}%` }}
            />
          </div>
        </div>

        {/* Control Buttons Section */}
        <div className="flex flex-col gap-1 pt-2 border-t border-gray-700">
          {/* Mute/Solo/Record */}
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateTrack(track.id, { muted: !track.muted });
              }}
              className={`flex-1 px-1.5 py-1 rounded text-xs font-semibold transition ${
                track.muted
                  ? 'bg-red-600/80 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Mute"
            >
              M
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateTrack(track.id, { soloed: !track.soloed });
              }}
              className={`flex-1 px-1.5 py-1 rounded text-xs font-semibold transition ${
                track.soloed
                  ? 'bg-yellow-600/80 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Solo"
            >
              S
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateTrack(track.id, { armed: !track.armed });
              }}
              className={`flex-1 px-1.5 py-1 rounded text-xs font-semibold transition ${
                track.armed
                  ? 'bg-red-700/80 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Record Arm"
            >
              R
            </button>
          </div>

          {/* Input/Output Routing */}
          <div className="flex gap-1">
            <button className="flex-1 px-1.5 py-1 rounded text-xs bg-gray-800 text-gray-400 hover:bg-gray-700 transition border border-gray-700">
              In
            </button>
            <button className="flex-1 px-1.5 py-1 rounded text-xs bg-gray-800 text-gray-400 hover:bg-gray-700 transition border border-gray-700">
              Out
            </button>
          </div>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTrack(track.id);
            }}
            className="w-full px-1.5 py-1 rounded text-xs font-semibold bg-gray-700 text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    );
  };

  const renderMasterStrip = () => {
    const masterVolume = 0; // Master level

    return (
      <div
        key="master"
        className="flex-shrink-0 w-28 h-full flex flex-col gap-2 p-2 rounded-lg border-2 border-yellow-600 bg-yellow-900/20"
      >
        {/* Master Label */}
        <div className="flex flex-col items-center gap-1 pb-2 border-b border-yellow-700">
          <div className="w-6 h-1 rounded-full bg-yellow-500" />
          <div className="text-xs font-bold text-yellow-300 text-center">Master</div>
          <div className="text-xs text-gray-500">Output</div>
        </div>

        {/* Master Fader Section */}
        <div className="flex-1 flex flex-col items-center justify-end gap-2 py-2">
          <div className="text-xs text-gray-500">Level</div>

          {/* Vertical Master Fader */}
          <input
            type="range"
            min="-60"
            max="12"
            value={masterVolume}
            onChange={(e) => {
              // Master volume update would go here
            }}
            className="w-3 h-32 appearance-none bg-yellow-900 rounded-full accent-yellow-500"
            style={{
              WebkitAppearance: 'slider-vertical',
              writingMode: 'bt-lr',
            }}
          />

          <div className="text-xs font-mono text-yellow-300 font-semibold">
            {masterVolume.toFixed(1)}dB
          </div>
        </div>

        {/* Master Level Meter */}
        <div className="flex flex-col items-center gap-1 py-2">
          <div className="w-3 h-24 bg-gray-950 rounded border border-yellow-700 overflow-hidden flex flex-col-reverse">
            <div
              className="w-full bg-gradient-to-t from-red-500 via-yellow-500 to-green-500 transition-all"
              style={{ height: '45%' }}
            />
          </div>
        </div>

        {/* Master Controls */}
        <div className="flex flex-col gap-1 pt-2 border-t border-yellow-700">
          <button className="w-full px-1.5 py-1 rounded text-xs font-semibold bg-yellow-700/50 text-yellow-200 hover:bg-yellow-600/60 transition">
            Solo
          </button>
          <button className="w-full px-1.5 py-1 rounded text-xs font-semibold bg-gray-700 text-gray-400 hover:bg-gray-600 transition">
            Dim
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Mixer Header */}
      <div className="h-8 bg-gradient-to-r from-gray-800 to-gray-750 border-b-2 border-gray-700 flex items-center px-4 flex-shrink-0">
        <Sliders className="w-4 h-4 text-gray-400 mr-2" />
        <span className="text-xs font-semibold text-gray-300">Channel Mixer</span>
      </div>

      {/* Channel Strips Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-950">
        <div className="flex h-full gap-3 p-3 min-w-max">
          {/* Master Strip (Always on Left) */}
          {renderMasterStrip()}

          {/* Channel Strips */}
          {tracks.length === 0 ? (
            <div className="flex items-center justify-center w-full text-gray-500 text-sm">
              No tracks. Add tracks from the left panel to see channel strips.
            </div>
          ) : (
            tracks.map(track => renderChannelStrip(track))
          )}
        </div>
      </div>
    </div>
  );
}

