import React, { useState, useRef, useEffect, memo } from 'react';
import { useDAW } from '../contexts/DAWContext';
import {
  Sliders, ChevronDown, ChevronUp, Volume2, RotateCcw,
  Grid3x3, List, Maximize2, GripVertical,
} from 'lucide-react';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface FloatingFader {
  id: string;
  trackId: string;
  label: string;
  value: number;
  min: number;
  max: number;
  type: 'volume' | 'pan' | 'gain' | 'custom';
  position: { x: number; y: number };
  isDragging: boolean;
}

interface MixerPreset {
  name: string;
  layout: 'vertical' | 'horizontal' | 'compact';
  stripWidth: number;
  stripHeight: number;
  showMeters: boolean;
  showSends: boolean;
  showFX: boolean;
}

const MIXER_PRESETS: Record<string, MixerPreset> = {
  default: {
    name: 'Default',
    layout: 'horizontal',
    stripWidth: 100,
    stripHeight: 350,
    showMeters: true,
    showSends: true,
    showFX: true,
  },
  compact: {
    name: 'Compact',
    layout: 'horizontal',
    stripWidth: 70,
    stripHeight: 250,
    showMeters: false,
    showSends: false,
    showFX: false,
  },
  wide: {
    name: 'Wide',
    layout: 'horizontal',
    stripWidth: 140,
    stripHeight: 400,
    showMeters: true,
    showSends: true,
    showFX: true,
  },
  vertical: {
    name: 'Vertical',
    layout: 'vertical',
    stripWidth: 150,
    stripHeight: 80,
    showMeters: true,
    showSends: false,
    showFX: false,
  },
};

const MIN_STRIP_WIDTH = 60;
const MAX_STRIP_WIDTH = 180;
const MIN_STRIP_HEIGHT = 150;
const MAX_STRIP_HEIGHT = 500;

// ============================================================================
// FLOATING FADER COMPONENT
// ============================================================================

const FloatingFaderWindow = memo(({
  fader,
  onUpdate,
  onClose,
}: {
  fader: FloatingFader;
  onUpdate: (id: string, value: number, isDragging: boolean) => void;
  onClose: (id: string) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const windowEl = windowRef.current?.parentElement;
      if (windowEl) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        windowEl.style.left = `${newX}px`;
        windowEl.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={windowRef}
      className="fixed bg-gray-800 border-2 border-blue-500 rounded-lg shadow-2xl z-50 min-w-max"
      style={{
        left: `${fader.position.x}px`,
        top: `${fader.position.y}px`,
      }}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-cyan-700 px-3 py-2 rounded-t-md cursor-move flex items-center justify-between"
      >
        <span className="text-xs font-bold text-white flex items-center gap-2">
          <GripVertical className="w-3 h-3" />
          {fader.label}
        </span>
        <button
          onClick={() => onClose(fader.id)}
          className="text-white hover:bg-blue-800 p-0.5 rounded transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 items-center">
        {/* Vertical Fader */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-sm font-semibold text-gray-200">{fader.label}</div>
          <input
            type="range"
            min={fader.min}
            max={fader.max}
            value={fader.value}
            onChange={(e) => onUpdate(fader.id, parseFloat(e.target.value), true)}
            className="h-32 appearance-none bg-gray-700 rounded cursor-pointer vertical-slider"
            style={{
              WebkitAppearance: 'slider-vertical',
            }}
          />
          <div className="text-xs text-gray-400">{fader.value.toFixed(1)}</div>
        </div>

        {/* Value Display & Reset */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => onUpdate(fader.id, (fader.min + fader.max) / 2, false)}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors"
            title="Reset to center"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <span className="text-gray-400">
            {((fader.value / fader.max) * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
});

FloatingFaderWindow.displayName = 'FloatingFaderWindow';

// ============================================================================
// MIXER STRIP COMPONENT (RESIZABLE)
// ============================================================================

interface MixerStripProps {
  trackId: string;
  width: number;
  height: number;
  onWidthChange: (width: number) => void;
  onDetach: (trackId: string) => void;
  showMeters?: boolean;
}

const ResizableMixerStrip = memo(({
  trackId,
  width,
  height,
  onWidthChange,
  onDetach,
  showMeters = true,
}: MixerStripProps) => {
  const { tracks, selectedTrack, selectTrack, updateTrack } = useDAW();
  const [isResizing, setIsResizing] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const track = tracks.find((t) => t.id === trackId);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!stripRef.current) return;
      const rect = stripRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      const clampedWidth = Math.max(MIN_STRIP_WIDTH, Math.min(MAX_STRIP_WIDTH, newWidth));
      onWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  if (!track) return null;

  const isSelected = selectedTrack?.id === trackId;

  return (
    <div
      ref={stripRef}
      className={`relative bg-gray-800 border rounded-lg transition-all duration-100 flex flex-col overflow-hidden group ${
        isSelected
          ? 'border-blue-500 shadow-lg shadow-blue-500/20'
          : 'border-gray-700 hover:border-gray-600'
      }`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Track Header */}
      <div
        onClick={() => selectTrack(trackId)}
        className="px-2 py-2 bg-slate-800 cursor-pointer flex flex-col gap-1 flex-shrink-0"
      >
        <div className="text-xs font-bold text-gray-100 truncate">{track.name}</div>
        <div className="text-xs text-gray-500">{track.type}</div>
      </div>

      {/* Fader Area */}
      <div className="flex-1 flex flex-col items-center px-2 py-3 gap-2 min-h-0">
        {/* Volume Fader */}
        <div className="flex-1 flex flex-col items-center gap-2 w-full">
          <div className="text-xs text-gray-400">Vol</div>
          <input
            type="range"
            min="-60"
            max="6"
            value={track.volume}
            onChange={(e) => updateTrack(trackId, { volume: parseFloat(e.target.value) })}
            className="h-20 w-6 appearance-none bg-gray-700 rounded cursor-pointer flex-1 vertical-slider"
            style={{
              WebkitAppearance: 'slider-vertical',
            }}
            title={`Volume: ${track.volume.toFixed(1)} dB`}
          />
          <div className="text-xs text-gray-300 font-semibold">{track.volume.toFixed(1)}</div>
        </div>

        {/* Pan Control */}
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={track.pan}
          onChange={(e) => updateTrack(trackId, { pan: parseFloat(e.target.value) })}
          className="w-12 h-1 bg-gray-700 rounded cursor-pointer"
          title={`Pan: ${(track.pan * 100).toFixed(0)}%`}
        />
        <div className="text-xs text-gray-400">
          {track.pan > 0 ? 'R' : track.pan < 0 ? 'L' : 'C'}
        </div>
      </div>

      {/* Meter Display (optional) */}
      {showMeters && (
        <div className="px-2 py-2 bg-gray-900/50 border-t border-gray-700 h-12 flex items-center justify-center">
          <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, (track.volume + 60) * 1.67))}%` }}
            />
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="px-2 py-2 bg-gray-900 border-t border-gray-700 flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={() => updateTrack(trackId, { muted: !track.muted })}
          className={`w-full px-2 py-1 rounded text-xs font-semibold transition-colors ${
            track.muted
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
          title={track.muted ? 'Unmute' : 'Mute'}
        >
          {track.muted ? 'Muted' : 'Mute'}
        </button>
        <button
          onClick={() => updateTrack(trackId, { soloed: !track.soloed })}
          className={`w-full px-2 py-1 rounded text-xs font-semibold transition-colors ${
            track.soloed
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
          title={track.soloed ? 'Un-solo' : 'Solo'}
        >
          {track.soloed ? 'Solo' : 'Solo'}
        </button>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 bottom-0 w-1.5 bg-cyan-500/40 hover:bg-cyan-500/80 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to resize strip width"
      />

      {/* Detach Button */}
      <button
        onClick={() => onDetach(trackId)}
        className="absolute top-2 right-2 p-1 bg-blue-600 hover:bg-blue-500 rounded opacity-0 group-hover:opacity-100 transition-all text-white"
        title="Detach to floating window"
      >
        <Maximize2 className="w-3 h-3" />
      </button>
    </div>
  );
});

ResizableMixerStrip.displayName = 'ResizableMixerStrip';

// ============================================================================
// MASTER TRACK COMPONENT
// ============================================================================

const MasterTrack = memo(({
  width,
  height,
  onWidthChange,
}: {
  width: number;
  height: number;
  onWidthChange: (width: number) => void;
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const masterRef = useRef<HTMLDivElement>(null);
  const [masterVolume, setMasterVolume] = useState(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!masterRef.current) return;
      const rect = masterRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      const clampedWidth = Math.max(MIN_STRIP_WIDTH, Math.min(MAX_STRIP_WIDTH, newWidth));
      onWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  return (
    <div
      ref={masterRef}
      className="relative bg-slate-950 border-2 border-purple-600 rounded-md flex flex-col overflow-hidden group shadow-md shadow-purple-600/20"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Track Header */}
      <div className="px-3 py-3 bg-purple-800 flex flex-col gap-1 flex-shrink-0">
        <div className="text-sm font-bold text-white">MASTER</div>
        <div className="text-xs text-purple-200">Master Output</div>
      </div>

      {/* Fader Area */}
      <div className="flex-1 flex flex-col items-center px-3 py-3 gap-3 min-h-0">
        <div className="flex-1 flex flex-col items-center gap-2 w-full">
          <div className="text-xs text-purple-300 font-semibold">Level</div>
          <input
            type="range"
            min="-60"
            max="6"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="h-24 w-6 appearance-none bg-purple-900/50 rounded cursor-pointer flex-1 vertical-slider"
            style={{
              WebkitAppearance: 'slider-vertical',
            }}
          />
          <div className="text-xs text-purple-200 font-semibold">{masterVolume.toFixed(1)}</div>
        </div>
      </div>

      {/* Master Meter */}
      <div className="px-3 py-3 bg-purple-950/50 border-t border-purple-600 h-16 flex flex-col gap-2 flex-shrink-0">
        <div className="text-xs text-purple-300 font-semibold">Master Meter</div>
        <div className="flex gap-1 flex-1">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-purple-900 rounded-sm overflow-hidden"
            >
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{
                  height: `${Math.max(0, (masterVolume + 60) * 1.67) - i * 16.7}%`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 bottom-0 w-1.5 bg-purple-500/40 hover:bg-purple-500/80 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
});

MasterTrack.displayName = 'MasterTrack';

// ============================================================================
// MAIN MIXER PRO COMPONENT
// ============================================================================

export default function MixerPro() {
  const { tracks } = useDAW();

  const [stripWidths, setStripWidths] = useState<Record<string, number>>({});
  const [preset, setPreset] = useState<keyof typeof MIXER_PRESETS>('default');
  const [stripHeight, setStripHeight] = useState(350);
  const [isMinimized, setIsMinimized] = useState(false);
  const [floatingFaders, setFloatingFaders] = useState<FloatingFader[]>([]);
  const [masterWidth, setMasterWidth] = useState(100);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [showMeters, setShowMeters] = useState(true);

  const currentPreset = MIXER_PRESETS[preset];

  // Initialize strip widths
  useEffect(() => {
    const newWidths: Record<string, number> = {};
    tracks.forEach((track) => {
      if (!stripWidths[track.id]) {
        newWidths[track.id] = currentPreset.stripWidth;
      }
    });
    if (Object.keys(newWidths).length > 0) {
      setStripWidths((prev) => ({ ...prev, ...newWidths }));
    }
  }, [tracks, currentPreset.stripWidth, stripWidths]);

  const handlePresetChange = (newPreset: keyof typeof MIXER_PRESETS) => {
    setPreset(newPreset);
    const p = MIXER_PRESETS[newPreset];
    setStripHeight(p.stripHeight);
    const newLayout = p.layout === 'compact' ? 'horizontal' : p.layout;
    setLayout(newLayout);
  };

  const handleAddFloatingFader = (trackId: string, type: 'volume' | 'pan' | 'gain') => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    const newFader: FloatingFader = {
      id: `fader-${Date.now()}`,
      trackId,
      label: `${track.name} - ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      value: type === 'volume' ? track.volume : type === 'pan' ? track.pan : 0,
      min: type === 'pan' ? -1 : -60,
      max: type === 'pan' ? 1 : 6,
      type,
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
      },
      isDragging: false,
    };

    setFloatingFaders((prev) => [...prev, newFader]);
  };

  const handleUpdateFloatingFader = (id: string, value: number, isDragging: boolean) => {
    setFloatingFaders((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              value,
              isDragging,
            }
          : f
      )
    );
  };

  const handleCloseFloatingFader = (id: string) => {
    setFloatingFaders((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="h-12 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-3 gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-gray-100">Mixer Pro</span>
          <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-800 rounded">
            {tracks.length} tracks
          </span>
        </div>

        {/* Layout Controls */}
        <div className="flex items-center gap-1">
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value as keyof typeof MIXER_PRESETS)}
            className="text-xs bg-gray-700 text-gray-200 border border-gray-600 rounded px-2 py-1 hover:bg-gray-600 transition-colors cursor-pointer"
            title="Select mixer preset"
          >
            {Object.entries(MIXER_PRESETS).map(([key, p]) => (
              <option key={key} value={key}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowMeters(!showMeters)}
            className={`p-1.5 rounded transition-colors ${
              showMeters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Toggle meters"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setLayout(layout === 'horizontal' ? 'vertical' : 'horizontal')}
            className="p-1.5 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors"
            title={`Switch to ${layout === 'horizontal' ? 'vertical' : 'horizontal'} layout`}
          >
            {layout === 'horizontal' ? <Grid3x3 className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Mixer Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-auto bg-gray-950 flex flex-col min-h-0">
          {/* Height Slider */}
          <div className="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">Track Height:</span>
            <input
              type="range"
              min={MIN_STRIP_HEIGHT}
              max={MAX_STRIP_HEIGHT}
              value={stripHeight}
              onChange={(e) => setStripHeight(parseInt(e.target.value))}
              className="flex-1 max-w-xs"
            />
            <span className="text-xs text-gray-400">{stripHeight}px</span>
          </div>

          {/* Tracks Container */}
          <div className="flex-1 overflow-auto flex gap-3 p-3 min-h-0 min-w-0">
            {/* Mixer Strips */}
            {tracks.map((track) => (
              <ResizableMixerStrip
                key={track.id}
                trackId={track.id}
                width={stripWidths[track.id] || currentPreset.stripWidth}
                height={stripHeight}
                onWidthChange={(width) =>
                  setStripWidths((prev) => ({ ...prev, [track.id]: width }))
                }
                onDetach={() => handleAddFloatingFader(track.id, 'volume')}
                showMeters={showMeters}
              />
            ))}

            {/* Master Track */}
            <MasterTrack
              width={masterWidth}
              height={stripHeight}
              onWidthChange={setMasterWidth}
            />
          </div>
        </div>
      )}

      {/* Floating Fader Windows */}
      {floatingFaders.map((fader) => (
        <FloatingFaderWindow
          key={fader.id}
          fader={fader}
          onUpdate={handleUpdateFloatingFader}
          onClose={handleCloseFloatingFader}
        />
      ))}
    </div>
  );
}
