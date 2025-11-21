import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';
import { Trash2, Maximize2, Minimize2 } from 'lucide-react';
import Tooltip from './Tooltip';

interface MixerTileProps {
  track: Track;
  isSelected: boolean;
  onSelect: (trackId: string) => void;
  onDelete: (trackId: string) => void;
  onUpdate: (trackId: string, updates: Partial<Track>) => void;
  levels: Record<string, number>;
  stripWidth?: number;
  stripHeight?: number;
  isDetached?: boolean;
  onDetach?: () => void;
  onDock?: () => void;
}

export default function MixerTile({
  track,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
  levels,
  stripWidth = 100,
  stripHeight = 400,
  isDetached = false,
  onDetach,
  onDock,
}: MixerTileProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: stripWidth, height: stripHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const tileRef = useRef<HTMLDivElement>(null);

  const getMeterColor = (db: number) => {
    if (db > -3) return 'rgb(255, 0, 0)';
    if (db > -8) return 'rgb(255, 200, 0)';
    if (db > -20) return 'rgb(0, 255, 0)';
    return 'rgb(0, 150, 0)';
  };

  const linearToDb = (val: number) =>
    val <= 0.00001 ? -60 : 20 * Math.log10(val);

  const handleMouseDownTitle = (e: React.MouseEvent) => {
    if (!isDetached || (e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    if (!isDetached) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const maxWidth = window.innerWidth * 0.95;
      const maxHeight = window.innerHeight * 0.9;
      const minWidth = 60;
      const minHeight = 200;

      if (isDragging && isDetached) {
        const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - 100));
        const newY = Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - 100));
        setPosition({
          x: newX,
          y: newY,
        });
      }
      if (isResizing && isDetached) {
        const newWidth = Math.max(minWidth, Math.min(resizeStart.width + (e.clientX - resizeStart.x), maxWidth));
        const newHeight = Math.max(minHeight, Math.min(resizeStart.height + (e.clientY - resizeStart.y), maxHeight));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if ((isDragging || isResizing) && isDetached) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, isDetached]);

  const meter = levels[track.id] || 0;
  const db = linearToDb(meter);
  const currentWidth = isDetached ? size.width : stripWidth;
  const currentHeight = isDetached ? size.height : stripHeight;

  const headerHeight = Math.max(currentHeight * 0.12, 24);
  const faderSectionMinHeight = Math.max(currentHeight * 0.35, 80);
  const meterWidth = Math.max(currentWidth * 0.15, 6);

  // Docked tile styling
  if (!isDetached) {
    return (
      <div
        key={track.id}
        onClick={() => onSelect(track.id)}
        className="flex-shrink-0 transition-all select-none relative group"
        style={{
          width: `${currentWidth}px`,
          height: `${currentHeight}px`,
          border: isSelected ? '2px solid rgb(59, 130, 246)' : '1px solid rgb(55, 65, 81)',
          backgroundColor: 'rgb(17, 24, 39)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '4px',
        }}
      >
        {/* Resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 bg-transparent hover:bg-blue-500 hover:opacity-100 opacity-0 cursor-col-resize transition-opacity"
          onMouseDown={(e) => {
            e.preventDefault();
            // Width resizing logic stays in parent
          }}
        />

        {/* Detach button overlay */}
        <Tooltip content="Detach to floating window" position="right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDetach?.();
            }}
            className="absolute top-1 right-1 p-1 rounded bg-blue-600/0 hover:bg-blue-600/80 text-blue-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-10"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Track Header with Controls */}
        <div
          style={{
            height: `${headerHeight}px`,
            backgroundColor: track.color,
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: `${Math.max(currentWidth * 0.12, 9)}px`,
            flexShrink: 0,
            paddingLeft: '4px',
            paddingRight: '4px',
            gap: '2px',
          }}
          className="font-bold text-gray-900 overflow-hidden"
        >
          {/* Track Name */}
          <div className="truncate flex-1">
            {track.name}
          </div>

          {/* Inline Control Buttons */}
          <div className="flex gap-0.5 flex-shrink-0">
            {/* Mute Button */}
            <Tooltip content={track.muted ? 'Unmute' : 'Mute'} position="bottom">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(track.id, { muted: !track.muted });
                }}
                className={`px-1 rounded text-xs font-bold transition ${
                  track.muted
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-900/50 text-gray-900 hover:bg-gray-900/70'
                }`}
              >
                M
              </button>
            </Tooltip>

            {/* Solo Button */}
            <Tooltip content={track.soloed ? 'Unsolo' : 'Solo'} position="bottom">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(track.id, { soloed: !track.soloed });
                }}
                className={`px-1 rounded text-xs font-bold transition ${
                  track.soloed
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-gray-900/50 text-gray-900 hover:bg-gray-900/70'
                }`}
              >
                S
              </button>
            </Tooltip>

            {/* Record Arm Button */}
            <Tooltip content={track.armed ? 'Disarm' : 'Arm for recording'} position="bottom">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(track.id, { armed: !track.armed });
                }}
                className={`px-1 rounded text-xs font-bold transition ${
                  track.armed
                    ? 'bg-red-700 text-white'
                    : 'bg-gray-900/50 text-gray-900 hover:bg-gray-900/70'
                }`}
              >
                R
              </button>
            </Tooltip>
          </div>
        </div>

        {/* METER + FADER */}
        <div className="flex flex-col items-center justify-end flex-1">
          {/* Meter */}
          <div
            className="rounded border border-gray-700 bg-gray-950 flex flex-col-reverse shadow-inner mb-1"
            style={{
              width: `${meterWidth}px`,
              height: '100%',
              minHeight: `${faderSectionMinHeight * 0.8}px`,
            }}
          >
            <div
              style={{
                height: `${meter * 100}%`,
                backgroundColor: getMeterColor(db),
                transition: 'height 0.1s linear',
                borderRadius: '1px',
              }}
            />
          </div>

          {/* dB Display */}
          <Tooltip content="RMS level in decibels" position="right">
            <div
              className="font-mono text-xs text-gray-400 text-center cursor-help"
              style={{
                padding: '2px',
                minHeight: '20px',
              }}
            >
              {db.toFixed(1)} dB
            </div>
          </Tooltip>
        </div>

        {/* Delete Button */}
        <Tooltip content="Delete track" position="top">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(track.id);
            }}
            className="w-full rounded font-semibold bg-gray-700 text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition flex items-center justify-center gap-1"
            style={{
              fontSize: `${Math.max(stripWidth * 0.08, 8)}px`,
              padding: '4px',
              flexShrink: 0,
            }}
          >
            <Trash2 style={{ width: 12, height: 12 }} /> Del
          </button>
        </Tooltip>
      </div>
    );
  }

  // Detached floating tile styling
  return (
    <div
      ref={tileRef}
      onClick={() => onSelect(track.id)}
      className="absolute transition-shadow select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        border: isSelected ? '2px solid rgb(59, 130, 246)' : '2px solid rgb(55, 65, 81)',
        backgroundColor: 'rgb(17, 24, 39)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '4px',
        zIndex: isDragging ? 1000 : 100,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Title Bar - Draggable */}
      <div
        onMouseDown={handleMouseDownTitle}
        className="h-6 bg-gradient-to-r from-gray-800 via-gray-750 to-gray-800 border-b border-gray-600 rounded-t-1 flex items-center justify-between px-3 flex-shrink-0 cursor-move hover:bg-gradient-to-r hover:from-gray-700 hover:via-gray-700 hover:to-gray-700 transition-all"
      >
        <span className="text-xs font-semibold text-gray-100 truncate flex-1">{track.name}</span>
        <Tooltip content="Dock back to mixer" position="left">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDock?.();
            }}
            className="p-0.5 hover:bg-blue-600/30 rounded transition-colors text-gray-400 hover:text-blue-400 ml-2"
          >
            <Minimize2 className="w-3 h-3" />
          </button>
        </Tooltip>
      </div>

      {/* Track Header with Controls */}
      <div
        style={{
          height: `${headerHeight}px`,
          backgroundColor: track.color,
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: `${Math.max(size.width * 0.12, 9)}px`,
          flexShrink: 0,
          paddingLeft: '4px',
          paddingRight: '4px',
          gap: '2px',
          marginTop: '4px',
        }}
        className="font-bold text-gray-900 overflow-hidden"
      >
        {/* Track Name */}
        <div className="truncate flex-1">
          {track.name}
        </div>

        {/* Inline Control Buttons */}
        <div className="flex gap-0.5 flex-shrink-0">
          {/* Mute Button */}
          <Tooltip content={track.muted ? 'Unmute' : 'Mute'} position="bottom">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(track.id, { muted: !track.muted });
              }}
              className={`px-1 rounded text-xs font-bold transition ${
                track.muted
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-900/50 text-gray-900 hover:bg-gray-900/70'
              }`}
            >
              M
            </button>
          </Tooltip>

          {/* Solo Button */}
          <Tooltip content={track.soloed ? 'Unsolo' : 'Solo'} position="bottom">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(track.id, { soloed: !track.soloed });
              }}
              className={`px-1 rounded text-xs font-bold transition ${
                track.soloed
                  ? 'bg-yellow-500 text-gray-900'
                  : 'bg-gray-900/50 text-gray-900 hover:bg-gray-900/70'
              }`}
            >
              S
            </button>
          </Tooltip>

          {/* Record Arm Button */}
          <Tooltip content={track.armed ? 'Disarm' : 'Arm for recording'} position="bottom">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(track.id, { armed: !track.armed });
              }}
              className={`px-1 rounded text-xs font-bold transition ${
                track.armed
                  ? 'bg-red-700 text-white'
                  : 'bg-gray-900/50 text-gray-900 hover:bg-gray-900/70'
              }`}
            >
              R
            </button>
          </Tooltip>
        </div>
      </div>

      {/* METER + FADER */}
      <div className="flex flex-col items-center justify-end flex-1">
        {/* Meter */}
        <div
          className="rounded border border-gray-700 bg-gray-950 flex flex-col-reverse shadow-inner mb-1"
          style={{
            width: `${meterWidth}px`,
            height: '100%',
            minHeight: `${faderSectionMinHeight * 0.8}px`,
          }}
        >
          <div
            style={{
              height: `${meter * 100}%`,
              backgroundColor: getMeterColor(db),
              transition: 'height 0.1s linear',
              borderRadius: '1px',
            }}
          />
        </div>

        {/* dB Display */}
        <Tooltip content="RMS level in decibels" position="right">
          <div
            className="font-mono text-xs text-gray-400 text-center cursor-help"
            style={{
              padding: '2px',
              minHeight: '20px',
            }}
          >
            {db.toFixed(1)} dB
          </div>
        </Tooltip>
      </div>

      {/* Delete */}
      <Tooltip content="Delete track" position="top">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(track.id);
          }}
          className="w-full rounded font-semibold bg-gray-700 text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition flex items-center justify-center gap-1"
          style={{
            fontSize: `${Math.max(size.width * 0.08, 8)}px`,
            padding: '4px',
            flexShrink: 0,
          }}
        >
          <Trash2 style={{ width: 12, height: 12 }} /> Del
        </button>
      </Tooltip>

      {/* Resize Handle - Bottom Right Corner */}
      <Tooltip content="Drag to resize window" position="left">
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-gradient-to-tl from-blue-500/40 to-transparent hover:from-blue-500/80 transition-all"
          style={{ zIndex: 50 }}
        />
      </Tooltip>
    </div>
  );
}
