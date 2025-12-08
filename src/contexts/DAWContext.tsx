import * as React from "react";
import type {
  Track,
  Project,
  LogicCoreMode,
  Plugin,
  Marker,
  LoopRegion,
  MetronomeSettings,
  Bus,
  MidiDevice,
  MidiRoute,
  AudioContextState,
} from "../types";
import { CodetteSuggestion, getCodetteBridge } from "../lib/codetteBridge";
import { supabase } from "../lib/supabase";
import { useEffectChainAPI, EffectChainContextAPI } from "../lib/effectChainContextAdapter";
import { getAudioEngine } from "../lib/audioEngine";
import { loadProjectFromStorage, saveProjectToStorage } from "../lib/projectStorage";
import { setDAWContext } from "../lib/actions/initializeActions";

// Create context (may be undefined before provider mounts)
const DAWContext = React.createContext<DAWContextType | undefined>(undefined);

interface DAWContextType {
  currentProject: Project | null;
  tracks: Track[];
  selectedTrack: Track | null;
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  zoom: number;
  logicCoreMode: LogicCoreMode;
  voiceControlActive: boolean;
  cpuUsage: number;
  isUploadingFile: boolean;
  uploadError: string | null;
  deletedTracks: Track[];
  canUndo: boolean;
  canRedo: boolean;
  markers: Marker[];
  loopRegion: LoopRegion | null;
  metronomeSettings: MetronomeSettings;
  inputLevel: number;
  latencyMs: number;
  bufferUnderruns: number;
  bufferOverruns: number;
  isAudioIOActive: boolean;
  audioIOError: string | null;
  selectedInputDevice: { label: string } | null;
  selectedInputDeviceId: string | null;
  selectedOutputDeviceId: string | null;
  selectInputDevice: (deviceId: string) => Promise<void>;
  selectOutputDevice: (deviceId: string) => Promise<void>
  getAudioContextStatus: () => AudioContextState | string;
  setCurrentProject: (project: Project | null) => void;
  togglePlay: () => void;
  toggleRecord: () => void;
  stop: () => void;
  setLogicCoreMode: (mode: LogicCoreMode) => void;
  toggleVoiceControl: () => void;
  saveProject: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  uploadAudioFile: (file: File) => Promise<boolean>;
  getWaveformData: (_trackId: string) => number[];
  getAudioDuration: (_trackId: string) => number;
  getAudioBufferData: (trackId: string) => Float32Array | null;
  getAudioLevels: () => Uint8Array | null;
  seek: (timeSeconds: number) => void;
  setTrackInputGain: (trackId: string, gainDb: number) => void;
  addPluginToTrack: (trackId: string, plugin: Plugin) => void;
  removePluginFromTrack: (trackId: string, pluginId: string) => void;
  togglePluginEnabled: (trackId: string, pluginId: string, enabled: boolean) => void;
  undo: () => void;
  redo: () => void;
  addMarker: (time: number, name: string) => void;
  deleteMarker: (markerId: string) => void;
  updateMarker: (markerId: string, updates: Partial<Marker>) => void;
  setLoopRegion: (startTime: number, endTime: number) => void;
  toggleLoop: () => void;
  clearLoopRegion: () => void;
  toggleMetronome: () => void;
  setMetronomeVolume: (volume: number) => void;
  setMetronomeBeatSound: (sound: MetronomeSettings["beatSound"]) => void;
  // Modal State
  showNewProjectModal: boolean;
  openNewProjectModal: () => void;
  closeNewProjectModal: () => void;
  showExportModal: boolean;
  openExportModal: () => void;
  closeExportModal: () => void;
  showAudioSettingsModal: boolean;
  openAudioSettingsModal: () => void;
  closeAudioSettingsModal: () => void;
  showAboutModal: boolean;
  openAboutModal: () => void;
  closeAboutModal: () => void;
  showSaveAsModal: boolean;
  openSaveAsModal: () => void;
  closeSaveAsModal: () => void;
  showOpenProjectModal: boolean;
  openOpenProjectModal: () => void;
  closeOpenProjectModal: () => void;
  showMidiSettingsModal: boolean;
  openMidiSettingsModal: () => void;
  closeMidiSettingsModal: () => void;
  showMixerOptionsModal: boolean;
  openMixerOptionsModal: () => void;
  closeMixerOptionsModal: () => void;
  showPreferencesModal: boolean;
  openPreferencesModal: () => void;
  closePreferencesModal: () => void;
  showShortcutsModal: boolean;
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;
  exportAudio: (format: string, quality: string) => Promise<void>;
  exportProjectAsFile: () => void;
  importProjectFromFile: () => Promise<void>;
  // Bus/Routing
  buses: Bus[];
  createBus: (name: string) => void;
  deleteBus: (busId: string) => void;
  addTrackToBus: (trackId: string, busId: string) => void;
  removeTrackFromBus: (trackId: string, busId: string) => void;
  createSidechain: (sourceTrackId: string, targetTrackId: string) => void;
  // Plugin functions
  loadPlugin: (trackId: string, pluginName: string) => void;
  unloadPlugin: (trackId: string, pluginId: string) => void;
  loadedPlugins: Map<string, Plugin[]>;
  // MIDI functions
  midiDevices: MidiDevice[];
  createMIDIRoute: (sourceDeviceId: string, targetTrackId: string) => void;
  deleteMIDIRoute: (routeId: string) => void;
  getMIDIRoutesForTrack: (trackId: string) => MidiRoute[];
  // Codette AI Integration
  codetteConnected: boolean;
  codetteLoading: boolean;
  codetteSuggestions: CodetteSuggestion[];
  getSuggestionsForTrack: (trackId: string, context?: string) => Promise<CodetteSuggestion[]>;
  applyCodetteSuggestion: (trackId: string, suggestion: CodetteSuggestion) => Promise<boolean>;
  analyzeTrackWithCodette: (trackId: string) => Promise<any>;
  syncDAWStateToCodette: () => Promise<boolean>;
  codetteTransportPlay: () => Promise<any>;
  codetteTransportStop: () => Promise<any>;
  codetteTransportSeek: (timeSeconds: number) => Promise<any>;
  codetteSetTempo: (bpm: number) => Promise<any>;
  codetteSetLoop: (enabled: boolean, startTime?: number, endTime?: number) => Promise<any>;
  getWebSocketStatus: () => { connected: boolean; reconnectAttempts: number };
  getCodetteBridgeStatus: () => {
    connected: boolean;
    reconnectCount: number;
    isReconnecting: boolean;
  };
  // Clipboard Operations
  clipboardData: { type: 'track' | 'clip' | null; data: any | null };
  cutTrack: (trackId: string) => void;
  copyTrack: (trackId: string) => void;
  pasteTrack: () => void;
  selectAllTracks: () => void;
  deselectAllTracks: () => void;
  selectedTracks: Set<string>;
  cpuUsageDetailed: Record<string, number>;
  // Recording state
  recordingTrackId: null | string;
  recordingStartTime: number;
  recordingTakeCount: number;
  recordingMode: 'audio' | 'midi' | 'overdub';
  punchInEnabled: boolean;
  punchInTime: number;
  punchOutTime: number;
  recordingBlob: Blob | null;
  recordingError: string | null;
  // Recording methods
  startRecording: (trackId: string) => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => boolean;
  resumeRecording: () => boolean;
  setRecordingMode: (mode: 'audio' | 'midi' | 'overdub') => void;
  setPunchInOut: (punchIn: number, punchOut: number) => void;
  togglePunchIn: () => void;
  undoLastRecording: () => void;
  // Effect Chain Management
  effectChainsByTrack: EffectChainContextAPI['effectChainsByTrack'];
  getTrackEffects: EffectChainContextAPI['getTrackEffects'];
  addEffectToTrack: EffectChainContextAPI['addEffectToTrack'];
  removeEffectFromTrack: EffectChainContextAPI['removeEffectFromTrack'];
  updateEffectParameter: EffectChainContextAPI['updateEffectParameter'];
  enableDisableEffect: EffectChainContextAPI['enableDisableEffect'];
  setEffectWetDry: EffectChainContextAPI['setEffectWetDry'];
  getEffectChainForTrack: EffectChainContextAPI['getEffectChainForTrack'];
  processTrackEffects: EffectChainContextAPI['processTrackEffects'];
  hasActiveEffects: EffectChainContextAPI['hasActiveEffects'];
  // Track management methods
  addTrack: (type: Track["type"]) => void;
  selectTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  deleteTrack: (trackId: string) => void;
  duplicateTrack: (trackId: string) => Promise<Track | null>;
  restoreTrack: (trackId: string) => void;
  permanentlyDeleteTrack: (trackId: string) => void;
}

// DAW Provider component
export function DAWProvider({ children }: { children: React.ReactNode }) {
  // Singleton refs
  const audioEngineRef = React.useRef(getAudioEngine());
  const audioEngineInitializedRef = React.useRef(false);
  const codetteBridgeRef = React.useRef(getCodetteBridge());

  // Initialize AudioEngine on mount
  React.useEffect(() => {
    if (!audioEngineInitializedRef.current) {
      audioEngineRef.current
        .initialize()
        .then(() => {
          console.log("[DAWContext] AudioEngine initialized successfully");
          audioEngineInitializedRef.current = true;
        })
        .catch((error) => {
          console.error("[DAWContext] Failed to initialize AudioEngine:", error);
        });
    }
  }, []);

  // Core State
  const [currentProject, setCurrentProject] = React.useState<Project | null>(null);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = React.useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [isRecording, setIsRecording] = React.useState<boolean>(false);
  const [currentTime, setCurrentTime] = React.useState<number>(0);
  const [zoom, _setZoom] = React.useState<number>(1);
  const [logicCoreMode, setLogicCoreMode] = React.useState<LogicCoreMode>("ON");
  const [voiceControlActive, setVoiceControlActive] = React.useState<boolean>(false);
  const [cpuUsage, _setCpuUsage] = React.useState<number>(0);
  const [isUploadingFile, setIsUploadingFile] = React.useState<boolean>(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [deletedTracks, _setDeletedTracks] = React.useState<Track[]>([]);
  const [canUndo, _setCanUndo] = React.useState<boolean>(false);
  const [canRedo, _setCanRedo] = React.useState<boolean>(false);
  const [markers, _setMarkers] = React.useState<Marker[]>([]);
  const [loopRegion, _setLoopRegion] = React.useState<LoopRegion | null>(null);
  const [metronomeSettings, _setMetronomeSettings] = React.useState<MetronomeSettings>({
    enabled: false,
    volume: 1,
    beatSound: "click",
    accentFirst: false,
  });

  // Audio I/O State
  const [selectedInputDeviceId, _setSelectedInputDeviceId] = React.useState<string | null>(null);
  const [selectedOutputDeviceId, _setSelectedOutputDeviceId] = React.useState<string | null>(null);
  const [inputLevel, _setInputLevel] = React.useState<number>(0);
  const [latencyMs, _setLatencyMs] = React.useState<number>(0);
  const [bufferUnderruns, _setBufferUnderruns] = React.useState<number>(0);
  const [bufferOverruns, _setBufferOverruns] = React.useState<number>(0);
  const [isAudioIOActive, _setIsAudioIOActive] = React.useState<boolean>(false);
  const [audioIOError, _setAudioIOError] = React.useState<string | null>(null);

  // MIDI State
  const [midiDevices] = React.useState<MidiDevice[]>([]);
  
  // Effect Chain API
  const effectChainAPI = useEffectChainAPI();
  
  // Recording state
  const [recordingTrackId, _setRecordingTrackId] = React.useState<string | null>(null);
  const [recordingStartTime, _setRecordingStartTime] = React.useState<number>(0);
  const [recordingTakeCount, _setRecordingTakeCount] = React.useState<number>(0);
  const [recordingModeState, setRecordingModeState] = React.useState<'audio' | 'midi' | 'overdub'>('audio');
  const [punchInEnabled, _setPunchInEnabled] = React.useState<boolean>(false);
  const [punchInTime, _setPunchInTime] = React.useState<number>(0);
  const [punchOutTime, _setPunchOutTime] = React.useState<number>(0);
  const [recordingBlob, _setRecordingBlob] = React.useState<Blob | null>(null);
  const [recordingError, _setRecordingError] = React.useState<string | null>(null);

  // Codette AI State
  const [codetteConnected, setCodetteConnected] = React.useState<boolean>(false);
  const [codetteLoading, setCodetteLoading] = React.useState<boolean>(false);
  const [codetteSuggestions, setCodetteSuggestions] = React.useState<CodetteSuggestion[]>([]);

  // Modal State Management
  const [showNewProjectModal, setShowNewProjectModal] = React.useState<boolean>(false);
  const [showExportModal, setShowExportModal] = React.useState<boolean>(false);
  const [showAudioSettingsModal, setShowAudioSettingsModal] = React.useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = React.useState<boolean>(false);
  const [showSaveAsModal, setShowSaveAsModal] = React.useState<boolean>(false);
  const [showOpenProjectModal, setShowOpenProjectModal] = React.useState<boolean>(false);
  const [showMidiSettingsModal, setShowMidiSettingsModal] = React.useState<boolean>(false);
  const [showMixerOptionsModal, setShowMixerOptionsModal] = React.useState<boolean>(false);
  const [showPreferencesModal, setShowPreferencesModal] = React.useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = React.useState<boolean>(false);

  // Bus and MIDI routing state
  const [buses, setBuses] = React.useState<Bus[]>([]);
  const [midiRoutes, setMidiRoutes] = React.useState<MidiRoute[]>([]);
  const [selectedTracks, setSelectedTracks] = React.useState<Set<string>>(new Set());
  const [clipboardData, setClipboardData] = React.useState<{ type: 'track' | 'clip' | null; data: any | null }>({ type: null, data: null });

  // Unique ID counters
  const trackIdCounterRef = React.useRef<number>(0);
  const markerIdCounterRef = React.useRef<number>(0);

  const getUniqueTrackId = () => `track-${++trackIdCounterRef.current}`;
  const getUniqueMarkerId = () => `marker-${Date.now()}-${++markerIdCounterRef.current}`;

  // Playback timer with proper cleanup
  const playTimerRef = React.useRef<number | null>(null);
  const lastTickRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = performance.now();
      const tick = () => {
        const now = performance.now();
        const last = lastTickRef.current ?? now;
        const deltaSec = (now - last) / 1000;
        lastTickRef.current = now;
        
        // Update current time without triggering re-render loop
        setCurrentTime((prev) => prev + deltaSec);
        
        // Schedule next frame
        playTimerRef.current = requestAnimationFrame(tick);
      };
      
      // Start animation loop
      playTimerRef.current = requestAnimationFrame(tick);
      
      // Cleanup on unmount or when isPlaying changes
      return () => {
        if (playTimerRef.current !== null) {
          cancelAnimationFrame(playTimerRef.current);
          playTimerRef.current = null;
        }
      };
    } else {
      // Stop animation loop when paused
      if (playTimerRef.current !== null) {
        cancelAnimationFrame(playTimerRef.current);
        playTimerRef.current = null;
      }
      lastTickRef.current = null;
    }
  }, [isPlaying]); // Only depend on isPlaying - not currentTime!

  // Monitor Codette connection status
  React.useEffect(() => {
    const bridge = codetteBridgeRef.current;

    // Kick off immediate connectivity attempts
    try {
      // Fire WS connect immediately
      void bridge.initializeWebSocket();
      // Ping REST health right away
      void bridge.healthCheck();
    } catch (e) {
      console.debug("[DAWContext] Bridge init/connect failed", e);
    }

    const handleConnected = () => setCodetteConnected(true);
    const handleDisconnected = () => setCodetteConnected(false);
    const handleWsConnected = (val: unknown) => setCodetteConnected(!!val);
    const handleServerStatus = () => setCodetteConnected(true);

    bridge.on("connected", handleConnected);
    bridge.on("disconnected", handleDisconnected);
    bridge.on("ws_connected", handleWsConnected);
    bridge.on("server_status", handleServerStatus);

    const checkConnection = () => {
      try {
        const status = bridge.getConnectionStatus();
        setCodetteConnected(status.connected);
      } catch (error) {
        console.debug("[DAWContext] Failed to check Codette connection:", error);
        setCodetteConnected(false);
      }
    };

    // initial check + periodic polling as a fallback
    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => {
      clearInterval(interval);
      bridge.off("connected", handleConnected);
      bridge.off("disconnected", handleDisconnected);
      bridge.off("ws_connected", handleWsConnected);
      bridge.off("server_status", handleServerStatus);
    };
  }, []);

  // Demo waveform and duration cache
  const waveformCacheRef = React.useRef<Map<string, number[]>>(new Map());
  const durationCacheRef = React.useRef<Map<string, number>>(new Map());
  
  // Derived values
  const projectDuration = React.useMemo(() => {
    try {
      let max = 0;
      tracks.forEach((t) => {
        const d = durationCacheRef.current.get(t.id) ?? 0;
        if (d > max) max = d;
      });
      return Math.max(max, 300);
    } catch (e) {
      return 300;
    }
  }, [tracks]);

  const ensureDemoDataForTrack = (trackId: string) => {
    if (!waveformCacheRef.current.has(trackId)) {
      const length = 4096;
      const data = Array.from({ length }, (_, i) => {
        const t = (i / length) * Math.PI * 4;
        return Math.abs(Math.sin(t) * 0.6 + Math.sin(t * 2) * 0.3 + Math.sin(t * 3) * 0.1 + Math.random() * 0.05);
      });
      waveformCacheRef.current.set(trackId, data);
    }
    if (!durationCacheRef.current.has(trackId)) {
      durationCacheRef.current.set(trackId, 60);
    }
  };

  // Basic helper functions
  const getAudioContextStatus = () => "running";
  const setZoom = (z: number) => {
    _setZoom(z);
  };
  const togglePlay = () => {
    if (!isPlaying) {
      // Starting playback
      audioEngineRef.current
        .initialize()
        .then(async () => {
          // CRITICAL FIX: Resume audio context explicitly (browser autoplay policy)
          await audioEngineRef.current.resumeAudioContext();
          
          // Play all non-muted audio and instrument tracks from current time
          tracks.forEach((track) => {
            if (
              !track.muted &&
              (track.type === "audio" || track.type === "instrument")
            ) {
              // playAudio expects dB volume value
              const success = audioEngineRef.current.playAudio(
                track.id,
                currentTime,
                track.volume,
                track.pan,
                track.inserts
              );
              if (success) {
                console.log(`? Started playback for track: ${track.name}`);
              } else {
                console.warn(`?? No audio buffer for track: ${track.name} - upload audio first`);
              }
            }
          });
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("? Audio init failed:", err);
          alert("Audio playback failed. Please check browser permissions and try again.");
        });
    } else {
      // Pausing playback
      audioEngineRef.current.stopAllAudio();
      setIsPlaying(false);
    }
  };
  const toggleRecord = () => setIsRecording((prev) => !prev);
  const stop = () => {
    // Stop recording first if active
    if (isRecording) {
      audioEngineRef.current
        .stopRecording()
        .then((blob) => {
          if (blob) {
            // Auto-save recording as new track
            const recordedFile = new File(
              [blob],
              `Recording-${Date.now()}.webm`,
              { type: "audio/webm" }
            );
            uploadAudioFile(recordedFile);
          }
        })
        .catch((err) => console.error("Error stopping recording:", err));
      setIsRecording(false);
    }

    // Stop all playback
    audioEngineRef.current.stopAllAudio();
    setIsPlaying(false);

    // Reset timeline to beginning
    setCurrentTime(0);
    
    console.log("?? Playback stopped and reset to start");
  };
  const toggleVoiceControl = () => setVoiceControlActive((prev) => !prev);
  
  const toggleMixerView = () => setShowMixerView((prev) => !prev);

  const saveProject = async () => {
    if (!currentProject) return;
    setIsUploadingFile(true);
    try {
      await supabase
        .from("projects")
        .insert([{ ...currentProject, id: undefined }])
        .single();
      setCurrentProject(currentProject);
    } catch (error) {
      console.error("Error saving project:", error);
      setUploadError("Error saving project. Please try again.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const loadProject = async (projectId: string) => {
    setIsUploadingFile(true);
    try {
      // Try localStorage first
      try {
        const local = loadProjectFromStorage();
        if (local && local.id === projectId) {
          setCurrentProject(local);
          setTracks(local.tracks || []);
          setBuses(local.buses || []);
          _setLoopRegion(local.loopRegion || null);
          _setMetronomeSettings(local.metronomeSettings || metronomeSettings);
          console.log("[DAWContext] Project loaded from localStorage:", projectId);
          return;
        }
      } catch (e) {
        console.debug("[DAWContext] localStorage load failed:", e);
      }

      // Fallback to Supabase
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (error || !data) {
        console.warn("[DAWContext] Project not found in Supabase:", error);
        setUploadError("Project not found");
        return;
      }

      const project: Project = {
        id: data.id,
        name: data.name || "Untitled Project",
        sampleRate: data.sample_rate || 44100,
        bitDepth: data.bit_depth || 24,
        bpm: data.bpm || 120,
        timeSignature: data.time_signature || "4/4",
        tracks: data.session_data?.tracks || [],
        buses: data.buses || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as Project;

      setCurrentProject(project);
      setTracks(project.tracks || []);
      setBuses(project.buses || []);
      console.log("[DAWContext] Project loaded from Supabase:", projectId);
    } catch (error) {
      console.error("Error loading project:", error);
      setUploadError("Error loading project. Please try again.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const uploadAudioFile = async (file: File): Promise<boolean> => {
    if (!selectedTrack) {
      setUploadError("Please select a track first");
      return false;
    }
    const validTypes: string[] = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|flac|aac)$/i)) {
      setUploadError("Unsupported audio format. Use MP3, WAV, OGG, FLAC, or AAC.");
      return false;
    }
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File too large. Maximum size is 100MB.");
      return false;
    }
    setIsUploadingFile(true);
    setUploadError(null);
    try {
      const success = await audioEngineRef.current.loadAudioFile(selectedTrack.id, file);
      if (!success) {
        setUploadError("Failed to decode audio file");
        return false;
      }
      const waveform = audioEngineRef.current.getWaveformData(selectedTrack.id);
      const duration = audioEngineRef.current.getAudioDuration(selectedTrack.id);
      waveformCacheRef.current.set(selectedTrack.id, waveform);
      durationCacheRef.current.set(selectedTrack.id, duration);
      console.log(`[DAWContext] Audio file loaded: ${duration.toFixed(2)}s, ${waveform.length} waveform samples`);
      return true;
    } catch (error) {
      console.error("Error uploading audio file:", error);
      setUploadError(error instanceof Error ? error.message : "Unknown error occurred");
      return false;
    } finally {
      setIsUploadingFile(false);
    }
  };

  const getWaveformData = (trackId: string): number[] => {
    try {
      const waveform = audioEngineRef.current.getWaveformData(trackId);
      if (waveform && waveform.length > 0) {
        return waveform;
      }
    } catch (error) {
      console.debug("[DAWContext] AudioEngine waveform retrieval failed:", error);
    }
    return waveformCacheRef.current.get(trackId) || [];
  };

  const getAudioDuration = (trackId: string): number => {
    try {
      const duration = audioEngineRef.current.getAudioDuration(trackId);
      if (duration > 0) {
        return duration;
      }
    } catch (error) {
      console.debug("[DAWContext] AudioEngine duration retrieval failed:", error);
    }
    return durationCacheRef.current.get(trackId) || 0;
  };

  const getAudioBufferData = (trackId: string): Float32Array | null => {
    try {
      return audioEngineRef.current.getAudioBufferData(trackId);
    } catch (error) {
      console.debug("[DAWContext] AudioEngine buffer retrieval failed:", error);
      return null;
    }
  };

  // Codette AI functions
  const syncDAWStateToCodette = async (): Promise<boolean> => {
    try {
      const bridge = codetteBridgeRef.current;
      const result = await bridge.syncState(
        tracks,
        currentTime,
        isPlaying,
        currentProject?.bpm || 120
      );
      console.log("[DAWContext] DAW state synced to Codette:", result);
      return result.synced;
    } catch (error) {
      console.error("[DAWContext] Failed to sync DAW state to Codette:", error);
      return false;
    }
  };

  const codetteTransportPlay = async () => {
    try {
      const bridge = codetteBridgeRef.current;
      const state = await bridge.transportPlay();
      togglePlay();
      console.log("[DAWContext] Codette transport play:", state);
      return state;
    } catch (error) {
      console.error("[DAWContext] Codette transport play failed:", error);
      return null;
    }
  };

  const codetteTransportStop = async () => {
    try {
      const bridge = codetteBridgeRef.current;
      const state = await bridge.transportStop();
      stop();
      console.log("[DAWContext] Codette transport stop:", state);
      return state;
    } catch (error) {
      console.error("[DAWContext] Codette transport stop failed:", error);
      return null;
    }
  };

  const codetteTransportSeek = async (timeSeconds: number) => {
    try {
      const bridge = codetteBridgeRef.current;
      const state = await bridge.transportSeek(timeSeconds);
      seek(timeSeconds);
      console.log("[DAWContext] Codette transport seek:", state);
      return state;
    } catch (error) {
      console.error("[DAWContext] Codette transport seek failed:", error);
      return null;
    }
  };

  const codetteSetTempo = async (bpm: number) => {
    try {
      const bridge = codetteBridgeRef.current;
      const state = await bridge.setTempo(bpm);
      if (currentProject) {
        setCurrentProject({ ...currentProject, bpm });
      }
      console.log("[DAWContext] Codette set tempo:", state);
      return state;
    } catch (error) {
      console.error("[DAWContext] Codette set tempo failed:", error);
      return null;
    }
  };

  const codetteSetLoop = async (
    enabled: boolean,
    startTime: number = 0,
    endTime: number = 10
  ) => {
    try {
      const bridge = codetteBridgeRef.current;
      const state = await bridge.setLoop(enabled, startTime, endTime);
      _setLoopRegion({ enabled, startTime, endTime });
      console.log("[DAWContext] Codette set loop:", state);
      return state;
    } catch (error) {
      console.error("[DAWContext] Codette set loop failed:", error);
      return null;
    }
  };

  const getSuggestionsForTrack = async (
    trackId: string,
    context?: string
  ): Promise<CodetteSuggestion[]> => {
    try {
      setCodetteLoading(true);
      const bridge = codetteBridgeRef.current;
      const track = tracks.find(t => t.id === trackId);
      
      if (!track) {
        console.warn("[DAWContext] Track not found for suggestions:", trackId);
        return [];
      }

      const response = await bridge.getSuggestions({
        type: context || 'general',
        track_type: track.type,
        mood: 'neutral',
        genre: 'unknown',
      });

      const suggestions = response.suggestions || [];
      setCodetteSuggestions(suggestions);
      console.log("[DAWContext] Got suggestions for track:", trackId, suggestions.length);
      return suggestions;
    } catch (error) {
      console.error("[DAWContext] Failed to get suggestions for track:", error);
      return [];
    } finally {
      setCodetteLoading(false);
    }
  };

  const applyCodetteSuggestion = async (
    trackId: string,
    suggestion: CodetteSuggestion
  ): Promise<boolean> => {
    try {
      setCodetteLoading(true);
      const bridge = codetteBridgeRef.current;
      const result = await bridge.applySuggestion(trackId, suggestion);
      
      console.log("[DAWContext] Applied Codette suggestion:", trackId, suggestion.id);
      return result?.success ?? true;
    } catch (error) {
      console.error("[DAWContext] Failed to apply suggestion:", error);
      return false;
    } finally {
      setCodetteLoading(false);
    }
  };

  const analyzeTrackWithCodette = async (trackId: string): Promise<any> => {
    try {
      setCodetteLoading(true);
      const bridge = codetteBridgeRef.current;
      const track = tracks.find(t => t.id === trackId);
      
      if (!track) {
        console.warn("[DAWContext] Track not found for analysis:", trackId);
        return null;
      }

      const audioBuffer = audioEngineRef.current.getAudioBufferData(trackId);
      const duration = audioEngineRef.current.getAudioDuration(trackId);
      
      const audioData = audioBuffer ? {
        duration: duration,
        sample_rate: 44100,
        peak_level: 0.8,
        rms_level: -12,
      } : undefined;

      const analysis = await bridge.analyzeAudio(audioData, 'spectrum');
      console.log("[DAWContext] Analyzed track:", trackId, analysis);
      return analysis;
    } catch (error) {
      console.error("[DAWContext] Failed to analyze track:", error);
      return null;
    } finally {
      setCodetteLoading(false);
    }
  };

  const getWebSocketStatus = () => {
    try {
      const bridge = codetteBridgeRef.current;
      return bridge.getWebSocketStatus();
    } catch (error) {
      console.warn("[DAWContext] Failed to get WebSocket status:", error);
      return { connected: false, reconnectAttempts: 0 };
    }
  };

  const getCodetteBridgeStatus = () => {
    try {
      const bridge = codetteBridgeRef.current;
      const status = bridge.getConnectionStatus();
      return {
        connected: status.connected,
        reconnectCount: status.reconnectAttempts,
        isReconnecting: status.isReconnecting,
      };
    } catch (error) {
      console.warn("[DAWContext] Failed to get bridge status:", error);
      return {
        connected: false,
        reconnectCount: 0,
        isReconnecting: false,
      };
    }
  };

  // Recording functions
  const startRecording = async (trackId: string): Promise<boolean> => {
    try {
      _setRecordingTrackId(trackId);
      _setRecordingStartTime(Date.now());
      setIsRecording(true);
      const result = await audioEngineRef.current.startRecording();
      console.log(`[DAWContext] Recording started on track ${trackId}`);
      return result;
    } catch (error) {
      console.error("[DAWContext] startRecording failed:", error);
      _setRecordingError(error instanceof Error ? error.message : "Recording failed");
      return false;
    }
  };

  const stopRecording = async (): Promise<Blob | null> => {
    try {
      setIsRecording(false);
      const blob = await audioEngineRef.current.stopRecording();
      if (blob && recordingTrackId) {
        _setRecordingBlob(blob);
        await audioEngineRef.current.saveRecordingToTrack(recordingTrackId, blob);
        console.log(`[DAWContext] Recording saved to track ${recordingTrackId}`);
      }
      return blob;
    } catch (error) {
      console.error("[DAWContext] stopRecording failed:", error);
      _setRecordingError(error instanceof Error ? error.message : "Stop recording failed");
      return null;
    }
  };

  const pauseRecording = (): boolean => {
    try {
      const result = audioEngineRef.current.pauseRecording();
      if (result) console.log("[DAWContext] Recording paused");
      return result;
    } catch (error) {
      console.error("[DAWContext] pauseRecording failed:", error);
      return false;
    }
  };

  const resumeRecording = (): boolean => {
    try {
      const result = audioEngineRef.current.resumeRecording();
      if (result) console.log("[DAWContext] Recording resumed");
      return result;
    } catch (error) {
      console.error("[DAWContext] resumeRecording failed:", error);
      return false;
    }
  };

  const setPunchInOut = (punchIn: number, punchOut: number) => {
    _setPunchInTime(punchIn);
    _setPunchOutTime(punchOut);
    console.log(`[DAWContext] Punch in/out set: ${punchIn}s - ${punchOut}s`);
  };

  const togglePunchIn = () => {
    _setPunchInEnabled((prev) => !prev);
    console.log(`[DAWContext] Punch in ${punchInEnabled ? 'disabled' : 'enabled'}`);
  };

  const setRecordingMode = (mode: 'audio' | 'midi' | 'overdub') => {
    setRecordingModeState(mode);
    console.log(`[DAWContext] Recording mode set to ${mode}`);
  };

  const undoLastRecording = () => {
    console.log("[DAWContext] Undo last recording (stub)");
  };

  // Bus/Routing functions
  const createBus = (name: string) => {
    const bus: Bus = {
      id: `bus-${Date.now()}`,
      name,
      trackIds: [],
      volume: 0,
      pan: 0,
      color: '#888',
      muted: false,
      inserts: [],
    };
    setBuses((prev) => [...prev, bus]);
    console.log(`[DAWContext] Bus created: ${name}`);
  };

  const deleteBus = (busId: string) => {
    setBuses((prev) => prev.filter((b) => b.id !== busId));
    console.log(`[DAWContext] Bus ${busId} deleted`);
  };

  const addTrackToBus = (trackId: string, busId: string) => {
    setBuses((prev) =>
      prev.map((b) =>
        b.id === busId ? { ...b, trackIds: [...b.trackIds, trackId] } : b
      )
    );
    console.log(`[DAWContext] Track ${trackId} added to bus ${busId}`);
  };

  const removeTrackFromBus = (trackId: string, busId: string) => {
    setBuses((prev) =>
      prev.map((b) =>
        b.id === busId ? { ...b, trackIds: b.trackIds.filter((t: string) => t !== trackId) } : b
      )
    );
    console.log(`[DAWContext] Track ${trackId} removed from bus ${busId}`);
  };

  const createSidechain = (sourceTrackId: string, targetTrackId: string) => {
    setTracks((prev) => prev.map((t) => (t.id === targetTrackId ? { ...t, routing: `sidechain:${sourceTrackId}` } : t)));
    console.log(`[DAWContext] Sidechain created: ${sourceTrackId} ? ${targetTrackId}`);
  };

  // MIDI functions
  const createMIDIRoute = (sourceDeviceId: string, targetTrackId: string) => {
    const route: MidiRoute = {
      id: `route-${Date.now()}`,
      sourceDeviceId,
      targetTrackId,
      channel: 0,
    };
    setMidiRoutes((prev) => [...prev, route]);
    console.log(`[DAWContext] MIDI route created: ${sourceDeviceId} ? ${targetTrackId}`);
  };

  const deleteMIDIRoute = (routeId: string) => {
    setMidiRoutes((prev) => prev.filter((r) => r.id !== routeId));
    console.log(`[DAWContext] MIDI route ${routeId} deleted`);
  };

  const getMIDIRoutesForTrack = (trackId: string): MidiRoute[] => {
    return midiRoutes.filter((r) => r.targetTrackId === trackId);
  };

  // Export functions
  const exportAudio = async (format: string, quality: string) => {
    console.log(`[DAWContext] Exporting audio as ${format} (${quality})`);
  };

  const exportProjectAsFile = () => {
    const projectData = {
      currentProject,
      tracks,
      buses,
      midiRoutes,
      loopRegion,
      metronomeSettings,
    };
    const json = JSON.stringify(projectData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject?.name || 'project'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("[DAWContext] Project exported successfully");
  };

  const importProjectFromFile = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      setCurrentProject(data.currentProject);
      setTracks(data.tracks || []);
      setBuses(data.buses || []);
      setMidiRoutes(data.midiRoutes || []);
      _setLoopRegion(data.loopRegion || null);
      _setMetronomeSettings(data.metronomeSettings || { enabled: false, volume: 1, beatSound: "click", accentFirst: false });
      console.log("[DAWContext] Project imported successfully");
    };
    input.click();
  };

  const unloadPlugin = (trackId: string, pluginId: string) => {
    removePluginFromTrack(trackId, pluginId);
    console.log(`[DAWContext] Plugin ${pluginId} unloaded from track ${trackId}`);
  };

  // Audio engine wrapper functions
  const seek = (timeSeconds: number) => {
    setCurrentTime(timeSeconds);
    if (isPlaying) {
      try {
        // Stop current playback
        audioEngineRef.current.stopAllAudio();
        // Resume audio context if needed
        audioEngineRef.current.resumeAudioContext();
        // Restart playback for all eligible tracks from new position
        tracks.forEach((track) => {
          if (!track.muted && (track.type === "audio" || track.type === "instrument")) {
            audioEngineRef.current.playAudio(
              track.id,
              timeSeconds,
              track.volume,
              track.pan,
              track.inserts
            );
          }
        });
      } catch (error) {
        console.error("[DAWContext] Seek failed:", error);
      }
    }
  };

  const setTrackInputGain = (trackId: string, gainDb: number) => {
    try {
      audioEngineRef.current.setTrackInputGain(trackId, gainDb);
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, inputGain: gainDb } : t))
      );
    } catch (error) {
      console.error("[DAWContext] setTrackInputGain failed:", error);
    }
  };

  const getAudioLevels = (): Uint8Array | null => {
    try {
      return audioEngineRef.current.getAudioLevels();
    } catch (error) {
      console.debug("[DAWContext] getAudioLevels failed:", error);
      return null;
    }
  };

  // Plugin management functions
  const addPluginToTrack = (trackId: string, plugin: Plugin) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? { ...t, inserts: [...(t.inserts || []), plugin] }
          : t
      )
    );
    console.log(`[DAWContext] Plugin ${plugin.id} added to track ${trackId}`);
  };

  const removePluginFromTrack = (trackId: string, pluginId: string) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? { ...t, inserts: (t.inserts || []).filter((p) => p.id !== pluginId) }
          : t
      )
    );
    console.log(`[DAWContext] Plugin ${pluginId} removed from track ${trackId}`);
  };

  const togglePluginEnabled = (trackId: string, pluginId: string, enabled: boolean) => {
    effectChainAPI.enableDisableEffect(trackId, pluginId, enabled);
    console.log(`[DAWContext] Plugin ${pluginId} on track ${trackId}: ${enabled ? 'enabled' : 'disabled'}`);
  };

  const loadPlugin = (trackId: string, pluginName: string) => {
    const plugin: Plugin = {
      id: `plugin-${Date.now()}`,
      name: pluginName,
      type: 'utility',
      parameters: {},
      enabled: true,
    };
    addPluginToTrack(trackId, plugin);
    console.log(`[DAWContext] Plugin ${pluginName} loaded on track ${trackId}`);
  };

  // Stub functions for undo/redo
  const undo = () => { 
    console.log("[DAWContext] undo (stub)");
  };

  const redo = () => { 
    console.log("[DAWContext] redo (stub)");
  };

  // Clipboard functions
  const cutTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      setClipboardData({ type: 'track', data: track });
      deleteTrack(trackId);
    }
  };

  const copyTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      setClipboardData({ type: 'track', data: track });
    }
  };

  const pasteTrack = () => {
    if (clipboardData.type === 'track' && clipboardData.data) {
      const newTrack = { ...clipboardData.data, id: getUniqueTrackId() };
      setTracks(prev => [...prev, newTrack]);
    }
  };

  const selectAllTracks = () => {
    setSelectedTracks(new Set(tracks.map(t => t.id)));
  };

  const deselectAllTracks = () => {
    setSelectedTracks(new Set());
  };

  // Track management functions
  const addTrack = (type: Track["type"]) => {
    const t: Track = {
      id: getUniqueTrackId(),
      name: `${type} ${tracks.length + 1}`,
      type,
      color: '#888',
      muted: false,
      soloed: false,
      armed: false,
      inputGain: 0,
      volume: 0,
      pan: 0,
      stereoWidth: 100,
      phaseFlip: false,
      inserts: [],
      sends: [],
      routing: '',
    };
    setTracks((prev) => [...prev, t]);
    ensureDemoDataForTrack(t.id);
  };

  const selectTrack = (trackId: string) => {
    const t = tracks.find((tr) => tr.id === trackId) || null;
    setSelectedTrack(t);
    if (t) ensureDemoDataForTrack(t.id);
  };

  const updateTrack = (trackId: string, updates: Partial<Track>) => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, ...updates } : t)));
  };

  const deleteTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    const del = tracks.find((t) => t.id === trackId);
    if (del) _setDeletedTracks((prev) => [...prev, del]);
  };

  const duplicateTrack = async (trackId: string) => {
    const source = tracks.find((t) => t.id === trackId);
    if (!source) return null;
    const copy: Track = { ...source, id: getUniqueTrackId() };
    setTracks((prev) => [...prev, copy]);
    await audioEngineRef.current.duplicateTrackAudioBuffer(source.id, copy.id);
    const wf = waveformCacheRef.current.get(source.id);
    if (wf) waveformCacheRef.current.set(copy.id, wf);
    const dur = durationCacheRef.current.get(source.id);
    if (dur) durationCacheRef.current.set(copy.id, dur);
    return copy;
  };

  const restoreTrack = (trackId: string) => {
    const t = deletedTracks.find((tr) => tr.id === trackId);
    if (!t) return;
    setTracks((prev) => [...prev, { ...t }]);
    _setDeletedTracks((prev) => prev.filter((tr) => tr.id !== trackId));
  };

  const permanentlyDeleteTrack = (trackId: string) => {
    _setDeletedTracks((prev) => prev.filter((tr) => tr.id !== trackId));
  };

  // Marker functions
  const addMarker = (time: number, name: string) => {
    const marker: Marker = { id: getUniqueMarkerId(), name, time, color: '#fff', locked: false };
    _setMarkers((prev) => [...prev, marker]);
  };

  const deleteMarker = (markerId: string) => {
    _setMarkers((prev) => prev.filter((m) => m.id !== markerId));
  };

  const updateMarker = (markerId: string, updates: Partial<Marker>) => {
    _setMarkers((prev) => prev.map((m) => (m.id === markerId ? { ...m, ...updates } : m)));
  };

  // Loop functions
  const setLoopRegion = (startTime: number, endTime: number) => {
    _setLoopRegion({ enabled: loopRegion?.enabled ?? true, startTime, endTime });
  };

  const toggleLoop = () => {
    if (!loopRegion) return;
    const enabled = loopRegion.enabled;
    _setLoopRegion((prev) => (prev ? { ...prev, enabled: !enabled } : prev));
  };

  const clearLoopRegion = () => {
    _setLoopRegion(null);
  };

  // Metronome functions
  const toggleMetronome = () => {
    _setMetronomeSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const setMetronomeVolume = (volume: number) => {
    _setMetronomeSettings((prev) => ({ ...prev, volume }));
  };

  const setMetronomeBeatSound = (sound: MetronomeSettings["beatSound"]) => {
    _setMetronomeSettings((prev) => ({ ...prev, beatSound: sound }));
  };

  // Context value assembly
  const contextValue: DAWContextType = {
    currentProject,
    tracks,
    selectedTrack,
    isPlaying,
    isRecording,
    currentTime,
    zoom,
    logicCoreMode,
    voiceControlActive,
    cpuUsage,
    isUploadingFile,
    uploadError,
    deletedTracks,
    canUndo,
    canRedo,
    markers,
    loopRegion,
    metronomeSettings,
    inputLevel,
    latencyMs,
    bufferUnderruns,
    bufferOverruns,
    isAudioIOActive,
    audioIOError,
    selectedInputDevice: null,
    selectedInputDeviceId,
    selectedOutputDeviceId,
    selectInputDevice: async (deviceId: string) => { _setSelectedInputDeviceId(deviceId); },
    selectOutputDevice: async (deviceId: string) => { _setSelectedOutputDeviceId(deviceId); },
    getAudioContextStatus,
    setCurrentProject,
    togglePlay,
    toggleRecord,
    stop,
    setLogicCoreMode: (mode: LogicCoreMode) => setLogicCoreMode(mode),
    toggleVoiceControl,
    saveProject,
    loadProject,
    uploadAudioFile,
    getWaveformData,
    getAudioDuration,
    getAudioBufferData,
    getAudioLevels,
    seek,
    setTrackInputGain,
    addPluginToTrack,
    removePluginFromTrack,
    togglePluginEnabled,
    undo,
    redo,
    addTrack,
    selectTrack,
    updateTrack,
    deleteTrack,
    duplicateTrack,
    restoreTrack,
    permanentlyDeleteTrack,
    addMarker,
    deleteMarker,
    updateMarker,
    setLoopRegion,
    toggleLoop,
    clearLoopRegion,
    toggleMetronome,
    setMetronomeVolume,
    setMetronomeBeatSound,
    openNewProjectModal: () => setShowNewProjectModal(true),
    closeNewProjectModal: () => setShowNewProjectModal(false),
    openExportModal: () => setShowExportModal(true),
    closeExportModal: () => setShowExportModal(false),
    openAudioSettingsModal: () => setShowAudioSettingsModal(true),
    closeAudioSettingsModal: () => setShowAudioSettingsModal(false),
    openAboutModal: () => setShowAboutModal(true),
    closeAboutModal: () => setShowAboutModal(false),
    openSaveAsModal: () => setShowSaveAsModal(true),
    closeSaveAsModal: () => setShowSaveAsModal(false),
    openOpenProjectModal: () => setShowOpenProjectModal(true),
    closeOpenProjectModal: () => setShowOpenProjectModal(false),
    openMidiSettingsModal: () => setShowMidiSettingsModal(true),
    closeMidiSettingsModal: () => setShowMidiSettingsModal(false),
    openMixerOptionsModal: () => setShowMixerOptionsModal(true),
    closeMixerOptionsModal: () => setShowMixerOptionsModal(false),
    openPreferencesModal: () => setShowPreferencesModal(true),
    closePreferencesModal: () => setShowPreferencesModal(false),
    openShortcutsModal: () => setShowShortcutsModal(true),
    closeShortcutsModal: () => setShowShortcutsModal(false),
    showNewProjectModal,
    showExportModal,
    showAudioSettingsModal,
    showAboutModal,
    showSaveAsModal,
    showOpenProjectModal,
    showMidiSettingsModal,
    showMixerOptionsModal,
    showPreferencesModal,
    showShortcutsModal,
    exportAudio,
    exportProjectAsFile,
    importProjectFromFile,
    buses,
    createBus,
    deleteBus,
    addTrackToBus,
    removeTrackFromBus,
    createSidechain,
    loadPlugin,
    unloadPlugin,
    midiDevices,
    createMIDIRoute,
    deleteMIDIRoute,
    getMIDIRoutesForTrack,
    codetteConnected,
    codetteLoading,
    codetteSuggestions,
    getSuggestionsForTrack,
    applyCodetteSuggestion,
    analyzeTrackWithCodette,
    syncDAWStateToCodette,
    codetteTransportPlay,
    codetteTransportStop,
    codetteTransportSeek,
    codetteSetTempo,
    codetteSetLoop,
    getWebSocketStatus,
    getCodetteBridgeStatus,
    clipboardData,
    cutTrack,
    copyTrack,
    pasteTrack,
    selectAllTracks,
    deselectAllTracks,
    selectedTracks,
    cpuUsageDetailed: {},
    recordingTrackId,
    recordingStartTime,
    recordingTakeCount,
    recordingMode: recordingModeState,
    punchInEnabled,
    punchInTime,
    punchOutTime,
    recordingBlob,
    recordingError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    setRecordingMode,
    setPunchInOut,
    togglePunchIn,
    undoLastRecording,
    effectChainsByTrack: effectChainAPI.effectChainsByTrack,
    getTrackEffects: effectChainAPI.getTrackEffects,
    addEffectToTrack: effectChainAPI.addEffectToTrack,
    removeEffectFromTrack: effectChainAPI.removeEffectFromTrack,
    updateEffectParameter: effectChainAPI.updateEffectParameter,
    enableDisableEffect: effectChainAPI.enableDisableEffect,
    setEffectWetDry: effectChainAPI.setEffectWetDry,
    getEffectChainForTrack: effectChainAPI.getEffectChainForTrack,
    processTrackEffects: effectChainAPI.processTrackEffects,
    hasActiveEffects: effectChainAPI.hasActiveEffects,
    loadedPlugins: new Map(),
  };

  // Expose DAW context globally for action modules that read from window
  React.useEffect(() => {
    try {
      (window as any).__CORELOGIC_DAW_CONTEXT__ = contextValue;
      // also set module-local reference for action modules
      try { setDAWContext && setDAWContext(contextValue); } catch (e) { /* ignore */ }
    } catch (e) {
      // ignore
    }
    return () => {
      try {
        (window as any).__CORELOGIC_DAW_CONTEXT__ = undefined;
      } catch (e) {
        // ignore
      }
    };
  }, [contextValue]);

  return <DAWContext.Provider value={contextValue}>{children}</DAWContext.Provider>;
}

// Custom hook to use DAW context
export const useDAW = (): DAWContextType => {
  const context = React.useContext(DAWContext);
  if (!context) {
    throw new Error("useDAW must be used within a DAWProvider");
  }
  return context;
};
