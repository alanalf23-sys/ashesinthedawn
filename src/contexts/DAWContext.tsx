import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Track, Project, LogicCoreMode } from '../types';
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
}

const DAWContext = createContext<DAWContextType | undefined>(undefined);

export function DAWProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [logicCoreMode, setLogicCoreMode] = useState<LogicCoreMode>('ON');
  const [voiceControlActive, setVoiceControlActive] = useState(false);
  const [cpuUsage, setCpuUsage] = useState(12);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const audioEngineRef = useRef(getAudioEngine());

  useEffect(() => {
    if (currentProject) {
      setTracks(currentProject.tracks || []);
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

  // Sync track volume changes with audio engine
  useEffect(() => {
    tracks.forEach(track => {
      audioEngineRef.current.setTrackVolume(track.id, track.volume);
    });
  }, [tracks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioEngineRef.current.dispose();
    };
  }, []);

  const addTrack = (type: Track['type']) => {
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${tracks.length + 1}`,
      type,
      color: '#3b82f6',
      muted: false,
      soloed: false,
      armed: false,
      volume: 0,
      pan: 0,
      inserts: [],
      sends: [],
      routing: 'Master',
    };
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

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
    if (isRecording) setIsRecording(false);
    
    if (!isPlaying) {
      // Starting playback
      audioEngineRef.current.initialize().catch(err => console.error('Audio init failed:', err));
    } else {
      // Stopping playback
      audioEngineRef.current.stopAllAudio();
    }
  };

  const toggleRecord = () => {
    setIsRecording(prev => !prev);
    if (!isPlaying) setIsPlaying(true);
    
    if (!isRecording) {
      // Starting recording
      audioEngineRef.current.startRecording().catch(err => console.error('Recording failed:', err));
    } else {
      // Stopping recording
      audioEngineRef.current.stopRecording();
    }
  };

  const stop = () => {
    setIsPlaying(false);
    setIsRecording(false);
    setCurrentTime(0);
    audioEngineRef.current.stopAllAudio();
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

      const newTrack: Track = {
        id: `track-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: 'audio',
        color: '#3b82f6',
        muted: false,
        soloed: false,
        armed: false,
        volume: 0,
        pan: 0,
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
    } catch (error) {
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
      }}
    >
      {children}
    </DAWContext.Provider>
  );
}

export function useDAW() {
  const context = useContext(DAWContext);
  if (!context) {
    throw new Error('useDAW must be used within DAWProvider');
  }
  return context;
}
