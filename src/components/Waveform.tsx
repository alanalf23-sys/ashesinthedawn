import { useEffect, useRef, useMemo } from 'react';
import { Track } from '../types';
import { useDAW } from '../contexts/DAWContext';

interface WaveformProps {
  track: Track;
  height?: number;
  width?: number;
  color?: string;
  showPlayhead?: boolean;
  currentTime?: number;
}

export default function Waveform({ 
  track, 
  height = 60, 
  width = 400, 
  color = '#3b82f6',
  showPlayhead = false,
  currentTime = 0
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getWaveformData, getAudioDuration } = useDAW();
  
  const waveformData = useMemo(() => {
    return getWaveformData(track.id);
  }, [track.id, getWaveformData]);

  const duration = useMemo(() => {
    return getAudioDuration(track.id);
  }, [track.id, getAudioDuration]);

  // Compute min/max peaks for efficient rendering (similar to PyQt6 version)
  const peakData = useMemo(() => {
    if (!waveformData || waveformData.length === 0) return null;
    
    const blockSize = Math.max(1, Math.floor(waveformData.length / width));
    const mins: number[] = [];
    const maxs: number[] = [];
    
    for (let i = 0; i < waveformData.length; i += blockSize) {
      const block = waveformData.slice(i, Math.min(i + blockSize, waveformData.length));
      if (block.length === 0) continue;
      
      const min = Math.min(...block);
      const max = Math.max(...block);
      mins.push(min);
      maxs.push(max);
    }
    
    return { mins, maxs };
  }, [waveformData, width]);

  useEffect(() => {
    if (!canvasRef.current || !peakData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with dark background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line (subtle)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Draw min/max peaks (fast rendering like PyQt6 version)
    const { mins, maxs } = peakData;
    const midY = canvas.height / 2;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    for (let x = 0; x < Math.min(canvas.width, mins.length); x++) {
      const yMin = midY - (mins[x] * midY * 0.85);
      const yMax = midY - (maxs[x] * midY * 0.85);
      ctx.beginPath();
      ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMax);
      ctx.stroke();
    }

    // Draw playhead if enabled
    if (showPlayhead && duration > 0) {
      const playheadX = (currentTime / duration) * canvas.width;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvas.height);
      ctx.stroke();
    }
  }, [peakData, width, height, color, showPlayhead, currentTime, duration]);

  return (
    <div className="flex flex-col gap-1">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="bg-gray-900 rounded border border-gray-700 hover:border-blue-500 transition-colors duration-200 cursor-crosshair hover:shadow-lg hover:shadow-blue-500/20"
      />
      {duration > 0 && (
        <div className="text-xs text-gray-400 animate-fade-in">
          Duration: {duration.toFixed(2)}s | Samples: {waveformData.length}
        </div>
      )}
    </div>
  );
}
