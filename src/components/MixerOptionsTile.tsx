import { useState, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Track } from '../types';

interface MixerOptionsTileProps {
  tracks: Track[];
  onUpdateTrack: (trackId: string, updates: Partial<Track>) => void;
  onRemovePlugin: (trackId: string, pluginId: string) => void;
  stripWidth: number;
  stripHeight: number;
  position: { x: number; y: number };
  onDock: () => void;
  isDetached: boolean;
}

export default function MixerOptionsTile({
  tracks,
  onUpdateTrack,
  onRemovePlugin,
  stripWidth,
  stripHeight,
  position,
  onDock,
  isDetached,
}: MixerOptionsTileProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentPos, setCurrentPos] = useState(position);
  const tileRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - currentPos.x, y: e.clientY - currentPos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    setCurrentPos({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetAll = () => {
    tracks.forEach((track) => {
      if (track.type !== 'master' && track.inserts.length > 0) {
        track.inserts.forEach((plugin) => {
          onRemovePlugin(track.id, plugin.id);
        });
      }
    });
  };

  const handleSoloAll = () => {
    tracks.forEach((track) => {
      if (track.type !== 'master' && !track.soloed) {
        onUpdateTrack(track.id, { soloed: true });
      }
    });
  };

  const handleUnsoloAll = () => {
    tracks.forEach((track) => {
      if (track.soloed) {
        onUpdateTrack(track.id, { soloed: false });
      }
    });
  };

  const handleMuteAll = () => {
    tracks.forEach((track) => {
      if (track.type !== 'master' && !track.muted) {
        onUpdateTrack(track.id, { muted: true });
      }
    });
  };

  const handleUnmuteAll = () => {
    tracks.forEach((track) => {
      if (track.muted) {
        onUpdateTrack(track.id, { muted: false });
      }
    });
  };

  const options = [
    { label: 'Reset All', onClick: handleResetAll },
    { label: 'Solo All', onClick: handleSoloAll },
    { label: 'Unsolo All', onClick: handleUnsoloAll },
    { label: 'Mute All', onClick: handleMuteAll },
    { label: 'Unmute All', onClick: handleUnmuteAll },
  ];

  if (isDetached) {
    return (
      <div
        ref={tileRef}
        className="fixed bg-gray-900 border-2 border-blue-600 rounded shadow-lg z-40"
        style={{
          left: `${currentPos.x}px`,
          top: `${currentPos.y}px`,
          width: `${stripWidth}px`,
          minHeight: `${stripHeight}px`,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Header */}
        <div
          className="bg-gradient-to-r from-blue-700 to-blue-600 p-2 flex items-center justify-between cursor-move rounded-t text-white text-xs font-semibold"
          onMouseDown={handleMouseDown}
        >
          <span>Mixer Options</span>
          <button
            onClick={onDock}
            className="p-1 hover:bg-blue-500 rounded transition"
            title="Dock"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Options */}
        <div className="p-3 space-y-2">
          {options.map((option) => (
            <button
              key={option.label}
              onClick={option.onClick}
              className="w-full text-left px-3 py-2 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white transition rounded"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 select-none"
      style={{
        width: `${stripWidth}px`,
        height: `${stripHeight}px`,
        border: '2px solid rgb(37, 99, 235)',
        backgroundColor: 'rgb(17, 24, 39)',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: '4px',
      }}
    >
      <div
        className="font-bold text-white flex items-center justify-between bg-blue-600 rounded px-2 py-2 text-xs cursor-move hover:bg-blue-700 transition"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <span>Mixer Options</span>
        <button
          onClick={onDock}
          className="p-1 hover:bg-blue-500 rounded transition"
          title="Detach"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={option.onClick}
            className="w-full text-left px-2 py-1 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white transition rounded"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
