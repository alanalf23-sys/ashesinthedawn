import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  Track,
  Project,
  LogicCoreMode,
  Plugin,
  Marker,
  LoopRegion,
  MetronomeSettings,
} from "../types";
import { supabase } from "../lib/supabase";
import { getAudioEngine } from "../lib/audioEngine";
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Track, Project, LogicCoreMode, Plugin, Clip, AudioEvent, AudioDevice, AudioIOState, PluginInstance, EffectChain, MIDIDevice, MIDIRoute, BusNode, SidechainConfig, AutomationCurve } from '../types';
import { supabase } from '../lib/supabase';
import { getAudioEngine } from '../lib/audioEngine';
import { getAudioDeviceManager } from '../lib/audioDeviceManager';
import { RealtimeBufferManager } from '../lib/realtimeBufferManager';
import { AudioIOMetrics } from '../lib/audioIOMetrics';
import { getPluginHostManager } from '../lib/pluginHost';
import { BusManager, RoutingEngine, SidechainManager } from '../lib/audioRouter';
import { getVoiceControlEngine } from '../lib/voiceControlEngine';
// Phase 5.1: Session, Undo/Redo, and Metering Systems
import { SessionManager, UndoRedoManager } from '../lib/sessionManager';
import { MeteringEngine, MeteringMode } from '../lib/meteringEngine';

interface ProjectSettings {
  sampleRate: number;
  bitDepth: number;
  bpm: number;
  timeSignature: string;
}

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
  deletedTracks: Track[]; // Trash
  canUndo: boolean;
  canRedo: boolean;
  markers: Marker[];
  loopRegion: LoopRegion;
  metronomeSettings: MetronomeSettings;
  setCurrentProject: (project: Project | null) => void;
  addTrack: (type: Track["type"]) => void;
  selectTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  deleteTrack: (trackId: string) => void; // Soft delete to trash
  restoreTrack: (trackId: string) => void; // Restore from trash
  permanentlyDeleteTrack: (trackId: string) => void; // Hard delete
  togglePlay: () => void;
  toggleRecord: () => void;
  stop: () => void;
  setLogicCoreMode: (mode: LogicCoreMode) => void;
  toggleVoiceControl: () => void;
  saveProject: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  uploadAudioFile: (file: File) => Promise<boolean>;
  getWaveformData: (trackId: string) => number[];
  getAudioDuration: (trackId: string) => number;
  seek: (timeSeconds: number) => void;
  setTrackInputGain: (trackId: string, gainDb: number) => void;
  addPluginToTrack: (trackId: string, plugin: Plugin) => void;
  removePluginFromTrack: (trackId: string, pluginId: string) => void;
  togglePluginEnabled: (
    trackId: string,
    pluginId: string,
    enabled: boolean
  ) => void;
  undo: () => void;
  redo: () => void;
  // Phase 3: Markers
  addMarker: (time: number, name: string) => void;
  deleteMarker: (markerId: string) => void;
  updateMarker: (markerId: string, updates: Partial<Marker>) => void;
  // Phase 3: Looping
  setLoopRegion: (startTime: number, endTime: number) => void;
  toggleLoop: () => void;
  clearLoopRegion: () => void;
  // Phase 3: Metronome
  toggleMetronome: () => void;
  setMetronomeVolume: (volume: number) => void;
  setMetronomeBeatSound: (sound: MetronomeSettings["beatSound"]) => void;
  togglePluginEnabled: (trackId: string, pluginId: string, enabled: boolean) => void;
  // Edit operations
  undo: () => void;
  redo: () => void;
  cut: () => void;
  copy: () => void;
  paste: () => void;
  // View operations
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  // Track operations
  duplicateTrack: (trackId: string) => void;
  muteTrack: (trackId: string, muted: boolean) => void;
  soloTrack: (trackId: string, soloed: boolean) => void;
  muteAllTracks: () => void;
  unmuteAllTracks: () => void;
  // UI state for modals
  showNewProjectModal: boolean;
  showOpenProjectModal: boolean;
  showSaveAsModal: boolean;
  showExportModal: boolean;
  showPreferencesModal: boolean;
  showAudioSettingsModal: boolean;
  showMidiSettingsModal: boolean;
  showShortcutsModal: boolean;
  showAboutModal: boolean;
  showMixerOptionsModal: boolean;
  isFullscreen: boolean;
  showMixer: boolean;
  // Modal control functions
  openNewProjectModal: () => void;
  closeNewProjectModal: () => void;
  openOpenProjectModal: () => void;
  closeOpenProjectModal: () => void;
  openSaveAsModal: () => void;
  closeSaveAsModal: () => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  openPreferencesModal: () => void;
  closePreferencesModal: () => void;
  openAudioSettingsModal: () => void;
  closeAudioSettingsModal: () => void;
  openMidiSettingsModal: () => void;
  closeMidiSettingsModal: () => void;
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;
  openAboutModal: () => void;
  closeAboutModal: () => void;
  openMixerOptionsModal: () => void;
  closeMixerOptionsModal: () => void;
  // View control functions
  toggleFullscreen: () => void;
  toggleMixerVisibility: () => void;
  // File operations
  createNewProject: (name: string, settings: ProjectSettings) => void;
  exportAudio: (format: string, quality: string) => Promise<void>;
  // Clip operations
  clips: Clip[];
  selectedClip: Clip | null;
  createClip: (trackId: string, startTime: number, duration: number, audioFileId?: string) => void;
  deleteClip: (clipId: string) => void;
  splitClip: (clipId: string, splitTime: number) => void;
  quantizeClip: (clipId: string, gridSize: number) => void;
  selectClip: (clipId: string | null) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  // Event operations
  events: AudioEvent[];
  selectedEvent: AudioEvent | null;
  createEvent: (trackId: string, type: AudioEvent['type'], time: number) => void;
  editEvent: (eventId: string, updates: Partial<AudioEvent>) => void;
  deleteEvent: (eventId: string) => void;
  selectEvent: (eventId: string | null) => void;
  
  // Phase 3: Real-Time Audio I/O
  selectedInputDevice: AudioDevice | null;
  selectedOutputDevice: AudioDevice | null;
  inputLevel: number;
  latencyMs: number;
  bufferUnderruns: number;
  bufferOverruns: number;
  isAudioIOActive: boolean;
  audioIOError: string | null;
  getInputDevices: () => Promise<AudioDevice[]>;
  getOutputDevices: () => Promise<AudioDevice[]>;
  selectInputDevice: (deviceId: string) => Promise<boolean>;
  selectOutputDevice: (deviceId: string) => Promise<boolean>;
  startAudioIO: () => Promise<boolean>;
  stopAudioIO: () => void;
  getLatencyMs: () => number;
  getIOMetrics: () => AudioIOState;
  refreshDeviceList: () => Promise<void>;
  // Test tone methods
  startTestTone: (frequency: number, volume: number) => boolean;
  stopTestTone: () => void;
  isTestTonePlaying: () => boolean;
  
  // Phase 4: Plugin Management
  loadedPlugins: Map<string, PluginInstance[]>;
  effectChains: Map<string, EffectChain>;
  loadPlugin: (pluginPath: string, trackId: string) => Promise<boolean>;
  unloadPlugin: (trackId: string, pluginId: string) => void;
  getPluginParameters: (trackId: string, pluginId: string) => Record<string, number>;
  setPluginParameter: (trackId: string, pluginId: string, paramId: string, value: number) => void;
  
  // Phase 4: MIDI Management
  midiRouting: Map<string, MIDIRoute>;
  midiDevices: MIDIDevice[];
  createMIDIRoute: (trackId: string, midiDevice: MIDIDevice, channel: number) => void;
  deleteMIDIRoute: (routeId: string) => void;
  getMIDIRoutesForTrack: (trackId: string) => MIDIRoute[];
  handleMIDINote: (note: number, velocity: number, channel: number) => void;
  
  // Phase 4: Audio Routing
  buses: BusNode[];
  routingEngine: RoutingEngine;
  sidechainConfigs: Map<string, SidechainConfig>;
  createBus: (name: string, color: string) => string;
  deleteBus: (busId: string) => void;
  addTrackToBus: (trackId: string, busId: string) => void;
  removeTrackFromBus: (trackId: string) => void;
  createSidechain: (compressorTrackId: string, sourceTrackId: string, frequency: number, filterType: 'lowpass' | 'highpass' | 'bandpass' | 'none') => void;
  deleteSidechain: (sidechainId: string) => void;
  applyBusRouting: (trackId: string, busId: string | null) => void;
  createAudioBus: (name: string, color: string, volume?: number, pan?: number) => string;
  setBusAudioLevel: (busId: string, volumeDb: number) => void;
  setBusAudioPan: (busId: string, pan: number) => void;
  
  // Phase 4: Automation
  automationCurves: Map<string, AutomationCurve[]>;
  createAutomationCurve: (trackId: string, parameter: string) => string;
  deleteAutomationCurve: (curveId: string) => void;
  addAutomationPoint: (curveId: string, time: number, value: number) => void;
  updateAutomationCurve: (curveId: string, updates: Partial<AutomationCurve>) => void;
  removeAutomationPoint: (curveId: string, pointTime: number) => void;
  
  // Phase 4: Analysis
  spectrumData: Record<string, number[]>;
  cpuUsageDetailed: number;

  // Phase 5.1: Session Management
  currentSession: SessionData | null;
  sessionHistory: SessionData[];
  sessionAutoSaveEnabled: boolean;
  sessionLastSaved: Date | null;
  createSession: (name: string) => void;
  saveSession: (name?: string) => Promise<boolean>;
  loadSession: (sessionId: string) => Promise<boolean>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  autoSaveSession: () => Promise<void>;
  exportSession: (sessionId: string, format: 'json' | 'zip') => Promise<Blob>;
  createSessionBackup: () => Promise<string>;
  restoreSessionBackup: (backupId: string) => Promise<boolean>;
  getSessionMetadata: () => Record<string, unknown>;
  setSessionAutoSaveEnabled: (enabled: boolean) => void;

  // Phase 5.1: Enhanced Undo/Redo System
  undoStack: UndoAction[];
  redoStack: UndoAction[];
  canUndo: boolean;
  canRedo: boolean;
  undoAction: () => void;
  redoAction: () => void;
  clearUndoHistory: () => void;
  getUndoActionName: () => string;
  getRedoActionName: () => string;
  recordAction: (action: UndoAction) => void;

  // Phase 5.1: Advanced Metering
  meteringMode: MeteringMode;
  meteringActive: boolean;
  lufs: number;
  truePeak: number;
  phaseCorrelation: number;
  headroom: number;
  spectrumFrequencies: number[];
  setMeteringMode: (mode: MeteringMode) => void;
  startMetering: () => void;
  stopMetering: () => void;
  resetMetering: () => void;
  getMeteringData: () => MeteringData;
  analyzeLoudness: (duration?: number) => Promise<LoudnessAnalysis>;
}

const DAWContext = createContext<DAWContextType | undefined>(undefined);

export function DAWProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [logicCoreMode, setLogicCoreMode] = useState<LogicCoreMode>("ON");
  const [deletedTracks, setDeletedTracks] = useState<Track[]>([]); // Trash
  const [undoHistory, setUndoHistory] = useState<Track[][]>([]); // Undo stack
  const [redoHistory, setRedoHistory] = useState<Track[][]>([]); // Redo stack
  const [voiceControlActive, setVoiceControlActive] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Phase 3: New state
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loopRegion, setLoopRegion] = useState<LoopRegion>({
    enabled: false,
    startTime: 0,
    endTime: 0,
  });
  const [metronomeSettings, setMetronomeSettings] = useState<MetronomeSettings>(
    {
      enabled: false,
      volume: 0.3,
      beatSound: "click",
      accentFirst: true,
    }
  );
  const zoom = 1;
  const cpuUsage = 12;
  const [zoom, setZoom] = useState(1);
  const zoom_val = zoom;
  const [cpuUsage, setCpuUsage] = useState(0);
  const audioEngineRef = useRef(getAudioEngine());
  
  // Command history for undo/redo
  const [history, setHistory] = useState<Track[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [clipboard, setClipboard] = useState<Track | null>(null);
  
  // Modal visibility states
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showOpenProjectModal, setShowOpenProjectModal] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showAudioSettingsModal, setShowAudioSettingsModal] = useState(false);
  const [showMidiSettingsModal, setShowMidiSettingsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showMixerOptionsModal, setShowMixerOptionsModal] = useState(false);
  
  // View states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMixer, setShowMixer] = useState(true);
  
  // Clip and Event states
  const [clips, setClips] = useState<Clip[]>([]);
  const [events, setEvents] = useState<AudioEvent[]>([]);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AudioEvent | null>(null);

  // Phase 3: Real-Time Audio I/O State
  const [selectedInputDevice, setSelectedInputDevice] = useState<AudioDevice | null>(null);
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<AudioDevice | null>(null);
  const [inputLevel, setInputLevel] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [bufferUnderruns] = useState(0);
  const [bufferOverruns] = useState(0);
  const [isAudioIOActive, setIsAudioIOActive] = useState(false);
  const [audioIOError, setAudioIOError] = useState<string | null>(null);

  // Phase 3: Audio I/O Infrastructure References
  const realtimeBufferRef = useRef<RealtimeBufferManager | null>(null);
  const audioMetricsRef = useRef<AudioIOMetrics | null>(null);
  const inputLevelMonitorRef = useRef<NodeJS.Timeout | null>(null);

  // Phase 4: Infrastructure References
  const pluginHostManagerRef = useRef(getPluginHostManager());
  const busManagerRef = useRef(new BusManager());
  const routingEngineRef = useRef(new RoutingEngine());
  const sidechainManagerRef = useRef(new SidechainManager());

  // Phase 4: State
  const [loadedPlugins, setLoadedPlugins] = useState<Map<string, PluginInstance[]>>(new Map());
  const [midiRouting, setMidiRouting] = useState<Map<string, MIDIRoute>>(new Map());
  const [buses, setBuses] = useState<BusNode[]>([]);
  const [sidechainConfigs, setSidechainConfigs] = useState<Map<string, SidechainConfig>>(new Map());
  const [automationCurves, setAutomationCurves] = useState<Map<string, AutomationCurve[]>>(new Map());
  const cpuUsageDetailed = cpuUsage;
  
  // Phase 4: Derived States (read-only from libraries)
  const effectChainsArray = pluginHostManagerRef.current.getAllEffectChains();
  const effectChains: Map<string, EffectChain> = new Map(effectChainsArray.map(chain => [chain.id, chain]));
  const midiDevices: MIDIDevice[] = [];
  const spectrumData: Record<string, number[]> = {};

  // Phase 5.1: Session Management State
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionData[]>([]);
  const [sessionAutoSaveEnabled, setSessionAutoSaveEnabled] = useState(true);
  const [sessionLastSaved, setSessionLastSaved] = useState<Date | null>(null);
  const sessionManagerRef = useRef(new SessionManager());

  // Phase 5.1: Enhanced Undo/Redo State
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoAction[]>([]);
  const undoRedoManagerRef = useRef(new UndoRedoManager());

  // Phase 5.1: Advanced Metering State
  const [meteringMode, setMeteringMode] = useState<MeteringMode>('integrated');
  const [meteringActive, setMeteringActive] = useState(false);
  const [lufs, setLufs] = useState(-60);
  const [truePeak, setTruePeak] = useState(-60);
  const [phaseCorrelation, setPhaseCorrelation] = useState(1.0);
  const [headroom, setHeadroom] = useState(23);
  const [spectrumFrequencies, setSpectrumFrequencies] = useState<number[]>([]);
  const meteringEngineRef = useRef(new MeteringEngine());

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  useEffect(() => {
    if (currentProject) {
      // Ensure master track exists
      const hasMasterTrack = currentProject.tracks?.some(
        (t) => t.type === "master"
      );
      let tracksToSet = currentProject.tracks || [];

      if (!hasMasterTrack) {
        const masterTrack: Track = {
          id: "master-main",
          name: "Master",
          type: "master",
          color: "#6366f1",
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
          routing: "Master",
          automationMode: "off",
        };
        tracksToSet = [...tracksToSet, masterTrack];
      }

      setTracks(tracksToSet);
    }
  }, [currentProject]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => prev + 0.1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  // Sync track volume and pan changes with audio engine during playback
  useEffect(() => {
    if (isPlaying) {
      tracks.forEach((track) => {
        audioEngineRef.current.setTrackVolume(track.id, track.volume);
        audioEngineRef.current.setTrackPan(track.id, track.pan);
        audioEngineRef.current.setStereoWidth(
          track.id,
          track.stereoWidth || 100
        );
        audioEngineRef.current.setPhaseFlip(track.id, track.phaseFlip || false);
        // Ensure input gain (pre-fader) is synced as well
        if (typeof track.inputGain === "number") {
          audioEngineRef.current.setTrackInputGain(track.id, track.inputGain);
        }
      });
    }
  }, [tracks, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    // Capture reference to avoid stale closure issues
    const engine = audioEngineRef.current;
    return () => {
      engine.dispose();
      if (realtimeBufferRef.current) {
        realtimeBufferRef.current.dispose();
      }
      if (audioMetricsRef.current) {
        audioMetricsRef.current.dispose();
      }
      if (inputLevelMonitorRef.current) {
        clearInterval(inputLevelMonitorRef.current);
      }
    };
  }, []);

  // Monitor CPU usage during playback
  useEffect(() => {
    if (!isPlaying) {
      setCpuUsage(0);
      return;
    }

    const cpuMonitorInterval = setInterval(() => {
      // Calculate CPU usage based on number of active tracks and operations
      const activeTrackCount = tracks.filter(t => !t.muted && (t.type === 'audio' || t.type === 'instrument')).length;
      const automationCount = automationCurves instanceof Map ? automationCurves.size : 0;
      
      // Rough estimate: 2% per track + 1% per automation curve + base 5%
      const estimatedCpuUsage = Math.min(95, 5 + (activeTrackCount * 2) + (automationCount * 1));
      setCpuUsage(Math.round(estimatedCpuUsage));
    }, 500); // Update CPU every 500ms

    return () => clearInterval(cpuMonitorInterval);
  }, [isPlaying, tracks, automationCurves]);

  // Phase 3: Initialize Audio Device Manager
  useEffect(() => {
    const initializeDeviceManager = async () => {
      try {
        const deviceManager = await getAudioDeviceManager();
        
        // Listen for device changes
        deviceManager.onDevicesChanged((devices) => {
          // Update device list on changes
          console.log('Devices changed:', devices);
        });

        // Initialize metrics and buffer
        realtimeBufferRef.current = new RealtimeBufferManager(8192, 2, 48000);
        audioMetricsRef.current = new AudioIOMetrics(48000, 256);

        // Load persisted device selections from localStorage
        try {
          const savedInputDevice = localStorage.getItem('selectedInputDeviceId');
          const savedOutputDevice = localStorage.getItem('selectedOutputDeviceId');

          if (savedInputDevice) {
            const inputDevices = await deviceManager.getInputDevices();
            const device = inputDevices.find(d => d.deviceId === savedInputDevice);
            if (device && device.state === 'connected') {
              deviceManager.selectInputDevice(savedInputDevice);
              setSelectedInputDevice(device);
              console.log('Restored input device from storage:', device.label);
            } else if (device) {
              console.warn('Saved input device is disconnected, clearing selection');
              localStorage.removeItem('selectedInputDeviceId');
            }
          }

          if (savedOutputDevice) {
            const outputDevices = await deviceManager.getOutputDevices();
            const device = outputDevices.find(d => d.deviceId === savedOutputDevice);
            if (device && device.state === 'connected') {
              deviceManager.selectOutputDevice(savedOutputDevice);
              setSelectedOutputDevice(device);
              console.log('Restored output device from storage:', device.label);
            } else if (device) {
              console.warn('Saved output device is disconnected, clearing selection');
              localStorage.removeItem('selectedOutputDeviceId');
            }
          }
        } catch (error) {
          console.warn('Failed to restore device settings from storage:', error);
          // Continue without persisted settings
        }

        console.log('Audio Device Manager initialized');
      } catch (error) {
        console.error('Failed to initialize Audio Device Manager:', error);
        setAudioIOError('Failed to initialize audio devices');
      }
    };

    initializeDeviceManager();
  }, []);

  // Branching function: Get sequential track number for a given type
  const getTrackNumberForType = (type: Track["type"]): number => {
    const tracksOfType = tracks.filter((t) => t.type === type);
    return tracksOfType.length + 1;
  };

  // Branching function: Get random color from palette
  const getRandomTrackColor = (): string => {
    const colors = [
      "#3b82f6",
      "#ef4444",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#14b8a6",
      "#6366f1",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // History management for undo/redo
  const addToHistory = (newTracks: Track[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTracks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTracks(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTracks(history[newIndex]);
    }
  };

  const cut = () => {
    if (selectedTrack) {
      setClipboard(selectedTrack);
      const newTracks = tracks.filter(t => t.id !== selectedTrack.id);
      setTracks(newTracks);
      addToHistory(newTracks);
      setSelectedTrack(null);
    }
  };

  const copy = () => {
    if (selectedTrack) {
      setClipboard(selectedTrack);
    }
  };

  const paste = () => {
    if (clipboard) {
      const pastedTrack: Track = {
        ...clipboard,
        id: `track-${Date.now()}`,
        name: `${clipboard.name} (Copy)`,
      };
      const newTracks = [...tracks, pastedTrack];
      setTracks(newTracks);
      addToHistory(newTracks);
      setSelectedTrack(pastedTrack);
    }
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const duplicateTrack = (trackId: string) => {
    const trackToDuplicate = tracks.find(t => t.id === trackId);
    if (trackToDuplicate) {
      const duplicatedTrack: Track = {
        ...trackToDuplicate,
        id: `track-${Date.now()}`,
        name: `${trackToDuplicate.name} (Copy)`,
      };
      const newTracks = [...tracks, duplicatedTrack];
      setTracks(newTracks);
      addToHistory(newTracks);
    }
  };

  const muteTrack = (trackId: string, muted: boolean) => {
    const newTracks = tracks.map(t => t.id === trackId ? { ...t, muted } : t);
    setTracks(newTracks);
    addToHistory(newTracks);
    if (selectedTrack?.id === trackId) {
      setSelectedTrack({ ...selectedTrack, muted });
    }
  };

  const soloTrack = (trackId: string, soloed: boolean) => {
    const newTracks = tracks.map(t => t.id === trackId ? { ...t, soloed } : t);
    setTracks(newTracks);
    addToHistory(newTracks);
    if (selectedTrack?.id === trackId) {
      setSelectedTrack({ ...selectedTrack, soloed });
    }
  };

  const muteAllTracks = () => {
    const newTracks = tracks.map(t => ({ ...t, muted: true }));
    setTracks(newTracks);
    addToHistory(newTracks);
  };

  const unmuteAllTracks = () => {
    const newTracks = tracks.map(t => ({ ...t, muted: false }));
    setTracks(newTracks);
    addToHistory(newTracks);
  };

  // Modal control functions
  const openNewProjectModal = () => setShowNewProjectModal(true);
  const closeNewProjectModal = () => setShowNewProjectModal(false);
  const openOpenProjectModal = () => setShowOpenProjectModal(true);
  const closeOpenProjectModal = () => setShowOpenProjectModal(false);
  const openSaveAsModal = () => setShowSaveAsModal(true);
  const closeSaveAsModal = () => setShowSaveAsModal(false);
  const openExportModal = () => setShowExportModal(true);
  const closeExportModal = () => setShowExportModal(false);
  const openPreferencesModal = () => setShowPreferencesModal(true);
  const closePreferencesModal = () => setShowPreferencesModal(false);
  const openAudioSettingsModal = () => setShowAudioSettingsModal(true);
  const closeAudioSettingsModal = () => setShowAudioSettingsModal(false);
  const openMidiSettingsModal = () => setShowMidiSettingsModal(true);
  const closeMidiSettingsModal = () => setShowMidiSettingsModal(false);
  const openShortcutsModal = () => setShowShortcutsModal(true);
  const closeShortcutsModal = () => setShowShortcutsModal(false);
  const openAboutModal = () => setShowAboutModal(true);
  const closeAboutModal = () => setShowAboutModal(false);
  const openMixerOptionsModal = () => setShowMixerOptionsModal(true);
  const closeMixerOptionsModal = () => setShowMixerOptionsModal(false);

  // View control functions
  const toggleFullscreen = () => setIsFullscreen(prev => !prev);
  const toggleMixerVisibility = () => setShowMixer(prev => !prev);

  // File operations
  const createNewProject = (name: string, settings: ProjectSettings) => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name,
      sampleRate: settings.sampleRate || 44100,
      bitDepth: settings.bitDepth || 24,
      bpm: settings.bpm || 120,
      timeSignature: settings.timeSignature || '4/4',
      tracks: [],
      buses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(newProject);
    setTracks([]);
    setHistory([[]]);
    setHistoryIndex(0);
    closeNewProjectModal();
  };

  const exportAudio = async (format: string, quality: string) => {
    console.log(`Exporting audio as ${format} with quality ${quality}`);
    try {
      // Get all audible (non-muted, not soloed-out) tracks
      const anySolo = tracks.some(t => t.soloed);
      const audibleTracks = tracks.filter(t => 
        !t.muted && t.type !== 'master' && (!anySolo || t.soloed)
      );

      if (audibleTracks.length === 0) {
        console.warn('No audible tracks to export');
        closeExportModal();
        return;
      }

      // In future, create an offline audio context for rendering
      // For MVP, just prepare the export
      console.log(`Preparing ${audibleTracks.length} tracks for export...`);
      // In production, integrate with audio engine to mix and render tracks
      // For MVP, just log the preparation
      
      closeExportModal();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Clip operations
  const createClip = (trackId: string, startTime: number, duration: number, audioFileId?: string) => {
    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      trackId,
      name: `Clip ${clips.filter(c => c.trackId === trackId).length + 1}`,
      startTime,
      duration,
      offset: 0,
      audioFileId,
      color: '#3b82f6',
      locked: false,
      muted: false,
    };
    setClips(prev => [...prev, newClip]);
    setSelectedClip(newClip);
    console.log('Created clip:', newClip);
  };

  const deleteClip = (clipId: string) => {
    setClips(prev => prev.filter(c => c.id !== clipId));
    if (selectedClip?.id === clipId) {
      setSelectedClip(null);
    }
    console.log('Deleted clip:', clipId);
  };

  const splitClip = (clipId: string, splitTime: number) => {
    const clipToSplit = clips.find(c => c.id === clipId);
    if (!clipToSplit) return;

    // Calculate the offset for the second clip
    const splitOffset = splitTime - clipToSplit.startTime;
    
    // Create new clip from split point
    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      trackId: clipToSplit.trackId,
      name: `${clipToSplit.name} (split)`,
      startTime: splitTime,
      duration: clipToSplit.duration - splitOffset,
      offset: clipToSplit.offset + splitOffset,
      audioFileId: clipToSplit.audioFileId,
      color: clipToSplit.color,
      locked: false,
      muted: clipToSplit.muted,
    };

    // Update original clip duration
    const updatedClip = { ...clipToSplit, duration: splitOffset };
    setClips(prev => [
      ...prev.filter(c => c.id !== clipId),
      updatedClip,
      newClip,
    ]);
    console.log('Split clip at', splitTime);
  };

  const quantizeClip = (clipId: string, gridSize: number = 0.25) => {
    // Snap clip start time to nearest grid line
    const clipToQuantize = clips.find(c => c.id === clipId);
    if (!clipToQuantize) return;

    const quantizedStart = Math.round(clipToQuantize.startTime / gridSize) * gridSize;
    setClips(prev => prev.map(c => 
      c.id === clipId ? { ...c, startTime: quantizedStart } : c
    ));
    console.log(`Quantized clip to grid (${gridSize}s)`);
  };

  const selectClip = (clipId: string | null) => {
    const clip = clipId ? clips.find(c => c.id === clipId) : null;
    setSelectedClip(clip || null);
  };

  const updateClip = (clipId: string, updates: Partial<Clip>) => {
    setClips(prev => prev.map(c => 
      c.id === clipId ? { ...c, ...updates } : c
    ));
    if (selectedClip?.id === clipId) {
      setSelectedClip(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Event operations
  const createEvent = (trackId: string, type: AudioEvent['type'], time: number) => {
    const newEvent: AudioEvent = {
      id: `event-${Date.now()}`,
      trackId,
      type,
      time,
      value: type === 'automation' ? 0 : undefined,
      note: type === 'note' ? { pitch: 60, velocity: 100, duration: 1 } : undefined,
    };
    setEvents(prev => [...prev, newEvent]);
    setSelectedEvent(newEvent);
    console.log('Created event:', newEvent);
  };

  const editEvent = (eventId: string, updates: Partial<AudioEvent>) => {
    setEvents(prev => prev.map(e => 
      e.id === eventId ? { ...e, ...updates } : e
    ));
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(prev => prev ? { ...prev, ...updates } : null);
    }
    console.log('Edited event:', eventId);
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null);
    }
    console.log('Deleted event:', eventId);
  };

  const selectEvent = (eventId: string | null) => {
    const event = eventId ? events.find(e => e.id === eventId) : null;
    setSelectedEvent(event || null);
  };

  // Branching function: Create audio track
  const createAudioTrack = (): Track => {
    const trackNum = getTrackNumberForType("audio");
    return {
      id: `track-${Date.now()}`,
      name: `Audio ${trackNum}`,
      type: "audio",
      color: getRandomTrackColor(),
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
      routing: "Master",
      automationMode: "off",
    } as Track;
  };

  // Branching function: Create instrument track
  const createInstrumentTrack = (): Track => {
    const trackNum = getTrackNumberForType("instrument");
    return {
      id: `track-${Date.now()}`,
      name: `Instrument ${trackNum}`,
      type: "instrument",
      color: getRandomTrackColor(),
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
      routing: "Master",
      automationMode: "off",
    } as Track;
  };

  // Branching function: Create MIDI track
  const createMidiTrack = (): Track => {
    const trackNum = getTrackNumberForType("midi");
    return {
      id: `track-${Date.now()}`,
      name: `MIDI ${trackNum}`,
      type: "midi",
      color: getRandomTrackColor(),
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
      routing: "Master",
      automationMode: "off",
    } as Track;
  };

  // Branching function: Create aux track
  const createAuxTrack = (): Track => {
    const trackNum = getTrackNumberForType("aux");
    return {
      id: `track-${Date.now()}`,
      name: `Aux ${trackNum}`,
      type: "aux",
      color: getRandomTrackColor(),
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
      routing: "Master",
      automationMode: "off",
    } as Track;
  };

  // Branching function: Create VCA track
  const createVcaTrack = (): Track => {
    const trackNum = getTrackNumberForType("vca");
    return {
      id: `track-${Date.now()}`,
      name: `VCA ${trackNum}`,
      type: "vca",
      color: getRandomTrackColor(),
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
      routing: "Master",
      automationMode: "off",
    } as Track;
  };

  // Main branching router: Add track based on type
  const addTrack = (type: Track["type"]) => {
    let newTrack: Track;

    switch (type) {
      case "audio":
        newTrack = createAudioTrack();
        break;
      case "instrument":
        newTrack = createInstrumentTrack();
        break;
      case "midi":
        newTrack = createMidiTrack();
        break;
      case "aux":
        newTrack = createAuxTrack();
        break;
      case "vca":
        newTrack = createVcaTrack();
        break;
      case "master":
        // Master track is managed separately, should not be added here
        console.warn("Master track should not be added via addTrack()");
        return;
      default:
        // Fallback to audio track
        newTrack = createAudioTrack();
    }

    setTracks((prev) => [...prev, newTrack]);
    const newTracks = [...tracks, newTrack];
    setTracks(newTracks);
    addToHistory(newTracks);
  };

  const selectTrack = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    setSelectedTrack(track || null);
  };

  const updateTrack = (trackId: string, updates: Partial<Track>) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...updates } : t))
    );
  };

  const deleteTrack = (trackId: string) => {
    // SOFT DELETE: Move to trash, don't permanently remove
    const trackToDelete = tracks.find((t) => t.id === trackId);
    if (trackToDelete) {
      // Save to undo history
      setUndoHistory((prev) => [...prev, tracks]);
      setRedoHistory([]); // Clear redo when new action taken

      // Move to trash
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      setDeletedTracks((prev) => [
        ...prev,
        { ...trackToDelete, deleted_at: new Date().toISOString() },
      ]);

      // Deselect if selected
      if (selectedTrack?.id === trackId) {
        setSelectedTrack(null);
      }

      console.log(`Track "${trackToDelete.name}" moved to trash`);
    }
  };

  // Restore track from trash
  const restoreTrack = (trackId: string) => {
    const trackToRestore = deletedTracks.find((t) => t.id === trackId);
    if (trackToRestore) {
      // Save to undo history
      setUndoHistory((prev) => [...prev, tracks]);
      setRedoHistory([]);

      // Restore from trash (remove any deletion metadata)
      setTracks((prev) => [...prev, trackToRestore]);
      setDeletedTracks((prev) => prev.filter((t) => t.id !== trackId));

      console.log(`Track "${trackToRestore.name}" restored from trash`);
    }
  };

  // Permanently delete track (irreversible - use with caution)
  const permanentlyDeleteTrack = (trackId: string) => {
    setDeletedTracks((prev) => prev.filter((t) => t.id !== trackId));
    console.log(`Track permanently deleted`);
  };

  // Undo last action
  const undo = () => {
    if (undoHistory.length > 0) {
      const previousState = undoHistory[undoHistory.length - 1];
      setRedoHistory((prev) => [...prev, tracks]);
      setTracks(previousState);
      setUndoHistory((prev) => prev.slice(0, -1));
      setSelectedTrack(null);
      console.log("Undo performed");
    }
  };

  // Redo last undone action
  const redo = () => {
    if (redoHistory.length > 0) {
      const nextState = redoHistory[redoHistory.length - 1];
      setUndoHistory((prev) => [...prev, tracks]);
      setTracks(nextState);
      setRedoHistory((prev) => prev.slice(0, -1));
    const newTracks = tracks.map(t => t.id === trackId ? { ...t, ...updates } : t);
    setTracks(newTracks);
  };

  const deleteTrack = (trackId: string) => {
    const newTracks = tracks.filter(t => t.id !== trackId);
    setTracks(newTracks);
    addToHistory(newTracks);
    if (selectedTrack?.id === trackId) {
      setSelectedTrack(null);
      console.log("Redo performed");
    }
  };

  // Set input gain (pre-fader) for a track both in state and audio engine
  const setTrackInputGain = (trackId: string, gainDb: number) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, inputGain: gainDb } : t))
    );
    try {
      audioEngineRef.current.setTrackInputGain(trackId, gainDb);
    } catch (error: unknown) {
      // audio engine might not be initialized yet — that's fine
      console.debug("setTrackInputGain error:", error);
    }
  };

  // Add a plugin to a track's insert chain
  const addPluginToTrack = (trackId: string, plugin: Plugin) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId ? { ...t, inserts: [...t.inserts, plugin] } : t
      )
    );
    // Update selected track if it was modified
    if (selectedTrack?.id === trackId) {
      setSelectedTrack((prev) =>
        prev ? { ...prev, inserts: [...prev.inserts, plugin] } : null
      );
    }
  };

  // Remove a plugin from a track's insert chain
  const removePluginFromTrack = (trackId: string, pluginId: string) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? { ...t, inserts: t.inserts.filter((p) => p.id !== pluginId) }
          : t
      )
    );
    // Update selected track if it was modified
    if (selectedTrack?.id === trackId) {
      setSelectedTrack((prev) =>
        prev
          ? { ...prev, inserts: prev.inserts.filter((p) => p.id !== pluginId) }
          : null
      );
    }
  };

  // Toggle plugin enabled/disabled
  const togglePluginEnabled = (
    trackId: string,
    pluginId: string,
    enabled: boolean
  ) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? {
              ...t,
              inserts: t.inserts.map((p) =>
                p.id === pluginId ? { ...p, enabled } : p
              ),
            }
          : t
      )
    );
    // Update selected track if it was modified
    if (selectedTrack?.id === trackId) {
      setSelectedTrack((prev) =>
        prev
          ? {
              ...prev,
              inserts: prev.inserts.map((p) =>
                p.id === pluginId ? { ...p, enabled } : p
              ),
            }
          : null
      );
    }
  };

  const togglePlay = () => {
    if (!isPlaying) {
      // Starting playback
      audioEngineRef.current
        .initialize()
        .then(() => {
          // Play all non-muted audio and instrument tracks from current time
          tracks.forEach((track) => {
            if (
              !track.muted &&
              (track.type === "audio" || track.type === "instrument")
            ) {
              // playAudio expects linear volume (0-1), convert from dB
              audioEngineRef.current.playAudio(
                track.id,
                currentTime,
                track.volume,
                track.pan
              );
            }
          });
          setIsPlaying(true);
        })
        .catch((err) => console.error("Audio init failed:", err));
      // Starting playback - update state first to prevent race conditions
      setIsPlaying(true);
      audioEngineRef.current.initialize().then(() => {
        // Play all non-muted audio and instrument tracks from current time
        tracks.forEach(track => {
          if (!track.muted && (track.type === 'audio' || track.type === 'instrument')) {
            // playAudio expects dB volume
            const volumeDb = track.volume || 0;
            audioEngineRef.current.playAudio(track.id, currentTime, volumeDb, track.pan);
          }
        });
      }).catch(err => {
        console.error('Audio init failed:', err);
        setIsPlaying(false);
      });
    } else {
      // Pausing playback
      setIsPlaying(false);
      audioEngineRef.current.stopAllAudio();
    }
  };

  const toggleRecord = () => {
    if (!isRecording) {
      // Starting recording - initialize audio engine first
      audioEngineRef.current
        .initialize()
        .then(async () => {
          const success = await audioEngineRef.current.startRecording();
          if (success) {
            setIsRecording(true);
            // Start playback if not already playing
            if (!isPlaying) {
              togglePlay();
            }
          } else {
            console.error(
              "Failed to start recording - getUserMedia may have been denied"
            );
          }
        })
        .catch((err) => console.error("Audio init failed during record:", err));
    } else {
      // Stopping recording - capture the blob and create a track
      audioEngineRef.current
        .stopRecording()
        .then((blob) => {
          if (blob) {
            // Create a new audio track from the recording
            const recordedFile = new File(
              [blob],
              `Recording-${Date.now()}.webm`,
              { type: "audio/webm" }
            );
            uploadAudioFile(recordedFile);
            console.log("Recording saved and imported as new track");
          }
          setIsRecording(false);
        })
        .catch((err) => console.error("Error stopping recording:", err));
      setIsRecording(true);
      audioEngineRef.current.initialize().then(async () => {
        const success = await audioEngineRef.current.startRecording();
        if (!success) {
          console.error('Failed to start recording - getUserMedia may have been denied');
          setIsRecording(false);
          return;
        }
        // Start playback if not already playing
        if (!isPlaying) {
          setIsPlaying(true);
          tracks.forEach(track => {
            if (!track.muted && (track.type === 'audio' || track.type === 'instrument')) {
              audioEngineRef.current.playAudio(track.id, currentTime, track.volume, track.pan);
            }
          });
        }
      }).catch(err => {
        console.error('Audio init failed during record:', err);
        setIsRecording(false);
      });
    } else {
      // Stopping recording
      setIsRecording(false);
      audioEngineRef.current.stopRecording().then(blob => {
        if (blob) {
          const recordedFile = new File([blob], `Recording-${Date.now()}.webm`, { type: 'audio/webm' });
          uploadAudioFile(recordedFile);
          console.log('Recording saved and imported as new track');
        }
      }).catch(err => console.error('Error stopping recording:', err));
    }
  };

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
  };

  const seek = (timeSeconds: number) => {
    setCurrentTime(timeSeconds);

    if (isPlaying) {
      // If playing, stop all audio and restart from new position
      audioEngineRef.current.stopAllAudio();

      // Resume playback from seek time
      tracks.forEach((track) => {
        if (
          !track.muted &&
          (track.type === "audio" || track.type === "instrument")
        ) {
          audioEngineRef.current.playAudio(
            track.id,
            timeSeconds,
            track.volume,
            track.pan
          );
        }
      });
    }
    // If not playing, just update currentTime - playback will start from this position when play is pressed
  };

  const getWaveformData = (trackId: string): number[] => {
    return audioEngineRef.current.getWaveformData(trackId);
  };

  const getAudioDuration = (trackId: string): number => {
    return audioEngineRef.current.getAudioDuration(trackId);
  };

  const toggleVoiceControl = () => {
    setVoiceControlActive((prev) => !prev);
    const voiceEngine = getVoiceControlEngine();
    
    setVoiceControlActive(prev => {
      const newState = !prev;
      
      if (newState) {
        // Enable voice control
        voiceEngine.enable();
        
        // Register voice command callbacks
        voiceEngine.onCommand('play', () => {
          setIsPlaying(true);
        });
        
        voiceEngine.onCommand('pause', () => {
          setIsPlaying(false);
        });
        
        voiceEngine.onCommand('stop', () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });
        
        voiceEngine.onCommand('record', () => {
          setIsRecording(prev => !prev);
        });
        
        voiceEngine.onCommand('nextTrack', () => {
          const currentIndex = tracks.findIndex(t => t.id === selectedTrack?.id);
          if (currentIndex < tracks.length - 1) {
            setSelectedTrack(tracks[currentIndex + 1]);
          }
        });
        
        voiceEngine.onCommand('prevTrack', () => {
          const currentIndex = tracks.findIndex(t => t.id === selectedTrack?.id);
          if (currentIndex > 0) {
            setSelectedTrack(tracks[currentIndex - 1]);
          }
        });
        
        voiceEngine.onCommand('undo', () => {
          undo();
        });
        
        voiceEngine.onCommand('redo', () => {
          redo();
        });
        
        voiceEngine.onCommand('solo', () => {
          if (selectedTrack) {
            updateTrack(selectedTrack.id, { soloed: !selectedTrack.soloed });
          }
        });
        
        voiceEngine.onCommand('mute', () => {
          if (selectedTrack) {
            updateTrack(selectedTrack.id, { muted: true });
          }
        });
        
        voiceEngine.onCommand('unmute', () => {
          if (selectedTrack) {
            updateTrack(selectedTrack.id, { muted: false });
          }
        });

        console.log('Voice Control enabled');
      } else {
        // Disable voice control
        voiceEngine.disable();
        console.log('Voice Control disabled');
      }
      
      return newState;
    });
  };

  const uploadAudioFile = async (file: File): Promise<boolean> => {
    setIsUploadingFile(true);
    setUploadError(null);

    try {
      // Validate file type
      const validTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/aac",
        "audio/flac",
        "audio/mp4",
      ];
      if (
        !validTypes.includes(file.type) &&
        !file.name.match(/\.(mp3|wav|ogg|aac|flac|m4a)$/i)
      ) {
        setUploadError("Invalid audio file format");
        setIsUploadingFile(false);
        return false;
      }

      // Validate file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        setUploadError("File size exceeds 100MB limit");
        setIsUploadingFile(false);
        return false;
      }

      const colors = [
        "#3b82f6",
        "#ef4444",
        "#10b981",
        "#f59e0b",
        "#8b5cf6",
        "#ec4899",
        "#14b8a6",
        "#6366f1",
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newTrack: Track = {
        id: `track-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: "audio",
        color: randomColor,
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
        routing: "Master",
      };

      // Load audio into engine
      const audioLoaded = await audioEngineRef.current.loadAudioFile(
        newTrack.id,
        file
      );
      if (!audioLoaded) {
        setUploadError("Failed to decode audio file");
        setIsUploadingFile(false);
        return false;
      }

      setTracks((prev) => [...prev, newTrack]);
      setIsUploadingFile(false);
      return true;
    } catch (error: unknown) {
      console.error("Upload error:", error);
      setUploadError("Failed to upload file");
      setIsUploadingFile(false);
      return false;
    }
  };

  const saveProject = async () => {
    if (!currentProject) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const sessionData = {
      tracks,
      bpm: currentProject.bpm,
      timeSignature: currentProject.timeSignature,
    };

    const { error } = await supabase.from("projects").upsert({
      id: currentProject.id,
      user_id: user.id,
      name: currentProject.name,
      sample_rate: currentProject.sampleRate,
      bit_depth: currentProject.bitDepth,
      bpm: currentProject.bpm,
      time_signature: currentProject.timeSignature,
      session_data: sessionData,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving project:", error);
    }
  };

  const loadProject = async (projectId: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    if (error || !data) {
      console.error("Error loading project:", error);
      return;
    }

    const project: Project = {
      id: data.id,
      name: data.name,
      sampleRate: data.sample_rate,
      bitDepth: data.bit_depth,
      bpm: data.bpm,
      timeSignature: data.time_signature,
      tracks: data.session_data?.tracks || [],
      buses: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setCurrentProject(project);
  };

  // Phase 3: Marker functions
  const addMarker = (time: number, name: string = "Marker") => {
    const newMarker: Marker = {
      id: `marker-${Date.now()}`,
      name,
      time,
      color: "#3b82f6",
      locked: false,
    };
    setMarkers((prev) => [...prev, newMarker].sort((a, b) => a.time - b.time));
  };

  const deleteMarker = (markerId: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId));
  };

  const updateMarker = (markerId: string, updates: Partial<Marker>) => {
    setMarkers((prev) =>
      prev
        .map((m) => (m.id === markerId ? { ...m, ...updates } : m))
        .sort((a, b) => a.time - b.time)
    );
  };

  // Phase 3: Loop functions
  const setLoopRegionFn = (startTime: number, endTime: number) => {
    setLoopRegion({
      enabled: loopRegion.enabled,
      startTime,
      endTime,
    });
  };

  const toggleLoop = () => {
    setLoopRegion((prev) => ({ ...prev, enabled: !prev.enabled }));
    // If loop is enabled and we're playing, handle loop playback
    if (isPlaying && !loopRegion.enabled) {
      // Loop just enabled - will handle in playback loop
      console.log("Loop enabled for playback");
    }
  };

  const clearLoopRegion = () => {
    setLoopRegion({
      enabled: false,
      startTime: 0,
      endTime: 0,
    });
  };

  // Phase 3: Metronome functions
  const toggleMetronome = () => {
    setMetronomeSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const setMetronomeVolume = (volume: number) => {
    setMetronomeSettings((prev) => ({
      ...prev,
      volume: Math.max(0, Math.min(1, volume)),
    }));
  };

  const setMetronomeBeatSound = (sound: MetronomeSettings["beatSound"]) => {
    setMetronomeSettings((prev) => ({ ...prev, beatSound: sound }));
  // Phase 3: Real-Time Audio I/O Methods
  const getInputDevices = async (): Promise<AudioDevice[]> => {
    try {
      const deviceManager = await getAudioDeviceManager();
      return deviceManager.getInputDevices();
    } catch (error) {
      console.error('Failed to get input devices:', error);
      return [];
    }
  };

  const getOutputDevices = async (): Promise<AudioDevice[]> => {
    try {
      const deviceManager = await getAudioDeviceManager();
      return deviceManager.getOutputDevices();
    } catch (error) {
      console.error('Failed to get output devices:', error);
      return [];
    }
  };

  const selectInputDevice = async (deviceId: string): Promise<boolean> => {
    try {
      const deviceManager = await getAudioDeviceManager();
      const success = deviceManager.selectInputDevice(deviceId);
      if (success) {
        const device = deviceManager.getSelectedInputDevice();
        setSelectedInputDevice(device);
        setAudioIOError(null);
        // Persist to localStorage
        try {
          localStorage.setItem('selectedInputDeviceId', deviceId);
        } catch (storageError) {
          console.warn('Failed to save input device to localStorage:', storageError);
        }
      }
      return success;
    } catch (error) {
      console.error('Failed to select input device:', error);
      setAudioIOError('Failed to select input device');
      return false;
    }
  };

  const selectOutputDevice = async (deviceId: string): Promise<boolean> => {
    try {
      const deviceManager = await getAudioDeviceManager();
      const success = deviceManager.selectOutputDevice(deviceId);
      if (success) {
        const device = deviceManager.getSelectedOutputDevice();
        setSelectedOutputDevice(device);
        setAudioIOError(null);
        // Persist to localStorage
        try {
          localStorage.setItem('selectedOutputDeviceId', deviceId);
        } catch (storageError) {
          console.warn('Failed to save output device to localStorage:', storageError);
        }
      }
      return success;
    } catch (error) {
      console.error('Failed to select output device:', error);
      setAudioIOError('Failed to select output device');
      return false;
    }
  };

  const startAudioIO = async (): Promise<boolean> => {
    try {
      const deviceManager = await getAudioDeviceManager();
      const device = deviceManager.getSelectedInputDevice();

      if (!device) {
        setAudioIOError('No input device selected');
        return false;
      }

      const engine = getAudioEngine();
      
      // Start real-time input with callback
      const success = await engine.startAudioInput(device.deviceId, (audioData) => {
        if (realtimeBufferRef.current) {
          realtimeBufferRef.current.writeAudio(audioData, 0);
        }
      });

      if (success) {
        setIsAudioIOActive(true);
        setAudioIOError(null);

        // Start input level monitoring
        if (inputLevelMonitorRef.current) {
          clearInterval(inputLevelMonitorRef.current);
        }
        inputLevelMonitorRef.current = setInterval(() => {
          const level = engine.getInputLevel();
          setInputLevel(level);

          if (realtimeBufferRef.current && audioMetricsRef.current) {
            const latency = realtimeBufferRef.current.getLatencyMs(0);
            setLatencyMs(latency);
            audioMetricsRef.current.setCurrentLatency(latency);
          }
        }, 50); // Update every 50ms

        console.log('Audio I/O started successfully');
        return true;
      } else {
        setAudioIOError('Failed to start audio input');
        return false;
      }
    } catch (error) {
      console.error('Failed to start audio I/O:', error);
      setAudioIOError(`Failed to start audio I/O: ${(error as Error).message}`);
      return false;
    }
  };

  const stopAudioIO = () => {
    try {
      const engine = getAudioEngine();
      engine.stopAudioInput();
      setIsAudioIOActive(false);
      setInputLevel(0);
      setLatencyMs(0);

      if (inputLevelMonitorRef.current) {
        clearInterval(inputLevelMonitorRef.current);
        inputLevelMonitorRef.current = null;
      }

      console.log('Audio I/O stopped');
    } catch (error) {
      console.error('Failed to stop audio I/O:', error);
    }
  };

  const getLatencyMs = (): number => {
    return latencyMs;
  };

  const getIOMetrics = (): AudioIOState => {
    return {
      selectedInputDevice,
      selectedOutputDevice,
      inputLevel,
      latencyMs,
      bufferUnderruns,
      bufferOverruns,
      isAudioIOActive,
      audioIOError,
    };
  };

  const refreshDeviceList = async (): Promise<void> => {
    try {
      const deviceManager = await getAudioDeviceManager();
      await deviceManager.refreshDevices();
      console.log('Device list refreshed');
    } catch (error) {
      console.error('Failed to refresh device list:', error);
    }
  };

  // Test tone methods
  const startTestTone = (frequency: number, volume: number): boolean => {
    try {
      const engine = audioEngineRef.current;
      return engine.startTestTone(frequency, Math.max(0, Math.min(1, volume)));
    } catch (error) {
      console.error('Failed to start test tone:', error);
      return false;
    }
  };

  const stopTestTone = (): void => {
    try {
      const engine = audioEngineRef.current;
      engine.stopTestTone();
    } catch (error) {
      console.error('Failed to stop test tone:', error);
    }
  };

  const isTestTonePlaying = (): boolean => {
    try {
      const engine = audioEngineRef.current;
      return engine.isTestTonePlaying();
    } catch (error) {
      console.error('Failed to check test tone status:', error);
      return false;
    }
  };

  // Phase 4: Plugin Management Methods
  const loadPlugin = async (pluginPath: string, trackId: string): Promise<boolean> => {
    try {
      const pluginName = pluginPath.split('/').pop() || 'Unknown';
      const plugin = pluginHostManagerRef.current.createPluginInstance(pluginName, 'vst3', '1.0');

      // Update state
      setLoadedPlugins(prev => {
        const updated = new Map(prev);
        const trackPlugins = updated.get(trackId) || [];
        trackPlugins.push(plugin);
        updated.set(trackId, trackPlugins);
        return updated;
      });

      console.log(`Loaded plugin ${pluginPath} on track ${trackId}`);
      return true;
    } catch (error) {
      console.error('Failed to load plugin:', error);
      return false;
    }
  };

  const unloadPlugin = (trackId: string, pluginId: string) => {
    try {
      pluginHostManagerRef.current.deletePlugin(pluginId);
      
      setLoadedPlugins(prev => {
        const updated = new Map(prev);
        const trackPlugins = updated.get(trackId) || [];
        updated.set(trackId, trackPlugins.filter(p => p.id !== pluginId));
        return updated;
      });

      console.log(`Unloaded plugin ${pluginId} from track ${trackId}`);
    } catch (error) {
      console.error('Failed to unload plugin:', error);
    }
  };

  const getPluginParameters = (trackId: string, pluginId: string): Record<string, number> => {
    const trackPlugins = loadedPlugins.get(trackId) || [];
    const plugin = trackPlugins.find(p => p.id === pluginId);
    return plugin?.currentValues || {};
  };

  const setPluginParameter = (trackId: string, pluginId: string, paramId: string, value: number) => {
    setLoadedPlugins(prev => {
      const updated = new Map(prev);
      const trackPlugins = updated.get(trackId) || [];
      const updatedPlugins = trackPlugins.map(p => {
        if (p.id === pluginId) {
          return {
            ...p,
            currentValues: { ...p.currentValues, [paramId]: value },
          };
        }
        return p;
      });
      updated.set(trackId, updatedPlugins);
      return updated;
    });

    // Update plugin host manager
    const plugin = pluginHostManagerRef.current.getPlugin(pluginId);
    if (plugin) {
      plugin.setParameter(paramId, value);
    }
  };

  // Phase 4: MIDI Management Methods
  const createMIDIRoute = (trackId: string, midiDevice: MIDIDevice, channel: number) => {
    const routeId = `midi-route-${Date.now()}`;
    const route: MIDIRoute = {
      id: routeId,
      trackId,
      midiDevice,
      midiChannel: channel,
      transpose: 0,
      velocity: 100,
    };

    setMidiRouting(prev => {
      const updated = new Map(prev);
      updated.set(routeId, route);
      return updated;
    });

    console.log(`Created MIDI route ${routeId} for track ${trackId}`);
  };

  const deleteMIDIRoute = (routeId: string) => {
    setMidiRouting(prev => {
      const updated = new Map(prev);
      updated.delete(routeId);
      return updated;
    });

    console.log(`Deleted MIDI route ${routeId}`);
  };

  const getMIDIRoutesForTrack = (trackId: string): MIDIRoute[] => {
    const routes: MIDIRoute[] = [];
    midiRouting.forEach(route => {
      if (route.trackId === trackId) {
        routes.push(route);
      }
    });
    return routes;
  };

  // Handle MIDI note input and trigger track playback
  const handleMIDINote = (note: number, velocity: number, channel: number) => {
    const audioEngine = getAudioEngine();
    if (!audioEngine.getContext()) return;

    // Find routes matching this MIDI channel
    midiRouting.forEach(route => {
      if (route.midiChannel === channel) {
        const track = tracks.find(t => t.id === route.trackId);
        if (!track || track.type !== 'instrument') return;

        // Apply transpose
        const transposedNote = note + (route.transpose || 0);
        
        // Apply velocity scaling (0-1 normalized)
        const velocityFactor = (velocity * (route.velocity || 100)) / (127 * 100);

        console.log(`MIDI Note: ${note} → Track: ${track.name}, Transposed: ${transposedNote}, Velocity: ${velocityFactor}`);
        
        // In full implementation, would:
        // 1. Trigger synthesizer on instrument track
        // 2. Pass note number to synthesis engine
        // 3. Apply velocity to envelope attack/release
        // 4. Route through track effects
      }
    });
  };

  // Phase 4: Audio Routing Methods
  const createBus = (name: string, color: string): string => {
    const newBus = busManagerRef.current.createBus(name, color);
    setBuses(prev => [...prev, newBus]);

    console.log(`Created bus ${name} (${newBus.id})`);
    return newBus.id;
  };

  const deleteBus = (busId: string) => {
    busManagerRef.current.deleteBus(busId);
    setBuses(prev => prev.filter(b => b.id !== busId));

    console.log(`Deleted bus ${busId}`);
  };

  const addTrackToBus = (trackId: string, busId: string) => {
    busManagerRef.current.addTrackToBus(trackId, busId);
    setBuses(prev => prev.map(b => 
      b.id === busId ? { ...b, tracks: [...b.tracks, trackId] } : b
    ));

    console.log(`Added track ${trackId} to bus ${busId}`);
  };

  const removeTrackFromBus = (trackId: string) => {
    setBuses(prev => prev.map(b => ({
      ...b,
      tracks: b.tracks.filter(t => t !== trackId),
    })));

    console.log(`Removed track ${trackId} from bus`);
  };

  const createSidechain = (compressorTrackId: string, sourceTrackId: string, frequency: number, filterType: 'lowpass' | 'highpass' | 'bandpass' | 'none') => {
    const config = sidechainManagerRef.current.createSidechain(compressorTrackId, sourceTrackId, frequency, filterType);
    
    setSidechainConfigs(prev => {
      const updated = new Map(prev);
      updated.set(config.id, config);
      return updated;
    });

    console.log(`Created sidechain ${config.id} for compressor on track ${compressorTrackId}`);
  };

  const deleteSidechain = (sidechainId: string) => {
    sidechainManagerRef.current.deleteSidechain(sidechainId);
    setSidechainConfigs(prev => {
      const updated = new Map(prev);
      updated.delete(sidechainId);
      return updated;
    });

    console.log(`Deleted sidechain ${sidechainId}`);
  };

  // Audio Engine Integration for Phase 4
  const applyBusRouting = (trackId: string, busId: string | null) => {
    const audioEngine = getAudioEngine();
    if (!audioEngine.getContext()) return;

    if (busId) {
      // Route track to bus in audio engine
      const success = audioEngine.routeTrackToBus(trackId, busId);
      if (success) {
        addTrackToBus(trackId, busId);
      }
    }
  };

  const createAudioBus = (name: string, color: string, volume: number = 0, pan: number = 0): string => {
    const busId = createBus(name, color);
    
    // Create corresponding audio graph bus
    const audioEngine = getAudioEngine();
    if (audioEngine.getContext()) {
      audioEngine.createBus(busId, volume, pan);
    }

    return busId;
  };

  const setBusAudioLevel = (busId: string, volumeDb: number) => {
    // Update state
    setBuses(prev => prev.map(b => 
      b.id === busId ? { ...b, volume: volumeDb } : b
    ));

    // Update audio engine
    const audioEngine = getAudioEngine();
    if (audioEngine.getContext()) {
      audioEngine.setBusVolume(busId, volumeDb);
    }
  };

  const setBusAudioPan = (busId: string, pan: number) => {
    // Update state
    setBuses(prev => prev.map(b => 
      b.id === busId ? { ...b, pan } : b
    ));

    // Update audio engine
    const audioEngine = getAudioEngine();
    if (audioEngine.getContext()) {
      audioEngine.setBusPan(busId, pan);
    }
  };

  // Phase 4: Automation Methods
  const createAutomationCurve = (trackId: string, parameter: string): string => {
    const curveId = `automation-${Date.now()}`;
    const curve: AutomationCurve = {
      id: curveId,
      trackId,
      parameter,
      points: [],
      mode: 'write',
      recording: false,
    };

    setAutomationCurves(prev => {
      const updated = new Map(prev);
      const trackCurves = updated.get(trackId) || [];
      trackCurves.push(curve);
      updated.set(trackId, trackCurves);
      return updated;
    });

    console.log(`Created automation curve ${curveId} for parameter ${parameter}`);
    return curveId;
  };

  const deleteAutomationCurve = (curveId: string) => {
    setAutomationCurves(prev => {
      const updated = new Map(prev);
      updated.forEach((curves, trackId) => {
        updated.set(trackId, curves.filter(c => c.id !== curveId));
      });
      return updated;
    });

    console.log(`Deleted automation curve ${curveId}`);
  };

  const addAutomationPoint = (curveId: string, time: number, value: number) => {
    setAutomationCurves(prev => {
      const updated = new Map(prev);
      updated.forEach((curves, trackId) => {
        updated.set(trackId, curves.map(c => {
          if (c.id === curveId) {
            return {
              ...c,
              points: [...c.points, { time, value, curveType: 'linear' }],
            };
          }
          return c;
        }));
      });
      return updated;
    });

    console.log(`Added automation point at time ${time} with value ${value}`);
  };

  const updateAutomationCurve = (curveId: string, updates: Partial<AutomationCurve>) => {
    setAutomationCurves(prev => {
      const updated = new Map(prev);
      updated.forEach((curves, trackId) => {
        updated.set(trackId, curves.map(c => {
          if (c.id === curveId) {
            return { ...c, ...updates };
          }
          return c;
        }));
      });
      return updated;
    });

    console.log(`Updated automation curve ${curveId}`);
  };

  const removeAutomationPoint = (curveId: string, pointTime: number) => {
    setAutomationCurves(prev => {
      const updated = new Map(prev);
      updated.forEach((curves, trackId) => {
        updated.set(trackId, curves.map(c => {
          if (c.id === curveId) {
            return {
              ...c,
              points: c.points.filter(p => p.time !== pointTime),
            };
          }
          return c;
        }));
      });
      return updated;
    });

    console.log(`Removed automation point at time ${pointTime}`);
  };

  // ============================================================================
  // Phase 5.1: Session Management Methods
  // ============================================================================

  const createSession = (name: string) => {
    const sessionId = `session-${Date.now()}`;
    const newSession: SessionData = {
      id: sessionId,
      name,
      timestamp: Date.now(),
      lastModified: Date.now(),
      duration: currentTime,
      tracks: tracks,
      project: currentProject,
      metadata: {
        bpm: currentProject?.bpm || 120,
        sampleRate: currentProject?.sampleRate || 48000,
        trackCount: tracks.length,
      },
      tags: [],
      autoSaved: false,
    };
    setCurrentSession(newSession);
    console.log(`✅ Session created: ${name}`);
  };

  const saveSession = async (name?: string): Promise<boolean> => {
    try {
      const session = currentSession || {
        id: `session-${Date.now()}`,
        name: name || 'Untitled Session',
        timestamp: Date.now(),
        lastModified: Date.now(),
        duration: currentTime,
        tracks: tracks,
        project: currentProject,
        metadata: {},
        tags: [],
        autoSaved: false,
      };

      const manager = sessionManagerRef.current;
      const result = manager.saveSession(session);
      
      if (result) {
        setSessionLastSaved(new Date());
        addToHistory(tracks); // Also record in undo history
        console.log(`✅ Session saved: ${session.name}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to save session:', error);
      return false;
    }
  };

  const loadSession = async (sessionId: string): Promise<boolean> => {
    try {
      const manager = sessionManagerRef.current;
      const session = manager.loadSession(sessionId);
      
      if (session) {
        setCurrentSession(session);
        setCurrentProject(session.project);
        setTracks(session.tracks);
        addToHistory(session.tracks);
        console.log(`✅ Session loaded: ${session.name}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      return false;
    }
  };

  const deleteSession = async (sessionId: string): Promise<boolean> => {
    try {
      const manager = sessionManagerRef.current;
      manager.deleteSession(sessionId);
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
      console.log(`✅ Session deleted: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete session:', error);
      return false;
    }
  };

  const autoSaveSession = async () => {
    if (!sessionAutoSaveEnabled || !currentSession) return;
    
    try {
      const manager = sessionManagerRef.current;
      const updated: SessionData = {
        ...currentSession,
        lastModified: Date.now(),
        duration: currentTime,
        tracks: tracks,
        autoSaved: true,
      };
      manager.saveSession(updated);
      setCurrentSession(updated);
      console.log(`✅ Session auto-saved: ${currentSession.name}`);
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  };

  const exportSession = async (sessionId: string, format: 'json' | 'zip'): Promise<Blob> => {
    try {
      const manager = sessionManagerRef.current;
      const session = manager.loadSession(sessionId);
      if (!session) throw new Error('Session not found');

      const jsonData = JSON.stringify(session, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      console.log(`✅ Session exported: ${sessionId}`);
      return blob;
    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  };

  const createSessionBackup = async (): Promise<string> => {
    try {
      const manager = sessionManagerRef.current;
      const backup = manager.createBackup(currentSession || {
        id: `session-${Date.now()}`,
        name: 'Backup',
        timestamp: Date.now(),
        lastModified: Date.now(),
        duration: currentTime,
        tracks: tracks,
        project: currentProject,
        metadata: {},
        tags: [],
        autoSaved: false,
      });
      console.log(`✅ Backup created: ${backup}`);
      return backup;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  };

  const restoreSessionBackup = async (backupId: string): Promise<boolean> => {
    try {
      const manager = sessionManagerRef.current;
      const session = manager.restoreBackup(backupId);
      if (session) {
        setCurrentSession(session);
        setTracks(session.tracks);
        addToHistory(session.tracks);
        console.log(`✅ Backup restored: ${backupId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Restore failed:', error);
      return false;
    }
  };

  const getSessionMetadata = (): Record<string, unknown> => {
    if (!currentSession) return {};
    return {
      ...currentSession.metadata,
      lastModified: currentSession.lastModified,
      trackCount: tracks.length,
      currentTime: currentTime,
    };
  };

  const setSessionAutoSaveEnabledLocal = (enabled: boolean) => {
    setSessionAutoSaveEnabled(enabled);
    console.log(`🔄 Auto-save ${enabled ? 'enabled' : 'disabled'}`);
  };

  // ============================================================================
  // Phase 5.1: Enhanced Undo/Redo Methods
  // ============================================================================

  const recordAction = (action: UndoAction) => {
    setUndoStack(prev => [...prev.slice(-99), action]); // Keep last 100 actions
    setRedoStack([]); // Clear redo stack when new action is recorded
    
    const undoRedoManager = undoRedoManagerRef.current;
    undoRedoManager.addAction(action);
    
    console.log(`📝 Action recorded: ${action.name}`);
  };

  const undoAction = () => {
    if (!canUndo) return;
    
    setUndoStack(prev => {
      const newUndoStack = [...prev];
      const action = newUndoStack.pop();
      if (action) {
        setRedoStack(prev => [...prev, action]);
        action.undo();
        console.log(`↶ Undo: ${action.name}`);
      }
      return newUndoStack;
    });
  };

  const redoAction = () => {
    if (!canRedo) return;
    
    setRedoStack(prev => {
      const newRedoStack = [...prev];
      const action = newRedoStack.pop();
      if (action) {
        setUndoStack(prev => [...prev, action]);
        action.redo();
        console.log(`↷ Redo: ${action.name}`);
      }
      return newRedoStack;
    });
  };

  const clearUndoHistory = () => {
    setUndoStack([]);
    setRedoStack([]);
    console.log('🗑️ Undo/Redo history cleared');
  };

  const getUndoActionName = (): string => {
    return undoStack.length > 0 ? undoStack[undoStack.length - 1].name : 'Undo';
  };

  const getRedoActionName = (): string => {
    return redoStack.length > 0 ? redoStack[redoStack.length - 1].name : 'Redo';
  };

  // ============================================================================
  // Phase 5.1: Advanced Metering Methods
  // ============================================================================

  const setMeteringModeLocal = (mode: MeteringMode) => {
    setMeteringMode(mode);
    const meter = meteringEngineRef.current;
    meter.setMode(mode);
    console.log(`📊 Metering mode set to: ${mode}`);
  };

  const startMetering = () => {
    setMeteringActive(true);
    const meter = meteringEngineRef.current;
    meter.start();
    
    // Update metering state every 100ms
    const meterInterval = setInterval(() => {
      const data = meter.getMeteringData();
      setLufs(data.lufs);
      setTruePeak(data.truePeak);
      setPhaseCorrelation(data.phaseCorrelation);
      setHeadroom(data.headroom);
      setSpectrumFrequencies(data.spectrumFrequencies);
    }, 100);

    // Store interval ID for cleanup
    (startMetering as any).__intervalId = meterInterval;
    console.log('📊 Metering started');
  };

  const stopMetering = () => {
    setMeteringActive(false);
    const meter = meteringEngineRef.current;
    meter.stop();
    
    // Clear interval if it exists
    if ((stopMetering as any).__intervalId) {
      clearInterval((stopMetering as any).__intervalId);
    }
    console.log('📊 Metering stopped');
  };

  const resetMetering = () => {
    const meter = meteringEngineRef.current;
    meter.reset();
    setLufs(-60);
    setTruePeak(-60);
    setPhaseCorrelation(1.0);
    setHeadroom(23);
    console.log('📊 Metering reset');
  };

  const getMeteringData = (): MeteringData => {
    return meteringEngineRef.current.getMeteringData();
  };

  const analyzeLoudness = async (duration: number = currentTime): Promise<LoudnessAnalysis> => {
    try {
      const meter = meteringEngineRef.current;
      const analysis = meter.analyzeLoudness(duration);
      
      console.log(`📊 Loudness analysis: ${analysis.integratedLufs.toFixed(1)} LUFS`);
      return analysis;
    } catch (error) {
      console.error('❌ Loudness analysis failed:', error);
      throw error;
    }
  };

  // Setup auto-save interval
  useEffect(() => {
    if (sessionAutoSaveEnabled && currentSession) {
      const autoSaveInterval = setInterval(() => {
        autoSaveSession();
      }, 60000); // Auto-save every 60 seconds
      
      return () => clearInterval(autoSaveInterval);
    }
  }, [sessionAutoSaveEnabled, currentSession]);

  return (
    <DAWContext.Provider
      value={{
        currentProject,
        tracks,
        selectedTrack,
        isPlaying,
        isRecording,
        currentTime,
        zoom: zoom_val,
        logicCoreMode,
        voiceControlActive,
        cpuUsage,
        isUploadingFile,
        uploadError,
        setCurrentProject,
        addTrack,
        selectTrack,
        updateTrack,
        deleteTrack,
        restoreTrack,
        permanentlyDeleteTrack,
        togglePlay,
        toggleRecord,
        stop,
        setLogicCoreMode,
        toggleVoiceControl,
        saveProject,
        loadProject,
        uploadAudioFile,
        getWaveformData,
        getAudioDuration,
        seek,
        setTrackInputGain,
        addPluginToTrack,
        removePluginFromTrack,
        togglePluginEnabled,
        undo,
        redo,
        canUndo: undoHistory.length > 0,
        canRedo: redoHistory.length > 0,
        deletedTracks,
        // Phase 3
        markers,
        loopRegion,
        metronomeSettings,
        addMarker,
        deleteMarker,
        updateMarker,
        setLoopRegion: setLoopRegionFn,
        toggleLoop,
        clearLoopRegion,
        toggleMetronome,
        setMetronomeVolume,
        setMetronomeBeatSound,
        // Edit operations
        undo,
        redo,
        cut,
        copy,
        paste,
        // View operations
        zoomIn,
        zoomOut,
        resetZoom,
        // Track operations
        duplicateTrack,
        muteTrack,
        soloTrack,
        muteAllTracks,
        unmuteAllTracks,
        // Modal states
        showNewProjectModal,
        showOpenProjectModal,
        showSaveAsModal,
        showExportModal,
        showPreferencesModal,
        showAudioSettingsModal,
        showMidiSettingsModal,
        showShortcutsModal,
        showAboutModal,
        showMixerOptionsModal,
        isFullscreen,
        showMixer,
        // Modal control functions
        openNewProjectModal,
        closeNewProjectModal,
        openOpenProjectModal,
        closeOpenProjectModal,
        openSaveAsModal,
        closeSaveAsModal,
        openExportModal,
        closeExportModal,
        openPreferencesModal,
        closePreferencesModal,
        openAudioSettingsModal,
        closeAudioSettingsModal,
        openMidiSettingsModal,
        closeMidiSettingsModal,
        openShortcutsModal,
        closeShortcutsModal,
        openAboutModal,
        closeAboutModal,
        openMixerOptionsModal,
        closeMixerOptionsModal,
        // View control functions
        toggleFullscreen,
        toggleMixerVisibility,
        // File operations
        createNewProject,
        exportAudio,
        // Clip operations
        clips,
        selectedClip,
        createClip,
        deleteClip,
        splitClip,
        quantizeClip,
        selectClip,
        updateClip,
        // Event operations
        events,
        selectedEvent,
        createEvent,
        editEvent,
        deleteEvent,
        selectEvent,
        // Phase 3: Real-Time Audio I/O
        selectedInputDevice,
        selectedOutputDevice,
        inputLevel,
        latencyMs,
        bufferUnderruns,
        bufferOverruns,
        isAudioIOActive,
        audioIOError,
        getInputDevices,
        getOutputDevices,
        selectInputDevice,
        selectOutputDevice,
        startAudioIO,
        stopAudioIO,
        getLatencyMs,
        getIOMetrics,
        refreshDeviceList,
        // Test tone methods
        startTestTone,
        stopTestTone,
        isTestTonePlaying,
        // Phase 4: Plugin Management
        loadedPlugins,
        effectChains,
        loadPlugin,
        unloadPlugin,
        getPluginParameters,
        setPluginParameter,
        // Phase 4: MIDI Management
        midiRouting,
        midiDevices,
        createMIDIRoute,
        deleteMIDIRoute,
        getMIDIRoutesForTrack,
        handleMIDINote,
        // Phase 4: Audio Routing
        buses,
        routingEngine: routingEngineRef.current,
        sidechainConfigs,
        createBus,
        deleteBus,
        addTrackToBus,
        removeTrackFromBus,
        createSidechain,
        deleteSidechain,
        applyBusRouting,
        createAudioBus,
        setBusAudioLevel,
        setBusAudioPan,
        // Phase 4: Automation
        automationCurves,
        createAutomationCurve,
        deleteAutomationCurve,
        addAutomationPoint,
        updateAutomationCurve,
        removeAutomationPoint,
        // Phase 4: Analysis
        spectrumData,
        cpuUsageDetailed,
        // Phase 5.1: Session Management
        currentSession,
        sessionHistory,
        sessionAutoSaveEnabled,
        sessionLastSaved,
        createSession,
        saveSession,
        loadSession,
        deleteSession,
        autoSaveSession,
        exportSession,
        createSessionBackup,
        restoreSessionBackup,
        getSessionMetadata,
        setSessionAutoSaveEnabled: setSessionAutoSaveEnabledLocal,
        // Phase 5.1: Enhanced Undo/Redo
        undoStack,
        redoStack,
        canUndo,
        canRedo,
        undoAction,
        redoAction,
        clearUndoHistory,
        getUndoActionName,
        getRedoActionName,
        recordAction,
        // Phase 5.1: Advanced Metering
        meteringMode,
        meteringActive,
        lufs,
        truePeak,
        phaseCorrelation,
        headroom,
        spectrumFrequencies,
        setMeteringMode: setMeteringModeLocal,
        startMetering,
        stopMetering,
        resetMetering,
        getMeteringData,
        analyzeLoudness,
      }}
    >
      {children}
    </DAWContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDAW() {
  const context = useContext(DAWContext);
  if (!context) {
    throw new Error("useDAW must be used within DAWProvider");
  }
  return context;
}
