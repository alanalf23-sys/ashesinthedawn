import { useDAW } from '../contexts/DAWContext';
import { useEffect, useRef, useState } from 'react';

export default function Timeline() {
  const { tracks, currentTime, currentProject, getAudioDuration, seek, getWaveformData } = useDAW();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [waveforms, setWaveforms] = useState<Record<string, number[]>>({});

  const bars = 32;
  const pixelsPerBar = 120;
  const pixelsPerSecond = pixelsPerBar / 4; // assuming 4 seconds per bar

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
    setWaveforms(newWaveforms);
  }, [tracks, getWaveformData]);

  // Auto-scroll playhead into view
  useEffect(() => {
    if (timelineRef.current) {
      const playheadX = (currentTime * pixelsPerSecond);
      const viewportWidth = timelineRef.current.clientWidth;
      if (playheadX > viewportWidth) {
        timelineRef.current.scrollLeft = playheadX - viewportWidth / 3;
      }
    }
  }, [currentTime, pixelsPerSecond]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const clickTime = clickX / pixelsPerSecond;
    seek(clickTime);
  };

  const renderAudioRegion = (track: any) => {
    if (track.type !== 'audio') return null;
    
    const duration = getAudioDuration(track.id);
    if (duration <= 0) return null;

    const width = duration * pixelsPerSecond;
    const waveformData = waveforms[track.id];
    
    return (
      <div
        key={`region-${track.id}`}
        className="timeline-region absolute h-14 top-1 left-1 overflow-hidden"
        style={{
          width: `${width}px`,
          minWidth: '30px',
        }}
      >
        {/* Waveform visualization */}
        {waveformData && (
          <div className="h-10 flex items-center justify-center gap-0.5 px-1">
            {waveformData.slice(0, 60).map((sample, i) => (
              <div
                key={i}
                className="waveform-bar w-0.5 rounded-sm"
                style={{
                  height: `${Math.max(2, Math.min(36, sample * 40))}px`,
                  opacity: 0.7 + sample * 0.3,
                }}
              />
            ))}
          </div>
        )}
        <div className="text-daw-xs text-daw-blue-100 px-2 py-0.5 truncate font-medium">
          {track.name}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-gray-950 overflow-hidden flex flex-col">
      <div className="h-12 bg-daw-dark-800 border-b border-daw-dark-600 flex items-center sticky top-0 z-10">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            style={{ width: `${pixelsPerBar}px` }}
            className="h-full flex items-center justify-center border-l border-daw-dark-600 text-daw-xs text-daw-dark-400 font-mono"
          >
            {i + 1}.0
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto relative cursor-pointer bg-daw-dark-900" ref={timelineRef} onClick={handleTimelineClick}>
        {/* Playhead */}
        <div
          className="timeline-playhead absolute top-0 bottom-0 w-0.5 z-30 pointer-events-none"
          style={{ left: `${currentTime * pixelsPerSecond}px`, boxShadow: '0 0 12px rgba(245, 158, 11, 0.9)' }}
        >
          <div className="w-3 h-3 bg-daw-accent-400 -ml-1.5 -mt-1 sticky" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        </div>

        {/* Tracks */}
        {tracks.map((track) => (
          <div
            key={track.id}
            className="timeline-grid h-16 border-b border-daw-dark-700 hover:bg-daw-dark-800/50 transition-colors relative"
            style={{ width: `${bars * pixelsPerBar}px` }}
          >
            {/* Grid lines */}
            <div className="absolute top-0 left-0 right-0 bottom-0 flex pointer-events-none">
              {Array.from({ length: bars }).map((_, i) => (
                <div
                  key={i}
                  style={{ width: `${pixelsPerBar}px` }}
                  className="h-full border-l border-daw-dark-600/20"
                />
              ))}
            </div>

            {/* Audio region */}
            {track.type === 'audio' && (
              <div className="absolute top-0 left-0 h-full">
                {renderAudioRegion(track)}
              </div>
            )}

            {/* Track label */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-daw-xs text-daw-dark-400 pointer-events-none font-medium">
              {track.name.substring(0, 8)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
