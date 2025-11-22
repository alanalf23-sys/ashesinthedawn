import { useDAW } from "../contexts/DAWContext";
import { Track } from "../types";
import { useEffect, useRef, useState } from "react";
import WaveformDisplay from "./WaveformDisplay";
import { ChevronDown, ChevronUp, Zap } from "lucide-react";

/**
 * Enhanced Timeline with Professional Audio Waveform Visualization
 * Features:
 * - High-resolution waveform display
 * - Real-time playhead tracking
 * - Zoom and pan controls
 * - Interactive track editing
 * - Peak metering overlay
 * - Professional ruler with time markers
 */
export default function Timeline() {
  const {
    tracks,
    currentTime,
    getAudioDuration,
    seek,
    getWaveformData,
    isPlaying,
    markers,
    loopRegion,
  } = useDAW();

import { useDAW } from '../contexts/DAWContext';
import { Track } from '../types';
import { useEffect, useRef, useState, memo } from 'react';

const TimelineComponent = () => {
  const { tracks, currentTime, getAudioDuration, seek, getWaveformData, isPlaying, uploadAudioFile, addTrack, selectTrack } = useDAW();
  const timelineRef = useRef<HTMLDivElement>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.0);
  const [showTrackHeaders, setShowTrackHeaders] = useState(true);
  const [selectedTrackForWaveform, setSelectedTrackForWaveform] = useState<
    string | null
  >(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragOverTrackId, setDragOverTrackId] = useState<string | null>(null);

  const basePixelsPerBar = 120;
  const pixelsPerBar = basePixelsPerBar * zoom;
  const pixelsPerSecond = pixelsPerBar / 4;

  // Get total duration
  const maxDuration = Math.max(
    ...tracks.map((t) => getAudioDuration(t.id)),
    loopRegion?.endTime || 0,
    ...(markers.length > 0 ? markers.map((m) => m.time) : [0]),
    30 // minimum
  );

  // Color mapping for waveforms
  const getWaveformColor = (index: number) => {
    const colors = [
      "#d4a574",
      "#a855f7",
      "#4b9fa5",
      "#c084fc",
      "#d9a574",
      "#3b82f6",
      "#ec4899",
      "#f59e0b",
      "#06b6d4",
      "#ef4444",
      "#84cc16",
      "#6b7280",
    ];
    return colors[index % colors.length];
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(2, "0")}`;
  };

  // Auto-scroll playhead into view
  useEffect(() => {
    if (timelineRef.current && isPlaying) {
      const playheadX = currentTime * pixelsPerSecond;
      const viewportWidth = timelineRef.current.clientWidth;
      if (playheadX > viewportWidth) {
        timelineRef.current.scrollLeft = playheadX - viewportWidth / 3;
      }
    }
  }, [currentTime, pixelsPerSecond, isPlaying]);

  // Timeline click handler
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformContainerRef.current) return;
    const rect = waveformContainerRef.current.getBoundingClientRect();
    const clickX =
      e.clientX - rect.left + waveformContainerRef.current.scrollLeft;
    const clickTime = Math.max(0, clickX / pixelsPerSecond);
    seek(clickTime);
  };

  // Render time ruler
  const renderRuler = () => {
    const timeMarkers = [];
    for (let t = 0; t <= maxDuration; t += 1) {
      const x = t * pixelsPerSecond;
      const isMainBeat = t % 4 === 0;
      timeMarkers.push(
        <div
          key={`time-${t}`}
          className="absolute flex flex-col items-center"
          style={{ left: `${x}px` }}
        >
          {isMainBeat ? (
            <>
              <div className="w-0.5 h-2 bg-gray-400" />
              <span className="text-xs text-gray-400 mt-0.5">
                {formatTime(t)}
              </span>
            </>
          ) : (
            <div className="w-0.5 h-1 bg-gray-700" />
          )}
        </div>
      );
    }
    return timeMarkers;
  };

  // Render markers
  const renderMarkers = () => {
    return markers.map((marker) => {
      const x = marker.time * pixelsPerSecond;
      return (
        <div
          key={`marker-${marker.id}`}
          className="absolute top-0 bottom-0 flex flex-col items-center"
          style={{ left: `${x}px`, width: "2px" }}
        >
          <div className="w-0.5 h-full bg-yellow-400 opacity-60" />
          <div className="text-xs bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded whitespace-nowrap">
            {marker.name}
          </div>
        </div>
      );
    });
  };

  // Render loop region
  const renderLoopRegion = () => {
    if (!loopRegion || !loopRegion.enabled) return null;

    const startX = loopRegion.startTime * pixelsPerSecond;
    const endX = loopRegion.endTime * pixelsPerSecond;
    const width = endX - startX;

    return (
      <div
        className="absolute top-0 bottom-0 bg-blue-500 opacity-10 border-l-2 border-r-2 border-blue-500"
        style={{
          left: `${startX}px`,
          width: `${width}px`,
        }}
      />
    );
  };

  // Render individual audio track waveform
  const renderAudioTrackWaveform = (track: Track, trackIndex: number) => {
    if (track.type !== "audio") return null;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items) {
      const hasAudioFiles = Array.from(e.dataTransfer.items).some(item => {
        return item.type.startsWith('audio/') || item.type === 'application/octet-stream';
      });
      if (hasAudioFiles) {
        setIsDraggingOver(true);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Only set to false if leaving the timeline entirely
    if (e.target === timelineRef.current) {
      setIsDraggingOver(false);
      setDragOverTrackId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    setDragOverTrackId(null);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    // Process each audio file
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/') && file.type !== 'application/octet-stream') continue;

      // Create audio track if needed
      if (tracks.length === 0) {
        addTrack('audio');
      }

      // Get or create target audio track
      const audioTracks = tracks.filter(t => t.type === 'audio');
      const targetTrack = audioTracks[i % audioTracks.length] || audioTracks[0];

      if (targetTrack) {
        selectTrack(targetTrack.id);
        await uploadAudioFile(file);
      }
    }
  };

  const handleTrackDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setDragOverTrackId((e.currentTarget as any).dataset.trackId);
  };

  const handleTrackDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.currentTarget === e.target) {
      setDragOverTrackId(null);
    }
  };

  const renderAudioRegion = (track: Track, trackIndex: number) => {
    if (track.type !== 'audio') return null;
    const duration = getAudioDuration(track.id);
    if (duration <= 0) {
      console.debug(`Track ${track.id} has no duration`);
      return null;
    }

    const waveformData = getWaveformData(track.id);
    if (!waveformData || waveformData.length === 0) {
      console.warn(
        `No waveform data for track ${track.id} (duration: ${duration}s)`
      );
      return null;
    }

    const regionColor = getWaveformColor(trackIndex);
    const width = duration * pixelsPerSecond;

    // Compute peaks
    const computePeaks = () => {
      if (!waveformData || waveformData.length === 0) return null;
      const blockSize = Math.max(1, Math.floor(waveformData.length / width));
      const mins: number[] = [];
      const maxs: number[] = [];

      for (let i = 0; i < waveformData.length; i += blockSize) {
        const block = waveformData.slice(
          i,
          Math.min(i + blockSize, waveformData.length)
        );
        if (block.length === 0) continue;
        mins.push(Math.min(...block));
        maxs.push(Math.max(...block));
      }
      return { mins, maxs };
    };

    const peaks = computePeaks();

    return (
      <div
        key={`waveform-${track.id}`}
        className="absolute top-1 left-0 overflow-hidden rounded cursor-pointer hover:brightness-110 transition-all"
        style={{
          width: `${width}px`,
          minWidth: "30px",
          height: "calc(100% - 8px)",
          backgroundColor: track.muted
            ? "rgba(107, 114, 128, 0.2)"
            : `${regionColor}20`,
          borderLeft: `3px solid ${regionColor}`,
        }}
        onClick={() => setSelectedTrackForWaveform(track.id)}
      >
        {/* Waveform SVG */}
        {peaks && (
          <svg
            width={Math.max(width, 1)}
            height={56}
            className="absolute inset-0"
            style={{ pointerEvents: "none" }}
          >
            <defs>
              <linearGradient
                id={`grad-${track.id}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={regionColor} stopOpacity="0.8" />
                <stop offset="50%" stopColor={regionColor} stopOpacity="0.6" />
                <stop offset="100%" stopColor={regionColor} stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Draw waveform lines */}
            {peaks.mins.map((_, x) => {
              if (x >= Math.min(width, peaks.mins.length)) return null;
              const minY = 28 - peaks.mins[x] * 28 * 0.85;
              const maxY = 28 - peaks.maxs[x] * 28 * 0.85;
              const amplitude = Math.abs(
                Math.max(peaks.maxs[x], Math.abs(peaks.mins[x]))
              );
              return (
                <line
                  key={x}
                  x1={x}
                  y1={minY}
                  x2={x}
                  y2={maxY}
                  stroke={`url(#grad-${track.id})`}
                  strokeWidth="1"
                  opacity={0.5 + amplitude * 0.5}
                />
              );
            })}

            {/* Draw filled area */}
            <rect
              x={0}
              y={0}
              width={width}
              height={56}
              fill={`url(#grad-${track.id})`}
              opacity="0.1"
            />
          </svg>
        )}

        {/* Track selection indicator */}
        {selectedTrackForWaveform === track.id && (
          <div className="absolute inset-0 border-2 border-blue-400 rounded" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={() => setShowTrackHeaders(!showTrackHeaders)}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-400 transition"
          title="Toggle track headers"
        >
          {showTrackHeaders ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>

        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-gray-400">Zoom:</span>
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition"
          >
            −
          </button>
          <span className="text-xs text-gray-400 w-8 text-center">
            {zoom.toFixed(1)}x
          </span>
          <button
            onClick={() => setZoom(Math.min(4.0, zoom + 0.1))}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition"
          >
            +
          </button>
        </div>

        <div className="flex-1" />

        <div className="text-sm text-gray-300 font-mono">
          {formatTime(currentTime)} / {formatTime(maxDuration)}
        </div>

        {loopRegion?.enabled && (
          <div className="flex items-center gap-1 text-xs text-blue-400">
            <Zap size={14} />
            Loop Active
          </div>
        )}
      </div>

      {/* Time Ruler */}
      <div
        className="relative h-12 bg-gray-800 border-b border-gray-700 overflow-x-auto overflow-y-hidden"
        ref={timelineRef}
      >
        <div
          className="relative"
          style={{
            width: `${maxDuration * pixelsPerSecond}px`,
            minWidth: "100%",
          }}
        >
          {renderRuler()}
        </div>
      </div>

      {/* Waveform Container */}
      <div
        ref={waveformContainerRef}
        className="flex-1 overflow-auto bg-gray-950 relative"
        onClick={handleTimelineClick}
        style={{ cursor: "crosshair" }}
      {/* Timeline Content */}
      <div 
        className={`flex-1 overflow-auto relative cursor-pointer transition-colors ${
          isDraggingOver ? 'bg-blue-900/20 ring-2 ring-blue-400' : 'bg-gray-950'
        }`}
        ref={timelineRef} 
        onClick={handleTimelineClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className="relative"
          style={{
            width: `${maxDuration * pixelsPerSecond}px`,
            minWidth: "100%",
            minHeight: "100%",
          }}
        >
          {/* Loop Region Overlay */}
          {renderLoopRegion()}

          {/* Markers */}
          {renderMarkers()}

          {/* Audio Tracks */}
          {tracks
            .filter((t) => t.type === "audio")
            .map((track, idx) => (
              <div
                key={`track-${track.id}`}
                className="relative h-20 bg-gray-900 border-b border-gray-800 group"
              >
                {showTrackHeaders && (
                  <div className="absolute left-0 top-0 bottom-0 w-24 bg-gray-800 border-r border-gray-700 flex items-center px-2 z-10">
                    <span className="text-xs text-gray-300 truncate">
                      {track.name}
                    </span>
                  </div>
                )}
                <div style={{ marginLeft: showTrackHeaders ? "96px" : "0" }}>
                  {renderAudioTrackWaveform(track, idx)}
                </div>
              </div>
            ))}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
            style={{
              left: `${currentTime * pixelsPerSecond}px`,
              zIndex: 20,
              boxShadow: isPlaying ? "0 0 10px rgba(239, 68, 68, 0.8)" : "none",
            }}
          />
        </div>
      </div>

      {/* Detailed Waveform Display for Selected Track */}
      {selectedTrackForWaveform && (
        <div className="h-32 bg-gray-900 border-t border-gray-700 p-2">
          <div className="text-xs text-gray-400 mb-1">
            {tracks.find((t) => t.id === selectedTrackForWaveform)?.name} -
            Detailed Waveform
        {/* Drag and Drop Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div className="bg-blue-600/90 text-white px-6 py-4 rounded-lg shadow-xl text-center">
              <p className="font-semibold text-lg">Drop audio files to import</p>
              <p className="text-sm text-blue-100 mt-1">Files will be added to audio tracks</p>
            </div>
          </div>
        )}

        {/* Tracks */}
        {tracks.map((track, trackIndex) => (
          <div
            key={track.id}
            data-track-id={track.id}
            className={`h-20 border-b-2 border-gray-700 relative flex-shrink-0 transition-colors ${
              dragOverTrackId === track.id 
                ? 'bg-green-900/40 border-b-2 border-green-500' 
                : 'hover:bg-gray-900/30'
            }`}
            style={{ width: `${bars * pixelsPerBar}px` }}
            onDragOver={handleTrackDragOver}
            onDragLeave={handleTrackDragLeave}
            onDrop={handleDrop}
          >
            {/* Grid lines */}
            <div className="absolute top-0 left-0 right-0 bottom-0 flex pointer-events-none">
              {Array.from({ length: bars }).map((_, i) => (
                <div
                  key={i}
                  style={{ width: `${pixelsPerBar}px` }}
                  className="h-full border-l border-gray-700/40 flex-shrink-0"
                />
              ))}
            </div>

            {/* Audio/MIDI Regions */}
            {track.type === 'audio' && renderAudioRegion(track, trackIndex)}
            {(track.type === 'midi' || track.type === 'instrument') && renderMIDIRegion(track, trackIndex)}

            {/* Track Label */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none z-10">
              {track.name.substring(0, 12)}
            </div>
          </div>
        ))}

        {tracks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-sm">No tracks. Add a track to begin.</p>
            </div>
          </div>
          <WaveformDisplay
            trackId={selectedTrackForWaveform}
            height={100}
            showPeakMeter={true}
            interactive={true}
          />
        </div>
      )}
    </div>
  );
};

export default memo(TimelineComponent);
