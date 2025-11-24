import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useDAW } from '../contexts/DAWContext';
import { normalizeCanvasDimensions } from '../lib/windowScaling';

interface CanvasWaveformProps {
  trackId: string;
  height?: number;
  pixelsPerSecond?: number;
  onClick?: (time: number) => void;
  isPlaying?: boolean;
  currentTime?: number;
}

export const CanvasWaveform: React.FC<CanvasWaveformProps> = React.memo(({
  trackId,
  height = 100,
  pixelsPerSecond = 100,
  onClick,
  isPlaying = false,
  currentTime = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [waveformData, setWaveformData] = useState<{ peaks: number[]; rms: number[] } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { getAudioDuration, getWaveformData } = useDAW();

  const duration = useMemo(() => getAudioDuration(trackId), [trackId, getAudioDuration]);

  // Initialize worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      workerRef.current = new Worker(
        new URL('../workers/waveformWorker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.addEventListener('message', (event) => {
        const { peakData, rmsData } = event.data;
        setWaveformData({ peaks: peakData, rms: rmsData });
        setIsProcessing(false);
      });
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Process waveform data
  useEffect(() => {
    if (!canvasRef.current || duration === 0) return;

    const waveformRaw = getWaveformData(trackId);
    if (waveformRaw.length === 0) return;

    const targetResolution = Math.ceil(duration * pixelsPerSecond);

    // Use worker if available, otherwise process on main thread
    if (workerRef.current && waveformRaw.length > 1000) {
      setIsProcessing(true);
      workerRef.current.postMessage({
        id: trackId,
        audioBuffer: new Float32Array(waveformRaw),
        targetResolution,
        pixelsPerSecond,
      });
    } else {
      // Fallback: simple downsampling on main thread
      const peaks: number[] = [];
      const samplesPerPixel = Math.max(1, Math.floor(waveformRaw.length / targetResolution));

      for (let i = 0; i < targetResolution; i++) {
        const startIdx = i * samplesPerPixel;
        const endIdx = Math.min(startIdx + samplesPerPixel, waveformRaw.length);
        let peak = 0;
        for (let j = startIdx; j < endIdx; j++) {
          const sample = Math.abs(waveformRaw[j]);
          if (sample > peak) peak = sample;
        }
        peaks.push(peak);
      }

      setWaveformData({ peaks, rms: peaks });
    }
  }, [trackId, duration, pixelsPerSecond, getWaveformData]);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || !waveformData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = duration * pixelsPerSecond;
    const displayWidth = Math.max(width, canvas.parentElement?.clientWidth || 400);
    normalizeCanvasDimensions(canvas, displayWidth, height);

    // Background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center line
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(canvas.width, height / 2);
    ctx.stroke();

    // Draw waveform
    ctx.fillStyle = '#3b82f6';
    const centerY = height / 2;
    const scale = (height / 2) * 0.9; // Leave some margin

    waveformData.peaks.forEach((peak, i) => {
      const x = i;
      const peakHeight = Math.min(peak * scale, height / 2);

      // Draw top bar
      ctx.fillRect(x, centerY - peakHeight, 1, peakHeight);
      // Draw bottom bar (mirror)
      ctx.fillRect(x, centerY, 1, peakHeight);
    });

    // Draw playhead
    if (isPlaying) {
      const playheadX = currentTime * pixelsPerSecond;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  }, [waveformData, height, pixelsPerSecond, duration, isPlaying, currentTime]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !onClick) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = x / pixelsPerSecond;
      onClick(time);
    },
    [pixelsPerSecond, onClick]
  );

  return (
    <div className="relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10">
          <div className="text-xs text-gray-400">Processing waveform...</div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full cursor-pointer bg-gray-950 rounded"
        style={{ display: 'block' }}
      />
    </div>
  );
});

CanvasWaveform.displayName = 'CanvasWaveform';
