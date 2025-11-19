import { Plus, Music, Mic2, Piano, Radio, Volume2, Trash2, Layers } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { Track } from '../types';
import { useState } from 'react';

export default function TrackList() {
  const { tracks, selectedTrack, addTrack, selectTrack, deleteTrack } = useDAW();
  const [showAddMenu, setShowAddMenu] = useState(false);


  const getTrackNumber = (index: number, type: Track['type']): number => {
    const tracksOfType = tracks.filter(t => t.type === type);
    return tracksOfType.findIndex(t => t.id === tracks[index].id) + 1;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      {/* Header with Add Button */}
      <div className="p-2 border-b border-gray-700">
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full flex items-center justify-center p-1.5 bg-blue-700 hover:bg-blue-600 rounded text-white transition text-xs font-semibold gap-1"
          >
            <Plus className="w-3 h-3" />
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
        {tracks.map((track, index) => (
          <div
            key={track.id}
            onClick={() => selectTrack(track.id)}
            className={`p-2 border-b border-gray-700 cursor-pointer transition ${
              selectedTrack?.id === track.id
                ? 'bg-blue-900 bg-opacity-50'
                : 'hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className="w-3 h-3 rounded flex-shrink-0"
                  style={{ backgroundColor: track.color }}
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-gray-200 truncate">
                    {track.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {track.type.charAt(0).toUpperCase()}
                    {getTrackNumber(index, track.type)}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTrack(track.id);
                }}
                className="p-0.5 hover:bg-red-900 hover:bg-opacity-50 rounded transition text-gray-500 hover:text-red-400 flex-shrink-0"
                title="Delete track"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
