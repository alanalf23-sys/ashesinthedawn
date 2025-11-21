import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Track, Project, LogicCoreMode, Plugin } from '../types';
import { supabase } from '../lib/supabase';
import { getAudioEngine } from '../lib/audioEngine';

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
}

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
  const zoom = 1;
  const cpuUsage = 12;
  const audioEngineRef = useRef(getAudioEngine());

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
    };
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

    setTracks(prev => [...prev, newTrack]);
  };

  const selectTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    setSelectedTrack(track || null);
  };

  const updateTrack = (trackId: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, ...updates } : t));
  };

  const deleteTrack = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
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
