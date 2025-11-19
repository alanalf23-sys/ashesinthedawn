import { Plus, Music, Mic2, Piano, Radio, Eye } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { Track } from '../types';
import { useState } from 'react';

export default function TrackList() {
  const { tracks, selectedTrack, addTrack, selectTrack, updateTrack } = useDAW();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const getTrackNumber = (track: Track): number => {
    const tracksOfSameType = tracks.filter(t => t.type === track.type);
    return tracksOfSameType.findIndex(t => t.id === track.id) + 1;
  };

  const getTrackTypeIcon = (type: Track['type']) => {
    switch (type) {
      case 'audio': return <Mic2 className="w-3 h-3" />;
      case 'instrument': return <Piano className="w-3 h-3" />;
      case 'midi': return <Music className="w-3 h-3" />;
      case 'aux': return <Radio className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r-2 border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-2 border-b-2 border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750">
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full flex items-center justify-center p-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold text-white text-xs transition gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Track
          </button>
          {showAddMenu && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg">
              <button
                onClick={() => { addTrack('audio'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-700 first:rounded-t last:rounded-b"
              >
                <Mic2 className="w-3 h-3" /> Audio
              </button>
              <button
                onClick={() => { addTrack('instrument'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-700"
              >
                <Piano className="w-3 h-3" /> Instrument
              </button>
              <button
                onClick={() => { addTrack('midi'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-700"
              >
                <Music className="w-3 h-3" /> MIDI
              </button>
              <button
                onClick={() => { addTrack('aux'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-700 last:rounded-b"
              >
                <Radio className="w-3 h-3" /> Aux
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tracks List */}
      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-xs text-center p-4">
            No tracks. Click "Add Track" to get started.
          </div>
        ) : (
          tracks.map((track) => (
            <div
              key={track.id}
              onClick={() => selectTrack(track.id)}
              className={`border-b border-gray-700 cursor-pointer transition group ${
                selectedTrack?.id === track.id
                  ? 'bg-blue-900/40 border-b-blue-600'
                  : 'bg-gray-800 hover:bg-gray-750'
              }`}
              style={{
                borderLeft: `4px solid ${track.color}`,
              }}
            >
              {/* Track Header */}
              <div className="p-3 space-y-2">
                {/* Name & Type */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-100 truncate">{track.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      {getTrackTypeIcon(track.type)}
                      {track.type.charAt(0).toUpperCase() + track.type.slice(1)} {getTrackNumber(track)}
                    </div>
                  </div>
                  <div
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: track.color }}
                    title="Track color"
                  />
                </div>

                {/* Control Buttons - Row 1 */}
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTrack(track.id, { muted: !track.muted });
                    }}
                    title="Mute"
                    className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition ${
                      track.muted
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTrack(track.id, { soloed: !track.soloed });
                    }}
                    title="Solo"
                    className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition ${
                      track.soloed
                        ? 'bg-yellow-600 text-white shadow-md'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    S
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTrack(track.id, { armed: !track.armed });
                    }}
                    title="Record Arm"
                    className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition ${
                      track.armed
                        ? 'bg-red-700 text-white shadow-md'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    R
                  </button>
                </div>

                {/* Input Monitoring & Volume Meter */}
                <div className="flex items-center gap-2">
                  <button
                    title="Input Monitor"
                    className="p-1 rounded bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-300 transition"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  {/* Mini Volume Meter */}
                  <div className="flex-1 h-3 bg-gray-950 rounded border border-gray-600 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                      style={{
                        width: `${Math.random() * 100}%`,
                        transition: 'width 0.1s linear',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
