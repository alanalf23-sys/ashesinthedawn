import { useEffect, useRef, useMemo } from 'react';
import { Track } from '../types';
import { useDAW } from '../contexts/DAWContext';

interface WaveformProps {
  track: Track;
  height?: number;
  width?: number;
  color?: string;
}

export default function Waveform({ track, height = 60, width = 400, color = '#3b82f6' }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getWaveformData, getAudioDuration } = useDAW();
  
  const waveformData = useMemo(() => {
    return getWaveformData(track.id);
  }, [track.id, getWaveformData]);

  const duration = useMemo(() => {
    return getAudioDuration(track.id);
  }, [track.id, getAudioDuration]);

  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Draw waveform
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const samples = waveformData.length;
    const pixelWidth = canvas.width / samples;
    const centerY = canvas.height / 2;

    waveformData.forEach((value, index) => {
      const x = index * pixelWidth + pixelWidth / 2;
      const y = centerY - (value * centerY * 0.8);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw mirror (bottom half)
    ctx.beginPath();
    waveformData.forEach((value, index) => {
      const x = index * pixelWidth + pixelWidth / 2;
      const y = centerY + (value * centerY * 0.8);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }, [waveformData, width, height, color]);

  return (
    <div className="flex flex-col gap-1">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="bg-gray-900 rounded border border-gray-700"
      />
      {duration > 0 && (
        <div className="text-xs text-gray-400">
          Duration: {duration.toFixed(2)}s
        </div>
      )}
    </div>
  );
}
