import { useDAW } from '../contexts/DAWContext';
import { useEffect, useRef, useState } from 'react';

export default function Timeline() {
  const { tracks, currentTime, getAudioDuration, seek, getWaveformData, isPlaying } = useDAW();
  const timelineRef = useRef<HTMLDivElement>(null);
  const waveformsRef = useRef<Record<string, number[]>>({});
  const [, setWaveformUpdateCounter] = useState(0);

  const bars = 32;
  const pixelsPerBar = 120;
  const pixelsPerSecond = pixelsPerBar / 4;

  // Color mapping for waveforms
  const getWaveformColor = (index: number) => {
    const colors = [
      '#3b82f6', // blue
      '#22c55e', // green
      '#ec4899', // pink
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#ef4444', // red
      '#84cc16', // lime
      '#6366f1', // indigo
      '#14b8a6', // teal
      '#f97316', // orange
      '#6b7280', // gray
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
  }, [tracks]);

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

  const renderAudioRegion = (track: any, trackIndex: number) => {
    if (track.type !== 'audio') return null;
    
    const duration = getAudioDuration(track.id);
    if (duration <= 0) return null;

    const width = duration * pixelsPerSecond;
    const waveformData = waveformsRef.current[track.id];
    const waveformColor = getWaveformColor(trackIndex);
    
    return (
      <div
        key={`region-${track.id}`}
        className="timeline-region absolute top-1 left-0 overflow-hidden"
        style={{
          width: `${width}px`,
          minWidth: '30px',
          height: 'calc(100% - 8px)',
          backgroundColor: track.muted ? 'rgba(107, 114, 128, 0.3)' : 'rgba(3, 102, 214, 0.1)',
          borderColor: waveformColor,
        }}
      >
        {/* Waveform visualization */}
        {waveformData && (
          <div className="h-full flex items-center justify-center gap-0.5 px-1">
            {waveformData.slice(0, Math.min(200, Math.floor(width / 2))).map((sample, i) => {
              const barWidth = Math.max(1, Math.floor(width / Math.min(200, Math.floor(width / 2)) - 1));
              return (
                <div
                  key={i}
                  className="waveform-bar rounded-sm flex-shrink-0"
                  style={{
                    width: `${barWidth}px`,
                    height: `${Math.max(2, Math.min(56, sample * 56))}px`,
                    backgroundColor: waveformColor,
                    opacity: 0.6 + sample * 0.4,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-daw-dark-950 overflow-hidden flex flex-col">
      {/* Ruler / Bar Numbers */}
      <div className="h-8 bg-daw-dark-800 border-b border-daw-dark-600 flex items-center sticky top-0 z-10 overflow-x-auto">
        <div className="flex h-full">
          {Array.from({ length: bars }).map((_, i) => (
            <div
              key={i}
              style={{ width: `${pixelsPerBar}px` }}
              className="h-full flex items-center justify-center border-l border-daw-dark-600 text-daw-xs text-daw-dark-400 font-mono flex-shrink-0"
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Content */}
      <div 
        className="flex-1 overflow-auto relative cursor-pointer bg-daw-dark-950" 
        ref={timelineRef} 
        onClick={handleTimelineClick}
      >
        {/* Playhead */}
        <div
          className="timeline-playhead absolute top-0 bottom-0 w-0.5 z-30 pointer-events-none"
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
            className="h-16 border-b border-daw-dark-700 hover:bg-daw-dark-800/30 transition-colors relative flex-shrink-0"
            style={{ width: `${bars * pixelsPerBar}px` }}
          >
            {/* Grid lines */}
            <div className="absolute top-0 left-0 right-0 bottom-0 flex pointer-events-none">
              {Array.from({ length: bars }).map((_, i) => (
                <div
                  key={i}
                  style={{ width: `${pixelsPerBar}px` }}
                  className="h-full border-l border-daw-dark-700/40 flex-shrink-0"
                />
              ))}
            </div>

            {/* Audio region */}
            {track.type === 'audio' && (
              <div className="absolute top-0 left-0 h-full w-full">
                {renderAudioRegion(track, trackIndex)}
              </div>
            )}

            {/* Track label in timeline */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-daw-xs text-daw-dark-400 pointer-events-none font-medium z-10">
              {track.name.substring(0, 10)}
            </div>
          </div>
        ))}

        {tracks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-daw-dark-500">
            <div className="text-center">
              <p className="text-sm">No audio tracks. Add a track to begin recording.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
