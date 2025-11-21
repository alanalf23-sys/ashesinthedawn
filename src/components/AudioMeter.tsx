import { useEffect, useRef } from 'react';
import { getAudioEngine } from '../lib/audioEngine';

export default function AudioMeter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const peaksRef = useRef<number[]>([]); // store peaks for falloff

  useEffect(() => {
    const audioEngine = getAudioEngine();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barGap = 1;
    const falloffSpeed = 0.02; // how quickly peaks fall

    const draw = () => {
      const data = audioEngine.getAudioLevels();
      if (!data) {
        requestAnimationFrame(draw);
        return;
      }

      const { width, height } = canvas;
      const barCount = data.length;
      const barWidth = width / barCount;

      ctx.clearRect(0, 0, width, height);

      // background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0f172a');
      bgGradient.addColorStop(1, '#1e293b');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // prepare peak memory if needed
      if (peaksRef.current.length !== barCount) {
        peaksRef.current = new Array(barCount).fill(0);
      }

      let rmsSum = 0;

      for (let i = 0; i < barCount; i++) {
        const level = data[i] / 255;
        rmsSum += level * level;

        // Smooth previous peaks
        peaksRef.current[i] = Math.max(level, peaksRef.current[i] - falloffSpeed);

        // height in pixels
        const barHeight = level * height;
        const peakHeight = peaksRef.current[i] * height;

        // Color scale (green → amber → red)
        const hue = Math.min(120, Math.max(0, 120 - level * 120)); // 120 = green → 0 = red
        ctx.fillStyle = `hsl(${hue}, 90%, 50%)`;

        // draw bar
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - barGap, barHeight);

        // draw peak indicator
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(i * barWidth, height - peakHeight - 2, barWidth - barGap, 2);
      }

      // RMS overlay line (average energy)
      const rms = Math.sqrt(rmsSum / barCount);
      const rmsHeight = height * rms;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, height - rmsHeight, width, 2);

      // label overlay
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '10px monospace';
      ctx.fillText(`RMS: ${(rms * 100).toFixed(1)}%`, 6, 12);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-2 shadow-inner">
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className="w-full h-24 border border-gray-700 rounded bg-gray-950"
      />
      <p className="text-xs text-gray-400 mt-1 text-center">Frequency Spectrum & RMS</p>
    </div>
  );
}
