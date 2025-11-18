import { Plus, Music, Mic2, Piano, Radio, Volume2, Trash2, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { Track } from '../types';
import Waveform from './Waveform';
import { useState } from 'react';

export default function TrackList() {
  const { tracks, selectedTrack, addTrack, selectTrack, deleteTrack, updateTrack } = useDAW();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Branching function: Get track number for a specific type
  const getTrackNumberForType = (trackId: string, type: Track['type']): number => {
    const tracksOfTypeBeforeThis = tracks
      .filter(t => t.type === type && !t.parentTrackId)
      .findIndex(t => t.id === trackId);
    return tracksOfTypeBeforeThis + 1;
  };

  // Branching function: Get display label with sequential numbering
  const getTrackDisplayLabel = (track: Track): string => {
    if (track.type === 'master') return 'Master';
    const trackNumber = getTrackNumberForType(track.id, track.type);
    const typeLabel = track.type.charAt(0).toUpperCase() + track.type.slice(1);
    return `${typeLabel} ${trackNumber}`;
  };

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
    <div className="w-64 bg-daw-dark-900 border-r border-daw-dark-600 flex flex-col">
      <div className="p-4 border-b border-daw-dark-600">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-daw-dark-100">Tracks</h2>
          <div className="relative group">
            <button className="btn-primary p-1 rounded">
              <Plus className="w-4 h-4" />
            </button>
            <div className="dropdown-menu w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 right-0 mt-2">
              <button
                onClick={() => addTrack('audio')}
                className="dropdown-item w-full text-left px-4 py-2 text-sm flex items-center space-x-2 rounded-t-lg"
              >
                <Mic2 className="w-4 h-4" />
                <span>Audio Track</span>
              </button>
              <button
                onClick={() => addTrack('instrument')}
                className="dropdown-item w-full text-left px-4 py-2 text-sm flex items-center space-x-2"
              >
                <Piano className="w-4 h-4" />
                <span>Instrument Track</span>
              </button>
              <button
                onClick={() => addTrack('midi')}
                className="dropdown-item w-full text-left px-4 py-2 text-sm flex items-center space-x-2"
              >
                <Music className="w-4 h-4" />
                <span>MIDI Track</span>
              </button>
              <button
                onClick={() => addTrack('aux')}
                className="dropdown-item w-full text-left px-4 py-2 text-sm flex items-center space-x-2"
              >
                <Radio className="w-4 h-4" />
                <span>Aux/FX Return</span>
              </button>
              <button
                onClick={() => addTrack('vca')}
                className="dropdown-item w-full text-left px-4 py-2 text-sm rounded-b-lg flex items-center space-x-2"
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
                className={`track-item p-3 cursor-pointer transition-colors flex items-center space-x-2 border-b ${
                  selectedTrack?.id === track.id ? 'track-item selected border-l-4 border-l-daw-blue-500' : 'border-daw-dark-600'
                }`}
              >
                {isGroup && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(track.id);
                    }}
                    className="text-daw-dark-400 hover:text-daw-dark-200"
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
                      <div className="flex flex-col min-w-0">
                        <span className="text-daw-xs text-daw-dark-400">{getTrackDisplayLabel(track)}</span>
                        <span className="text-sm font-medium text-daw-dark-100 truncate">{track.name}</span>
                      </div>
                      {isGroup && <span className="text-daw-xs text-daw-dark-400">({children.length})</span>}
                    </div>
                    {track.type !== 'master' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTrack(track.id);
                        }}
                        className="p-1 text-daw-dark-400 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Delete track"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {track.type === 'audio' && (
                <div className="border-b border-daw-dark-600 px-3 pb-2">
                  <Waveform track={track} height={40} width={240} color={track.color || '#0ea5e9'} />
                </div>
              )}

              <div className="px-3 py-2 border-b border-daw-dark-600 flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTrack(track.id, { muted: !track.muted });
                  }}
                  className={`btn-small ${
                    track.muted ? 'btn-mute active' : 'btn-mute'
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
                  className={`btn-small ${
                    track.soloed ? 'btn-solo active' : 'btn-solo'
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
                  className={`btn-small ${
                    track.armed ? 'btn-danger' : 'btn-secondary'
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
                  className={`track-item p-3 pl-8 border-b cursor-pointer transition-colors ${
                    selectedTrack?.id === childTrack.id ? 'track-item selected border-l-4 border-l-daw-blue-500' : 'border-daw-dark-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div style={{ backgroundColor: childTrack.color }} className="w-3 h-3 rounded-full" />
                      {getTrackIcon(childTrack.type)}
                      <div className="flex flex-col">
                        <span className="text-daw-xs text-daw-dark-500">{getTrackDisplayLabel(childTrack)}</span>
                        <span className="text-sm text-daw-dark-300">{childTrack.name}</span>
                      </div>
                    </div>
                    {childTrack.type !== 'master' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTrack(childTrack.id);
                        }}
                        className="p-1 text-daw-dark-400 hover:text-red-500 transition-colors"
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
