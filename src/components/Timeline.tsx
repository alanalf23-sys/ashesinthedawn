import { useDAW } from '../contexts/DAWContext';
import { useEffect, useRef } from 'react';

export default function Timeline() {
  const { tracks, currentTime, currentProject, getAudioDuration, seek } = useDAW();
  const timelineRef = useRef<HTMLDivElement>(null);

  const bars = 32;
  const pixelsPerBar = 120;
  const pixelsPerSecond = pixelsPerBar / 4; // assuming 4 seconds per bar

  useEffect(() => {
    // Auto-scroll playhead into view
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
    
    return (
      <div
        key={`region-${track.id}`}
        className="absolute h-14 rounded border border-blue-400 bg-blue-500/20 top-1 left-1"
        style={{
          width: `${width}px`,
          minWidth: '30px',
        }}
      >
        <div className="text-xs text-blue-300 px-2 py-1 truncate font-medium">
          {track.name}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-gray-950 overflow-hidden flex flex-col">
      <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center sticky top-0 z-10">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            style={{ width: `${pixelsPerBar}px` }}
            className="h-full flex items-center justify-center border-l border-gray-700 text-xs text-gray-500 font-mono"
          >
            {i + 1}.0
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto relative cursor-pointer" ref={timelineRef} onClick={handleTimelineClick}>
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-30 pointer-events-none"
          style={{ left: `${currentTime * pixelsPerSecond}px`, boxShadow: '0 0 8px rgba(96, 165, 250, 0.8)' }}
        >
          <div className="w-3 h-3 bg-blue-400 -ml-1.5 -mt-1 sticky" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        </div>

        {/* Tracks */}
        {tracks.map((track) => (
          <div
            key={track.id}
            className="h-16 border-b border-gray-800 hover:bg-gray-900/50 transition-colors relative bg-gray-950/50"
            style={{ width: `${bars * pixelsPerBar}px` }}
          >
            {/* Grid lines */}
            <div className="absolute top-0 left-0 right-0 bottom-0 flex pointer-events-none">
              {Array.from({ length: bars }).map((_, i) => (
                <div
                  key={i}
                  style={{ width: `${pixelsPerBar}px` }}
                  className="h-full border-l border-gray-800/30"
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
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
              {track.name.substring(0, 8)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
