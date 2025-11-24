/**
 * Session Management & Undo/Redo System
 * Provides comprehensive session save/load and full undo/redo capabilities
 * @module sessionManager
 */

export interface DAWSession {
  id: string;
  name: string;
  description: string;
  sampleRate: number;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  tracks: SessionTrack[];
  busses: SessionBus[];
  masterSettings: MasterSettings;
  automationData: AutomationData[];
  pluginChains: PluginChainData[];
  midiMappings: MidiMappingData[];
  metadata: SessionMetadata;
}

export interface SessionTrack {
  id: string;
  name: string;
  type: 'audio' | 'instrument' | 'midi' | 'aux' | 'vca' | 'master';
  color: string;
  muted: boolean;
  soloed: boolean;
  armed: boolean;
  volume: number;
  pan: number;
  inputGain: number;
  stereoWidth: number;
  phaseFlip: boolean;
  routing: string;
  audioData?: AudioTrackData;
  midiData?: MidiTrackData;
}

export interface AudioTrackData {
  clips: AudioClip[];
  waveformData?: Float32Array[];
}

export interface AudioClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  offset: number;
  gainDb: number;
  fadeIn: { duration: number; curve: string };
  fadeOut: { duration: number; curve: string };
}

export interface MidiTrackData {
  clips: MidiClip[];
}

export interface MidiClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  notes: MidiNote[];
}

export interface MidiNote {
  note: number;
  velocity: number;
  startTime: number;
  duration: number;
}

export interface SessionBus {
  id: string;
  name: string;
  color: string;
  outputBus?: string;
  effects: EffectInstance[];
}

export interface EffectInstance {
  id: string;
  pluginId: string;
  enabled: boolean;
  bypassed: boolean;
  parameters: Record<number, number>;
}

export interface MasterSettings {
  volume: number;
  pan: number;
  effects: EffectInstance[];
  metronome: {
    enabled: boolean;
    volume: number;
    preCountEnabled: boolean;
    preCountBars: number;
  };
}

export interface AutomationData {
  trackId: string;
  targetType: 'volume' | 'pan' | 'parameter';
  targetId?: string;
  parameterId?: number;
  curve: AutomationCurveData[];
}

export interface AutomationCurveData {
  time: number;
  value: number;
  curve: 'linear' | 'exponential';
}

export interface PluginChainData {
  id: string;
  trackId: string;
  plugins: PluginInstanceData[];
}

export interface PluginInstanceData {
  id: string;
  manifestId: string;
  parameters: Record<number, number>;
  presetId?: string;
  state?: ArrayBuffer;
}

export interface MidiMappingData {
  id: string;
  controllerId: string;
  mappings: MidiControlMappingData[];
}

export interface MidiControlMappingData {
  id: string;
  midiCC: number;
  targetTrackId: string;
  targetParameterId: number;
}

export interface SessionMetadata {
  created: number;
  modified: number;
  author: string;
  version: number;
  tags: string[];
  projectPath?: string;
  backupCount: number;
  lastBackup?: number;
}

export interface UndoRedoAction {
  id: string;
  type: ActionType;
  description: string;
  timestamp: number;
  data: ActionData;
  reverse: ActionData;
}

export enum ActionType {
  CREATE_TRACK = 'CREATE_TRACK',
  DELETE_TRACK = 'DELETE_TRACK',
  UPDATE_TRACK = 'UPDATE_TRACK',
  CREATE_CLIP = 'CREATE_CLIP',
  DELETE_CLIP = 'DELETE_CLIP',
  MOVE_CLIP = 'MOVE_CLIP',
  LOAD_PLUGIN = 'LOAD_PLUGIN',
  SET_PARAMETER = 'SET_PARAMETER',
  CREATE_AUTOMATION = 'CREATE_AUTOMATION',
  DELETE_AUTOMATION = 'DELETE_AUTOMATION',
  CREATE_BUS = 'CREATE_BUS',
  DELETE_BUS = 'DELETE_BUS',
  ROUTE_TRACK = 'ROUTE_TRACK',
  CREATE_MIDI_MAPPING = 'CREATE_MIDI_MAPPING',
  DELETE_MIDI_MAPPING = 'DELETE_MIDI_MAPPING'
}

export type ActionData = Record<string, unknown>;

/**
 * Session Manager
 * Handles session save/load and persistence
 */
export class SessionManager {
  private static instance: SessionManager;
  private currentSession: DAWSession | null = null;
  private sessionStoragePath: string = 'daw_sessions';
  private autoSaveInterval: number = 60000; // 1 minute
  private autoSaveHandle: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeSessionStorage();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize session storage
   */
  private initializeSessionStorage(): void {
    try {
      const stored = localStorage.getItem(`${this.sessionStoragePath}_list`);
      if (!stored) {
        localStorage.setItem(`${this.sessionStoragePath}_list`, JSON.stringify([]));
      }
    } catch (error) {
      console.warn('[SessionManager] Session storage not available:', error);
    }
  }

  /**
   * Create new session
   */
  createSession(
    name: string,
    sampleRate: number = 48000,
    bpm: number = 120
  ): DAWSession {
    const session: DAWSession = {
      id: `session_${Date.now()}`,
      name,
      description: '',
      sampleRate,
      bpm,
      timeSignature: { numerator: 4, denominator: 4 },
      tracks: [],
      busses: [],
      masterSettings: {
        volume: 0,
        pan: 0,
        effects: [],
        metronome: {
          enabled: true,
          volume: -12,
          preCountEnabled: true,
          preCountBars: 1
        }
      },
      automationData: [],
      pluginChains: [],
      midiMappings: [],
      metadata: {
        created: Date.now(),
        modified: Date.now(),
        author: 'User',
        version: 1,
        tags: [],
        backupCount: 0
      }
    };

    this.currentSession = session;
    console.log('[SessionManager] Created new session:', session.id);
    return session;
  }

  /**
   * Save session to storage
   */
  async saveSession(session?: DAWSession): Promise<string> {
    const sessionToSave = session || this.currentSession;
    if (!sessionToSave) {
      throw new Error('No session to save');
    }

    try {
      sessionToSave.metadata.modified = Date.now();

      const serialized = this.serializeSession(sessionToSave);
      const key = `${this.sessionStoragePath}_${sessionToSave.id}`;

      localStorage.setItem(key, JSON.stringify(serialized));

      // Update session list
      this.updateSessionList(sessionToSave);

      console.log('[SessionManager] Session saved:', sessionToSave.id);
      return sessionToSave.id;
    } catch (error) {
      console.error('[SessionManager] Failed to save session:', error);
      throw error;
    }
  }

  /**
   * Load session from storage
   */
  async loadSession(sessionId: string): Promise<DAWSession> {
    try {
      const key = `${this.sessionStoragePath}_${sessionId}`;
      const stored = localStorage.getItem(key);

      if (!stored) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const deserialized = this.deserializeSession(JSON.parse(stored));
      this.currentSession = deserialized;

      console.log('[SessionManager] Session loaded:', sessionId);
      return deserialized;
    } catch (error) {
      console.error('[SessionManager] Failed to load session:', error);
      throw error;
    }
  }

  /**
   * Get all saved sessions
   */
  async getAllSessions(): Promise<DAWSession[]> {
    try {
      const listStr = localStorage.getItem(`${this.sessionStoragePath}_list`);
      if (!listStr) return [];

      const list = JSON.parse(listStr) as Array<{ id: string; name: string; modified: number }>;
      return list.map((item: { id: string; name: string; modified: number }) => {
        const key = `${this.sessionStoragePath}_${item.id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          return this.deserializeSession(JSON.parse(stored));
        }
      }).filter(Boolean) as DAWSession[];
    } catch (error) {
      console.error('[SessionManager] Failed to get sessions:', error);
      return [];
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = `${this.sessionStoragePath}_${sessionId}`;
      localStorage.removeItem(key);

      // Update session list
      const listStr = localStorage.getItem(`${this.sessionStoragePath}_list`);
      if (listStr) {
        const list = JSON.parse(listStr) as Array<{ id: string; name: string; modified: number }>;
        const filtered = list.filter((s: { id: string; name: string; modified: number }) => s.id !== sessionId);
        localStorage.setItem(`${this.sessionStoragePath}_list`, JSON.stringify(filtered));
      }

      if (this.currentSession?.id === sessionId) {
        this.currentSession = null;
      }

      console.log('[SessionManager] Session deleted:', sessionId);
    } catch (error) {
      console.error('[SessionManager] Failed to delete session:', error);
      throw error;
    }
  }

  /**
   * Start auto-save
   */
  startAutoSave(intervalMs: number = this.autoSaveInterval): void {
    this.autoSaveInterval = intervalMs;
    this.autoSaveHandle = setInterval(() => {
      if (this.currentSession) {
        this.saveSession().catch(err => {
          console.error('[SessionManager] Auto-save failed:', err);
        });
      }
    }, intervalMs);

    console.log('[SessionManager] Auto-save started (interval:', intervalMs, 'ms)');
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveHandle) {
      clearInterval(this.autoSaveHandle);
      this.autoSaveHandle = null;
    }
    console.log('[SessionManager] Auto-save stopped');
  }

  /**
   * Create backup
   */
  async createBackup(sessionId: string): Promise<string> {
    const session = await this.loadSession(sessionId);
    const backupId = `backup_${sessionId}_${Date.now()}`;
    const key = `${this.sessionStoragePath}_${backupId}`;

    const serialized = this.serializeSession(session);
    localStorage.setItem(key, JSON.stringify(serialized));

    session.metadata.backupCount++;
    session.metadata.lastBackup = Date.now();

    console.log('[SessionManager] Backup created:', backupId);
    return backupId;
  }

  /**
   * Get current session
   */
  getCurrentSession(): DAWSession | null {
    return this.currentSession;
  }

  /**
   * Serialize session for storage (convert problematic types)
   */
  private serializeSession(session: DAWSession): Record<string, unknown> {
    return {
      ...session,
      // Handle any non-serializable types here
    };
  }

  /**
   * Deserialize session from storage
   */
  private deserializeSession(data: Record<string, unknown>): DAWSession {
    return data as unknown as DAWSession;
  }

  /**
   * Update session list
   */
  private updateSessionList(session: DAWSession): void {
    try {
      const listStr = localStorage.getItem(`${this.sessionStoragePath}_list`);
      const list = listStr ? (JSON.parse(listStr) as Array<{ id: string; name: string; modified: number }>) : [];

      const index = list.findIndex((s: { id: string; name: string; modified: number }) => s.id === session.id);
      if (index >= 0) {
        list[index] = { id: session.id, name: session.name, modified: session.metadata.modified };
      } else {
        list.push({ id: session.id, name: session.name, modified: session.metadata.modified });
      }

      localStorage.setItem(`${this.sessionStoragePath}_list`, JSON.stringify(list));
    } catch (error) {
      console.error('[SessionManager] Failed to update session list:', error);
    }
  }
}

/**
 * Undo/Redo Manager
 * Manages action history and provides undo/redo functionality
 */
export class UndoRedoManager {
  private static instance: UndoRedoManager;
  private history: UndoRedoAction[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 100;
  private actionListeners: Set<(action: UndoRedoAction) => void> = new Set();

  private constructor() {}

  static getInstance(): UndoRedoManager {
    if (!UndoRedoManager.instance) {
      UndoRedoManager.instance = new UndoRedoManager();
    }
    return UndoRedoManager.instance;
  }

  /**
   * Execute action and add to history
   */
  executeAction(
    type: ActionType,
    description: string,
    data: ActionData,
    reverse: ActionData
  ): UndoRedoAction {
    // Remove any actions after current index
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    const action: UndoRedoAction = {
      id: `action_${Date.now()}`,
      type,
      description,
      timestamp: Date.now(),
      data,
      reverse
    };

    this.history.push(action);
    this.currentIndex++;

    // Enforce max history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    this.notifyListeners(action);
    console.log('[UndoRedoManager] Action executed:', type, description);

    return action;
  }

  /**
   * Undo last action
   */
  undo(): UndoRedoAction | null {
    if (this.currentIndex <= 0) return null;

    const action = this.history[this.currentIndex];
    this.currentIndex--;

    console.log('[UndoRedoManager] Undo:', action.type, action.description);
    return action;
  }

  /**
   * Redo last undone action
   */
  redo(): UndoRedoAction | null {
    if (this.currentIndex >= this.history.length - 1) return null;

    this.currentIndex++;
    const action = this.history[this.currentIndex];

    console.log('[UndoRedoManager] Redo:', action.type, action.description);
    return action;
  }

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history
   */
  getHistory(): UndoRedoAction[] {
    return [...this.history];
  }

  /**
   * Subscribe to action changes
   */
  onActionExecuted(listener: (action: UndoRedoAction) => void): () => void {
    this.actionListeners.add(listener);
    return () => {
      this.actionListeners.delete(listener);
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(action: UndoRedoAction): void {
    this.actionListeners.forEach(listener => {
      listener(action);
    });
  }
}

/**
 * Export getters
 */
export const getSessionManager = (): SessionManager => {
  return SessionManager.getInstance();
};

export const getUndoRedoManager = (): UndoRedoManager => {
  return UndoRedoManager.getInstance();
};
