import { useEffect, useRef } from 'react';
import { getAudioEngine } from '../lib/audioEngine';

export default function AudioMeter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const audioEngine = getAudioEngine();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const audioLevels = audioEngine.getAudioLevels();
      if (!audioLevels) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      // Clear canvas
      ctx.fillStyle = '#111827'; // Dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw frequency bars
      const barWidth = canvas.width / audioLevels.length;
      const barGap = 1;

      for (let i = 0; i < audioLevels.length; i++) {
        const barHeight = (audioLevels[i] / 255) * canvas.height;

        // Color based on level
        if (barHeight > canvas.height * 0.8) {
          ctx.fillStyle = '#ef4444'; // Red - clipping danger
        } else if (barHeight > canvas.height * 0.6) {
          ctx.fillStyle = '#f59e0b'; // Amber - high level
        } else {
          ctx.fillStyle = '#10b981'; // Green - normal
        }

        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - barGap, barHeight);
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gray-900 rounded border border-gray-700 p-2">
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className="w-full border border-gray-700 rounded bg-gray-950"
      />
      <p className="text-xs text-gray-400 mt-1">Frequency Spectrum</p>
    </div>
  );
}
