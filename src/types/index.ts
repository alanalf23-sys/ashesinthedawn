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
  duration?: number; // Track duration in seconds
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

// Router and ProjectMeta mapping for manage_daw_project schema
export interface RoutingDestination {
  destinationId: string;
  level_db?: number;
  pre_fader?: boolean;
}

export interface Router {
  routing_matrix: Record<string, string[]>;
  buses?: Record<string, { name?: string }>;

}

export interface ProjectMeta {
  name?: string;
  bpm?: number;
  [key: string]: any;
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
  // optional router/meta fields coming from manage_daw_project schema
  router?: Router;
  meta?: ProjectMeta;
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
export type AudioContextState = 'suspended' | 'running' | 'closed' | 'interrupted';

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

// Phase 4: Professional Features Types

export interface PluginInstance {
  id: string;
  name: string;
  version: string;
  type: 'vst2' | 'vst3' | 'au' | 'internal';
  enabled: boolean;
  parameters: PluginParameter[];
  currentValues: Record<string, number>;
  automationCurve?: AutomationCurve;
}

export interface PluginParameter {
  id: string;
  pluginId: string;
  name: string;
  type: 'float' | 'int' | 'boolean' | 'list';
  min: number;
  max: number;
  default: number;
  current: number;
  automatable: boolean;
}

export interface EffectChain {
  id: string;
  trackId: string;
  plugins: PluginInstance[];
  bypass: boolean;
  outputGain: number;
}

export interface MIDIDevice {
  deviceId: string;
  name: string;
  kind: 'input' | 'output';
  manufacturer: string;
  state: 'connected' | 'disconnected';
  channel: number;
}

export interface MIDIRoute {
  id: string;
  trackId: string;
  midiDevice: MIDIDevice;
  midiChannel: number;
  transpose: number;
  velocity: number;
}

export interface MIDINote {
  pitch: number;
  velocity: number;
  startTime: number;
  duration: number;
  trackId: string;
}

export interface BusNode {
  id: string;
  name: string;
  color: string;
  tracks: string[];
  outputBusId?: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
}

export interface RoutingMatrix {
  fromTrackId: string;
  toDestinations: RoutingDestination[];
}

export interface SidechainConfig {
  id: string;
  compressorTrackId: string;
  sourceTrackId: string;
  frequency: number;
  filterType: 'lowpass' | 'highpass' | 'bandpass' | 'none';
  enabled: boolean;
}

export interface AutomationCurve {
  id: string;
  trackId: string;
  parameter: string;
  points: AutomationPoint[];
  mode: 'off' | 'read' | 'write' | 'touch' | 'latch';
  recording: boolean;
}

export interface AutomationPoint {
  time: number;
  value: number;
  curveType: 'linear' | 'exponential' | 'logarithmic';
}

export interface FrequencyBucket {
  frequency: number;
  magnitude: number;
  normalized: number;
}

export interface SpectrumData {
  timestamp: number;
  buckets: FrequencyBucket[];
  peakFrequency: number;
  peakMagnitude: number;
  average: number;
}

// Phase 5.1: Session Management Types
export interface SessionData {
  id: string;
  name: string;
  timestamp: number;
  lastModified: number;
  duration: number;
  tracks: Track[];
  project: Project | null;
  metadata: Record<string, unknown>;
  tags: string[];
  autoSaved: boolean;
}

export interface SessionBackup {
  id: string;
  sessionId: string;
  timestamp: number;
  data: SessionData;
  size: number;
}

// Phase 5.1: Enhanced Undo/Redo System Types
export interface UndoAction {
  id: string;
  type: 'add-track' | 'delete-track' | 'update-track' | 'create-clip' | 'delete-clip' | 'update-clip' | 'volume-change' | 'pan-change' | 'automation' | 'plugin-add' | 'plugin-remove' | 'plugin-parameter' | 'routing-change' | 'mute' | 'solo' | 'delete-event' | 'custom';
  timestamp: number;
  name: string;
  description: string;
  data: Record<string, unknown>;
  undo: () => void;
  redo: () => void;
}

// Phase 5.1: Advanced Metering Types
export interface MeteringData {
  lufs: number;
  truePeak: number;
  phaseCorrelation: number;
  headroom: number;
  shortTermLufs: number;
  momentaryLufs: number;
  spectrumFrequencies: number[];
  peakLevel: number;
  averageLevel: number;
  dynamicRange: number;
  crestFactor: number;
}

export interface LoudnessAnalysis {
  duration: number;
  integratedLufs: number;
  shortTermLufs: number;
  momentaryLufs: number;
  truePeak: number;
  phaseCorrelation: number;
  headroom: number;
  clippingOccurred: boolean;
  recommendations: string[];
}

// Python DSP Integration Types
export interface PythonDSPEffect {
  id: string;
  type: string;
  name: string;
  category: "eq" | "dynamics" | "saturation" | "delay" | "reverb" | "modulation";
  enabled: boolean;
  parameters: Record<string, number>;
  pythonClass?: string; // Python class name (e.g., "EQ3Band", "Compressor")
}

export interface PythonDSPProcessRequest {
  effectType: string;
  parameters: Record<string, number>;
  audioData: Float32Array | number[];
  sampleRate: number;
  requestId?: string;
}

export interface PythonDSPProcessResponse {
  success: boolean;
  processedAudio?: Float32Array | number[];
  effectType: string;
  processingTime?: number;
  error?: string;
  requestId?: string;
}

export interface PythonDSPBridgeState {
  connected: boolean;
  serverUrl: string;
  latency: number;
  effectsProcessed: number;
  lastError: string | null;
}

// Bus/Routing Types
export interface Bus {
  id: string;
  name: string;
  color: string;
  volume: number;
  pan: number;
  muted: boolean;
  trackIds: string[];
  inserts: Plugin[];
}

// MIDI Types
export interface MidiDevice {
  id: string;
  name: string;
  type: 'input' | 'output';
  enabled: boolean;
}

export interface MidiRoute {
  id: string;
  sourceDeviceId: string;
  targetTrackId: string;
  channel: number;
}

// Realtime Messaging Types
export interface Message {
  id: string;
  user_id: string;
  room_id: string;
  text: string;
  created_at: string;
}

export interface RoomMessage extends Message {
  userName?: string;
  isOwn?: boolean;
}
