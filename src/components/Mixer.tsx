import { useDAW } from '../contexts/DAWContext';
import { Track } from '../types';
import { Sliders } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import MixerTile from './MixerTile';
import DetachablePluginRack from './DetachablePluginRack';
import MixerOptionsTile from './MixerOptionsTile';

interface DetachedTileState {
  trackId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export default function Mixer() {
  const { tracks, selectedTrack, updateTrack, deleteTrack, selectTrack, addPluginToTrack, removePluginFromTrack, togglePluginEnabled } = useDAW();
  const [stripWidth] = useState(100);
  const [stripHeight] = useState(400);
  const [detachedTiles, setDetachedTiles] = useState<DetachedTileState[]>([]);
  const [detachedOptionsTile, setDetachedOptionsTile] = useState(false);
  const [detachedPluginRacks, setDetachedPluginRacks] = useState<Record<string, boolean>>({});
  const [levels, setLevels] = useState<Record<string, number>>({}); // live RMS values

  const animationRef = useRef<number | null>(null);

  // Helper Functions ---
  const getMeterColor = (db: number) => {
    if (db > -3) return 'rgb(255, 0, 0)';
    if (db > -8) return 'rgb(255, 200, 0)';
    if (db > -20) return 'rgb(0, 255, 0)';
    return 'rgb(0, 150, 0)';
  };

  const linearToDb = (val: number) =>
    val <= 0.00001 ? -60 : 20 * Math.log10(val);

  // --- Real-Time Level Polling ---
  useEffect(() => {
    const updateLevels = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const engine = (window as any)?.audioEngineRef?.current;
      if (engine && typeof engine.getTrackLevel === 'function') {
        const newLevels: Record<string, number> = {};
        tracks.forEach((track) => {
          const raw = engine.getTrackLevel(track.id);
          const smoothed =
            0.6 * (levels[track.id] || 0) + 0.4 * (raw || 0);
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

  // --- Solo/Mute Logic ---
  const anySolo = tracks.some(t => t.soloed);
  const isTrackAudible = (t: Track) =>
    !t.muted && (!anySolo || t.soloed) && t.type !== 'master';

  // --- Master Level ---
  const masterLevel = (() => {
    const active = tracks.filter(isTrackAudible);
    if (active.length === 0) return 0;
    const sum = active.reduce((acc, t) => acc + (levels[t.id] || 0), 0);
    return sum / active.length;
  })();

  // --- Detach/Dock Handlers ---
  const handleDetachTile = (trackId: string) => {
    const isAlreadyDetached = detachedTiles.some(t => t.trackId === trackId);
    if (!isAlreadyDetached) {
      setDetachedTiles(prev => [...prev, {
        trackId,
        position: { x: 200 + Math.random() * 100, y: 150 + Math.random() * 100 },
        size: { width: stripWidth, height: stripHeight },
      }]);
    }
  };

  const handleDockTile = (trackId: string) => {
    setDetachedTiles(prev => prev.filter(t => t.trackId !== trackId));
  };

  // --- Mixer Layout ---
  return (
    <>
      <div className="h-full w-full flex flex-col bg-gray-900 overflow-hidden">
        <div className="h-10 bg-gradient-to-r from-gray-800 to-gray-750 border-b-2 border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sliders className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-300">
              Mixer (Live) {detachedTiles.length > 0 && `• ${detachedTiles.length} floating`}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {/* Options moved to Options > Mixer Options menu */}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Mixer Strips */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-950">
            <div className="flex h-full gap-2 p-3 min-w-max">
              {/* Options Tile */}
              {!detachedOptionsTile && (
                <MixerOptionsTile
                  tracks={tracks}
                  onUpdateTrack={updateTrack}
                  onRemovePlugin={removePluginFromTrack}
                  stripWidth={stripWidth}
                  stripHeight={stripHeight}
                  position={{ x: 0, y: 0 }}
                  onDock={() => setDetachedOptionsTile(true)}
                  isDetached={false}
                />
              )}

              {/* Master Strip */}
              <div
                className="flex-shrink-0 select-none"
                style={{
                  width: `${stripWidth}px`,
                  height: `${stripHeight}px`,
                  border: '2px solid rgb(202, 138, 4)',
                  backgroundColor: 'rgb(30, 24, 15)',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '4px',
                }}
              >
                <div
                  className="font-bold text-gray-900 flex items-center justify-center bg-yellow-600 rounded"
                  style={{ height: '40px' }}
                >
                  Master
                </div>

                <div className="flex flex-col items-center justify-end flex-1">
                  <div
                    className="rounded border-2 border-yellow-700 bg-gray-950 flex flex-col-reverse shadow-inner"
                    style={{
                      width: '16px',
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        height: `${masterLevel * 100}%`,
                        backgroundColor: getMeterColor(linearToDb(masterLevel)),
                        transition: 'height 0.1s linear',
                      }}
                    />
                  </div>
                  <div className="text-yellow-400 font-mono text-xs mt-2">
                    {linearToDb(masterLevel).toFixed(1)} dB
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
                  .filter(t => t.type !== 'master')
                  .map((track) => (
                    <MixerTile
                      key={track.id}
                      track={track}
                      isSelected={selectedTrack?.id === track.id}
                      onSelect={selectTrack}
                      onDelete={deleteTrack}
                      onUpdate={updateTrack}
                      levels={levels}
                      stripWidth={stripWidth}
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
              stripWidth={stripWidth}
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
          const track = tracks.find(t => t.id === tile.trackId);
          if (!track) return null;

          return (
            <div
              key={tile.trackId}
              className="pointer-events-auto"
              style={{
                position: 'fixed',
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
                stripWidth={stripWidth}
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
}