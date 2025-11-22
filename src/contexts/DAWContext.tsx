import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Track, Project, LogicCoreMode, Plugin, Clip, AudioEvent, AudioDevice, AudioIOState } from '../types';
import { supabase } from '../lib/supabase';
import { getAudioEngine } from '../lib/audioEngine';
import { getAudioDeviceManager } from '../lib/audioDeviceManager';
import { RealtimeBufferManager } from '../lib/realtimeBufferManager';
import { AudioIOMetrics } from '../lib/audioIOMetrics';

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
  setCurrentProject: (project: Project | null) => void;
  addTrack: (type: Track['type']) => void;
  selectTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  deleteTrack: (trackId: string) => void;
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
  createNewProject: (name: string, settings: any) => void;
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
};

const DAWContext = createContext<DAWContextType | undefined>(undefined);

export function DAWProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [logicCoreMode, setLogicCoreMode] = useState<LogicCoreMode>('ON');
  const [voiceControlActive, setVoiceControlActive] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const zoom_val = zoom;
  const cpuUsage = 12;
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

  useEffect(() => {
    if (currentProject) {
      // Ensure master track exists
      const hasMasterTrack = currentProject.tracks?.some(t => t.type === 'master');
      let tracksToSet = currentProject.tracks || [];
      
      if (!hasMasterTrack) {
        const masterTrack: Track = {
          id: 'master-main',
          name: 'Master',
          type: 'master',
          color: '#6366f1',
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
          routing: 'Master',
          automationMode: 'off',
        };
        tracksToSet = [...tracksToSet, masterTrack];
      }
      
      setTracks(tracksToSet);
    }
  }, [currentProject]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prev => prev + 0.1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  // Sync track volume and pan changes with audio engine during playback
  useEffect(() => {
    if (isPlaying) {
      tracks.forEach(track => {
        audioEngineRef.current.setTrackVolume(track.id, track.volume);
        audioEngineRef.current.setTrackPan(track.id, track.pan);
        audioEngineRef.current.setStereoWidth(track.id, track.stereoWidth || 100);
        audioEngineRef.current.setPhaseFlip(track.id, track.phaseFlip || false);
        // Ensure input gain (pre-fader) is synced as well
        if (typeof track.inputGain === 'number') {
          audioEngineRef.current.setTrackInputGain(track.id, track.inputGain);
        }
      });
    }
  }, [tracks, isPlaying]);

  // Cleanup on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      const engineRef = audioEngineRef.current;
      engineRef.dispose();
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
  const getTrackNumberForType = (type: Track['type']): number => {
    const tracksOfType = tracks.filter(t => t.type === type);
    return tracksOfType.length + 1;
  };

  // Branching function: Get random color from palette
  const getRandomTrackColor = (): string => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];
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
  const createNewProject = (name: string, settings: any) => {
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
    const trackNum = getTrackNumberForType('audio');
    return {
      id: `track-${Date.now()}`,
      name: `Audio ${trackNum}`,
      type: 'audio',
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
      routing: 'Master',
      automationMode: 'off',
    } as Track;
  };

  // Branching function: Create instrument track
  const createInstrumentTrack = (): Track => {
    const trackNum = getTrackNumberForType('instrument');
    return {
      id: `track-${Date.now()}`,
      name: `Instrument ${trackNum}`,
      type: 'instrument',
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
      routing: 'Master',
      automationMode: 'off',
    } as Track;
  };

  // Branching function: Create MIDI track
  const createMidiTrack = (): Track => {
    const trackNum = getTrackNumberForType('midi');
    return {
      id: `track-${Date.now()}`,
      name: `MIDI ${trackNum}`,
      type: 'midi',
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
      routing: 'Master',
      automationMode: 'off',
    } as Track;
  };

  // Branching function: Create aux track
  const createAuxTrack = (): Track => {
    const trackNum = getTrackNumberForType('aux');
    return {
      id: `track-${Date.now()}`,
      name: `Aux ${trackNum}`,
      type: 'aux',
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
      routing: 'Master',
      automationMode: 'off',
    } as Track;
  };

  // Branching function: Create VCA track
  const createVcaTrack = (): Track => {
    const trackNum = getTrackNumberForType('vca');
    return {
      id: `track-${Date.now()}`,
      name: `VCA ${trackNum}`,
      type: 'vca',
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
      routing: 'Master',
      automationMode: 'off',
    } as Track;
  };

  // Main branching router: Add track based on type
  const addTrack = (type: Track['type']) => {
    let newTrack: Track;

    switch (type) {
      case 'audio':
        newTrack = createAudioTrack();
        break;
      case 'instrument':
        newTrack = createInstrumentTrack();
        break;
      case 'midi':
        newTrack = createMidiTrack();
        break;
      case 'aux':
        newTrack = createAuxTrack();
        break;
      case 'vca':
        newTrack = createVcaTrack();
        break;
      case 'master':
        // Master track is managed separately, should not be added here
        console.warn('Master track should not be added via addTrack()');
        return;
      default:
        // Fallback to audio track
        newTrack = createAudioTrack();
    }

    const newTracks = [...tracks, newTrack];
    setTracks(newTracks);
    addToHistory(newTracks);
  };

  const selectTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    setSelectedTrack(track || null);
  };

  const updateTrack = (trackId: string, updates: Partial<Track>) => {
    const newTracks = tracks.map(t => t.id === trackId ? { ...t, ...updates } : t);
    setTracks(newTracks);
  };

  const deleteTrack = (trackId: string) => {
    const newTracks = tracks.filter(t => t.id !== trackId);
    setTracks(newTracks);
    addToHistory(newTracks);
    if (selectedTrack?.id === trackId) {
      setSelectedTrack(null);
    }
  };

  // Set input gain (pre-fader) for a track both in state and audio engine
  const setTrackInputGain = (trackId: string, gainDb: number) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, inputGain: gainDb } : t));
    try {
      audioEngineRef.current.setTrackInputGain(trackId, gainDb);
    } catch (error: unknown) {
      // audio engine might not be initialized yet — that's fine
      console.debug('setTrackInputGain error:', error);
    }
  };

  // Add a plugin to a track's insert chain
  const addPluginToTrack = (trackId: string, plugin: Plugin) => {
    setTracks(prev =>
      prev.map(t =>
        t.id === trackId
          ? { ...t, inserts: [...t.inserts, plugin] }
          : t
      )
    );
    // Update selected track if it was modified
    if (selectedTrack?.id === trackId) {
      setSelectedTrack(prev => prev ? { ...prev, inserts: [...prev.inserts, plugin] } : null);
    }
  };

  // Remove a plugin from a track's insert chain
  const removePluginFromTrack = (trackId: string, pluginId: string) => {
    setTracks(prev =>
      prev.map(t =>
        t.id === trackId
          ? { ...t, inserts: t.inserts.filter(p => p.id !== pluginId) }
          : t
      )
    );
    // Update selected track if it was modified
    if (selectedTrack?.id === trackId) {
      setSelectedTrack(prev =>
        prev ? { ...prev, inserts: prev.inserts.filter(p => p.id !== pluginId) } : null
      );
    }
  };

  // Toggle plugin enabled/disabled
  const togglePluginEnabled = (trackId: string, pluginId: string, enabled: boolean) => {
    setTracks(prev =>
      prev.map(t =>
        t.id === trackId
          ? {
              ...t,
              inserts: t.inserts.map(p =>
                p.id === pluginId ? { ...p, enabled } : p
              ),
            }
          : t
      )
    );
    // Update selected track if it was modified
    if (selectedTrack?.id === trackId) {
      setSelectedTrack(prev =>
        prev
          ? {
              ...prev,
              inserts: prev.inserts.map(p =>
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
      audioEngineRef.current.initialize().then(() => {
        // Play all non-muted audio and instrument tracks from current time
        tracks.forEach(track => {
          if (!track.muted && (track.type === 'audio' || track.type === 'instrument')) {
            // playAudio expects linear volume (0-1), convert from dB
            audioEngineRef.current.playAudio(track.id, currentTime, track.volume, track.pan);
          }
        });
        setIsPlaying(true);
      }).catch(err => console.error('Audio init failed:', err));
    } else {
      // Pausing playback
      audioEngineRef.current.stopAllAudio();
      setIsPlaying(false);
    }
  };

  const toggleRecord = () => {
    if (!isRecording) {
      // Starting recording - initialize audio engine first
      audioEngineRef.current.initialize().then(async () => {
        const success = await audioEngineRef.current.startRecording();
        if (success) {
          setIsRecording(true);
          // Start playback if not already playing
          if (!isPlaying) {
            togglePlay();
          }
        } else {
          console.error('Failed to start recording - getUserMedia may have been denied');
        }
      }).catch(err => console.error('Audio init failed during record:', err));
    } else {
      // Stopping recording - capture the blob and create a track
      audioEngineRef.current.stopRecording().then(blob => {
        if (blob) {
          // Create a new audio track from the recording
          const recordedFile = new File([blob], `Recording-${Date.now()}.webm`, { type: 'audio/webm' });
          uploadAudioFile(recordedFile);
          console.log('Recording saved and imported as new track');
        }
        setIsRecording(false);
      }).catch(err => console.error('Error stopping recording:', err));
    }
  };

  const stop = () => {
    // Stop recording first if active
    if (isRecording) {
      audioEngineRef.current.stopRecording().then(blob => {
        if (blob) {
          // Auto-save recording as new track
          const recordedFile = new File([blob], `Recording-${Date.now()}.webm`, { type: 'audio/webm' });
          uploadAudioFile(recordedFile);
        }
      }).catch(err => console.error('Error stopping recording:', err));
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
      tracks.forEach(track => {
        if (!track.muted && (track.type === 'audio' || track.type === 'instrument')) {
          audioEngineRef.current.playAudio(track.id, timeSeconds, track.volume, track.pan);
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
    setVoiceControlActive(prev => !prev);
  };

  const uploadAudioFile = async (file: File): Promise<boolean> => {
    setIsUploadingFile(true);
    setUploadError(null);

    try {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/mp4'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|aac|flac|m4a)$/i)) {
        setUploadError('Invalid audio file format');
        setIsUploadingFile(false);
        return false;
      }

      // Validate file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        setUploadError('File size exceeds 100MB limit');
        setIsUploadingFile(false);
        return false;
      }

      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newTrack: Track = {
        id: `track-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: 'audio',
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
        routing: 'Master',
      };

      // Load audio into engine
      const audioLoaded = await audioEngineRef.current.loadAudioFile(newTrack.id, file);
      if (!audioLoaded) {
        setUploadError('Failed to decode audio file');
        setIsUploadingFile(false);
        return false;
      }

      setTracks(prev => [...prev, newTrack]);
      setIsUploadingFile(false);
      return true;
    } catch (error: unknown) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload file');
      setIsUploadingFile(false);
      return false;
    }
  };

  const saveProject = async () => {
    if (!currentProject) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const sessionData = {
      tracks,
      bpm: currentProject.bpm,
      timeSignature: currentProject.timeSignature,
    };

    const { error } = await supabase
      .from('projects')
      .upsert({
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
      console.error('Error saving project:', error);
    }
  };

  const loadProject = async (projectId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error loading project:', error);
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
    throw new Error('useDAW must be used within DAWProvider');
  }
  return context;
}
