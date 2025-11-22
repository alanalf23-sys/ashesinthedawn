export type TrackType = 'audio' | 'instrument' | 'midi' | 'aux' | 'vca' | 'master';

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  muted: boolean;
  soloed: boolean;
  armed: boolean;
  inputGain: number; // Pre-fader input level (separate from volume)
  volume: number; // Fader level (post-pan)
  pan: number;
  stereoWidth: number;
  phaseFlip: boolean;
  parentTrackId?: string;
  childTrackIds?: string[];
  automationMode?: 'off' | 'read' | 'write' | 'touch' | 'latch';
  inserts: Plugin[];
  sends: Send[];
  routing: string;
  input?: string;
}

export interface Plugin {
  id: string;
  name: string;
  type: 'eq' | 'compressor' | 'gate' | 'saturation' | 'delay' | 'reverb' | 'utility' | 'meter' | 'third-party';
  enabled: boolean;
  parameters: Record<string, number>;
}

export interface Send {
  id: string;
  destination: string;
  level: number;
  prePost: 'pre' | 'post';
  enabled: boolean;
}

export interface Project {
  id: string;
  name: string;
  sampleRate: number;
  bitDepth: number;
  bpm: number;
  timeSignature: string;
  tracks: Track[];
  buses: Track[];
  createdAt: string;
  updatedAt: string;
}

export type LogicCoreMode = 'ON' | 'SILENT' | 'OFF';

export interface AIPattern {
  type: string;
  data: Record<string, unknown>;
  usageCount: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tracks: Track[];
}

export interface Clip {
  id: string;
  trackId: string;
  name: string;
  startTime: number;
  duration: number;
  offset: number;
  audioFileId?: string;
  color: string;
  locked: boolean;
  muted: boolean;
}

export interface AudioEvent {
  id: string;
  trackId: string;
  type: 'note' | 'automation' | 'marker';
  time: number;
  value?: number;
  note?: {
    pitch: number;
    velocity: number;
    duration: number;
  };
  automation?: {
    parameter: string;
    value: number;
  };
}

// Phase 3: Real-Time Audio I/O Types
export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId: string;
  state: 'connected' | 'disconnected';
}

export interface AudioIOState {
  selectedInputDevice: AudioDevice | null;
  selectedOutputDevice: AudioDevice | null;
  inputLevel: number; // 0-1
  latencyMs: number;
  bufferUnderruns: number;
  bufferOverruns: number;
  isAudioIOActive: boolean;
  audioIOError: string | null;
}
