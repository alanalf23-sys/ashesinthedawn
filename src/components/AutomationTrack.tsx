import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AutomationCurve, AutomationPoint } from '../types';
import { AutomationEngine } from '../lib/automationEngine';
import { Trash2, Copy } from 'lucide-react';
import { normalizeCanvasDimensions } from '../lib/windowScaling';

interface AutomationTrackProps {
  curve: AutomationCurve;
  trackId: string;
  parameter: string;
  minValue: number;
  maxValue: number;
  onUpdateCurve: (curve: AutomationCurve) => void;
  onDeleteCurve: () => void;
  onDuplicateCurve: () => void;
  duration: number;
  isVisible?: boolean;
}

export const AutomationTrack: React.FC<AutomationTrackProps> = ({
  curve,
  trackId,
  parameter,
  minValue,
  maxValue,
  onUpdateCurve,
  onDeleteCurve,
  onDuplicateCurve,
  duration,
  isVisible = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const pixelsPerSecond = 100;
  const canvasHeight = 60;
  const padding = 8;

  // Draw automation curve
  useEffect(() => {
    if (!canvasRef.current || !isVisible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = duration * pixelsPerSecond;
    const displayWidth = Math.max(width, canvas.parentElement?.clientWidth || 0);
    normalizeCanvasDimensions(canvas, displayWidth, canvasHeight);

    // Background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvasHeight);

    // Grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i <= duration; i++) {
      const x = i * pixelsPerSecond;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // Horizontal center line
    ctx.strokeStyle = '#4b5563';
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight / 2);
    ctx.lineTo(canvas.width, canvasHeight / 2);
    ctx.stroke();

    // Draw curve
    if (curve.points.length > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();

      // Generate curve points for smooth visualization
      const curveData = AutomationEngine.generateCurveData(
        curve,
        0,
        duration,
        Math.min(300, duration * 50)
      );

      const valueRange = maxValue - minValue;

      curveData.forEach((point, index) => {
        const x = point.time * pixelsPerSecond;
        const normalized = (point.value - minValue) / valueRange;
        const y = canvasHeight - padding - normalized * (canvasHeight - 2 * padding);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      curve.points.forEach((point, index) => {
        const x = point.time * pixelsPerSecond;
        const normalized = (point.value - minValue) / valueRange;
        const y = canvasHeight - padding - normalized * (canvasHeight - 2 * padding);

        // Point circle
        ctx.fillStyle = selectedPointIndex === index ? '#ef4444' : '#60a5fa';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  }, [curve, duration, minValue, maxValue, selectedPointIndex, isVisible]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing point
    let clickedPointIndex = -1;
    const valueRange = maxValue - minValue;

    curve.points.forEach((point, index) => {
      const px = point.time * pixelsPerSecond;
      const normalized = (point.value - minValue) / valueRange;
      const py = canvasHeight - padding - normalized * (canvasHeight - 2 * padding);

      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (distance < 8) {
        clickedPointIndex = index;
      }
    });

    if (clickedPointIndex >= 0) {
      setSelectedPointIndex(clickedPointIndex);
    } else {
      // Add new point
      const time = Math.max(0, Math.min(duration, x / pixelsPerSecond));
      const normalizedY = Math.max(0, Math.min(1, (canvasHeight - padding - y) / (canvasHeight - 2 * padding)));
      const value = minValue + normalizedY * valueRange;

      const newPoint: AutomationPoint = {
        time,
        value,
        curveType: 'linear',
      };

      const updatedCurve = AutomationEngine.updatePoint(curve, newPoint);
      onUpdateCurve(updatedCurve);
      setSelectedPointIndex(-1);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedPointIndex === null) return;

    setIsDragging(true);
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || selectedPointIndex === null || !canvasRef.current) return;

    const deltaX = e.clientX - dragOffset.x;
    const deltaY = e.clientY - dragOffset.y;

    const oldPoint = curve.points[selectedPointIndex];
    const valueRange = maxValue - minValue;

    const newTime = Math.max(0, Math.min(duration, oldPoint.time + deltaX / pixelsPerSecond));
    const newValue = Math.max(
      minValue,
      Math.min(
        maxValue,
        oldPoint.value - (deltaY / (canvasHeight - 2 * padding)) * valueRange
      )
    );

    const updatedPoint: AutomationPoint = {
      ...oldPoint,
      time: newTime,
      value: newValue,
    };

    // Remove old point and add new one
    let updatedCurve = AutomationEngine.removePoint(curve, oldPoint.time);
    updatedCurve = AutomationEngine.updatePoint(updatedCurve, updatedPoint);
    onUpdateCurve(updatedCurve);

    setDragOffset({ x: e.clientX, y: e.clientY });
  }, [isDragging, selectedPointIndex, curve, minValue, maxValue, duration, pixelsPerSecond, canvasHeight, padding, onUpdateCurve, dragOffset]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) return;

    const moveHandler = (e: MouseEvent) => {
      handleMouseMove(e);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedPointIndex, curve, minValue, maxValue, duration, handleMouseMove]);

  const handleModeChange = (newMode: 'off' | 'read' | 'write' | 'touch' | 'latch') => {
    onUpdateCurve({ ...curve, mode: newMode });
  };

  const handleCurveTypeChange = (curveType: 'linear' | 'exponential' | 'logarithmic') => {
    if (selectedPointIndex === null) return;

    const updatedPoint: AutomationPoint = {
      ...curve.points[selectedPointIndex],
      curveType,
    };

    const updatedCurve = AutomationEngine.updatePoint(curve, updatedPoint);
    onUpdateCurve(updatedCurve);
  };

  const handleDeleteSelectedPoint = () => {
    if (selectedPointIndex === null) return;

    const pointToDelete = curve.points[selectedPointIndex];
    const updatedCurve = AutomationEngine.removePoint(curve, pointToDelete.time);
    onUpdateCurve(updatedCurve);
    setSelectedPointIndex(null);
  };

  if (!isVisible) return null;

  const selectedPoint = selectedPointIndex !== null ? curve.points[selectedPointIndex] : null;

  return (
    <div className="bg-gray-900 border-b border-gray-700 p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-xs font-semibold text-gray-300">{parameter}</h4>
          <p className="text-xs text-gray-500">Track: {trackId}</p>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-2">
          <select
            value={curve.mode}
            onChange={(e) => handleModeChange(e.target.value as 'off' | 'read' | 'write' | 'touch' | 'latch')}
            className="text-xs px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-300 hover:border-gray-600"
          >
            <option value="off">Off</option>
            <option value="read">Read</option>
            <option value="write">Write</option>
            <option value="touch">Touch</option>
            <option value="latch">Latch</option>
          </select>

          <button
            onClick={onDuplicateCurve}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Duplicate curve"
          >
            <Copy size={14} className="text-gray-400" />
          </button>

          <button
            onClick={onDeleteCurve}
            className="p-1 hover:bg-red-900/30 rounded transition-colors"
            title="Delete curve"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-gray-950 rounded border border-gray-700 overflow-hidden">
        <canvas
          ref={canvasRef}
          height={canvasHeight}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          className="w-full cursor-crosshair"
          style={{ display: 'block' }}
        />
      </div>

      {/* Point editor */}
      {selectedPoint && (
        <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-700 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 space-y-1">
              <div>
                <label className="text-gray-400">Time: </label>
                <span className="text-gray-300">{selectedPoint.time.toFixed(2)}s</span>
              </div>
              <div>
                <label className="text-gray-400">Value: </label>
                <span className="text-gray-300">{selectedPoint.value.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <select
                value={selectedPoint.curveType}
                onChange={(e) => handleCurveTypeChange(e.target.value as 'linear' | 'exponential' | 'logarithmic')}
                className="w-full text-xs px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300"
              >
                <option value="linear">Linear</option>
                <option value="exponential">Exponential</option>
                <option value="logarithmic">Logarithmic</option>
              </select>

              <button
                onClick={handleDeleteSelectedPoint}
                className="w-full px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded transition-colors"
              >
                Delete Point
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-2 text-xs text-gray-500">
        <span>{curve.points.length} points • Click canvas to add, click point to edit</span>
      </div>
    </div>
  );
};
