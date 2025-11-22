import { useState, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Plugin } from '../types';
import PluginRack from './PluginRack';

interface DetachablePluginRackProps {
  plugins: Plugin[];
  onAddPlugin: (plugin: Plugin) => void;
  onRemovePlugin: (pluginId: string) => void;
  onTogglePlugin: (pluginId: string, enabled: boolean) => void;
  trackId: string;
  trackName: string;
  isDetached: boolean;
  position?: { x: number; y: number };
  onDock?: () => void;
}

export default function DetachablePluginRack({
  plugins,
  onAddPlugin,
  onRemovePlugin,
  onTogglePlugin,
  trackId,
  trackName,
  isDetached,
  position = { x: 400, y: 200 },
  onDock,
}: DetachablePluginRackProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentPos, setCurrentPos] = useState(position);
  const tileRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="menu"]')) return;
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

  if (isDetached) {
    return (
      <div
        ref={tileRef}
        className="fixed bg-gray-900 border-2 border-blue-600 rounded shadow-lg z-40"
        style={{
          left: `${currentPos.x}px`,
          top: `${currentPos.y}px`,
          width: '320px',
          minHeight: '200px',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Header - Draggable */}
        <div
          className="bg-gradient-to-r from-blue-700 to-blue-600 p-3 flex items-center justify-between cursor-move rounded-t text-white text-xs font-semibold"
          onMouseDown={handleMouseDown}
        >
          <span>Inserts - {trackName}</span>
          <button
            onClick={onDock}
            className="p-1 hover:bg-blue-500 rounded transition"
            title="Dock"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          <PluginRack
            plugins={plugins}
            onAddPlugin={onAddPlugin}
            onRemovePlugin={onRemovePlugin}
            onTogglePlugin={onTogglePlugin}
            trackId={trackId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <PluginRack
          plugins={plugins}
          onAddPlugin={onAddPlugin}
          onRemovePlugin={onRemovePlugin}
          onTogglePlugin={onTogglePlugin}
          trackId={trackId}
        />
      </div>

      {/* Detach Button - positioned absolutely over the PluginRack */}
      {onDock && (
        <button
          onClick={onDock}
          className="absolute top-1 right-8 p-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white transition opacity-0 hover:opacity-100 z-10"
          title="Detach into floating window"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
