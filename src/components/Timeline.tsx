import { useDAW } from '../contexts/DAWContext';
import { Track } from '../types';
import { useEffect, useRef, useState } from 'react';

export default function Timeline() {
  const { tracks, currentTime, getAudioDuration, seek, getWaveformData, isPlaying } = useDAW();
  const timelineRef = useRef<HTMLDivElement>(null);
  const waveformsRef = useRef<Record<string, number[]>>({});
  const [, setWaveformUpdateCounter] = useState(0);
  const [zoom, setZoom] = useState(1.0);

  const bars = 32;
  const basePixelsPerBar = 120;
  const pixelsPerBar = basePixelsPerBar * zoom;
  const pixelsPerSecond = pixelsPerBar / 4;

  // Color mapping for waveforms - matches track colors
  const getWaveformColor = (index: number) => {
    const colors = [
      '#d4a574', // olive/tan
      '#a855f7', // purple
      '#4b9fa5', // teal
      '#c084fc', // light purple
      '#d9a574', // beige
      '#3b82f6', '#ec4899', '#f59e0b', '#06b6d4', '#ef4444', '#84cc16', '#6b7280',
    ];
    return colors[index % colors.length];
  };

  // Load waveform data for audio tracks
  useEffect(() => {
    const newWaveforms: Record<string, number[]> = {};
    tracks.forEach((track) => {
      if (track.type === 'audio' && getAudioDuration(track.id) > 0) {
        const waveformData = getWaveformData(track.id);
        if (waveformData.length > 0) {
          newWaveforms[track.id] = waveformData;
        }
      }
    });
    waveformsRef.current = newWaveforms;
    setWaveformUpdateCounter(c => c + 1);
  }, [tracks, getAudioDuration, getWaveformData]);

  // Auto-scroll playhead into view
  useEffect(() => {
    if (timelineRef.current && isPlaying) {
      const playheadX = currentTime * pixelsPerSecond;
      const viewportWidth = timelineRef.current.clientWidth;
      if (playheadX > viewportWidth) {
        timelineRef.current.scrollLeft = playheadX - viewportWidth / 3;
      }
    }
  }, [currentTime, pixelsPerSecond, isPlaying]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const clickTime = Math.max(0, clickX / pixelsPerSecond);
    seek(clickTime);
  };

  const renderAudioRegion = (track: Track, trackIndex: number) => {
    if (track.type !== 'audio') return null;
    const duration = getAudioDuration(track.id);
    if (duration <= 0) return null;

    const width = duration * pixelsPerSecond;
    const waveformData = waveformsRef.current[track.id];
    const regionColor = getWaveformColor(trackIndex);
    
    // Compute min/max peaks for efficient rendering
    const computePeaks = () => {
      if (!waveformData || waveformData.length === 0) return null;
      const blockSize = Math.max(1, Math.floor(waveformData.length / width));
      const mins: number[] = [];
      const maxs: number[] = [];
      
      for (let i = 0; i < waveformData.length; i += blockSize) {
        const block = waveformData.slice(i, Math.min(i + blockSize, waveformData.length));
        if (block.length === 0) continue;
        mins.push(Math.min(...block));
        maxs.push(Math.max(...block));
      }
      return { mins, maxs };
    };
    
    const peaks = computePeaks();
    
    return (
      <div
        key={`region-${track.id}`}
        className="absolute top-1 left-0 overflow-hidden rounded"
        style={{
          width: `${width}px`,
          minWidth: '30px',
          height: 'calc(100% - 8px)',
          backgroundColor: track.muted ? 'rgba(107, 114, 128, 0.2)' : `${regionColor}20`,
          borderLeft: `3px solid ${regionColor}`,
        }}
      >
        {peaks && (
          <svg 
            width={Math.max(width, 1)} 
            height={56} 
            className="absolute inset-0"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <linearGradient id={`grad-${track.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={regionColor} stopOpacity="0.8" />
                <stop offset="100%" stopColor={regionColor} stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {peaks.mins.map((_, x) => {
              if (x >= Math.min(width, peaks.mins.length)) return null;
              const minY = 28 - (peaks.mins[x] * 28 * 0.85);
              const maxY = 28 - (peaks.maxs[x] * 28 * 0.85);
              return (
                <line
                  key={x}
                  x1={x}
                  y1={minY}
                  x2={x}
                  y2={maxY}
                  stroke={regionColor}
                  strokeWidth="1"
                  opacity={0.6 + peaks.maxs[x] * 0.4}
                />
              );
            })}
          </svg>
        )}
      </div>
    );
  };

  const renderMIDIRegion = (track: Track, trackIndex: number) => {
    if (track.type !== 'midi' && track.type !== 'instrument') return null;

    const startTime = Math.random() * 2;
    const duration = 2 + Math.random() * 4;
    const left = startTime * pixelsPerSecond;
    const width = duration * pixelsPerSecond;
    const regionColor = getWaveformColor(trackIndex);

    return (
      <div
        key={`midi-region-${track.id}`}
        className="absolute top-1 left-0 overflow-hidden rounded border-2"
        style={{
          left: `${left}px`,
          width: `${width}px`,
          minWidth: '40px',
          height: 'calc(100% - 8px)',
          backgroundColor: `${regionColor}30`,
          borderColor: regionColor,
        }}
      >
        <div className="h-full flex flex-col justify-around px-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-1 rounded"
              style={{
                backgroundColor: regionColor,
                opacity: 0.5 + Math.random() * 0.5,
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-gray-950 overflow-hidden flex flex-col">
      {/* Zoom Controls */}
      <div className="h-8 bg-gray-900 border-b border-gray-700 px-3 flex items-center gap-2">
        <button
          onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
          className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700"
          title="Zoom Out"
        >
          −
        </button>
        <span className="text-xs text-gray-400 w-12">
          {(zoom * 100).toFixed(0)}%
        </span>
        <button
          onClick={() => setZoom(z => Math.min(3.0, z + 0.2))}
          className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700"
          title="Zoom In"
        >
          +
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setZoom(1.0)}
          className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700"
          title="Reset Zoom"
        >
          Reset
        </button>
      </div>

      {/* Time Ruler */}
      <div className="h-10 bg-gradient-to-b from-gray-800 to-gray-850 border-b-2 border-gray-700 flex items-center sticky top-0 z-10 overflow-x-auto">
        <div className="flex h-full">
          {Array.from({ length: bars }).map((_, i) => (
            <div
              key={i}
              style={{ width: `${pixelsPerBar}px` }}
              className="h-full flex items-center justify-center border-l-2 border-gray-700 text-xs font-mono font-bold text-gray-400 hover:text-gray-200 flex-shrink-0"
            >
              {(i + 1).toString().padStart(1)}.{(Math.floor(Math.random() * 4) + 1).toString().padStart(2, '0')}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Content */}
      <div 
        className="flex-1 overflow-auto relative bg-gray-950 cursor-pointer" 
        ref={timelineRef} 
        onClick={handleTimelineClick}
      >
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 z-30 pointer-events-none"
          style={{ 
            left: `${currentTime * pixelsPerSecond}px`,
            backgroundColor: '#f59e0b',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.9)',
          }}
        >
          <div 
            className="absolute -top-1 -left-1.5 w-3 h-3" 
            style={{
              backgroundColor: '#f59e0b',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            }}
          />
        </div>

        {/* Tracks */}
        {tracks.map((track, trackIndex) => (
          <div
            key={track.id}
            className="h-20 border-b-2 border-gray-700 hover:bg-gray-900/30 transition-colors relative flex-shrink-0"
            style={{ width: `${bars * pixelsPerBar}px` }}
          >
            {/* Grid lines */}
            <div className="absolute top-0 left-0 right-0 bottom-0 flex pointer-events-none">
              {Array.from({ length: bars }).map((_, i) => (
                <div
                  key={i}
                  style={{ width: `${pixelsPerBar}px` }}
                  className="h-full border-l border-gray-700/40 flex-shrink-0"
                />
              ))}
            </div>

            {/* Audio/MIDI Regions */}
            {track.type === 'audio' && renderAudioRegion(track, trackIndex)}
            {(track.type === 'midi' || track.type === 'instrument') && renderMIDIRegion(track, trackIndex)}

            {/* Track Label */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none z-10">
              {track.name.substring(0, 12)}
            </div>
          </div>
        ))}

        {tracks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-sm">No tracks. Add a track to begin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
