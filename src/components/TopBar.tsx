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
} from "lucide-react";
import { useDAW } from "../contexts/DAWContext";
import { useTransportClock, useTransportAPI } from "../hooks/useTransportClock";

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
  } = useDAW();

  // Real-time transport from WebSocket
  const { state: transport, connected, error } = useTransportClock();
  const api = useTransportAPI();

  const handleSearch = () => {
    // Placeholder for search functionality
    console.log("Search opened");
  };

  const handleSettings = () => {
    // Placeholder for settings functionality
    console.log("Settings opened");
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

  return (
    <div className="h-12 bg-gradient-to-r from-gray-800 via-gray-750 to-gray-800 border-b border-gray-600 flex items-center justify-between px-4 gap-4 text-xs shadow-md">
      {/* LEFT SECTION: Previous/Next Track, Stop, Play, Record, Pause */}
      <div className="flex items-center gap-2">
        {/* Previous/Next Track Buttons */}
        <button
          onClick={prevTrack}
          className="p-1.5 rounded hover:bg-gray-700 text-gray-300 transition"
          title="Previous Track"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={nextTrack}
          className="p-1.5 rounded hover:bg-gray-700 text-gray-300 transition"
          title="Next Track"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* Transport Controls */}
        <div className="flex items-center gap-1 bg-gray-900 rounded-md px-2 py-1 border border-gray-700">
          {/* Stop Button (red square) */}
          <button
            onClick={stop}
            className="p-1.5 rounded hover:bg-red-700/30 text-red-400 transition"
            title="Stop"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

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

        <div className="w-px h-6 bg-gray-700" />

        {/* CPU Usage */}
        <div className="flex items-center gap-1 text-gray-400">
          <Zap className="w-3 h-3" />
          <span>
            CPU:{" "}
            <span className="text-gray-200 font-semibold">{cpuUsage}%</span>
          </span>
        </div>

        {/* Settings & Search buttons */}
        <button
          onClick={handleSearch}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-300 transition"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={handleSettings}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-300 transition"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
