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
  Repeat,
  Undo2,
  Redo2,
  Music,
  Flag,
  Volume2,
  Sparkles,
  BookOpen,
  Lightbulb,
  RotateCcw,
  Wrench,
} from "lucide-react";
import { useDAW } from "../contexts/DAWContext";
import { useTransportClock } from "../hooks/useTransportClock";
import { useState } from "react";
import CodetteStatus from "./CodetteStatus";
import CodetteAdvancedTools from "./CodetteAdvancedTools";
import { Tooltip, TOOLTIP_LIBRARY } from "./TooltipProvider";

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
    loopRegion,
    toggleLoop,
    metronomeSettings,
    toggleMetronome,
    setMetronomeVolume,
    setMetronomeBeatSound,
    undo,
    redo,
    canUndo,
    canRedo,
    addMarker,
    markers,
    openAudioSettingsModal,
  } = useDAW();

  // Real-time transport from WebSocket
  const { state: transport, connected, error } = useTransportClock();
  // const api = useTransportAPI(); // Unused for now

  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showMetronomeMenu, setShowMetronomeMenu] = useState(false);
  const [showCodetteMenu, setShowCodetteMenu] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [codetteFeature, setCodetteFeature] = useState<"suggestions" | "theory" | "composition">("suggestions");
  const [viewOptions, setViewOptions] = useState({
    showWaveform: true,
    showMixer: true,
    showTimeline: true,
    showTransport: true,
    compactMode: false,
  });

  const handleSearch = () => {
    // Open file browser / search panel
    const searchInput = prompt("Search files or tracks...", "");
    if (searchInput) {
      console.log("Searching for:", searchInput);
      // TODO: Implement actual file/track search
    }
  };

  const handleSettings = () => {
    // Open Audio Settings modal
    openAudioSettingsModal();
  };

  const formatTime = (seconds: number) => {
    // Format time display - using HH:MM:SS format
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
    <div className="h-12 bg-gradient-to-r from-gray-800 via-gray-750 to-gray-800 border-b border-gray-600 flex items-center px-2 gap-2 text-xs shadow-md overflow-x-auto scrollbar-hide" style={{ scrollBehavior: 'smooth', zIndex: 1 }}>
      {/* LEFT SECTION: Previous/Next Track, Stop, Play, Record, Pause */}
      <div className="flex items-center gap-1 flex-shrink-0">
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
          <Tooltip content={TOOLTIP_LIBRARY['stop']}>
            <button
              onClick={stop}
              className="p-1.5 rounded hover:bg-red-700/30 text-red-400 transition"
              title="Stop (Space)"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </Tooltip>

          {/* Play Button (green circle) - currently active */}
          <Tooltip content={TOOLTIP_LIBRARY['play']}>
            <button
              onClick={togglePlay}
              className={`p-1.5 rounded transition ${
                isPlaying
                  ? "bg-green-600 text-white shadow-lg"
                  : "hover:bg-gray-800 text-green-400"
              }`}
              title="Play (Space)"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          </Tooltip>

          {/* Record Button */}
          <Tooltip content={TOOLTIP_LIBRARY['record']}>
            <button
              onClick={toggleRecord}
              className={`p-1.5 rounded transition ${
                isRecording
                  ? "bg-red-600 text-white shadow-lg animate-pulse"
                  : "hover:bg-gray-800 text-gray-300"
              }`}
              title="Record (Ctrl+R)"
            >
              <Circle className="w-4 h-4 fill-current" />
            </button>
          </Tooltip>

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

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* Loop Control */}
        <Tooltip content={TOOLTIP_LIBRARY['loop']}>
          <button
            onClick={toggleLoop}
            className={`p-1.5 rounded transition ${
              loopRegion.enabled
                ? "bg-blue-600 text-white shadow-lg"
                : "hover:bg-gray-800 text-gray-300"
            }`}
            title={`Loop ${loopRegion.enabled ? "On" : "Off"} (Ctrl+L)`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Undo/Redo */}
        <Tooltip content={TOOLTIP_LIBRARY['undo']}>
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition ${
              canUndo
                ? "hover:bg-gray-800 text-gray-300"
                : "text-gray-600 cursor-not-allowed"
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip content={TOOLTIP_LIBRARY['redo']}>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition ${
              canRedo
                ? "hover:bg-gray-800 text-gray-300"
                : "text-gray-600 cursor-not-allowed"
            }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Metronome Toggle */}
        <Tooltip content={TOOLTIP_LIBRARY['metronome']}>
          <button
            onClick={toggleMetronome}
            className={`p-1.5 rounded transition ${
              metronomeSettings.enabled
                ? "bg-yellow-600 text-white shadow-lg"
                : "hover:bg-gray-800 text-gray-300"
            }`}
            title="Metronome"
          >
            <Music className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Add Marker */}
        <Tooltip content={TOOLTIP_LIBRARY['addMarker']}>
          <button
            onClick={() => addMarker(currentTime, `Marker ${markers.length + 1}`)}
            className="p-1.5 rounded hover:bg-gray-800 text-purple-400 transition"
            title="Add Marker (M)"
          >
            <Flag className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      {/* CENTER SECTION: Time display and Status */}
      <div className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
        {/* Connection Status */}
        <div className="flex items-center gap-0.5 hidden sm:flex">
          <div
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              connected
                ? "bg-green-500"
                : error
                ? "bg-red-500"
                : "bg-yellow-500"
            }`}
            title={connected ? "Synced" : error || "Connecting"}
          />
          <span className="text-xs text-gray-500 hidden md:inline">
            {connected ? "Sync" : "Offline"}
          </span>
        </div>

        {/* Current time - use WebSocket if connected, fallback to DAW */}
        <div className="font-mono text-gray-200 bg-gray-900 px-2 py-0.5 rounded border border-gray-700 shadow-inner text-xs flex-shrink-0">
          {formatTime(connected ? transport.time_seconds : currentTime)}
        </div>

        {/* Status indicator */}
        <div className="font-mono text-xs flex-shrink-0">
          {connected ? (
            transport.playing ? (
              <span className="text-green-400 font-semibold">[▶]</span>
            ) : (
              <span className="text-gray-500">[◼]</span>
            )
          ) : isPlaying ? (
            <span className="text-green-400 font-semibold">[▶]</span>
          ) : isRecording ? (
            <span className="text-red-400 font-semibold animate-pulse">
              [⦿]
            </span>
          ) : (
            <span className="text-gray-500">[◼]</span>
          )}
        </div>

        {/* Tempo/BPM display */}
        <div className="font-mono text-gray-400 text-xs flex-shrink-0 hidden sm:block">
          {transport.bpm.toFixed(0)}
        </div>
      </div>

      {/* RIGHT SECTION: Connection status, CPU, and controls */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
        {/* Sync indicator */}
        {!connected && (
          <span className="text-xs text-yellow-500 font-semibold hidden md:inline">
            Local
          </span>
        )}

        <div className="w-px h-4 bg-gray-700 hidden sm:block flex-shrink-0" />

        {/* Metronome Volume Control */}
        {metronomeSettings.enabled && (
          <div className="flex items-center gap-2">
            <Volume2 className="w-3 h-3 text-yellow-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={metronomeSettings.volume}
              onChange={(e) => setMetronomeVolume(parseFloat(e.target.value))}
              className="w-20 h-1 rounded appearance-none bg-gray-700 cursor-pointer"
              title="Metronome Volume"
            />
            <span className="text-xs text-gray-400 w-8">
              {Math.round(metronomeSettings.volume * 100)}%
            </span>
          </div>
        )}

        {/* Metronome Beat Sound Selector */}
        {metronomeSettings.enabled && (
          <div className="relative">
            <button
              onClick={() => setShowMetronomeMenu(!showMetronomeMenu)}
              className="px-2 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center gap-1 transition"
              title="Beat Sound"
            >
              {metronomeSettings.beatSound}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showMetronomeMenu && (
              <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded shadow-lg z-50">
                {(["click", "cowbell", "woodblock"] as const).map((sound) => (
                  <button
                    key={sound}
                    onClick={() => {
                      setMetronomeBeatSound(sound);
                      setShowMetronomeMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-800 ${
                      metronomeSettings.beatSound === sound
                        ? "bg-blue-600 text-white"
                        : "text-gray-300"
                    }`}
                  >
                    {sound.charAt(0).toUpperCase() + sound.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="w-px h-6 bg-gray-700" />

        {/* CPU Usage */}
        <div className="flex items-center gap-0.5 text-gray-400 flex-shrink-0">
          <Zap className="w-3 h-3 flex-shrink-0" />
          <span className="text-xs">
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

        {/* Codette Music Theory & Composition Menu */}
        <div className="relative">
          <button
            onClick={() => setShowCodetteMenu(!showCodetteMenu)}
            className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-purple-800/30 text-purple-400 transition border border-purple-600/50"
            title="Codette Music Tools (Theory, Composition, Analysis)"
          >
            <Sparkles className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>

          {showCodetteMenu && (
            <div className="absolute right-0 top-full mt-1 bg-gradient-to-b from-gray-900 to-purple-900/20 border border-purple-600 rounded shadow-lg z-50 min-w-56">
              <div className="p-2 space-y-2">
                {/* Music Theory */}
                <button
                  onClick={() => {
                    setCodetteFeature("theory");
                    setShowCodetteMenu(false);
                  }}
                  className={`w-full px-3 py-2 rounded text-left text-xs flex items-center gap-2 transition ${
                    codetteFeature === "theory"
                      ? "bg-purple-600 text-white"
                      : "hover:bg-gray-800 text-gray-300"
                  }`}
                  title="Scales, chords, intervals, microtonality"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Music Theory</span>
                </button>

                {/* Composition Helper */}
                <button
                  onClick={() => {
                    setCodetteFeature("composition");
                    setShowCodetteMenu(false);
                  }}
                  className={`w-full px-3 py-2 rounded text-left text-xs flex items-center gap-2 transition ${
                    codetteFeature === "composition"
                      ? "bg-purple-600 text-white"
                      : "hover:bg-gray-800 text-gray-300"
                  }`}
                  title="Chord progressions, melodies, arrangements"
                >
                  <Lightbulb className="w-3 h-3" />
                  <span>Composition Helper</span>
                </button>

                {/* AI Suggestions */}
                <button
                  onClick={() => {
                    setCodetteFeature("suggestions");
                    setShowCodetteMenu(false);
                  }}
                  className={`w-full px-3 py-2 rounded text-left text-xs flex items-center gap-2 transition ${
                    codetteFeature === "suggestions"
                      ? "bg-purple-600 text-white"
                      : "hover:bg-gray-800 text-gray-300"
                  }`}
                  title="Real-time mixing, production, and arrangement tips"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI Suggestions</span>
                </button>

                <div className="h-px bg-purple-700/50 my-1" />

                {/* Tempo Sync Helper */}
                <button
                  className="w-full px-3 py-2 rounded text-left text-xs hover:bg-gray-800 text-gray-300 flex items-center gap-2 transition"
                  title="Calculate tempo-synced delay times"
                  onClick={() => {
                    const bpm = transport.bpm || 120;
                    const quarterNote = (60000 / bpm) / 0.25;
                    alert(`Delay Sync at ${bpm.toFixed(1)} BPM:\n• Quarter: ${(quarterNote/1000).toFixed(2)}s\n• Eighth: ${(quarterNote*2/1000).toFixed(2)}s\n• Triplet: ${(quarterNote/1.5/1000).toFixed(2)}s`);
                    setShowCodetteMenu(false);
                  }}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Delay Sync Calculator</span>
                </button>

                {/* Genre Analysis */}
                <button
                  className="w-full px-3 py-2 rounded text-left text-xs hover:bg-gray-800 text-gray-300 flex items-center gap-2 transition"
                  title="Analyze production for genre conformance"
                >
                  <Music className="w-3 h-3" />
                  <span>Genre Analysis</span>
                </button>

                <div className="h-px bg-purple-700/50 my-1" />

                <div className="px-3 py-1 text-xs text-purple-400 font-semibold">
                  Current Feature: {codetteFeature === "theory" ? "Theory" : codetteFeature === "composition" ? "Composition" : "Suggestions"}
                </div>
              </div>
            </div>
          )}
        </div>

        <CodetteStatus />

        <button
          onClick={() => setShowAdvancedTools(!showAdvancedTools)}
          className="p-1.5 rounded hover:bg-purple-800/30 text-purple-400 transition border border-purple-600/50"
          title="Advanced Codette Tools (Production, Ear Training, Instruments)"
        >
          <Wrench className="w-4 h-4" />
        </button>

        <button
          onClick={handleSettings}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-300 transition"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Advanced Tools Panel */}
      {showAdvancedTools && (
        <div className="fixed bottom-16 right-4 z-40 max-w-md max-h-96 shadow-2xl rounded-lg border border-purple-600">
          <CodetteAdvancedTools 
            bpm={transport.bpm || 120}
            selectedTrackName={selectedTrack?.name || "Master"}
            onDelayTimeCalculated={(delayMs) => {
              console.log(`Delay sync calculated: ${delayMs}ms`);
            }}
          />
        </div>
      )}
    </div>
  );
}
