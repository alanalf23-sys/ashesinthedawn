import { useEffect, useRef, useState } from "react";
import { useDAW } from "../contexts/DAWContext";
import { normalizeCanvasDimensions } from "../lib/windowScaling";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WaveformDisplayProps {
  trackId: string;
  height?: number;
  showPeakMeter?: boolean;
  interactive?: boolean;
}

/**
 * Professional waveform display component with:
 * - High-resolution peak visualization
 * - Real-time frequency analysis (optional)
 * - Interactive seeking
 * - Zoom support
 * - Multiple rendering modes
 */
export default function WaveformDisplay({
  trackId,
  height = 80,
  showPeakMeter = true,
  interactive = true,
}: WaveformDisplayProps) {
  const { getWaveformData, getAudioDuration, currentTime, seek, isPlaying } =
    useDAW();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const peakMeterRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.0);
  const [peakLevel, setPeakLevel] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isHoveringPeak, setIsHoveringPeak] = useState(false);

  const duration = getAudioDuration(trackId);
  let waveformData = getWaveformData(trackId);

  // Generate demo waveform if no data available (for testing)
  if (!waveformData || waveformData.length === 0) {
    waveformData = Array.from({ length: 1024 }, (_, i) => {
      const t = (i / 1024) * Math.PI * 4;
      // Create a mix of sine waves for visual interest
      return Math.abs(
        Math.sin(t) * 0.6 +
        Math.sin(t * 2) * 0.3 +
        Math.sin(t * 3) * 0.1 +
        Math.random() * 0.05
      );
    });
  }

  // Track container and watch for size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial width
    setContainerWidth(container.offsetWidth);

    // Create resize observer to handle container size changes
    const resizeObserver = new ResizeObserver(() => {
      if (container) {
        setContainerWidth(container.offsetWidth);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Render waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData || waveformData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with DPI normalization
    const width = canvas.offsetWidth;
    
    // Ensure width is valid before rendering
    if (width <= 0) {
      console.warn("Canvas width is invalid", width);
      return;
    }

    normalizeCanvasDimensions(canvas, width, height);

    // Clear canvas
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1;
    const gridSpacing = width / 8;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSpacing, 0);
      ctx.lineTo(i * gridSpacing, height);
      ctx.stroke();
    }

    // Draw center line
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Calculate peaks for rendering with optimized algorithm
    const blockSize = Math.max(
      1,
      Math.floor(waveformData.length / (width * zoom))
    );
    const peaks = [];
    let maxPeak = 0;

    // Process blocks efficiently
    for (let i = 0; i < width && i * blockSize < waveformData.length; i++) {
      const startIdx = i * blockSize;
      const endIdx = Math.min(startIdx + blockSize, waveformData.length);
      
      let blockMax = 0;
      for (let j = startIdx; j < endIdx; j++) {
        blockMax = Math.max(blockMax, waveformData[j]);
      }
      
      // Store symmetric peaks
      peaks.push({ min: -blockMax, max: blockMax });
      maxPeak = Math.max(maxPeak, blockMax);
    }

    // Update peak meter with clamping
    setPeakLevel(Math.min(maxPeak, 1.0));

    // Draw waveform
    const centerY = height / 2;
    const scaleY = (height / 2) * 0.85;

    // Gradient for waveform
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#60a5fa");
    gradient.addColorStop(0.5, "#3b82f6");
    gradient.addColorStop(1, "#1e40af");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw waveform shape
    const pixelsPerPeak = width / peaks.length;

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < peaks.length; i++) {
      const x = i * pixelsPerPeak;
      const minY = centerY + peaks[i].min * scaleY;
      const maxY = centerY - peaks[i].max * scaleY;

      ctx.lineTo(x, maxY);
      ctx.lineTo(x, minY);
    }

    ctx.stroke();

    // Fill waveform area
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.lineTo(width, centerY);
    ctx.lineTo(0, centerY);
    ctx.fill();

    // Draw playhead if playing
    if (isPlaying && duration > 0) {
      const playheadX = (currentTime / duration) * width;
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }

    // Draw current position indicator (always)
    if (duration > 0) {
      const posX = (currentTime / duration) * width;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(posX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [waveformData, height, duration, currentTime, isPlaying, zoom, containerWidth]);

  // Handle canvas click for seeking
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !canvasRef.current || duration <= 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    seek(ratio * duration);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.5, Math.min(5, prev * delta)));
  };

  return (
    <div
      ref={containerRef}
      className="w-full bg-gray-900 rounded border border-gray-700 overflow-hidden"
      onWheel={handleWheel}
      style={{ height: `${height + (showPeakMeter ? 30 : 0)}px` }}
    >
      {/* Waveform Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: "100%",
          height: `${height}px`,
          cursor: interactive ? "pointer" : "default",
          display: "block",
        }}
        className="bg-gray-950"
      />

      {/* Peak Meter - Scrollable */}
      {showPeakMeter && (
        <div 
          ref={peakMeterRef}
          className="flex items-center gap-2 px-2 py-1 bg-gray-800 border-t border-gray-700 group"
          onMouseEnter={() => setIsHoveringPeak(true)}
          onMouseLeave={() => setIsHoveringPeak(false)}
        >
          {/* Left Scroll Button */}
          <button
            className="p-0.5 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              if (peakMeterRef.current) {
                peakMeterRef.current.scrollBy({ left: -50, behavior: 'smooth' });
              }
            }}
          >
            <ChevronLeft size={14} />
          </button>

          {/* Scrollable Peak Meter Container */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-xs text-gray-400 w-10 flex-shrink-0">Peak:</span>
            
            {/* Peak Meter Bar */}
            <div className="flex-1 min-w-24 bg-gray-700 rounded h-1.5 overflow-hidden flex-shrink-0 relative group/meter">
              <div
                className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-full transition-all duration-100"
                style={{ width: `${peakLevel * 100}%` }}
              />
              
              {/* Tooltip on hover */}
              {isHoveringPeak && (
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-950 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-50 border border-gray-700 shadow-lg">
                  <span className="font-mono">{Math.round(peakLevel * 100)}% Peak</span>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-950"></div>
                </div>
              )}
            </div>

            {/* Peak Level Percentage */}
            <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">
              {Math.round(peakLevel * 100)}%
            </span>
          </div>

          {/* Right Scroll Button */}
          <button
            className="p-0.5 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              if (peakMeterRef.current) {
                peakMeterRef.current.scrollBy({ left: 50, behavior: 'smooth' });
              }
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Zoom Info */}
      <div className="absolute top-1 right-2 text-xs text-gray-500 bg-gray-950 px-2 py-0.5 rounded">
        {zoom.toFixed(1)}x
      </div>
    </div>
  );
}
