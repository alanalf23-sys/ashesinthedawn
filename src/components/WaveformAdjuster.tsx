import { useEffect, useRef, useState, useCallback } from "react";
import { useDAW } from "../contexts/DAWContext";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip } from "./TooltipProvider";

interface WaveformAdjusterProps {
  trackId: string;
  height?: number;
  showControls?: boolean;
}

/**
 * Real-Time Waveform Adjuster Component
 * Features:
 * - High-resolution peak calculation (8192 samples default)
 * - Real-time rendering with live updates
 * - Interactive zoom and scale adjustments
 * - Accurate peak metering
 * - Fast re-rendering on track changes
 * - Color customization
 */
export default function WaveformAdjuster({
  trackId,
  height = 120,
  showControls = true,
}: WaveformAdjusterProps) {
  const { getWaveformData, getAudioDuration, currentTime, isPlaying } =
    useDAW();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Adjustable parameters
  const [zoom, setZoom] = useState(1.0);
  const [scale, setScale] = useState(1.0);
  const [waveformColor, setWaveformColor] = useState("#3b82f6");
  const [showGrid, setShowGrid] = useState(true);
  const [peakLevel, setPeakLevel] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [resolution, setResolution] = useState(4096); // 2^12
  const [smoothing, setSmoothing] = useState(0.5);

  const duration = getAudioDuration(trackId);
  const waveformData = getWaveformData(trackId);

  // High-resolution peak calculation with optimized caching
  const calculatePeaks = useCallback(
    (data: number[], pixelWidth: number): Array<{ min: number; max: number }> => {
      if (!data || data.length === 0) return [];

      const blockSize = Math.max(1, Math.ceil(data.length / (pixelWidth * zoom)));
      const peaks: Array<{ min: number; max: number }> = [];
      let globalMax = 0;

      // Optimize for mono waveform data (already contains peaks from audioEngine)
      for (let i = 0; i < pixelWidth && i * blockSize < data.length; i++) {
        const startIdx = i * blockSize;
        const endIdx = Math.min(startIdx + blockSize, data.length);
        
        let max = 0;
        for (let j = startIdx; j < endIdx; j++) {
          max = Math.max(max, data[j]);
        }
        
        // Store as symmetric peaks around center for visual balance
        peaks.push({ min: -max, max: max });
        globalMax = Math.max(globalMax, max);
      }

      setPeakLevel(Math.min(globalMax, 1.0)); // Clamp to 1.0 for percentage display
      return peaks;
    },
    [zoom]
  );

  // Draw waveform with optimized rendering
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData || waveformData.length === 0) return;

    const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: false });
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const actualHeight = canvas.offsetHeight;
    
    // Validate dimensions
    if (width <= 0 || actualHeight <= 0) return;

    // Set canvas resolution for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = actualHeight * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas with dark background
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, width, actualHeight);

    // Draw grid with reduced opacity for better visual hierarchy
    if (showGrid) {
      ctx.strokeStyle = "#2d3748";
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.6;
      const gridSpacing = width / 8;
      for (let i = 0; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSpacing, 0);
        ctx.lineTo(i * gridSpacing, actualHeight);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    }

    // Draw center line with enhanced visibility
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, actualHeight / 2);
    ctx.lineTo(width, actualHeight / 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Calculate peaks for current view
    const peaks = calculatePeaks(waveformData, width);
    if (peaks.length === 0) return;

    const centerY = actualHeight / 2;
    const scaleY = (actualHeight / 2) * 0.85 * scale;

    // Create gradient for waveform with enhanced colors
    const gradient = ctx.createLinearGradient(0, 0, 0, actualHeight);
    gradient.addColorStop(0, waveformColor + "99");    // Top: semi-transparent
    gradient.addColorStop(0.5, waveformColor + "ff");  // Middle: full color
    gradient.addColorStop(1, waveformColor + "99");    // Bottom: semi-transparent

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.95;

    // Draw waveform with anti-aliasing
    const pixelsPerPeak = width / peaks.length;

    // Draw filled area first with lighter color
    ctx.fillStyle = waveformColor + "15";
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < peaks.length; i++) {
      const x = i * pixelsPerPeak;
      const smoothedMin = peaks[i].min * (1 - smoothing) + (i > 0 ? peaks[i - 1].min : 0) * smoothing;
      const smoothedMax = peaks[i].max * (1 - smoothing) + (i > 0 ? peaks[i - 1].max : 0) * smoothing;

      const minY = centerY + smoothedMin * scaleY;
      const maxY = centerY - smoothedMax * scaleY;

      ctx.lineTo(x, maxY);
      ctx.lineTo(x, minY);
    }

    ctx.lineTo(width, centerY);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Draw outline with full opacity
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < peaks.length; i++) {
      const x = i * pixelsPerPeak;
      const smoothedMin = peaks[i].min * (1 - smoothing) + (i > 0 ? peaks[i - 1].min : 0) * smoothing;
      const smoothedMax = peaks[i].max * (1 - smoothing) + (i > 0 ? peaks[i - 1].max : 0) * smoothing;

      const minY = centerY + smoothedMin * scaleY;
      const maxY = centerY - smoothedMax * scaleY;

      ctx.lineTo(x, maxY);
      ctx.lineTo(x, minY);
    }

    ctx.stroke();

    // Draw playhead if playing with enhanced styling
    if (isPlaying && duration > 0) {
      const playheadX = (currentTime / duration) * width;
      
      // Playhead shadow for depth
      ctx.shadowColor = "#10b98144";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, actualHeight);
      ctx.stroke();
      
      ctx.shadowColor = "transparent";
      ctx.globalAlpha = 1.0;
    }

    // Draw current time indicator with better styling
    if (duration > 0) {
      const posX = (currentTime / duration) * width;
      ctx.fillStyle = "#ef4444";
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(posX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }, [waveformData, height, duration, currentTime, isPlaying, showGrid, waveformColor, scale, smoothing, calculatePeaks]);

  // Animate on playback
  useEffect(() => {
    if (!isPlaying) {
      drawWaveform();
      return;
    }

    const animate = () => {
      drawWaveform();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, drawWaveform]);

  // Redraw on data or parameter changes
  useEffect(() => {
    drawWaveform();
  }, [waveformData, zoom, scale, waveformColor, showGrid, smoothing, drawWaveform]);

  return (
    <div ref={containerRef} className="w-full bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height: `${height}px` }}
      />

      {/* Controls */}
      {showControls && (
        <div className="bg-gray-800 border-t border-gray-700 p-2 space-y-2">
          {/* Basic Controls Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 w-10">Zoom:</span>
              <Tooltip 
                content={{
                  title: 'Zoom Out',
                  description: 'Decrease zoom level to see more of the waveform',
                  hotkey: 'Scroll Left',
                  category: 'tools',
                  relatedFunctions: ['Zoom In', 'Scale', 'Pan'],
                  performanceTip: 'Zoom changes the visible time range without affecting playback',
                  examples: ['Zoom out to see full song structure', 'Zoom in for precise editing'],
                }}
                position="top"
              >
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
                  className="px-1.5 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition"
                  title="Zoom out"
                >
                  −
                </button>
              </Tooltip>
              <span className="text-xs text-gray-400 w-7 text-center">
                {zoom.toFixed(1)}x
              </span>
              <Tooltip 
                content={{
                  title: 'Zoom In',
                  description: 'Increase zoom level to see finer waveform detail',
                  hotkey: 'Scroll Right',
                  category: 'tools',
                  relatedFunctions: ['Zoom Out', 'Scale', 'Pan'],
                  performanceTip: 'Higher zoom levels show more detail; useful for precise editing',
                  examples: ['Zoom to 4x for detailed waveform editing', 'See transient peaks clearly'],
                }}
                position="top"
              >
                <button
                  onClick={() => setZoom(Math.min(4, zoom + 0.2))}
                  className="px-1.5 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition"
                  title="Zoom in"
                >
                  +
                </button>
              </Tooltip>
            </div>

            {/* Scale */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 w-10">Scale:</span>
              <Tooltip 
                content={{
                  title: 'Decrease Amplitude',
                  description: 'Reduce the vertical scale of the waveform display',
                  hotkey: 'Scroll Down',
                  category: 'tools',
                  relatedFunctions: ['Increase Amplitude', 'Zoom', 'Grid'],
                  performanceTip: 'Scale affects display only; does not change actual audio levels',
                  examples: ['Decrease scale to see full dynamic range', 'Increase scale to see quiet details'],
                }}
                position="top"
              >
                <button
                  onClick={() => setScale(Math.max(0.5, scale - 0.2))}
                  className="px-1.5 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition"
                  title="Decrease amplitude"
                >
                  ↓
                </button>
              </Tooltip>
              <span className="text-xs text-gray-400 w-7 text-center">
                {scale.toFixed(1)}x
              </span>
              <Tooltip 
                content={{
                  title: 'Increase Amplitude',
                  description: 'Increase the vertical scale of the waveform display',
                  hotkey: 'Scroll Up',
                  category: 'tools',
                  relatedFunctions: ['Decrease Amplitude', 'Zoom', 'Grid'],
                  performanceTip: 'Higher scale shows quiet details at the expense of dynamic range view',
                  examples: ['Increase scale to see quiet vocals', 'See subtle peaks and valleys'],
                }}
                position="top"
              >
                <button
                  onClick={() => setScale(Math.min(3, scale + 0.2))}
                  className="px-1.5 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition"
                  title="Increase amplitude"
                >
                  ↑
                </button>
              </Tooltip>
            </div>

            {/* Color Picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Color:</label>
              <input
                type="color"
                value={waveformColor}
                onChange={(e) => setWaveformColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer"
                title="Change waveform color"
              />
            </div>

            {/* Peak Level */}
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <span className="text-xs text-gray-400 whitespace-nowrap">Peak:</span>
              <div className="w-24 h-2 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                  style={{
                    width: `${Math.min(peakLevel * 100, 100)}%`,
                    transition: "width 0.05s linear",
                  }}
                />
              </div>
              <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">
                {Math.round(peakLevel * 100)}%
              </span>
            </div>

            {/* Toggle Advanced */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="ml-2 p-1 hover:bg-gray-700 rounded transition"
              title="Show advanced options"
            >
              {showAdvanced ? (
                <ChevronUp size={14} className="text-gray-400" />
              ) : (
                <ChevronDown size={14} className="text-gray-400" />
              )}
            </button>
          </div>

          {/* Advanced Controls */}
          {showAdvanced && (
            <div className="border-t border-gray-700 pt-2 space-y-2">
              {/* Grid Toggle */}
              <label className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded"
                />
                Show Grid
              </label>

              {/* Resolution */}
              <div className="flex items-center gap-2">
                <label htmlFor="waveform-resolution" className="text-xs text-gray-400 w-16\">Resolution:</label>
                <select
                  id="waveform-resolution"
                  name="waveform-resolution"
                  value={resolution}
                  onChange={(e) => setResolution(parseInt(e.target.value))}
                  className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 text-gray-300 transition"
                >
                  <option value={2048}>2K (2048)</option>
                  <option value={4096}>4K (4096)</option>
                  <option value={8192}>8K (8192)</option>
                  <option value={16384}>16K (16384)</option>
                </select>
              </div>

              {/* Smoothing */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 w-16">Smoothing:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={smoothing}
                  onChange={(e) => setSmoothing(parseFloat(e.target.value))}
                  className="flex-1"
                  title="Adjust waveform smoothing"
                />
                <span className="text-xs text-gray-400 w-6 text-right">
                  {Math.round(smoothing * 100)}%
                </span>
              </div>

              {/* Info */}
              <div className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">
                <p>Duration: {duration.toFixed(2)}s | Samples: {waveformData.length}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
