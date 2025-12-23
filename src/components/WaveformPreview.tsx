import { useEffect, useRef, useState } from 'react';

interface WaveformPreviewProps {
  audioFile?: File | string;
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  backgroundColor?: string;
}

/**
 * WaveformPreview - Renders audio waveform using Web Audio API
 * 
 * Features:
 * - High-resolution waveform rendering
 * - Stereo or mono display
 * - Automatic downsampling for performance
 * - Canvas-based visualization
 */
export function WaveformPreview({
  audioFile,
  width = 400,
  height = 80,
  className = '',
  color = '#06b6d4', // cyan-500
  backgroundColor = '#020617', // slate-950
}: WaveformPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  useEffect(() => {
    if (!audioFile) {
      clearCanvas();
      return;
    }
    
    loadAndRenderWaveform();
    
    return () => {
      // Cleanup: close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [audioFile, width, height, color, backgroundColor]);
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  
  const loadAndRenderWaveform = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get audio data
      let arrayBuffer: ArrayBuffer;
      
      if (audioFile instanceof File) {
        arrayBuffer = await audioFile.arrayBuffer();
      } else if (typeof audioFile === 'string') {
        const response = await fetch(audioFile);
        arrayBuffer = await response.arrayBuffer();
      } else {
        throw new Error('Invalid audio file');
      }
      
      // Create audio context
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
      }
      
      // Decode audio
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      // Render waveform
      renderWaveform(audioBuffer);
    } catch (err) {
      console.error('Waveform loading failed:', err);
      setError('Failed to load waveform');
      clearCanvas();
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderWaveform = (audioBuffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size (using device pixel ratio for crisp rendering)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Get audio data from first channel (mono or left channel)
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    
    // Downsample data to canvas width for performance
    const samplesPerPixel = Math.max(1, Math.floor(channelData.length / width));
    const peaks: number[] = [];
    
    for (let x = 0; x < width; x++) {
      const startSample = x * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, channelData.length);
      
      // Find peak (max absolute value) in this pixel's range
      let peak = 0;
      for (let i = startSample; i < endSample; i++) {
        const absSample = Math.abs(channelData[i]);
        if (absSample > peak) {
          peak = absSample;
        }
      }
      
      peaks.push(peak);
    }
    
    // Normalize peaks to 0-1 range
    const maxPeak = Math.max(...peaks, 0.001); // Avoid division by zero
    const normalizedPeaks = peaks.map(p => p / maxPeak);
    
    // Draw waveform
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    const centerY = height / 2;
    const amplitudeScale = (height / 2) * 0.9; // 90% of available height
    
    // Draw bars (mirrored vertically)
    for (let x = 0; x < width; x++) {
      const amplitude = normalizedPeaks[x] * amplitudeScale;
      
      // Draw bar from center to top
      ctx.fillRect(x, centerY - amplitude, 1, amplitude);
      
      // Draw bar from center to bottom (mirror)
      ctx.fillRect(x, centerY, 1, amplitude);
    }
    
    // Draw center line
    ctx.strokeStyle = `${color}33`; // 20% opacity
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  };
  
  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded"
        style={{ display: 'block' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 rounded">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-cyan-500 border-t-transparent" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 rounded">
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}
    </div>
  );
}

export default WaveformPreview;
