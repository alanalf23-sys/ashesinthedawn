/**
 * Voice Control Engine - Web Speech API Integration
 * Handles voice command recognition and execution for transport controls and track navigation
 */

type VoiceActionType = 'play' | 'pause' | 'stop' | 'record' | 'nextTrack' | 'prevTrack' | 'seek' | 'undo' | 'redo' | 'solo' | 'mute' | 'unmute' | 'volume';

interface VoiceCommand {
  pattern: RegExp;
  action: VoiceActionType;
  parameters?: Record<string, unknown>;
}

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

type VoiceCommandCallback = (action: string, params?: Record<string, unknown>) => void;

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionAPI {
  continuous: boolean;
  interimResults: boolean;
  language: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

class VoiceControlEngine {
  private recognition: SpeechRecognitionAPI | null = null;
  private isListening = false;
  private isEnabled = false;
  private commandCallbacks: Map<string, VoiceCommandCallback> = new Map();
  private commands: VoiceCommand[] = [];
  private interimTranscript = '';
  private finalTranscript = '';

  constructor() {
    this.initializeSpeechRecognition();
    this.setupCommands();
  }

  private initializeSpeechRecognition() {
    const windowObj = typeof window !== 'undefined' ? window : null;
    if (!windowObj) return;

    const SpeechRecognitionConstructor = 
      ((windowObj as unknown) as Record<string, unknown>).SpeechRecognition ||
      ((windowObj as unknown) as Record<string, unknown>).webkitSpeechRecognition;
    
    if (!SpeechRecognitionConstructor) {
      console.warn('Speech Recognition API not supported in this browser');
      return;
    }

    this.recognition = new (SpeechRecognitionConstructor as new () => SpeechRecognitionAPI)();
    
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.language = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.interimTranscript = '';
      this.emit('listening', true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.emit('listening', false);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Voice recognition error:', event.error);
      this.emit('error', event.error);
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          this.finalTranscript += transcript + ' ';
          this.processCommand({
            transcript: transcript.toLowerCase().trim(),
            confidence,
            isFinal: true
          });
        } else {
          this.interimTranscript += transcript;
        }
      }

      // Emit interim results for UI display
      this.emit('interim', this.interimTranscript);
    };
  }

  private setupCommands() {
    this.commands = [
      // Transport Commands
      { pattern: /^(play|start|resume)$/i, action: 'play' },
      { pattern: /^(pause|hold)$/i, action: 'pause' },
      { pattern: /^(stop|halt)$/i, action: 'stop' },
      { pattern: /^(record|rec)$/i, action: 'record' },

      // Navigation Commands
      { pattern: /^(next|next track)$/i, action: 'nextTrack' },
      { pattern: /^(previous|prev|previous track|back)$/i, action: 'prevTrack' },

      // Editing Commands
      { pattern: /^(undo)$/i, action: 'undo' },
      { pattern: /^(redo)$/i, action: 'redo' },

      // Track Control Commands
      { pattern: /^(solo|solo track)$/i, action: 'solo' },
      { pattern: /^(mute|mute track)$/i, action: 'mute' },
      { pattern: /^(unmute|unmute track)$/i, action: 'unmute' },

      // Volume Commands with regex capture
      { 
        pattern: /^(set volume to|volume) (\d+)%?$/i, 
        action: 'volume',
        parameters: { paramType: 'percent' }
      },
      {
        pattern: /^(louder|increase volume)$/i,
        action: 'volume',
        parameters: { delta: 5 }
      },
      {
        pattern: /^(quieter|decrease volume|lower volume)$/i,
        action: 'volume',
        parameters: { delta: -5 }
      },

      // Seek Commands (future enhancement)
      {
        pattern: /^(go to|seek to) (\d+):(\d+)$/i,
        action: 'seek',
        parameters: { paramType: 'timecode' }
      }
    ];
  }

  private processCommand(result: VoiceRecognitionResult) {
    const { transcript, confidence } = result;

    // Require minimum confidence threshold
    if (confidence < 0.5) {
      console.warn('Low confidence voice command:', transcript, confidence);
      return;
    }

    for (const command of this.commands) {
      const match = transcript.match(command.pattern);
      if (match) {
        let parameters = command.parameters || {};

        // Parse parameters from regex capture groups
        if (match.length > 1) {
          if (command.action === 'volume' && match[2]) {
            parameters = { percent: parseInt(match[2]) };
          } else if (command.action === 'seek' && match[2] && match[3]) {
            parameters = { minutes: parseInt(match[2]), seconds: parseInt(match[3]) };
          }
        }

        this.executeCommand(command.action, parameters);
        this.emit('command', { action: command.action, transcript, confidence });
        return;
      }
    }

    // No command matched
    this.emit('unrecognized', { transcript, confidence });
  }

  private executeCommand(action: string, parameters?: Record<string, unknown>) {
    const callback = this.commandCallbacks.get(action);
    if (callback) {
      callback(action, parameters);
    }
  }

  private emit(eventType: string, data?: unknown) {
    const event = new CustomEvent(`voice:${eventType}`, { detail: data });
    window.dispatchEvent(event);
  }

  // Public API

  /**
   * Enable voice control and start listening
   */
  public enable() {
    if (!this.recognition) {
      console.warn('Speech Recognition not available');
      return;
    }

    if (!this.isEnabled) {
      this.isEnabled = true;
      this.start();
    }
  }

  /**
   * Disable voice control
   */
  public disable() {
    this.isEnabled = false;
    this.stop();
  }

  /**
   * Start listening for voice commands
   */
  public start() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch {
        console.warn('Voice recognition already started');
      }
    }
  }

  /**
   * Stop listening for voice commands
   */
  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        console.warn('Error stopping voice recognition');
      }
    }
  }

  /**
   * Register a callback for a specific command
   */
  public onCommand(action: string, callback: VoiceCommandCallback) {
    this.commandCallbacks.set(action, callback);
  }

  /**
   * Remove command callback
   */
  public offCommand(action: string) {
    this.commandCallbacks.delete(action);
  }

  /**
   * Get current listening state
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Get current enabled state
   */
  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get interim transcript (real-time typing)
   */
  public getInterimTranscript(): string {
    return this.interimTranscript;
  }

  /**
   * Get final transcript
   */
  public getFinalTranscript(): string {
    return this.finalTranscript;
  }

  /**
   * Clear transcripts
   */
  public clearTranscripts() {
    this.interimTranscript = '';
    this.finalTranscript = '';
  }

  /**
   * Add custom command pattern
   */
  public addCommand(pattern: RegExp, action: VoiceActionType, parameters?: Record<string, unknown>) {
    this.commands.push({ pattern, action, parameters });
  }

  /**
   * Check if Speech Recognition is supported
   */
  public isSupported(): boolean {
    return !!this.recognition;
  }
}

// Singleton instance
let voiceControlInstance: VoiceControlEngine | null = null;

export function getVoiceControlEngine(): VoiceControlEngine {
  if (!voiceControlInstance) {
    voiceControlInstance = new VoiceControlEngine();
  }
  return voiceControlInstance;
}

export { VoiceControlEngine };
export type { VoiceCommand, VoiceRecognitionResult, VoiceCommandCallback, VoiceActionType };
