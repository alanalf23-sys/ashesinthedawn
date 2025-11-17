import { Plus, Music, Mic2, Piano, Radio, Volume2, Trash2 } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { Track } from '../types';

export default function TrackList() {
  const { tracks, selectedTrack, addTrack, selectTrack, deleteTrack, updateTrack } = useDAW();

  const getTrackIcon = (type: Track['type']) => {
    switch (type) {
      case 'audio': return <Mic2 className="w-4 h-4" />;
      case 'instrument': return <Piano className="w-4 h-4" />;
      case 'midi': return <Music className="w-4 h-4" />;
      case 'aux': return <Radio className="w-4 h-4" />;
      case 'master': return <Volume2 className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Tracks</h2>
          <div className="relative group">
            <button className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="w-4 h-4" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => addTrack('audio')}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 rounded-t-lg flex items-center space-x-2"
              >
                <Mic2 className="w-4 h-4" />
                <span>Audio Track</span>
              </button>
              <button
                onClick={() => addTrack('instrument')}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
              >
                <Piano className="w-4 h-4" />
                <span>Instrument Track</span>
              </button>
              <button
                onClick={() => addTrack('midi')}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
              >
                <Music className="w-4 h-4" />
                <span>MIDI Track</span>
              </button>
              <button
                onClick={() => addTrack('aux')}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 rounded-b-lg flex items-center space-x-2"
              >
                <Radio className="w-4 h-4" />
                <span>Aux/FX Return</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tracks.map((track) => (
          <div
            key={track.id}
            onClick={() => selectTrack(track.id)}
            className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${
              selectedTrack?.id === track.id ? 'bg-gray-800 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div style={{ backgroundColor: track.color }} className="w-3 h-3 rounded-full" />
                {getTrackIcon(track.type)}
                <span className="text-sm font-medium text-white">{track.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTrack(track.id);
                }}
                className="p-1 text-gray-500 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateTrack(track.id, { muted: !track.muted });
                }}
                className={`px-2 py-0.5 text-xs rounded ${
                  track.muted ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
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
                className={`px-2 py-0.5 text-xs rounded ${
                  track.soloed ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
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
                className={`px-2 py-0.5 text-xs rounded ${
                  track.armed ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                title="Arm for Recording"
              >
                R
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
