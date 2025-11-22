export type TrackType =
  | "audio"
  | "instrument"
  | "midi"
  | "aux"
  | "vca"
  | "master";

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
  automationMode?: "off" | "read" | "write" | "touch" | "latch";
  inserts: Plugin[];
  sends: Send[];
  routing: string;
  input?: string;
}

export interface Plugin {
  id: string;
  name: string;
  type:
    | "eq"
    | "compressor"
    | "gate"
    | "saturation"
    | "delay"
    | "reverb"
    | "utility"
    | "meter"
    | "third-party";
  enabled: boolean;
  parameters: Record<string, number>;
}

export interface Send {
  id: string;
  destination: string;
  level: number;
  prePost: "pre" | "post";
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

export type LogicCoreMode = "ON" | "SILENT" | "OFF";

export interface Marker {
  id: string;
  name: string;
  time: number;
  color: string;
  locked: boolean;
}

export interface LoopRegion {
  enabled: boolean;
  startTime: number;
  endTime: number;
}

export interface MetronomeSettings {
  enabled: boolean;
  volume: number; // 0-1
  beatSound: "click" | "cowbell" | "woodblock";
  accentFirst: boolean; // Emphasize first beat of measure
}

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
