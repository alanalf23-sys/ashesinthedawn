import React, { useState, useEffect, useRef } from "react";
import { Track, Plugin } from "../types";
import { Trash2, Maximize2, Plus, X, Minimize } from "lucide-react";
import { Tooltip } from "./TooltipProvider";
import VolumeFader from "./VolumeFader";

interface MixerTileProps {
  track: Track;
  isSelected: boolean;
  onSelect: (trackId: string) => void;
  onDelete: (trackId: string) => void;
  onUpdate: (trackId: string, updates: Partial<Track>) => void;
  onAddPlugin?: (trackId: string, plugin: Plugin) => void;
  onRemovePlugin?: (trackId: string, pluginId: string) => void;
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
  onAddPlugin,
  onRemovePlugin,
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
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [activeTab, setActiveTab] = useState<"controls" | "plugins">(
    "controls"
  );
  const [showPluginMenu, setShowPluginMenu] = useState(false);
  const tileRef = useRef<HTMLDivElement>(null);

  const AVAILABLE_PLUGINS = [
    { id: "eq", name: "Parametric EQ", type: "eq" as const, icon: "🎚️" },
    { id: "comp", name: "Compressor", type: "compressor" as const, icon: "⚙️" },
    { id: "gate", name: "Gate", type: "gate" as const, icon: "🚪" },
    { id: "sat", name: "Saturation", type: "saturation" as const, icon: "⚡" },
    { id: "delay", name: "Delay", type: "delay" as const, icon: "⏱️" },
    { id: "reverb", name: "Reverb", type: "reverb" as const, icon: "🌊" },
    { id: "meter", name: "Meter", type: "meter" as const, icon: "📊" },
  ];

  const addPlugin = (pluginId: string) => {
    const pluginDef = AVAILABLE_PLUGINS.find((p) => p.id === pluginId);
    if (pluginDef && onAddPlugin) {
      const newPlugin: Plugin = {
        id: `${pluginId}-${Date.now()}-${track.id}`,
        name: pluginDef.name,
        type: pluginDef.type,
        enabled: true,
        parameters: {},
      };
      onAddPlugin(track.id, newPlugin);
      setShowPluginMenu(false);
    }
  };

  const getMeterColor = (db: number) => {
    if (db > -3) return "rgb(255, 0, 0)";
    if (db > -8) return "rgb(255, 200, 0)";
    if (db > -20) return "rgb(0, 255, 0)";
    return "rgb(0, 150, 0)";
  };

  const linearToDb = (val: number) =>
    val <= 0.00001 ? -60 : 20 * Math.log10(val);

  const handleMouseDownTitle = (e: React.MouseEvent) => {
    if (!isDetached || (e.target as HTMLElement).closest("button")) return;
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
        const newX = Math.max(
          0,
          Math.min(e.clientX - dragStart.x, window.innerWidth - 100)
        );
        const newY = Math.max(
          0,
          Math.min(e.clientY - dragStart.y, window.innerHeight - 100)
        );
        setPosition({
          x: newX,
          y: newY,
        });
      }
      if (isResizing && isDetached) {
        const newWidth = Math.max(
          minWidth,
          Math.min(resizeStart.width + (e.clientX - resizeStart.x), maxWidth)
        );
        const newHeight = Math.max(
          minHeight,
          Math.min(resizeStart.height + (e.clientY - resizeStart.y), maxHeight)
        );
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if ((isDragging || isResizing) && isDetached) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, isDetached]);

  const meter = levels[track.id] || 0;
  const db = linearToDb(meter);
  const currentWidth = isDetached ? size.width : stripWidth;
  const currentHeight = isDetached ? size.height : stripHeight;

  const headerHeight = Math.max(currentHeight * 0.12, 24);
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
          border: isSelected
            ? "2px solid rgb(59, 130, 246)"
            : "1px solid rgb(55, 65, 81)",
          backgroundColor: "rgb(17, 24, 39)",
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "4px",
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
        <Tooltip 
          content={{
            title: 'Detach Tile',
            description: 'Move this track control to a floating window for flexible workspace layout',
            hotkey: 'Double-click',
            category: 'mixer',
            relatedFunctions: ['Dock Tile', 'Resize', 'Move'],
            performanceTip: 'Floating tiles stay on top of other windows; useful for multi-monitor setups',
            examples: ['Detach one track to monitor while editing others', 'Create control surfaces by detaching multiple tracks'],
          }}
          position="left"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDetach?.();
            }}
            className="absolute top-1 right-1 p-1 rounded bg-blue-600/0 hover:bg-blue-600/80 text-blue-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-150 hover:scale-110 active:scale-95 z-10"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Track Header with Controls */}
        <div
          style={{
            height: `${headerHeight}px`,
            backgroundColor: track.color,
            borderRadius: "3px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: `${Math.max(currentWidth * 0.12, 9)}px`,
            flexShrink: 0,
            paddingLeft: "4px",
            paddingRight: "4px",
            gap: "2px",
          }}
          className="font-bold text-gray-900 overflow-hidden"
        >
          {/* Track Name */}
          <div className="truncate flex-1">{track.name}</div>

          {/* Inline Control Buttons */}
          <div className="flex gap-0.5 flex-shrink-0">
            {/* Mute Button */}
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
                  onUpdate(track.id, { muted: !track.muted });
                }}
                className={`px-1 rounded text-xs font-bold transition-all duration-150 hover:scale-110 active:scale-95 ${
                  track.muted
                    ? "bg-red-600 text-white hover:shadow-lg hover:shadow-red-500/50"
                    : "bg-gray-900/50 text-gray-900 hover:bg-gray-900/70 hover:shadow-md hover:shadow-gray-400/30"
                }`}
              >
                M
              </button>
            </Tooltip>

            {/* Solo Button */}
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
                  onUpdate(track.id, { soloed: !track.soloed });
                }}
                className={`px-1 rounded text-xs font-bold transition-all duration-150 hover:scale-110 active:scale-95 ${
                  track.soloed
                    ? "bg-yellow-500 text-gray-900 hover:shadow-lg hover:shadow-yellow-500/50"
                    : "bg-gray-900/50 text-gray-900 hover:bg-gray-900/70 hover:shadow-md hover:shadow-gray-400/30"
                }`}
              >
                S
              </button>
            </Tooltip>

            {/* Record Arm Button */}
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
                  onUpdate(track.id, { armed: !track.armed });
                }}
                className={`px-1 rounded text-xs font-bold transition-all duration-150 hover:scale-110 active:scale-95 ${
                  track.armed
                    ? "bg-red-700 text-white hover:shadow-lg hover:shadow-red-500/50"
                    : "bg-gray-900/50 text-gray-900 hover:bg-gray-900/70 hover:shadow-md hover:shadow-gray-400/30"
                }`}
              >
                R
              </button>
            </Tooltip>
          </div>
        </div>

        {/* TAB BUTTONS */}
        <div className="flex gap-1 w-full flex-shrink-0">
          <button
            onClick={() => setActiveTab("controls")}
            className={`flex-1 py-1 text-xs rounded font-semibold transition ${
              activeTab === "controls"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Vol
          </button>
          <button
            onClick={() => setActiveTab("plugins")}
            className={`flex-1 py-1 text-xs rounded font-semibold transition relative ${
              activeTab === "plugins"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            FX{" "}
            {track.inserts?.length > 0 && (
              <span className="ml-1 text-xs">({track.inserts.length})</span>
            )}
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "controls" ? (
            // CONTROLS TAB: METER + FADER
            <div className="flex flex-col items-center justify-end flex-1 gap-2 w-full">
              {/* Meter */}
              <div
                className="rounded border border-gray-700 bg-gray-950 flex flex-col-reverse shadow-inner"
                style={{
                  width: `${meterWidth}px`,
                  height: "60%",
                  minHeight: "40px",
                }}
              >
                <div
                  style={{
                    height: `${meter * 100}%`,
                    backgroundColor: getMeterColor(db),
                    transition: "height 0.1s linear",
                    borderRadius: "1px",
                  }}
                />
              </div>

              {/* dB Display */}
              <Tooltip 
                content={{
                  title: 'Level Display',
                  description: 'Current track level in decibels (dB). Green is safe, Yellow is good, Red risks clipping.',
                  category: 'mixer',
                  relatedFunctions: ['Volume Fader', 'Clipping Detection', 'Input Gain'],
                  performanceTip: 'Aim for -6dB to -3dB peak to leave headroom for effects and mastering',
                  examples: ['Vocals: -12dB to -6dB', 'Drums: -9dB to -3dB', 'Bass: -12dB to -6dB'],
                }}
                position="left"
              >
                <div
                  className="font-mono text-xs text-gray-400 text-center cursor-help"
                  style={{
                    padding: "2px",
                    minHeight: "16px",
                  }}
                >
                  {db.toFixed(1)} dB
                </div>
              </Tooltip>

              {/* Professional Volume Fader */}
              <VolumeFader
                trackId={track.id}
                currentVolume={track.volume}
                onVolumeChange={(vol) => onUpdate(track.id, { volume: vol })}
                label="VOL"
                height={Math.max(currentHeight * 0.4, 80)}
                showLabel={true}
                showValue={true}
              />
            </div>
          ) : (
            // PLUGINS TAB: PLUGIN LIST
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 w-full">
              {/* Plugin List */}
              <div className="space-y-1 flex-1 overflow-y-auto">
                {track.inserts && track.inserts.length > 0 ? (
                  track.inserts.map((pluginItem: Plugin | string) => {
                    const pluginId =
                      typeof pluginItem === "string"
                        ? pluginItem
                        : pluginItem.id || "unknown";
                    return (
                      <div
                        key={pluginId}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-gray-700 border border-gray-600 text-xs"
                      >
                        <div className="flex-1 truncate text-gray-300">
                          📦 {pluginId}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePlugin?.(track.id, pluginId);
                          }}
                          className="p-0.5 hover:bg-red-600 rounded transition"
                        >
                          <X className="w-3 h-3 text-gray-400 hover:text-white" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-gray-500 text-center py-3 italic">
                    No plugins
                  </div>
                )}
              </div>

              {/* Add Plugin Button */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPluginMenu(!showPluginMenu);
                  }}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>

                {showPluginMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-900 border border-gray-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                    {AVAILABLE_PLUGINS.map((plugin) => (
                      <button
                        key={plugin.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          addPlugin(plugin.id);
                        }}
                        className="w-full text-left px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition first:rounded-t last:rounded-b whitespace-nowrap flex items-center gap-2"
                      >
                        <span>{plugin.icon}</span>
                        <span className="truncate">{plugin.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delete Button */}
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
          position="top"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(track.id);
            }}
            className="w-full rounded font-semibold bg-gray-700 text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition flex items-center justify-center gap-1"
            style={{
              fontSize: `${Math.max(stripWidth * 0.08, 8)}px`,
              padding: "4px",
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
        border: isSelected
          ? "2px solid rgb(59, 130, 246)"
          : "2px solid rgb(55, 65, 81)",
        backgroundColor: "rgb(17, 24, 39)",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "4px",
        zIndex: isDragging ? 1000 : 100,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Title Bar - Draggable */}
      <div
        onMouseDown={handleMouseDownTitle}
        className="h-6 bg-gradient-to-r from-gray-800 via-gray-750 to-gray-800 border-b border-gray-600 rounded-t-1 flex items-center justify-between px-3 flex-shrink-0 cursor-move hover:bg-gradient-to-r hover:from-gray-700 hover:via-gray-700 hover:to-gray-700 transition-all"
      >
        <span className="text-xs font-semibold text-gray-100 truncate flex-1">
          {track.name}
        </span>
        <Tooltip 
          content={{
            title: 'Dock Tile',
            description: 'Return this floating track control back to the main mixer window',
            hotkey: 'Double-click title',
            category: 'mixer',
            relatedFunctions: ['Detach Tile', 'Minimize', 'Maximize'],
            performanceTip: 'Docking frees screen space and integrates controls back into the main workspace',
            examples: ['Dock when done monitoring a specific track', 'Dock all floating tiles before exporting'],
          }}
          position="left"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDock?.();
            }}
            className="p-0.5 hover:bg-blue-600/30 rounded transition-all duration-150 text-gray-400 hover:text-blue-400 hover:scale-110 active:scale-95 ml-2"
          >
            <Minimize className="w-3 h-3" />
          </button>
        </Tooltip>
      </div>

      {/* Track Header with Controls */}
      <div
        style={{
          height: `${headerHeight}px`,
          backgroundColor: track.color,
          borderRadius: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: `${Math.max(size.width * 0.12, 9)}px`,
          flexShrink: 0,
          paddingLeft: "4px",
          paddingRight: "4px",
          gap: "2px",
          marginTop: "4px",
        }}
        className="font-bold text-gray-900 overflow-hidden"
      >
        {/* Track Name */}
        <div className="truncate flex-1">{track.name}</div>

        {/* Inline Control Buttons */}
        <div className="flex gap-0.5 flex-shrink-0">
          {/* Mute Button */}
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
                onUpdate(track.id, { muted: !track.muted });
              }}
              className={`px-1 rounded text-xs font-bold transition-all duration-150 hover:scale-110 active:scale-95 ${
                track.muted
                  ? "bg-red-600 text-white hover:shadow-lg hover:shadow-red-500/50"
                  : "bg-gray-900/50 text-gray-900 hover:bg-gray-900/70 hover:shadow-md hover:shadow-gray-400/30"
              }`}
            >
              M
            </button>
          </Tooltip>

          {/* Solo Button */}
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
                onUpdate(track.id, { soloed: !track.soloed });
              }}
              className={`px-1 rounded text-xs font-bold transition-all duration-150 hover:scale-110 active:scale-95 ${
                track.soloed
                  ? "bg-yellow-500 text-gray-900 hover:shadow-lg hover:shadow-yellow-500/50"
                  : "bg-gray-900/50 text-gray-900 hover:bg-gray-900/70 hover:shadow-md hover:shadow-gray-400/30"
              }`}
            >
              S
            </button>
          </Tooltip>

          {/* Record Arm Button */}
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
                onUpdate(track.id, { armed: !track.armed });
              }}
              className={`px-1 rounded text-xs font-bold transition-all duration-150 hover:scale-110 active:scale-95 ${
                track.armed
                  ? "bg-red-700 text-white hover:shadow-lg hover:shadow-red-500/50"
                  : "bg-gray-900/50 text-gray-900 hover:bg-gray-900/70 hover:shadow-md hover:shadow-gray-400/30"
              }`}
            >
              R
            </button>
          </Tooltip>
        </div>
      </div>

      {/* METER + FADER */}
      <div className="flex flex-col items-center justify-end flex-1 gap-2">
        {/* Meter */}
        <div
          className="rounded border border-gray-700 bg-gray-950 flex flex-col-reverse shadow-inner"
          style={{
            width: `${meterWidth}px`,
            height: "60%",
            minHeight: "60px",
          }}
        >
          <div
            style={{
              height: `${meter * 100}%`,
              backgroundColor: getMeterColor(db),
              transition: "height 0.1s linear",
              borderRadius: "1px",
            }}
          />
        </div>

        {/* dB Display */}
        <Tooltip 
          content={{
            title: 'Level Display',
            description: 'Current track level in decibels (dB). Green is safe, Yellow is good, Red risks clipping.',
            category: 'mixer',
            relatedFunctions: ['Volume Fader', 'Clipping Detection', 'Input Gain'],
            performanceTip: 'Aim for -6dB to -3dB peak to leave headroom for effects and mastering',
            examples: ['Vocals: -12dB to -6dB', 'Drums: -9dB to -3dB', 'Bass: -12dB to -6dB'],
          }}
          position="right"
        >
          <div
            className="font-mono text-xs text-gray-400 text-center cursor-help"
            style={{
              padding: "2px",
              minHeight: "16px",
            }}
          >
            {db.toFixed(1)} dB
          </div>
        </Tooltip>

        {/* Professional Volume Fader */}
        <VolumeFader
          trackId={track.id}
          currentVolume={track.volume}
          onVolumeChange={(vol) => onUpdate(track.id, { volume: vol })}
          label="VOL"
          height={Math.max(size.height * 0.4, 100)}
          showLabel={true}
          showValue={true}
        />
      </div>

      {/* Delete */}
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
        position="top"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(track.id);
          }}
          className="w-full rounded font-semibold bg-gray-700 text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition-all duration-150 hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
          style={{
            fontSize: `${Math.max(size.width * 0.08, 8)}px`,
            padding: "4px",
            flexShrink: 0,
          }}
        >
          <Trash2 style={{ width: 12, height: 12 }} /> Del
        </button>
      </Tooltip>

      {/* Resize Handle - Bottom Right Corner */}
      <Tooltip 
        content={{
          title: 'Resize Window',
          description: 'Drag to resize this floating track control window',
          hotkey: 'Drag corner',
          category: 'mixer',
          relatedFunctions: ['Dock Tile', 'Move Window', 'Minimize'],
          performanceTip: 'Resize for better visibility of controls; larger windows show more details',
          examples: ['Make narrower to fit multiple tracks on screen', 'Make taller for easier fader control'],
        }}
        position="left"
      >
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-gradient-to-tl from-blue-500/40 to-transparent hover:from-blue-500/80 transition-all"
          style={{ zIndex: 50 }}
        />
      </Tooltip>
    </div>
  );
}
