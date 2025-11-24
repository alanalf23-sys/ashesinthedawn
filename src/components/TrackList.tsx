import { Plus, Music, Mic2, Piano, Radio, Eye, X } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { Track } from '../types';
import { memo } from 'react';
import { DropdownMenu } from './DropdownMenu';

const TrackListComponent = () => {
  const { tracks, selectedTrack, addTrack, selectTrack, updateTrack, deleteTrack } = useDAW();
  const maxTracks = 256; // Maximum tracks allowed
  const canAddTracks = tracks.length < maxTracks;

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

  const trackMenuItems = [
    {
      label: 'Audio',
      icon: <Mic2 className="w-4 h-4" />,
      onClick: () => addTrack('audio'),
    },
    {
      label: 'Instrument',
      icon: <Piano className="w-4 h-4" />,
      onClick: () => addTrack('instrument'),
    },
    {
      label: 'MIDI',
      icon: <Music className="w-4 h-4" />,
      onClick: () => addTrack('midi'),
    },
    {
      label: 'Aux',
      icon: <Radio className="w-4 h-4" />,
      onClick: () => addTrack('aux'),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r-2 border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-2 border-b-2 border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750">
        <div className="relative">
          <DropdownMenu
            trigger={
              <>
                <Plus className={`w-4 h-4 ${!canAddTracks ? 'opacity-50' : ''}`} />
                {canAddTracks ? 'Add Track' : `Max ${maxTracks} reached`}
              </>
            }
            items={canAddTracks ? trackMenuItems : []}
            triggerClassName={`w-full px-4 py-2 rounded font-semibold text-white transition ${
              canAddTracks
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
            menuClassName="left-0 right-0"
            align="left"
            width="w-full"
          />
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: track.color }}
                      title="Track color"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${track.name}"?`)) {
                          deleteTrack(track.id);
                        }
                      }}
                      title="Delete track"
                      className="p-1 rounded bg-gray-700 text-gray-400 hover:bg-red-600 hover:text-white transition opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
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
};

export default memo(TrackListComponent);
