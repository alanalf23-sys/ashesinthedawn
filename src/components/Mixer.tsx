import { useDAW } from '../contexts/DAWContext';
import { Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect, memo } from 'react';
import MixerTile from './MixerTile';
import DetachablePluginRack from './DetachablePluginRack';
import MixerOptionsTile from './MixerOptionsTile';
import { Tooltip, TOOLTIP_LIBRARY } from './TooltipProvider';
import CodetteSuggestionsPanel from './CodetteSuggestionsPanel';
import CodetteAnalysisPanel from './CodetteAnalysisPanel';

interface DetachedTileState {
  trackId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// Define mixer constants with safe defaults (config accessed in component)
const DEFAULT_STRIP_WIDTH = 100; // Default channel strip width
const DEFAULT_STRIP_HEIGHT = 350;
const MIN_STRIP_WIDTH = 80;
const MAX_STRIP_WIDTH = 140;

const MixerComponent = () => {
  const { tracks, selectedTrack, updateTrack, deleteTrack, selectTrack, addPluginToTrack, removePluginFromTrack, togglePluginEnabled, addTrack } = useDAW();
  
  // Access configuration values inside component (at runtime)
  const stripHeight = DEFAULT_STRIP_HEIGHT; // Fixed height for channel strips
  const maxTracks = 256; // Maximum tracks allowed (configurable)
  
  // Warn if track count exceeds maximum
  if (tracks.length > maxTracks) {
    console.warn(`Track count (${tracks.length}) exceeds maximum tracks (${maxTracks})`);
  }
  
  const [detachedTiles, setDetachedTiles] = useState<DetachedTileState[]>([]);
  const [detachedOptionsTile, setDetachedOptionsTile] = useState(false);
  const [detachedPluginRacks, setDetachedPluginRacks] = useState<Record<string, boolean>>({});
  const [levels, setLevels] = useState<Record<string, number>>({}); // live RMS values
  const [masterFader, setMasterFader] = useState(0.7); // Master fader state (0-1)
  const [scaledStripWidth, setScaledStripWidth] = useState(DEFAULT_STRIP_WIDTH);
  const [isHoveringMixer, setIsHoveringMixer] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const animationRef = useRef<number | null>(null);
  const faderDraggingRef = useRef(false);
  const faderContainerRef = useRef<HTMLDivElement>(null);
  const mixerTracksRef = useRef<HTMLDivElement>(null);

  // --- Global Drag Handler for Master Fader ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!faderDraggingRef.current || !faderContainerRef.current) return;

      const rect = faderContainerRef.current.getBoundingClientRect();
      const newFader = Math.max(
        0,
        Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
      );
      setMasterFader(newFader);
    };

    const handleMouseUp = () => {
      faderDraggingRef.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // --- Smart Scaling Handler ---
  useEffect(() => {
    const handleResize = () => {
      if (!mixerTracksRef.current?.parentElement) return;
      const containerWidth = mixerTracksRef.current.parentElement.clientWidth;
      const totalTracks = tracks.length + 1; // +1 for master
      const availableWidth = containerWidth - 12; // subtract padding
      
      if (totalTracks > 0 && containerWidth > 0) {
        // Calculate optimal strip width based on available space
        const optimalWidth = Math.floor((availableWidth - (totalTracks * 8)) / totalTracks);
        const boundedWidth = Math.max(MIN_STRIP_WIDTH, Math.min(MAX_STRIP_WIDTH, optimalWidth));
        setScaledStripWidth(boundedWidth);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tracks.length]);

  // Helper Functions ---
  const getMeterColor = (db: number) => {
    if (db > -3) return "rgb(255, 0, 0)";
    if (db > -8) return "rgb(255, 200, 0)";
    if (db > -20) return "rgb(0, 255, 0)";
    return "rgb(0, 150, 0)";
  };

  const linearToDb = (val: number) =>
    val <= 0.00001 ? -60 : 20 * Math.log10(val);

  // --- Master Fader Volume Control ---
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const engine = (window as any)?.audioEngineRef?.current;
    if (engine && typeof engine.setMasterVolume === "function") {
      const masterDb = linearToDb(masterFader);
      engine.setMasterVolume(masterDb);
    }
  }, [masterFader]);

  // --- Real-Time Level Polling ---
  useEffect(() => {
    const updateLevels = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const engine = (window as any)?.audioEngineRef?.current;
      if (engine && typeof engine.getTrackLevel === "function") {
        const newLevels: Record<string, number> = {};
        tracks.forEach((track) => {
          const raw = engine.getTrackLevel(track.id);
          const smoothed = 0.6 * (levels[track.id] || 0) + 0.4 * (raw || 0);
          newLevels[track.id] = smoothed;
        });
        setLevels(newLevels);
      }
      animationRef.current = requestAnimationFrame(updateLevels);
    };
    animationRef.current = requestAnimationFrame(updateLevels);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [tracks, levels]);

  // --- Detach/Dock Handlers ---
  const handleDetachTile = (trackId: string) => {
    const isAlreadyDetached = detachedTiles.some((t) => t.trackId === trackId);
    if (!isAlreadyDetached) {
      setDetachedTiles((prev) => [
        ...prev,
        {
          trackId,
          position: {
            x: 200 + Math.random() * 100,
            y: 150 + Math.random() * 100,
          },
          size: { width: scaledStripWidth, height: stripHeight },
        },
      ]);
    }
  };

  const handleDockTile = (trackId: string) => {
    setDetachedTiles((prev) => prev.filter((t) => t.trackId !== trackId));
  };

  // --- Mixer Layout ---
  return (
    <>
      <div className="h-full w-full flex flex-col bg-gray-900 overflow-hidden">
        <div className="h-10 bg-gradient-to-r from-gray-800 to-gray-750 border-b-2 border-gray-700 flex items-center justify-between px-3 gap-2 flex-shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Sliders className="w-3 h-3 text-gray-400" />
            <span className="text-xs font-semibold text-gray-300 whitespace-nowrap">
              Mixer{" "}
              {detachedTiles.length > 0 && `(${detachedTiles.length})`}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <span className="text-xs text-gray-500 hidden sm:inline">Drag • +Track</span>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-0.5 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
              title={isMinimized ? "Expand mixer" : "Minimize mixer"}
            >
              {isMinimized ? (
                <ChevronUp className="w-3 h-3 text-gray-400 hover:text-gray-200" />
              ) : (
                <ChevronDown className="w-3 h-3 text-gray-400 hover:text-gray-200" />
              )}
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex-1 overflow-hidden flex flex-col">
          {/* Mixer Strips Container with Smart Scrollbar */}
          <div 
            className="flex-1 overflow-y-hidden bg-gray-950 group/scroller"
            style={{
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: isHoveringMixer ? '#3b82f6 #1f2937' : '#4b5563 #111827',
            }}
            onMouseEnter={() => setIsHoveringMixer(true)}
            onMouseLeave={() => setIsHoveringMixer(false)}
            ref={mixerTracksRef}
          >
            {/* Custom scrollbar styles via CSS */}
            <style>{`
              .group\\/scroller::-webkit-scrollbar {
                height: 8px;
              }
              .group\\/scroller::-webkit-scrollbar-track {
                background: #111827;
                border-radius: 4px;
                margin: 2px;
              }
              .group\\/scroller::-webkit-scrollbar-thumb {
                background: #4b5563;
                border-radius: 4px;
                border: 2px solid #111827;
                transition: all 0.2s ease;
              }
              .group\\/scroller::-webkit-scrollbar-thumb:hover {
                background: #3b82f6;
                border-color: #1e3a8a;
              }
              .group\\/scroller::-webkit-scrollbar-corner {
                background: #111827;
              }
            `}</style>
            <div
              className="flex h-full gap-1 p-2 min-w-max transition-all duration-300"
              onDoubleClick={(e) => {
                // Only add track if double-clicking on empty space (not on tracks)
                if (e.target === e.currentTarget) {
                  addTrack("audio");
                }
              }}
            >
              {/* Master Strip */}
              <div
                className="flex-shrink-0 select-none transition-all duration-300 hover:shadow-lg"
                style={{
                  width: `${scaledStripWidth}px`,
                  height: `${stripHeight}px`,
                  border: "2px solid rgb(202, 138, 4)",
                  backgroundColor: "rgb(30, 24, 15)",
                  borderRadius: "4px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "4px",
                  boxShadow: "0 0 0 rgba(202, 138, 4, 0.3) inset",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  className="font-bold text-gray-900 flex items-center justify-center bg-yellow-600 rounded"
                  style={{ height: "40px" }}
                >
                  Master
                </div>

                <div className="flex flex-col items-center justify-between flex-1 gap-3 py-2">
                  {/* Master Fader - Interactive with continuous drag */}
                  <Tooltip content={TOOLTIP_LIBRARY['volume']} position="right">
                    <div
                      ref={faderContainerRef}
                      className="flex-1 w-full flex items-end justify-center relative select-none"
                      style={{ userSelect: "none" }}
                    >
                      <div
                        className="rounded bg-gradient-to-b from-yellow-500 to-yellow-700 cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow"
                        style={{
                          width: "12px",
                          height: `${masterFader * 100}%`,
                          maxHeight: "140px",
                          minHeight: "20px",
                          boxShadow: faderDraggingRef.current
                            ? "0 0 12px rgba(255, 200, 0, 1)"
                            : "0 0 6px rgba(255, 200, 0, 0.7)",
                        }}
                        onMouseDown={() => {
                          faderDraggingRef.current = true;
                        }}
                      />
                    </div>
                  </Tooltip>

                  {/* Master Level Meter */}
                  <Tooltip 
                    content={{
                      title: 'Level Meter',
                      description: 'Real-time level display showing current master output level in dB',
                      category: 'mixer',
                      relatedFunctions: ['Volume Fader', 'Clipping Detection'],
                      performanceTip: 'Green (-20 to -8dB) is safe; Yellow (-8 to -3dB) is good; Red (>-3dB) risks clipping',
                      examples: ['Peak level indicator', 'RMS (Root Mean Square) display'],
                    }}
                    position="right"
                  >
                    <div
                      className="rounded border-2 border-yellow-700 bg-gray-950 flex flex-col-reverse shadow-inner"
                      style={{
                        width: "16px",
                        height: "40px",
                        minHeight: "40px",
                      }}
                    >
                      <div
                        style={{
                          height: `${(levels.master || 0) * 100}%`,
                          backgroundColor: getMeterColor(
                            linearToDb(levels.master || 0.001)
                          ),
                          transition: "height 0.1s linear",
                        }}
                      />
                    </div>
                  </Tooltip>

                  {/* dB Display */}
                  <div className="text-yellow-400 font-mono text-xs">
                    {linearToDb(masterFader).toFixed(1)} dB
                  </div>
                </div>
              </div>

              {/* Track Tiles */}
              {tracks.length === 0 ? (
                <div className="flex items-center justify-center w-full text-gray-500 text-sm">
                  No tracks. Add some to see the mixer.
                </div>
              ) : (
                tracks
                  .filter((t) => t.type !== "master")
                  .map((track) => (
                    <MixerTile
                      key={track.id}
                      track={track}
                      isSelected={selectedTrack?.id === track.id}
                      onSelect={selectTrack}
                      onDelete={deleteTrack}
                      onUpdate={updateTrack}
                      onAddPlugin={addPluginToTrack}
                      onRemovePlugin={removePluginFromTrack}
                      levels={levels}
                      stripWidth={scaledStripWidth}
                      stripHeight={stripHeight}
                      isDetached={false}
                      onDetach={() => handleDetachTile(track.id)}
                    />
                  ))
              )}
            </div>
          </div>

          {/* Plugin Rack for Selected Track */}
          {selectedTrack && selectedTrack.type !== 'master' && !detachedPluginRacks[selectedTrack.id] && (
            <div className="h-32 border-t border-gray-700 bg-gray-800 p-4 overflow-y-auto">
              <DetachablePluginRack
                plugins={selectedTrack.inserts}
                onAddPlugin={(plugin) => addPluginToTrack(selectedTrack.id, plugin)}
                onRemovePlugin={(pluginId) => removePluginFromTrack(selectedTrack.id, pluginId)}
                onTogglePlugin={(pluginId, enabled) => togglePluginEnabled(selectedTrack.id, pluginId, enabled)}
                trackId={selectedTrack.id}
                trackName={selectedTrack.name}
                isDetached={false}
                onDock={() => setDetachedPluginRacks(prev => ({ ...prev, [selectedTrack.id]: true }))}
              />
            </div>
          )}
        </div>
        )}
      </div>

      {/* Detached Floating Tiles */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Detached Options Tile */}
        {detachedOptionsTile && (
          <div className="pointer-events-auto">
            <MixerOptionsTile
              tracks={tracks}
              onUpdateTrack={updateTrack}
              onRemovePlugin={removePluginFromTrack}
              stripWidth={scaledStripWidth}
              stripHeight={stripHeight}
              position={{ x: 400, y: 150 }}
              onDock={() => setDetachedOptionsTile(false)}
              isDetached={true}
            />
          </div>
        )}

        {/* Detached Plugin Racks */}
        {Object.entries(detachedPluginRacks).map(([trackId, isDetached]) => {
          if (!isDetached) return null;
          const track = tracks.find(t => t.id === trackId);
          if (!track) return null;

          return (
            <div key={`plugin-${trackId}`} className="pointer-events-auto">
              <DetachablePluginRack
                plugins={track.inserts}
                onAddPlugin={(plugin) => addPluginToTrack(trackId, plugin)}
                onRemovePlugin={(pluginId) => removePluginFromTrack(trackId, pluginId)}
                onTogglePlugin={(pluginId, enabled) => togglePluginEnabled(trackId, pluginId, enabled)}
                trackId={trackId}
                trackName={track.name}
                isDetached={true}
                position={{ x: 300 + Math.random() * 100, y: 200 + Math.random() * 100 }}
                onDock={() => setDetachedPluginRacks(prev => ({ ...prev, [trackId]: false }))}
              />
            </div>
          );
        })}

        {detachedTiles.map((tile) => {
          const track = tracks.find((t) => t.id === tile.trackId);
          if (!track) return null;

          return (
            <div
              key={tile.trackId}
              className="pointer-events-auto"
              style={{
                position: "fixed",
                left: 0,
                top: 0,
              }}
            >
              <MixerTile
                track={track}
                isSelected={selectedTrack?.id === track.id}
                onSelect={selectTrack}
                onDelete={(id) => {
                  deleteTrack(id);
                  handleDockTile(id);
                }}
                onUpdate={updateTrack}
                levels={levels}
                stripWidth={scaledStripWidth}
                stripHeight={stripHeight}
                isDetached={true}
                onDock={() => handleDockTile(track.id)}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default memo(MixerComponent);
