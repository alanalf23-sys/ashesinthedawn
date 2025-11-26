import { Plus, Music, Mic2, Piano, Radio, Eye, X } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { Track } from '../types';
import { memo } from 'react';
import { DropdownMenu } from './DropdownMenu';
import { Tooltip } from './TooltipProvider';

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
    <div className="flex flex-col h-full bg-gray-900 border-r-2 border-gray-700 overflow-hidden text-xs">
      {/* Header - Compact */}
      <div className="p-1.5 border-b-2 border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750 flex-shrink-0">
        <div className="relative">
          <Tooltip
            content={{
              title: 'Add Track',
              description: 'Create a new audio, instrument, MIDI, or aux track to your project',
              hotkey: 'Ctrl+T',
              category: 'mixer',
              relatedFunctions: ['Delete Track', 'Select Track', 'Rename Track'],
              performanceTip: 'Audio tracks consume CPU for processing; use Aux buses to route multiple tracks',
              examples: ['Add Audio track for vocal recording', 'Add Instrument track for synth', 'Add Aux bus for reverb send'],
            }}
            position="right"
          >
            <DropdownMenu
              trigger={
                <>
                  <Plus className={`w-3 h-3 ${!canAddTracks ? 'opacity-50' : ''}`} />
                  <span className="hidden sm:inline">{canAddTracks ? 'Add' : 'Max'}</span>
                </>
              }
              items={canAddTracks ? trackMenuItems : []}
              triggerClassName={`w-full px-2 py-1 rounded font-semibold text-white text-xs transition ${
                canAddTracks
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
              menuClassName="left-0 right-0"
              align="left"
              width="w-full"
            />
          </Tooltip>
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
              <div className="p-2 space-y-1.5">
                {/* Name & Type */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-100 truncate">{track.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-0.5">
                      {getTrackTypeIcon(track.type)}
                      <span className="truncate">{track.type.charAt(0).toUpperCase() + track.type.slice(1)} {getTrackNumber(track)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div
                      className="w-3 h-3 rounded flex-shrink-0"
                      style={{ backgroundColor: track.color }}
                      title="Track color"
                    />
                    <Tooltip
                      content={{
                        title: 'Delete Track',
                        description: 'Permanently remove this track and all its audio/MIDI data. Cannot be undone.',
                        hotkey: 'Delete',
                        category: 'mixer',
                        relatedFunctions: ['Add Track', 'Undo', 'Archive Track'],
                        performanceTip: 'Deleting unused tracks frees CPU and memory; consider freezing before deleting',
                        examples: ['Delete duplicate vocal takes', 'Remove reference tracks before exporting'],
                      }}
                      position="left"
                    >
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
                    </Tooltip>
                  </div>
                </div>

                {/* Control Buttons - Row 1 */}
                <div className="flex gap-0.5">
                  <Tooltip
                    content={{
                      title: 'Mute Track',
                      description: 'Silence this track during playback. Audio is still processed internally.',
                      hotkey: 'M',
                      category: 'mixer',
                      relatedFunctions: ['Solo', 'Record Arm', 'Bypass Plugin'],
                      performanceTip: 'Muted tracks still consume CPU; freeze or delete for true CPU savings',
                      examples: ['Mute to compare different vocals', 'Mute backing track to hear lead clearly'],
                    }}
                    position="bottom"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTrack(track.id, { muted: !track.muted });
                      }}
                      title="Mute"
                      className={`flex-1 px-1 py-0.5 rounded text-xs font-semibold transition ${
                        track.muted
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      M
                    </button>
                  </Tooltip>
                  <Tooltip
                    content={{
                      title: 'Solo Track',
                      description: 'Isolate this track for listening. Mutes all other non-soloed tracks.',
                      hotkey: 'S',
                      category: 'mixer',
                      relatedFunctions: ['Mute', 'Record Arm', 'Select Track'],
                      performanceTip: 'Soloing does not reduce CPU - processing continues for muted tracks',
                      examples: ['Solo vocals to check for timing issues', 'Solo drums to verify kick/snare blend'],
                    }}
                    position="bottom"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTrack(track.id, { soloed: !track.soloed });
                      }}
                      title="Solo"
                      className={`flex-1 px-1 py-0.5 rounded text-xs font-semibold transition ${
                        track.soloed
                          ? 'bg-yellow-600 text-white shadow-md'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      S
                    </button>
                  </Tooltip>
                  <Tooltip
                    content={{
                      title: 'Record Arm',
                      description: 'Enable recording on this track. Audio input will be captured to this track.',
                      hotkey: 'R',
                      category: 'mixer',
                      relatedFunctions: ['Mute', 'Solo', 'Input Gain'],
                      performanceTip: 'Only one track can record at a time in mono mode; use aux buses for multi-track recording',
                      examples: ['Arm vocal track before recording vocals', 'Switch between tracks to record different parts'],
                    }}
                    position="bottom"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTrack(track.id, { armed: !track.armed });
                      }}
                      title="Record Arm"
                      className={`flex-1 px-1 py-0.5 rounded text-xs font-semibold transition ${
                        track.armed
                          ? 'bg-red-700 text-white shadow-md'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      R
                    </button>
                  </Tooltip>
                </div>

                {/* Input Monitoring & Volume Meter */}
                <div className="flex items-center gap-1">
                  <Tooltip
                    content={{
                      title: 'Input Monitor',
                      description: 'Monitor audio input in real-time without recording. Useful for live instrument monitoring.',
                      hotkey: 'I',
                      category: 'mixer',
                      relatedFunctions: ['Record Arm', 'Input Gain', 'Mute'],
                      performanceTip: 'Monitoring adds minimal latency; disable if you hear doubled signal',
                      examples: ['Monitor vocal input while playing backing track', 'Monitor guitar while recording'],
                    }}
                    position="right"
                  >
                    <button
                      title="Input Monitor"
                      className="p-0.5 rounded bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-300 transition flex-shrink-0"
                    >
                      <Eye className="w-2.5 h-2.5" />
                    </button>
                  </Tooltip>
                  {/* Mini Volume Meter */}
                  <div className="flex-1 h-2 bg-gray-950 rounded border border-gray-600 overflow-hidden">
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
