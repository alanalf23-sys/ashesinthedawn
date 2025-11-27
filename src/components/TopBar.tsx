import {
  Play,
  Square,
  Circle,
  Settings,
  Repeat,
  Undo2,
  Redo2,
  Music,
  Flag,
  Zap,
} from "lucide-react";
import { useDAW } from "../contexts/DAWContext";
import { useTransportClock } from "../hooks/useTransportClock";
import { useCodette } from "../hooks/useCodette";
import { useState } from "react";

export default function TopBar() {
  const {
    isPlaying,
    isRecording,
    currentTime,
    cpuUsage,
    togglePlay,
    toggleRecord,
    stop,
    toggleLoop,
    loopRegion,
    metronomeSettings,
    toggleMetronome,
    undo,
    redo,
    canUndo,
    canRedo,
    addMarker,
    markers,
    openAudioSettingsModal,
  } = useDAW();

  const { state: transport, connected } = useTransportClock();
  const { isConnected } = useCodette({ autoConnect: true });

  const [codetteActiveTab, setCodetteActiveTab] = useState<'suggestions' | 'analysis' | 'control'>('suggestions');

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  return (
    <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-3 gap-3 text-xs">
      {/* LEFT: Transport Controls */}
      <div className="flex items-center gap-1 bg-gray-900 rounded px-2 py-1 border border-gray-700">
        {/* Stop */}
        <button
          onClick={stop}
          className="p-1.5 rounded hover:bg-red-700/30 text-red-400 transition"
          title="Stop"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>

        {/* Play */}
        <button
          onClick={togglePlay}
          className={`p-1.5 rounded transition-all duration-200 ${
            isPlaying
              ? "bg-green-600 text-white shadow-lg shadow-green-500/50 animate-transport-pulse"
              : "hover:bg-gray-800 text-green-400"
          }`}
          title="Play"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>

        {/* Record */}
        <button
          onClick={toggleRecord}
          className={`p-1.5 rounded transition-all duration-200 ${
            isRecording
              ? "bg-red-600 text-white shadow-lg shadow-red-500/50 animate-pulse"
              : "hover:bg-gray-800 text-gray-300"
          }`}
          title="Record"
        >
          <Circle className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* MID-LEFT: Additional Controls */}
      <div className="flex items-center gap-1">
        {/* Loop */}
        <button
          onClick={toggleLoop}
          className={`p-1.5 rounded transition-all duration-200 ${
            loopRegion.enabled
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40 animate-control-highlight"
              : "hover:bg-gray-800 text-gray-300"
          }`}
          title="Loop"
        >
          <Repeat className="w-4 h-4" />
        </button>

        {/* Undo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded transition-all duration-200 ${
            canUndo
              ? "hover:bg-gray-800 text-gray-300 hover:shadow-md hover:shadow-blue-500/20"
              : "text-gray-600 cursor-not-allowed"
          }`}
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded transition-all duration-200 ${
            canRedo
              ? "hover:bg-gray-800 text-gray-300 hover:shadow-md hover:shadow-blue-500/20"
              : "text-gray-600 cursor-not-allowed"
          }`}
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Metronome */}
        <button
          onClick={toggleMetronome}
          className={`p-1.5 rounded transition-all duration-200 ${
            metronomeSettings.enabled
              ? "bg-yellow-600 text-white shadow-lg shadow-yellow-500/40"
              : "hover:bg-gray-800 text-gray-300"
          }`}
          title="Metronome"
        >
          <Music className="w-4 h-4" />
        </button>

        {/* Add Marker */}
        <button
          onClick={() => addMarker(currentTime, `Marker ${markers.length + 1}`)}
          className="p-1.5 rounded hover:bg-gray-800 text-purple-400 transition"
          title="Add Marker"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      {/* CENTER: Time Display */}
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded border border-gray-700">
        <div className="font-mono text-gray-200 text-xs flex-shrink-0">
          {formatTime(connected ? transport.time_seconds : currentTime)}
        </div>
        <div className="text-gray-500 text-xs">
          {transport.bpm.toFixed(0)} BPM
        </div>
      </div>

      {/* Codette Tabs */}
      <div className="flex items-center gap-0.5 p-1 bg-gray-900 rounded border border-gray-700">
        <button
          onClick={() => setCodetteActiveTab('suggestions')}
          className={`px-2 py-1 rounded transition-colors text-xs font-medium ${
            codetteActiveTab === 'suggestions'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          title="Suggestions"
        >
          💡
        </button>
        <button
          onClick={() => setCodetteActiveTab('analysis')}
          className={`px-2 py-1 rounded transition-colors text-xs font-medium ${
            codetteActiveTab === 'analysis'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          title="Analysis"
        >
          📊
        </button>
        <button
          onClick={() => setCodetteActiveTab('control')}
          className={`px-2 py-1 rounded transition-colors text-xs font-medium ${
            codetteActiveTab === 'control'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          title="Control"
        >
          ⚙️
        </button>
      </div>

      {/* RIGHT: Status */}
      <div className="flex-1" />

      {/* Codette Status */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
        isConnected 
          ? 'bg-green-900/30 text-green-400'
          : 'bg-red-900/30 text-red-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
        }`} />
        <span>{isConnected ? 'Codette: Online' : 'Codette: Offline'}</span>
      </div>

      {/* CPU Usage */}
      <div className="flex items-center gap-1 text-gray-400">
        <Zap className="w-3 h-3" />
        <span className="text-xs font-semibold text-gray-300">{cpuUsage}%</span>
      </div>

      {/* Settings */}
      <button
        onClick={openAudioSettingsModal}
        className="p-1.5 rounded hover:bg-gray-700 text-gray-300 transition"
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}
