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
  Check,
  AlertCircle,
  KeyboardMusic,
  HardDrive,
  X,
  ChevronUp,
  Folder,
  File,
  Volume2,
  Wrench,
  Cpu,
} from "lucide-react";
import { useDAW } from '../contexts/DAWContext';
import { useTransportClock } from "../hooks/useTransportClock";
import { useSaveStatus } from "../hooks/useSaveStatus";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  getDirectoryEntries,
  subscribeDirectoryEntries,
} from "../lib/projectDirectoryStore";
import type { DirectoryEntry } from "../lib/projectDirectoryStore";
import CodetteAdvancedTools from "./CodetteAdvancedTools";
import { usePythonDSPConnection } from "../hooks/usePythonDSP";
import { getAudioEngine } from "../lib/audioEngine";

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
    codetteConnected,
  } = useDAW();

  const { state: transport, connected } = useTransportClock();
  const { isSaving, isSaved, isError } = useSaveStatus();

  // MIDI Action Logger
  interface MIDIActionLog {
    id: string;
    action: string;
    timestamp: number;
    icon?: string;
  }

  const [midiActionLog, setMidiActionLog] = useState<MIDIActionLog[]>([]);
  const midiLogListenerRef = useRef<(() => void) | undefined>();

  useEffect(() => {
    // Listen for MIDI action logs from console
    const originalLog = console.log;
    midiLogListenerRef.current = (...args: any[]) => {
      const msg = args[0]?.toString?.() || '';
      if (msg.includes('✅')) {
        const actionText = msg.replace('✅ ', '').split(':')[0];
        const newLog: MIDIActionLog = {
          id: Date.now().toString(),
          action: actionText,
          timestamp: Date.now(),
        };
        setMidiActionLog((prev: MIDIActionLog[]) => [newLog, ...prev].slice(0, 10)); // Keep last 10
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
          setMidiActionLog((prev: MIDIActionLog[]) => prev.filter((log: MIDIActionLog) => log.id !== newLog.id));
        }, 4000);
      }
      originalLog(...args);
    };
    
    // Override console.log to capture MIDI actions
    (console as any).log = midiLogListenerRef.current;

    return () => {
      (console as any).log = originalLog;
    };
  }, []);

  const [projectDirSearch, setProjectDirSearch] = useState<string>('');
  const [showProjectDirDropdown, setShowProjectDirDropdown] = useState<boolean>(false);
  const [isProjectDirDocked, setIsProjectDirDocked] = useState<boolean>(true);
  const [showMIDIDropdown, setShowMIDIDropdown] = useState<boolean>(false);
  const [directoryEntries, setDirectoryEntries] = useState<DirectoryEntry[]>([]);
  const [showAdvancedTools, setShowAdvancedTools] = useState<boolean>(false);

  // Python DSP Integration
  const { connected: pythonConnected, error: pythonError } = usePythonDSPConnection();
  const [pythonDSPEnabled, setPythonDSPEnabled] = useState<boolean>(false);
  const [showPythonStats, setShowPythonStats] = useState<boolean>(false);

  useEffect(() => {
    setDirectoryEntries(getDirectoryEntries());
    const unsubscribe = subscribeDirectoryEntries((entries: DirectoryEntry[]) => {
      setDirectoryEntries(entries);
    });
    return unsubscribe;
  }, []);

  const projectSearchResults = useMemo(() => {
    const term = projectDirSearch.trim().toLowerCase();
    if (!term) return [];
    return directoryEntries
      .filter(
        (entry: DirectoryEntry) =>
          entry.name.toLowerCase().includes(term) ||
          entry.path.toLowerCase().includes(term)
      )
      .sort((a: DirectoryEntry, b: DirectoryEntry) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [projectDirSearch, directoryEntries]);

  const getProjectDirIcon = (entry: DirectoryEntry) => {
    if (entry.type === 'folder') {
      return <Folder className="w-3 h-3 text-yellow-400" />;
    }
    if (entry.name.endsWith('.wav') || entry.name.endsWith('.mp3')) {
      return <Volume2 className="w-3 h-3 text-blue-400" />;
    }
    return <File className="w-3 h-3 text-gray-400" />;
  };

  const handleProjectDirResultSelect = (entry: DirectoryEntry) => {
    setProjectDirSearch(entry.name);
    setShowProjectDirDropdown(false);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(entry.path).catch(() => {
        // Non-critical copy failure
      });
    }
  };

  // Python DSP toggle handler
  const togglePythonDSP = () => {
    const newState = !pythonDSPEnabled;
    setPythonDSPEnabled(newState);
    
    // Update AudioEngine
    const engine = getAudioEngine();
    engine.setPythonDSPEnabled(newState);
    engine.setHybridProcessingEnabled(newState);
    
    console.log(`[TopBar] Python DSP ${newState ? 'enabled' : 'disabled'}`);
  };

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
            loopRegion && loopRegion.enabled
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
            metronomeSettings && metronomeSettings.enabled
              ? "bg-yellow-600 text-white shadow-lg shadow-yellow-500/40"
              : "hover:bg-gray-800 text-gray-300"
          }`}
          title="Metronome"
        >
          <Music className="w-4 h-4" />
        </button>

        {/* Add Marker */}
        <button
          onClick={() => addMarker(currentTime, `Marker ${Array.isArray(markers) ? markers.length + 1 : 1}`)}
          className="p-1.5 rounded hover:bg-gray-800 text-purple-400 transition"
          title="Add Marker"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      {/* CENTER: Time Display and Project Directory Search */}
      <div className="flex items-center gap-3 flex-1 max-w-3xl">
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded border border-gray-700 flex-shrink-0">
          <div className="font-mono text-gray-200 text-xs flex-shrink-0">
            {formatTime(connected ? transport.time_seconds : currentTime)}
          </div>
          <div className="text-gray-500 text-xs">
            {transport.bpm.toFixed(0)} BPM
          </div>
        </div>

        {/* Project Directory Search - Dockable */}
        {isProjectDirDocked ? (
          <div className="relative flex-1 min-w-0 group">
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-900 rounded border border-gray-700 hover:border-gray-600 transition">
              <HardDrive className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search projects..."
                value={projectDirSearch}
                onChange={(e) => {
                  setProjectDirSearch(e.target.value);
                  setShowProjectDirDropdown(true);
                }}
                onFocus={() => setShowProjectDirDropdown(true)}
                onBlur={() => setTimeout(() => setShowProjectDirDropdown(false), 200)}
                className="flex-1 min-w-0 text-xs px-2 py-0 bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none"
                title="Search projects and files (Ctrl+Click to undock)"
              />
              {projectDirSearch && (
                <button
                  onClick={() => setProjectDirSearch('')}
                  className="p-0.5 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-300 transition flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    setIsProjectDirDocked(false);
                  }
                }}
                className="p-0.5 rounded text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-gray-800 hover:text-gray-300 transition flex-shrink-0 cursor-help"
                title="Ctrl+Click to undock"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>
            
            {/* Dropdown Results */}
            {showProjectDirDropdown && projectDirSearch && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="text-xs text-gray-400 p-2 flex justify-between">
                  <span>
                    Search results for "{projectDirSearch}" ({projectSearchResults.length})
                  </span>
                  <span className="text-gray-500">Indexed via Project Directory</span>
                </div>
                {projectSearchResults.length ? (
                  <div className="divide-y divide-gray-700">
                    {projectSearchResults.map((entry: DirectoryEntry) => (
                      <button
                        key={entry.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleProjectDirResultSelect(entry);
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                      >
                        <span>{getProjectDirIcon(entry)}</span>
                        <span className="flex-1 truncate">{entry.name}</span>
                        <span className="text-gray-500 truncate max-w-[40%]">
                          {entry.path}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 p-2 text-center border-t border-gray-700">
                    No indexed files match. Open the Project Directory panel to index folders.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsProjectDirDocked(true)}
            className="px-2 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-200 border border-gray-700 hover:border-gray-600 transition flex items-center gap-2"
            title="Click to dock Project Directory search"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Dock Search</span>
          </button>
        )}
      </div>

      {/* MIDI Action Status Display */}
      {midiActionLog.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowMIDIDropdown(!showMIDIDropdown)}
            className="flex items-center gap-1 px-2 py-1 bg-teal-900/20 rounded border border-teal-700/50 hover:bg-teal-900/40 hover:border-teal-600 transition group"
            title="MIDI Actions (click to expand)"
          >
            <KeyboardMusic className="w-3 h-3 text-teal-400 animate-pulse" />
            <span className="text-xs text-teal-300 font-medium hidden sm:inline">
              {midiActionLog[0].action}
            </span>
            <Check className="w-3 h-3 text-green-400" />
            <span className="text-xs text-teal-400">
              ({midiActionLog.length})
            </span>
          </button>
          
          {/* MIDI Actions Dropdown */}
          {showMIDIDropdown && (
            <div className="absolute top-full mt-1 right-0 bg-gray-800 border border-teal-700/50 rounded shadow-lg z-50 w-64 max-h-48 overflow-y-auto">
              <div className="sticky top-0 bg-teal-900/20 border-b border-teal-700/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <KeyboardMusic className="w-3 h-3 text-teal-400" />
                  <span className="text-xs font-semibold text-teal-300">Recent MIDI Actions</span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-700">
                {midiActionLog.map((log: MIDIActionLog) => (
                  <div key={log.id} className="px-3 py-2 hover:bg-gray-700/50 transition">
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span className="text-xs text-gray-300 truncate">{log.action}</span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {Math.round((Date.now() - log.timestamp) / 1000)}s ago
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RIGHT: Status */}
      <div className="flex-1" />

      {/* Save Status Indicator */}
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all duration-200 ${
        isSaving 
          ? 'bg-blue-900/40 text-blue-400'
          : isSaved 
          ? 'bg-green-900/40 text-green-400'
          : isError
          ? 'bg-red-900/40 text-red-400'
          : 'bg-transparent text-gray-600'
      }`}
      title={isSaving ? 'Saving project...' : isSaved ? 'Project saved' : 'Project auto-save'}
      >
        {isSaving && (
          <>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-medium">Saving...</span>
          </>
        )}
        {isSaved && (
          <>
            <Check className="w-3 h-3" />
            <span className="text-xs font-medium">Saved</span>
          </>
        )}
        {isError && (
          <>
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs font-medium">Save error</span>
          </>
        )}
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

      {/* Advanced Tools Button */}
      {codetteConnected && (
        <button
          onClick={() => setShowAdvancedTools(true)}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 hover:text-purple-200 border border-purple-700/50 hover:border-purple-600 transition-all duration-200"
          title="Codette Advanced Tools (Genre Detection, Checklists, Guides, Training)"
        >
          <Wrench className="w-3 h-3" />
          <span className="hidden sm:inline font-medium">Tools</span>
        </button>
      )}

      {/* Codette Status Indicator */}
      <div className="flex items-center gap-2 px-2 py-1 rounded text-xs bg-gray-900 border border-gray-700">
        <Zap className={`w-3 h-3 ${codetteConnected ? 'text-purple-400' : 'text-gray-500'}`} />
        <span className={`text-xs font-medium ${codetteConnected ? 'text-purple-400' : 'text-gray-500'}`}>
          {codetteConnected ? 'AI Ready' : 'AI Offline'}
        </span>
      </div>

      {/* Python DSP Status & Toggle */}
      <div className="relative">
        <button
          onClick={togglePythonDSP}
          onMouseEnter={() => setShowPythonStats(true)}
          onMouseLeave={() => setShowPythonStats(false)}
          className={`flex items-center gap-2 px-2 py-1 rounded text-xs border transition-all ${
            pythonConnected && pythonDSPEnabled
              ? 'bg-purple-900/40 border-purple-600 text-purple-300'
              : pythonConnected
              ? 'bg-gray-900 border-purple-700/50 text-purple-400 hover:bg-purple-900/20'
              : 'bg-gray-900 border-gray-700 text-gray-500'
          }`}
          title={
            pythonConnected
              ? pythonDSPEnabled
                ? 'Python DSP Active - Click to disable'
                : 'Python DSP Available - Click to enable'
              : pythonError || 'Python DSP Offline - Check server'
          }
        >
          <Cpu className={`w-3 h-3 ${pythonDSPEnabled ? 'animate-pulse' : ''}`} />
          <span className="font-medium">
            {pythonDSPEnabled ? '🐍 Python DSP' : 'DSP'}
          </span>
          {pythonConnected ? (
            <div className={`w-2 h-2 rounded-full ${pythonDSPEnabled ? 'bg-green-500 animate-pulse' : 'bg-purple-500'}`} />
          ) : (
            <div className="w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>

        {/* Python DSP Stats Tooltip */}
        {showPythonStats && pythonConnected && (
          <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-purple-700/50 rounded shadow-lg z-50 p-3 min-w-[250px]">
            <div className="text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                <span className="font-semibold text-purple-300">Python DSP Server</span>
                <span className="text-green-400">● Online</span>
              </div>
              
              <div className="space-y-1 text-gray-300">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={pythonDSPEnabled ? 'text-green-400' : 'text-gray-400'}>
                    {pythonDSPEnabled ? 'Active' : 'Standby'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Effects:</span>
                  <span className="text-purple-400">19 Available</span>
                </div>
                <div className="flex justify-between">
                  <span>Quality:</span>
                  <span className="text-blue-400">Professional</span>
                </div>
              </div>

              {pythonDSPEnabled && (
                <div className="pt-2 border-t border-gray-700 text-gray-400 text-[10px]">
                  <p>• EQ, Compression, Reverb</p>
                  <p>• Limiter, Gate, Saturation</p>
                  <p>• 197 verified tests</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Tools Modal */}
      {showAdvancedTools && (
        <CodetteAdvancedTools onClose={() => setShowAdvancedTools(false)} />
      )}
    </div>
  );
}
