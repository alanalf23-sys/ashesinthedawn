export type TrackType = 'audio' | 'instrument' | 'midi' | 'aux' | 'vca' | 'master';

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  muted: boolean;
  soloed: boolean;
  armed: boolean;
  volume: number;
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
