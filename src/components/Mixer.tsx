import { useDAW } from '../contexts/DAWContext';
import { Trash2, Sliders } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

export default function Mixer() {
  const { tracks, selectedTrack, updateTrack, deleteTrack, selectTrack } = useDAW();
  const [stripWidth, setStripWidth] = useState(100);
  const [stripHeight, setStripHeight] = useState(400);
  const [individualWidths, setIndividualWidths] = useState<Record<string, number>>({});
  const [resizingTrackId, setResizingTrackId] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [levels, setLevels] = useState<Record<string, number>>({}); // live RMS values

  const animationRef = useRef<number | null>(null);

  // --- Helper Functions ---
  const getMeterColor = (db: number) => {
    if (db > -3) return 'rgb(255, 0, 0)';
    if (db > -8) return 'rgb(255, 200, 0)';
    if (db > -20) return 'rgb(0, 255, 0)';
    return 'rgb(0, 150, 0)';
  };

  const linearToDb = (val: number) =>
    val <= 0.00001 ? -60 : 20 * Math.log10(val);

  const handleResizeStart = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    setResizingTrackId(trackId);
    setResizeStartX(e.clientX);
  };

  // --- Track Width Resizing ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingTrackId) {
        const delta = e.clientX - resizeStartX;
        const currentWidth = individualWidths[resizingTrackId] || stripWidth;
        const newWidth = Math.max(60, currentWidth + delta);
        setIndividualWidths(prev => ({
          ...prev,
          [resizingTrackId]: newWidth,
        }));
        setResizeStartX(e.clientX);
      }
    };

    const handleMouseUp = () => setResizingTrackId(null);

    if (resizingTrackId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingTrackId, resizeStartX, individualWidths, stripWidth]);

  // --- Real-Time Level Polling ---
  useEffect(() => {
    const updateLevels = () => {
      const engine = (window as any)?.audioEngineRef?.current;
      if (engine && typeof engine.getTrackLevel === 'function') {
        const newLevels: Record<string, number> = {};
        tracks.forEach(track => {
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
  }, [tracks]);

  // --- Solo/Mute Logic ---
  const anySolo = tracks.some(t => t.soloed);
  const isTrackAudible = (t: any) =>
    !t.muted && (!anySolo || t.soloed) && t.type !== 'master';

  // --- Master Level ---
  const masterLevel = (() => {
    const active = tracks.filter(isTrackAudible);
    if (active.length === 0) return 0;
    const sum = active.reduce((acc, t) => acc + (levels[t.id] || 0), 0);
    return sum / active.length;
  })();

  // --- Channel Strip ---
  const renderChannelStrip = (track: any) => {
    const isSelected = selectedTrack?.id === track.id;
    const currentWidth = individualWidths[track.id] || stripWidth;
    const meter = levels[track.id] || 0;
    const db = linearToDb(meter);
    const visible = isTrackAudible(track);

    const headerHeight = Math.max(stripHeight * 0.12, 24);
    const faderSectionMinHeight = Math.max(stripHeight * 0.35, 80);
    const buttonHeight = Math.max(stripHeight * 0.06, 18);
    const meterWidth = Math.max(currentWidth * 0.15, 6);

    return (
      <div
        key={track.id}
        onClick={() => selectTrack(track.id)}
        className={`flex-shrink-0 transition-all select-none relative`}
        style={{
          width: `${currentWidth}px`,
          height: `${stripHeight}px`,
          opacity: visible ? 1 : 0.4,
          border: isSelected
            ? '2px solid rgb(59, 130, 246)'
            : '1px solid rgb(55, 65, 81)',
          backgroundColor: 'rgb(17, 24, 39)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '4px',
        }}
      >
        <div
          className="absolute right-0 top-0 bottom-0 w-1 bg-transparent hover:bg-blue-500 hover:opacity-100 opacity-0 cursor-col-resize transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, track.id)}
        />

        {/* Track Header */}
        <div
          style={{
            height: `${headerHeight}px`,
            backgroundColor: track.color,
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${Math.max(currentWidth * 0.12, 9)}px`,
            flexShrink: 0,
          }}
          className="font-bold text-gray-900 truncate px-1 overflow-hidden"
        >
          {track.name}
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
          <div
            className="font-mono text-xs text-gray-400 text-center"
            style={{
              padding: '2px',
              minHeight: '20px',
            }}
          >
            {db.toFixed(1)} dB
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-1 justify-center flex-wrap">
          {/* Mute */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTrack(track.id, { muted: !track.muted });
            }}
            className={`rounded font-semibold transition flex-1 ${
              track.muted
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            style={{
              fontSize: `${Math.max(stripWidth * 0.1, 9)}px`,
              padding: `${Math.max(buttonHeight * 0.2, 2)}px`,
            }}
          >
            M
          </button>

          {/* Solo */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTrack(track.id, { soloed: !track.soloed });
            }}
            className={`rounded font-semibold transition flex-1 ${
              track.soloed
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            style={{
              fontSize: `${Math.max(stripWidth * 0.1, 9)}px`,
              padding: `${Math.max(buttonHeight * 0.2, 2)}px`,
            }}
          >
            S
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTrack(track.id);
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
      </div>
    );
  };

  // --- Master Strip ---
  const renderMasterStrip = () => {
    const db = linearToDb(masterLevel);
    const meterColor = getMeterColor(db);
    return (
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
                backgroundColor: meterColor,
                transition: 'height 0.1s linear',
              }}
            />
          </div>
          <div className="text-yellow-400 font-mono text-xs mt-2">
            {db.toFixed(1)} dB
          </div>
        </div>
      </div>
    );
  };

  // --- Mixer Layout ---
  return (
    <div className="h-full w-full flex flex-col bg-gray-900 overflow-hidden">
      <div className="h-10 bg-gradient-to-r from-gray-800 to-gray-750 border-b-2 border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Sliders className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-300">Mixer (Live)</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <label>
            W:
            <input
              type="range"
              min="60"
              max="200"
              value={stripWidth}
              onChange={(e) => setStripWidth(parseInt(e.target.value))}
              className="w-20 accent-blue-500 ml-2"
            />
          </label>
          <label>
            H:
            <input
              type="range"
              min="200"
              max="600"
              value={stripHeight}
              onChange={(e) => setStripHeight(parseInt(e.target.value))}
              className="w-20 accent-blue-500 ml-2"
            />
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-950">
        <div className="flex h-full gap-2 p-3 min-w-max">
          {renderMasterStrip()}
          {tracks.length === 0 ? (
            <div className="flex items-center justify-center w-full text-gray-500 text-sm">
              No tracks. Add some to see the mixer.
            </div>
          ) : (
            tracks.map((t) => renderChannelStrip(t))
          )}
        </div>
      </div>
    </div>
  );
}