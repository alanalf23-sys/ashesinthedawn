import { Play, Pause, Square, Circle, Settings, Search, SkipBack, SkipForward, Zap, AlertCircle } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

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
    return `${bars.toString()}:${beats.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const prevTrack = () => {
    if (selectedTrack && tracks.length > 1) {
      const currentIndex = tracks.findIndex(t => t.id === selectedTrack.id);
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
      selectTrack(tracks[nextIndex].id);
    }
  };

  const nextTrack = () => {
    if (selectedTrack && tracks.length > 1) {
      const currentIndex = tracks.findIndex(t => t.id === selectedTrack.id);
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
            className={`p-1.5 rounded transition ${isPlaying ? 'bg-green-600 text-white shadow-lg' : 'hover:bg-gray-800 text-green-400'}`}
            title="Play"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>

          {/* Record Button */}
          <button
            onClick={toggleRecord}
            className={`p-1.5 rounded transition ${isRecording ? 'bg-red-600 text-white shadow-lg animate-pulse' : 'hover:bg-gray-800 text-gray-300'}`}
            title="Record"
          >
            <Circle className="w-4 h-4 fill-current" />
          </button>

          {/* Pause Button */}
          <button
            onClick={isPlaying ? togglePlay : undefined}
            className={`p-1.5 rounded transition ${isPlaying ? 'hover:bg-gray-800 text-gray-300' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
            disabled={!isPlaying}
            title="Pause"
          >
            <Pause className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* CENTER SECTION: Time display and Status */}
      <div className="flex-1 flex justify-center items-center gap-4">
        {/* Current time */}
        <div className="font-mono text-gray-200 bg-gray-900 px-3 py-1 rounded border border-gray-700 shadow-inner">
          {formatTime(currentTime)}
        </div>

        {/* Status indicator */}
        <div className="font-mono text-sm">
          {isPlaying ? (
            <span className="text-green-400 font-semibold">[Playing]</span>
          ) : isRecording ? (
            <span className="text-red-400 font-semibold animate-pulse">[Recording]</span>
          ) : (
            <span className="text-gray-500">[Stopped]</span>
          )}
        </div>

        {/* Total duration - calculated from longest track */}
        <div className="font-mono text-gray-500 text-xs">
          / {formatTime(tracks.reduce((max, track) => Math.max(max, track.duration || 0), 0))}
        </div>
      </div>

      {/* RIGHT SECTION: Selection indicator and time markers */}
      <div className="flex items-center gap-4">
        {/* Selection indicator */}
        <div className="text-xs text-gray-400">
          Sel: <span className="text-gray-200 font-mono">2:2.00</span>
        </div>

        {/* Additional time markers */}
        <div className="text-xs text-gray-500">
          <span className="text-gray-300">10:2.00</span> / <span className="text-gray-300">8:0.00</span>
        </div>

        <div className="w-px h-6 bg-gray-700" />

        {/* CPU Usage */}
        <span className="text-gray-400">CPU: <span className="text-gray-200 font-semibold">{cpuUsage}%</span></span>

        <div className="w-px h-6 bg-gray-700" />

        {/* Audio I/O Status Indicator */}
        {audioIOError ? (
          <button
            onClick={openAudioSettingsModal}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-900/30 border border-red-700 hover:bg-red-900/50 transition text-red-400"
            title="Audio I/O Error - Click to configure"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs">I/O Error</span>
          </button>
        ) : isAudioIOActive ? (
          <button
            onClick={openAudioSettingsModal}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
            title="Click to adjust audio settings"
          >
            <Zap className={`w-3.5 h-3.5 ${getInputLevelColor()}`} />
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-300">
                {(inputLevel * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-gray-500">
                {latencyMs.toFixed(1)}ms
              </span>
            </div>
          </button>
        ) : (
          <button
            onClick={openAudioSettingsModal}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 transition text-gray-500"
            title="Audio I/O Offline - Click to enable"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="text-xs">Offline</span>
          </button>
        )}

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
