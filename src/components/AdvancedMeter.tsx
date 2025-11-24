import React, { useEffect, useRef, useState } from 'react';
import { normalizeCanvasDimensions } from '../lib/windowScaling';

interface MeteringData {
  rms: number; // 0-1
  peak: number; // 0-1
  loudnessLUFS: number; // -inf to 0 LUFS
  headroom: number; // dB below clipping
  spectrum: number[]; // 0-1 for each frequency band
}

interface AdvancedMeterProps {
  analyserNode: AnalyserNode | null;
  isActive?: boolean;
  showSpectrum?: boolean;
  showLoudness?: boolean;
}

export const AdvancedMeter: React.FC<AdvancedMeterProps> = ({
  analyserNode,
  isActive = true,
  showSpectrum = true,
  showLoudness = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [meteringData, setMeteringData] = useState<MeteringData>({
    rms: 0,
    peak: 0,
    loudnessLUFS: -96,
    headroom: 0,
    spectrum: Array(32).fill(0),
  });

  useEffect(() => {
    if (!analyserNode || !isActive) return;

    let animationId: number;
    let peakHold = 0;
    let peakHoldTime = 0;
    const peakHoldDuration = 2000; // 2 seconds

    const updateMetering = () => {
      const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
      analyserNode.getByteFrequencyData(dataArray);

      // Calculate RMS
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = dataArray[i] / 255;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Calculate peak
      let peak = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = dataArray[i] / 255;
        if (normalized > peak) peak = normalized;
      }

      // Update peak hold
      if (peak > peakHold) {
        peakHold = peak;
        peakHoldTime = 0;
      } else {
        peakHoldTime += 16; // ~60fps
        if (peakHoldTime > peakHoldDuration) {
          peakHold = Math.max(peak, peakHold * 0.99); // Slow decay
        }
      }

      // Calculate LUFS (simplified: using RMS)
      const loudnessLUFS = rms > 0 ? 20 * Math.log10(rms) : -96;

      // Calculate headroom
      const headroom = Math.max(0, 0 - (loudnessLUFS + 3)); // 3dB safety margin

      // Downsample spectrum to 32 bands
      const spectrumDownsampled: number[] = [];
      const bandsPerGroup = Math.ceil(dataArray.length / 32);
      for (let i = 0; i < 32; i++) {
        let bandSum = 0;
        const startIdx = i * bandsPerGroup;
        const endIdx = Math.min((i + 1) * bandsPerGroup, dataArray.length);
        for (let j = startIdx; j < endIdx; j++) {
          bandSum += dataArray[j] / 255;
        }
        spectrumDownsampled.push(bandSum / (endIdx - startIdx));
      }

      setMeteringData({
        rms,
        peak: peakHold,
        loudnessLUFS,
        headroom,
        spectrum: spectrumDownsampled,
      });

      animationId = requestAnimationFrame(updateMetering);
    };

    updateMetering();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyserNode, isActive]);

  // Draw meters
  useEffect(() => {
    if (!canvasRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = canvas.parentElement?.clientWidth || 300;
    normalizeCanvasDimensions(canvas, displayWidth, 200);

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    let y = 10;
    const lineHeight = 45;

    // RMS Meter
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px monospace';
    ctx.fillText('RMS', 10, y + 15);

    const rmsWidth = meteringData.rms * (width - 70);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(60, y + 5, rmsWidth, 12);
    ctx.strokeStyle = '#4b5563';
    ctx.strokeRect(60, y + 5, width - 70, 12);

    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`${(meteringData.rms * 100).toFixed(1)}%`, width - 60, y + 15);
    y += lineHeight;

    // Peak Hold Meter
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Peak', 10, y + 15);

    const peakWidth = meteringData.peak * (width - 70);
    ctx.fillStyle = meteringData.peak > 0.9 ? '#ef4444' : '#f59e0b';
    ctx.fillRect(60, y + 5, peakWidth, 12);
    ctx.strokeStyle = '#4b5563';
    ctx.strokeRect(60, y + 5, width - 70, 12);

    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`${(meteringData.peak * 100).toFixed(1)}%`, width - 60, y + 15);
    y += lineHeight;

    // Loudness (LUFS)
    if (showLoudness) {
      ctx.fillStyle = '#6b7280';
      ctx.fillText('LUFS', 10, y + 15);

      const lufsNormalized = Math.max(0, Math.min(1, (meteringData.loudnessLUFS + 30) / 30));
      const lufsWidth = lufsNormalized * (width - 70);
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(60, y + 5, lufsWidth, 12);
      ctx.strokeStyle = '#4b5563';
      ctx.strokeRect(60, y + 5, width - 70, 12);

      ctx.fillStyle = '#9ca3af';
      ctx.fillText(`${meteringData.loudnessLUFS.toFixed(1)}`, width - 60, y + 15);
      y += lineHeight;
    }

    // Headroom
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Headroom', 10, y + 15);

    const headroomWidth = (meteringData.headroom / 6) * (width - 70);
    const headroomColor = meteringData.headroom < 3 ? '#ef4444' : '#10b981';
    ctx.fillStyle = headroomColor;
    ctx.fillRect(60, y + 5, headroomWidth, 12);
    ctx.strokeStyle = '#4b5563';
    ctx.strokeRect(60, y + 5, width - 70, 12);

    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`${meteringData.headroom.toFixed(1)}dB`, width - 60, y + 15);

    // Spectrum analyzer
    if (showSpectrum && meteringData.spectrum.length > 0) {
      const spectrumY = y + lineHeight + 10;
      const spectrumHeight = height - spectrumY - 10;
      const barWidth = (width - 20) / meteringData.spectrum.length;

      for (let i = 0; i < meteringData.spectrum.length; i++) {
        const barHeight = meteringData.spectrum[i] * spectrumHeight;
        const x = 10 + i * barWidth;

        // Color based on frequency
        const hue = (i / meteringData.spectrum.length) * 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fillRect(x, spectrumY + spectrumHeight - barHeight, barWidth - 1, barHeight);
      }

      // Grid lines
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, spectrumY);
      ctx.lineTo(width - 10, spectrumY);
      ctx.stroke();
    }
  }, [meteringData, isActive, showSpectrum, showLoudness]);

  return (
    <div className="bg-gray-900 rounded border border-gray-700 p-3">
      <h3 className="text-xs font-semibold text-gray-300 mb-2">Advanced Metering</h3>
      <canvas
        ref={canvasRef}
        className="w-full border border-gray-700 rounded"
        style={{ display: 'block', minHeight: '200px' }}
      />
    </div>
  );
};
