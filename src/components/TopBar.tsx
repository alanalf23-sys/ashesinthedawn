import {
  Play,
  Pause,
  Square,
  Circle,
  Settings,
  Search,
  SkipBack,
  SkipForward,
  Zap,
  Eye,
  ChevronDown,
} from "lucide-react";
import { useDAW } from "../contexts/DAWContext";
import { useTransportClock } from "../hooks/useTransportClock";
import { useState } from "react";
import { Play, Pause, Square, Circle, Settings, Search, SkipBack, SkipForward, Zap } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { useEffect } from 'react';
import { DropdownMenu } from './DropdownMenu';

export default function TopBar() {
  const {
    isPlaying,
    isRecording,
    currentTime,
    tracks,
    selectedTrack,
    selectTrack,
    cpuUsage,
    togglePlay,
    toggleRecord,
    stop,
    isAudioIOActive,
    inputLevel,
    latencyMs,
    audioIOError,
    openAudioSettingsModal,
  } = useDAW();

  // Real-time transport from WebSocket
  const { state: transport, connected, error } = useTransportClock();
  // const api = useTransportAPI(); // Unused for now

  const [showViewMenu, setShowViewMenu] = useState(false);
  const [viewOptions, setViewOptions] = useState({
    showWaveform: true,
    showMixer: true,
    showTimeline: true,
    showTransport: true,
    compactMode: false,
  });

  const handleSearch = () => {
    // Placeholder for search functionality
    console.log("Search opened");
  };

  const handleSettings = () => {
    // Placeholder for settings functionality
    console.log("Settings opened");
  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Playback controls
      if (e.code === 'Space' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        togglePlay();
        return;
      }

      // Stop playback
      if (e.code === 'Escape') {
        e.preventDefault();
        stop();
        return;
      }

      // Record
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyR') {
        e.preventDefault();
        toggleRecord();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stop, toggleRecord]);

  const handleSearch = () => {
    // Focus on first track if none selected
    if (tracks.length > 0 && !selectedTrack) {
      selectTrack(tracks[0].id);
    }
  };

  const handleSettings = () => {
    // Open audio settings modal
    openAudioSettingsModal();
  };

  // Helper function to determine input level color
  const getInputLevelColor = () => {
    if (!isAudioIOActive) return 'text-gray-500';
    if (inputLevel < 0.6) return 'text-green-400';
    if (inputLevel < 0.85) return 'text-yellow-400';
    return 'text-red-500';
  };

  const formatTime = (seconds: number) => {
    const bars = Math.floor(seconds / 4);
    const beats = Math.floor((seconds % 4) / 1);
    const ms = Math.floor((seconds % 1) * 100);
    return `${bars.toString()}:${beats.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(2, "0")}`;
  };

  const prevTrack = () => {
    if (selectedTrack && tracks.length > 1) {
      const currentIndex = tracks.findIndex((t) => t.id === selectedTrack.id);
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
      selectTrack(tracks[nextIndex].id);
    }
  };

  const nextTrack = () => {
    if (selectedTrack && tracks.length > 1) {
      const currentIndex = tracks.findIndex((t) => t.id === selectedTrack.id);
      const nextIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0;
      selectTrack(tracks[nextIndex].id);
    }
  };

  // Tooltip component for consistent tooltip styling
  const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
    <div className="group relative inline-block">
      {children}
      <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-950 text-gray-200 text-xs rounded whitespace-nowrap border border-gray-700 z-50 pointer-events-none shadow-lg">
        {text}
      </div>
    </div>
  );

  return (
    <div className="h-12 bg-gradient-to-r from-gray-800 via-gray-750 to-gray-800 border-b border-gray-600 flex items-center justify-between px-4 gap-4 text-xs shadow-md">
      {/* LEFT SECTION: Previous/Next Track, Stop, Play, Record, Pause */}
      <div className="flex items-center gap-2">
        {/* Previous/Next Track Buttons with Tooltips */}
        <Tooltip text="Previous Track (Shift+←)">
          <button
            onClick={prevTrack}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-300 transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip text="Next Track (Shift+→)">
          <button
            onClick={nextTrack}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-300 transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* Transport Controls */}
        <div className="flex items-center gap-1 bg-gray-900 rounded-md px-2 py-1 border border-gray-700">
          {/* Stop Button (red square) */}
          <Tooltip text="Stop (Esc)">
            <button
              onClick={stop}
              className="p-1.5 rounded hover:bg-red-700/30 text-red-400 transition"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </Tooltip>

          {/* Play Button (green circle) - currently active */}
          <button
            onClick={togglePlay}
            className={`p-1.5 rounded transition ${
              isPlaying
                ? "bg-green-600 text-white shadow-lg"
                : "hover:bg-gray-800 text-green-400"
            }`}
            title="Play"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>

          {/* Record Button */}
          <button
            onClick={toggleRecord}
            className={`p-1.5 rounded transition ${
              isRecording
                ? "bg-red-600 text-white shadow-lg animate-pulse"
                : "hover:bg-gray-800 text-gray-300"
            }`}
            title="Record"
          >
            <Circle className="w-4 h-4 fill-current" />
          </button>

          {/* Pause Button */}
          <button
            onClick={isPlaying ? togglePlay : undefined}
            className={`p-1.5 rounded transition ${
              isPlaying
                ? "hover:bg-gray-800 text-gray-300"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isPlaying}
            title="Pause"
          >
            <Pause className="w-4 h-4 fill-current" />
          </button>
          <Tooltip text="Play/Pause (Space)">
            <button
              onClick={togglePlay}
              className={`p-1.5 rounded transition ${isPlaying ? 'bg-green-600 text-white shadow-lg' : 'hover:bg-gray-800 text-green-400'}`}
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          </Tooltip>

          {/* Record Button */}
          <Tooltip text="Record (Ctrl+R)">
            <button
              onClick={toggleRecord}
              className={`p-1.5 rounded transition ${isRecording ? 'bg-red-600 text-white shadow-lg animate-pulse' : 'hover:bg-gray-800 text-gray-300'}`}
            >
              <Circle className="w-4 h-4 fill-current" />
            </button>
          </Tooltip>

          {/* Pause Button */}
          <Tooltip text="Pause (Space)">
            <button
              onClick={isPlaying ? togglePlay : undefined}
              className={`p-1.5 rounded transition ${isPlaying ? 'hover:bg-gray-800 text-gray-300' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
              disabled={!isPlaying}
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* CENTER SECTION: Time display and Status */}
      <div className="flex-1 flex justify-center items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${
              connected
                ? "bg-green-500"
                : error
                ? "bg-red-500"
                : "bg-yellow-500"
            }`}
            title={connected ? "Synced" : error || "Connecting"}
          />
          <span className="text-xs text-gray-500">
            {connected ? "Sync" : "Offline"}
          </span>
        </div>

        {/* Current time - use WebSocket if connected, fallback to DAW */}
        <div className="font-mono text-gray-200 bg-gray-900 px-3 py-1 rounded border border-gray-700 shadow-inner">
          {formatTime(connected ? transport.time_seconds : currentTime)}
        </div>

        {/* Status indicator */}
        <div className="font-mono text-sm">
          {connected ? (
            transport.playing ? (
              <span className="text-green-400 font-semibold">[Playing]</span>
            ) : (
              <span className="text-gray-500">[Stopped]</span>
            )
          ) : isPlaying ? (
            <span className="text-green-400 font-semibold">[Playing]</span>
          ) : isRecording ? (
            <span className="text-red-400 font-semibold animate-pulse">
              [Recording]
            </span>
          ) : (
            <span className="text-gray-500">[Stopped]</span>
          )}
        </div>

        {/* Tempo/BPM display */}
        <div className="font-mono text-gray-400 text-xs">
          {transport.bpm.toFixed(1)} BPM
        {/* Total duration - calculated from longest track */}
        <div className="font-mono text-gray-500 text-xs">
          / {formatTime(tracks.reduce((max, track) => Math.max(max, track.duration || 0), 0))}
        </div>
      </div>

      {/* RIGHT SECTION: Connection status, CPU, and controls */}
      <div className="flex items-center gap-4">
        {/* Sync indicator */}
        {!connected && (
          <span className="text-xs text-yellow-500 font-semibold">
            ⚠️ Local Mode
          </span>
        )}
        {/* Current selection time display */}
        <div className="text-xs text-gray-400">
          Sel: <span className="text-gray-200 font-mono">{formatTime(currentTime)}</span>
        </div>

        {/* Calculation of max track duration for total time display */}
        {(() => {
          const maxDuration = tracks.reduce((max, track) => Math.max(max, track.duration || 0), 0);
          const endTime = Math.max(maxDuration, currentTime);
          return (
            <div className="text-xs text-gray-500">
              <span className="text-gray-300">{formatTime(endTime)}</span> / <span className="text-gray-300">{formatTime(maxDuration)}</span>
            </div>
          );
        })()}

        <div className="w-px h-6 bg-gray-700" />

        {/* CPU Usage */}
        <div className="flex items-center gap-1 text-gray-400">
          <Zap className="w-3 h-3" />
          <span>
            CPU:{" "}
            <span className="text-gray-200 font-semibold">{cpuUsage}%</span>
          </span>
        </div>

        <div className="w-px h-6 bg-gray-700" />

        {/* Audio I/O Dropdown Menu */}
        <DropdownMenu
          trigger={
            <>
              <Zap className={`w-4 h-4 ${audioIOError ? 'text-red-400' : isAudioIOActive ? getInputLevelColor() : 'text-gray-500'}`} />
              <span className="text-xs">
                {audioIOError ? 'I/O Error' : isAudioIOActive ? `${(inputLevel * 100).toFixed(0)}%` : 'Offline'}
              </span>
            </>
          }
          items={[
            {
              label: audioIOError ? 'Audio I/O Error - Click to configure' : `Input Level: ${(inputLevel * 100).toFixed(0)}%`,
              disabled: true,
              onClick: undefined,
              className: 'cursor-default hover:bg-gray-800 text-gray-300'
            },
            {
              label: `Latency: ${latencyMs.toFixed(1)}ms`,
              disabled: true,
              onClick: undefined,
              className: 'cursor-default hover:bg-gray-800 text-gray-300'
            },
            {
              label: isAudioIOActive ? 'Status: Active' : 'Status: Offline',
              disabled: true,
              onClick: undefined,
              className: `cursor-default hover:bg-gray-800 ${isAudioIOActive ? 'text-green-400' : 'text-gray-500'}`
            },
            {
              label: 'Configure Audio Settings',
              icon: <Settings className="w-3.5 h-3.5" />,
              onClick: openAudioSettingsModal
            }
          ]}
          align="right"
          triggerClassName={`px-2 py-1 rounded text-xs font-medium transition ${
            audioIOError
              ? 'bg-red-900/30 border border-red-700 hover:bg-red-900/50 text-red-400'
              : isAudioIOActive
                ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300'
                : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-500'
          }`}
          menuClassName="bg-gray-800 border border-gray-700"
        />

        {/* Settings & Search buttons */}
        <button
          onClick={handleSearch}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-300 transition"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* View Menu */}
        <div className="relative">
          <button
            onClick={() => setShowViewMenu(!showViewMenu)}
            className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-800 text-gray-300 transition"
            title="View Options"
          >
            <Eye className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>

          {showViewMenu && (
            <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-600 rounded shadow-lg z-50 min-w-48">
              <div className="p-2 space-y-2">
                {/* Waveform Toggle */}
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800 rounded cursor-pointer text-gray-300 text-xs">
                  <input
                    type="checkbox"
                    checked={viewOptions.showWaveform}
                    onChange={(e) =>
                      setViewOptions({
                        ...viewOptions,
                        showWaveform: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span>Show Waveform</span>
                </label>

                {/* Mixer Toggle */}
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800 rounded cursor-pointer text-gray-300 text-xs">
                  <input
                    type="checkbox"
                    checked={viewOptions.showMixer}
                    onChange={(e) =>
                      setViewOptions({
                        ...viewOptions,
                        showMixer: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span>Show Mixer</span>
                </label>

                {/* Timeline Toggle */}
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800 rounded cursor-pointer text-gray-300 text-xs">
                  <input
                    type="checkbox"
                    checked={viewOptions.showTimeline}
                    onChange={(e) =>
                      setViewOptions({
                        ...viewOptions,
                        showTimeline: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span>Show Timeline</span>
                </label>

                {/* Transport Toggle */}
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800 rounded cursor-pointer text-gray-300 text-xs">
                  <input
                    type="checkbox"
                    checked={viewOptions.showTransport}
                    onChange={(e) =>
                      setViewOptions({
                        ...viewOptions,
                        showTransport: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span>Show Transport</span>
                </label>

                <div className="h-px bg-gray-700 my-1" />

                {/* Compact Mode */}
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800 rounded cursor-pointer text-gray-300 text-xs">
                  <input
                    type="checkbox"
                    checked={viewOptions.compactMode}
                    onChange={(e) =>
                      setViewOptions({
                        ...viewOptions,
                        compactMode: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span>Compact Mode</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSettings}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-300 transition"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
        <Tooltip text="Search Tracks (Ctrl+F)">
          <button 
            onClick={handleSearch}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-300 transition"
          >
            <Search className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip text="Audio Settings">
          <button 
            onClick={handleSettings}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-300 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
