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
  Bus,
  MidiDevice,
  MidiRoute,
} from "../types";
import { supabase } from "../lib/supabase";
import { getAudioEngine } from "../lib/audioEngine";

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
  // Additional Modals
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
  // Export
  exportAudio: (format: string, quality: string) => Promise<void>;
  // Bus/Routing functions
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
  // Utility
  cpuUsageDetailed: Record<string, number>;
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
  // Modal State
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAudioSettingsModal, setShowAudioSettingsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [showOpenProjectModal, setShowOpenProjectModal] = useState(false);
  const [showMidiSettingsModal, setShowMidiSettingsModal] = useState(false);
  const [showMixerOptionsModal, setShowMixerOptionsModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  // Bus/Routing State
  const [buses, setBuses] = useState<Bus[]>([]);
  // Plugin State
  const [loadedPlugins, setLoadedPlugins] = useState<Map<string, Plugin[]>>(new Map());
  // MIDI State
  const [midiDevices, setMidiDevices] = useState<MidiDevice[]>([]);
  const [midiRoutes, setMidiRoutes] = useState<MidiRoute[]>([]);
  // CPU usage detailed
  const [cpuUsageDetailedState] = useState<Record<string, number>>({
    audio: 2,
    ui: 3,
    effects: 4,
    metering: 1,
    other: 2,
  });
  const zoom = 1;
  const cpuUsage = 12;
  const audioEngineRef = useRef(getAudioEngine());

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

  // Sync track volume, pan, and effects during playback for real-time updates
  useEffect(() => {
    if (isPlaying) {
      tracks.forEach((track) => {
        // Use smooth sync methods for real-time parameter updates
        audioEngineRef.current.syncTrackVolume(track.id, track.volume);
        audioEngineRef.current.syncTrackPan(track.id, track.pan);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      const engineRef = audioEngineRef.current;
      engineRef.dispose();
    };
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
    } else {
      // Pausing playback
      audioEngineRef.current.stopAllAudio();
      setIsPlaying(false);
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
  // Phase 3: Loop functions with audio engine sync
  const setLoopRegionFn = (startTime: number, endTime: number) => {
    setLoopRegion({
      enabled: loopRegion.enabled,
      startTime,
      endTime,
    });
    // Sync with audio engine
    audioEngineRef.current.setLoopRegion(
      startTime,
      endTime,
      loopRegion.enabled
    );
  };

  const toggleLoop = () => {
    const newLoopState = !loopRegion.enabled;
    setLoopRegion((prev) => ({ ...prev, enabled: newLoopState }));
    // Sync loop state with audio engine
    audioEngineRef.current.setLoopRegion(
      loopRegion.startTime,
      loopRegion.endTime,
      newLoopState
    );
    console.log(`Loop ${newLoopState ? "enabled" : "disabled"}`);
  };

  const clearLoopRegion = () => {
    setLoopRegion({
      enabled: false,
      startTime: 0,
      endTime: 0,
    });
    audioEngineRef.current.setLoopRegion(0, 0, false);
  };

  // Phase 3: Metronome functions with audio engine sync
  const toggleMetronome = () => {
    const newState = !metronomeSettings.enabled;
    setMetronomeSettings((prev) => ({ ...prev, enabled: newState }));
    audioEngineRef.current.setMetronomeEnabled(newState);
  };

  const setMetronomeVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setMetronomeSettings((prev) => ({
      ...prev,
      volume: clampedVolume,
    }));
    audioEngineRef.current.setMetronomeVolume(clampedVolume);
  };

  const setMetronomeBeatSound = (sound: MetronomeSettings["beatSound"]) => {
    setMetronomeSettings((prev) => ({ ...prev, beatSound: sound }));
    // Additional implementation for beat sound variation can be added here
    console.log(`Metronome beat sound set to: ${sound}`);
  };

  // Modal handlers
  const openNewProjectModal = () => setShowNewProjectModal(true);
  const closeNewProjectModal = () => setShowNewProjectModal(false);
  const openExportModal = () => setShowExportModal(true);
  const closeExportModal = () => setShowExportModal(false);
  const openAudioSettingsModal = () => setShowAudioSettingsModal(true);
  const closeAudioSettingsModal = () => setShowAudioSettingsModal(false);
  const openAboutModal = () => setShowAboutModal(true);
  const closeAboutModal = () => setShowAboutModal(false);
  const openSaveAsModal = () => setShowSaveAsModal(true);
  const closeSaveAsModal = () => setShowSaveAsModal(false);
  const openOpenProjectModal = () => setShowOpenProjectModal(true);
  const closeOpenProjectModal = () => setShowOpenProjectModal(false);
  const openMidiSettingsModal = () => setShowMidiSettingsModal(true);
  const closeMidiSettingsModal = () => setShowMidiSettingsModal(false);
  const openMixerOptionsModal = () => setShowMixerOptionsModal(true);
  const closeMixerOptionsModal = () => setShowMixerOptionsModal(false);
  const openPreferencesModal = () => setShowPreferencesModal(true);
  const closePreferencesModal = () => setShowPreferencesModal(false);
  const openShortcutsModal = () => setShowShortcutsModal(true);
  const closeShortcutsModal = () => setShowShortcutsModal(false);

  // Export audio stub
  const exportAudio = async (format: string, quality: string) => {
    console.log(`Exporting audio as ${format} with ${quality} quality`);
    // Simulate export process
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`Export complete: ${currentProject?.name}.${format}`);
        const message = `Audio exported as ${format.toUpperCase()}`;
        alert(message);
        resolve();
      }, 1500);
    });
  };

  // Bus/Routing functions
  const createBus = (name: string) => {
    const newBus: Bus = {
      id: `bus-${Date.now()}`,
      name,
      color: '#4F46E5',
      volume: 0,
      pan: 0,
      muted: false,
      trackIds: [],
      inserts: [],
    };
    setBuses([...buses, newBus]);
  };

  const deleteBus = (busId: string) => {
    setBuses(buses.filter(b => b.id !== busId));
    // Remove tracks from bus
    setTracks(tracks.map(t => ({
      ...t,
      routing: t.routing === busId ? 'master' : t.routing,
    })));
  };

  const addTrackToBus = (trackId: string, busId: string) => {
    const bus = buses.find(b => b.id === busId);
    if (bus && !bus.trackIds.includes(trackId)) {
      setBuses(buses.map(b =>
        b.id === busId
          ? { ...b, trackIds: [...b.trackIds, trackId] }
          : b
      ));
      setTracks(tracks.map(t =>
        t.id === trackId
          ? { ...t, routing: busId }
          : t
      ));
    }
  };

  const removeTrackFromBus = (trackId: string, busId: string) => {
    setBuses(buses.map(b =>
      b.id === busId
        ? { ...b, trackIds: b.trackIds.filter(id => id !== trackId) }
        : b
    ));
    setTracks(tracks.map(t =>
      t.id === trackId
        ? { ...t, routing: 'master' }
        : t
    ));
  };

  const createSidechain = (sourceTrackId: string, targetTrackId: string) => {
    console.log(`Created sidechain from ${sourceTrackId} to ${targetTrackId}`);
    // This would typically update a compressor on the target track to receive sidechain input
  };

  // Plugin functions
  const loadPlugin = (trackId: string, pluginName: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      const newPlugin: Plugin = {
        id: `plugin-${Date.now()}`,
        name: pluginName,
        type: 'third-party',
        enabled: true,
        parameters: {},
      };
      const updated = tracks.map(t =>
        t.id === trackId
          ? { ...t, inserts: [...t.inserts, newPlugin] }
          : t
      );
      setTracks(updated);
    }
  };

  const unloadPlugin = (trackId: string, pluginId: string) => {
    setTracks(tracks.map(t =>
      t.id === trackId
        ? { ...t, inserts: t.inserts.filter(p => p.id !== pluginId) }
        : t
    ));
  };

  // MIDI functions
  const createMIDIRoute = (sourceDeviceId: string, targetTrackId: string) => {
    const newRoute: MidiRoute = {
      id: `route-${Date.now()}`,
      sourceDeviceId,
      targetTrackId,
      channel: 0,
    };
    setMidiRoutes([...midiRoutes, newRoute]);
  };

  const deleteMIDIRoute = (routeId: string) => {
    setMidiRoutes(midiRoutes.filter(r => r.id !== routeId));
  };

  const getMIDIRoutesForTrack = (trackId: string) => {
    return midiRoutes.filter(r => r.targetTrackId === trackId);
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
        zoom,
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
        // Modal state
        showNewProjectModal,
        openNewProjectModal,
        closeNewProjectModal,
        showExportModal,
        openExportModal,
        closeExportModal,
        showAudioSettingsModal,
        openAudioSettingsModal,
        closeAudioSettingsModal,
        showAboutModal,
        openAboutModal,
        closeAboutModal,
        // Additional modals
        showSaveAsModal,
        openSaveAsModal,
        closeSaveAsModal,
        showOpenProjectModal,
        openOpenProjectModal,
        closeOpenProjectModal,
        showMidiSettingsModal,
        openMidiSettingsModal,
        closeMidiSettingsModal,
        showMixerOptionsModal,
        openMixerOptionsModal,
        closeMixerOptionsModal,
        showPreferencesModal,
        openPreferencesModal,
        closePreferencesModal,
        showShortcutsModal,
        openShortcutsModal,
        closeShortcutsModal,
        // Export
        exportAudio,
        // Bus/Routing
        buses,
        createBus,
        deleteBus,
        addTrackToBus,
        removeTrackFromBus,
        createSidechain,
        // Plugin management
        loadPlugin,
        unloadPlugin,
        loadedPlugins,
        // MIDI
        midiDevices,
        createMIDIRoute,
        deleteMIDIRoute,
        getMIDIRoutesForTrack,
        // CPU Usage
        cpuUsageDetailed: cpuUsageDetailedState,
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
