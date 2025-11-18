import { Plus, Music, Mic2, Piano, Radio, Volume2, Trash2, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { Track } from '../types';
import Waveform from './Waveform';
import { useState } from 'react';

export default function TrackList() {
  const { tracks, selectedTrack, addTrack, selectTrack, deleteTrack, updateTrack } = useDAW();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const getTrackIcon = (type: Track['type']) => {
    switch (type) {
      case 'audio': return <Mic2 className="w-4 h-4" />;
      case 'instrument': return <Piano className="w-4 h-4" />;
      case 'midi': return <Music className="w-4 h-4" />;
      case 'aux': return <Radio className="w-4 h-4" />;
      case 'vca': return <Layers className="w-4 h-4" />;
      case 'master': return <Volume2 className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  const toggleGroup = (trackId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(trackId)) {
      newExpanded.delete(trackId);
    } else {
      newExpanded.add(trackId);
    }
    setExpandedGroups(newExpanded);
  };

  const getChildTracks = (parentId: string) => {
    return tracks.filter(t => t.parentTrackId === parentId);
  };

  const isGroupTrack = (track: Track) => {
    return track.childTrackIds && track.childTrackIds.length > 0;
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
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
              >
                <Radio className="w-4 h-4" />
                <span>Aux/FX Return</span>
              </button>
              <button
                onClick={() => addTrack('vca')}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 rounded-b-lg flex items-center space-x-2"
              >
                <Layers className="w-4 h-4" />
                <span>VCA Master</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tracks.filter(t => !t.parentTrackId).map((track) => {
          const children = getChildTracks(track.id);
          const isGroup = isGroupTrack(track);
          const isExpanded = expandedGroups.has(track.id);

          return (
            <div key={track.id}>
              <div
                onClick={() => selectTrack(track.id)}
                className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors flex items-center space-x-2 ${
                  selectedTrack?.id === track.id ? 'bg-gray-800 border-l-4 border-l-blue-500' : ''
                }`}
              >
                {isGroup && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(track.id);
                    }}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
                {!isGroup && <div className="w-4" />}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div style={{ backgroundColor: track.color }} className="w-3 h-3 rounded-full flex-shrink-0" />
                      {getTrackIcon(track.type)}
                      <span className="text-sm font-medium text-white truncate">{track.name}</span>
                      {isGroup && <span className="text-xs text-gray-500">({children.length})</span>}
                    </div>
                    {track.type !== 'master' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTrack(track.id);
                        }}
                        className="p-1 text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Delete track"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {track.type === 'audio' && (
                <div className="border-b border-gray-800 px-3 pb-2">
                  <Waveform track={track} height={40} width={240} color={track.color || '#3b82f6'} />
                </div>
              )}

              <div className="px-3 py-2 border-b border-gray-800 flex items-center space-x-2">
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

              {/* Grouped Child Tracks */}
              {isExpanded && children.map((childTrack) => (
                <div
                  key={childTrack.id}
                  onClick={() => selectTrack(childTrack.id)}
                  className={`p-3 pl-8 border-b border-gray-800 cursor-pointer hover:bg-gray-750 transition-colors ${
                    selectedTrack?.id === childTrack.id ? 'bg-gray-750 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div style={{ backgroundColor: childTrack.color }} className="w-3 h-3 rounded-full" />
                      {getTrackIcon(childTrack.type)}
                      <span className="text-sm text-gray-300">{childTrack.name}</span>
                    </div>
                    {childTrack.type !== 'master' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTrack(childTrack.id);
                        }}
                        className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                        title="Delete track"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-6 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTrack(childTrack.id, { muted: !childTrack.muted });
                      }}
                      className={`px-2 py-0.5 rounded ${
                        childTrack.muted ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      M
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTrack(childTrack.id, { soloed: !childTrack.soloed });
                      }}
                      className={`px-2 py-0.5 rounded ${
                        childTrack.soloed ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      S
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
