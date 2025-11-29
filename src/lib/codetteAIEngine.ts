/**
 * Codette AI Engine Integration
 * Connects real Codette AI with CoreLogic Studio DAW
 * Implements all 10 documented AI abilities
 */

import { Track } from '../types';

export interface CodetteSuggestion {
  type: 'optimization' | 'effect' | 'routing' | 'creative' | 'warning' | 'learning';
  title: string;
  description: string;
  confidence: number;
  action?: () => Promise<void>;
  relatedAbility?: string;
}

export interface AnalysisResult {
  trackId: string;
  analysisType: string;
  score: number;
  findings: string[];
  recommendations: string[];
  reasoning: string;
  metrics: Record<string, number>;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  steps: LearningStep[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
}

export interface LearningStep {
  title: string;
  description: string;
  relatedFunctions?: string[];
  tips?: string[];
}

export interface CodetteChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  ability?: string;
}

/**
 * Core Codette AI Engine
 * Implements all 10 abilities documented in training data
 */
class CodetteAIEngine {
  private apiUrl: string;
  private chatHistory: CodetteChatMessage[] = [];
  private analysisCache: Map<string, AnalysisResult> = new Map();
  private confidenceScores: Map<string, number> = new Map();

  // Knowledge base for AI abilities
  private dawFunctions: Record<string, any> = {
    'togglePlay': {
      name: 'togglePlay',
      description: 'Start or stop audio playback',
      parameters: [],
      hotkey: 'Space',
      tips: ['Use Space bar for quick toggle', 'Check transport state before playing'],
      related: ['seek', 'stopAudio', 'recordAudio'],
    },
    'seek': {
      name: 'seek',
      description: 'Jump to specific time position in audio',
      parameters: ['timeSeconds'],
      hotkey: 'Click timeline',
      tips: ['Double-click waveform for precise seeking', 'Use arrow keys for fine control'],
      related: ['togglePlay', 'addAutomationPoint'],
    },
    'setTrackVolume': {
      name: 'setTrackVolume',
      description: 'Adjust track fader level in dB',
      parameters: ['trackId', 'volumeDb'],
      hotkey: 'Double-click volume fader',
      tips: ['-6dB = half volume', 'Use trim knob for mic level', 'Watch peak meter'],
      related: ['setTrackPan', 'setTrackInputGain'],
    },
    'addEffect': {
      name: 'addEffect',
      description: 'Insert audio effect into track',
      parameters: ['trackId', 'effectType'],
      hotkey: 'Right-click plugin slot',
      tips: ['EQ first in chain usually', 'Compression after EQ', 'Use linear phase for mastering'],
      related: ['removeEffect', 'setTrackVolume'],
    },
  };

  private uiComponents: Record<string, any> = {
    'Mixer': {
      purpose: 'Volume and pan control for all tracks',
      location: 'Bottom panel',
      size: { width: 'full', height: '200px' },
      functions: ['setTrackVolume', 'setTrackPan', 'toggleMute', 'toggleSolo'],
      tips: ['Hold Shift for fine control', 'Alt-click to reset', 'Right-click for routing'],
    },
    'Timeline': {
      purpose: 'Waveform display and playhead',
      location: 'Center panel',
      size: { width: 'full', height: '120px' },
      functions: ['seek', 'togglePlay', 'addAutomationPoint', 'setLoopPoints'],
      tips: ['Click to seek', 'Scroll to zoom', 'Ctrl+A to select all'],
    },
    'Inspector': {
      purpose: 'Detailed parameter editing',
      location: 'Right panel',
      size: { width: '300px', height: 'full' },
      functions: ['setParameter', 'createAutomation', 'bindMIDI'],
      tips: ['Double-click to edit', 'Use mouse wheel for fine adjustment', 'Type values directly'],
    },
  };

  constructor(apiUrl: string = 'http://localhost:8000') {
    this.apiUrl = apiUrl;
    console.log('🤖 Codette AI Engine initialized');
  }

  /**
   * ABILITY 1: Explain DAW Functions
   * Provides detailed explanations of DAW functionality
   */
  async explainDawFunction(functionName: string): Promise<string> {
    const func = this.dawFunctions[functionName];
    if (!func) {
      return `Function "${functionName}" not found in DAW.`;
    }

    let explanation = `**${func.name}**\n\n`;
    explanation += `${func.description}\n\n`;
    explanation += `**Parameters:** ${func.parameters.join(', ') || 'None'}\n`;
    explanation += `**Hotkey:** ${func.hotkey}\n\n`;
    explanation += `**Tips:**\n`;
    func.tips.forEach((tip: string) => {
      explanation += `• ${tip}\n`;
    });
    explanation += `\n**Related Functions:** ${func.related.join(', ')}\n`;

    return explanation;
  }

  /**
   * ABILITY 2: Teach Mixing Techniques
   * Suggests mixing chains and parameter settings
   */
  async teachMixingTechniques(trackType: string = 'vocals'): Promise<CodetteSuggestion[]> {
    const mixingChains: Record<string, CodetteSuggestion[]> = {
      'vocals': [
        {
          type: 'effect',
          title: 'Vocal Chain Setup',
          description: 'Professional vocal mixing chain: De-esser → EQ → Compression → Reverb',
          confidence: 0.92,
          relatedAbility: 'teach_mixing_techniques',
        },
        {
          type: 'optimization',
          title: 'Compression Settings',
          description: 'Try 4:1 ratio, 10ms attack, 100ms release, 2dB gain reduction',
          confidence: 0.88,
          relatedAbility: 'suggest_parameter_values',
        },
      ],
      'drums': [
        {
          type: 'effect',
          title: 'Drum Parallel Compression',
          description: 'Send drums to parallel compressor for punch: Hard compress at 6:1 ratio',
          confidence: 0.89,
          relatedAbility: 'teach_mixing_techniques',
        },
      ],
      'bass': [
        {
          type: 'effect',
          title: 'Bass Processing',
          description: 'High-pass filter 40Hz, EQ boost 80Hz, light compression 2:1',
          confidence: 0.85,
          relatedAbility: 'teach_mixing_techniques',
        },
      ],
    };

    return mixingChains[trackType] || mixingChains['vocals'];
  }

  /**
   * ABILITY 3: Analyze Session Health
   * Assesses mix quality and provides scoring
   */
  async analyzeSessionHealth(tracks: Track[]): Promise<AnalysisResult> {
    const trackCount = tracks.length;
    let healthScore = 100;
    const findings: string[] = [];
    const recommendations: string[] = [];
    const metrics: Record<string, number> = {};

    // Check track count
    if (trackCount < 2) {
      findings.push('Very few tracks - consider adding more elements');
      healthScore -= 10;
    } else if (trackCount > 50) {
      findings.push('High track count - consider grouping tracks');
      healthScore -= 5;
    }
    metrics['track_count'] = trackCount;

    // Check for muted tracks
    const mutedCount = tracks.filter((t) => t.muted).length;
    if (mutedCount > trackCount / 3) {
      findings.push('Many muted tracks - consider archiving unused tracks');
      healthScore -= 5;
    }
    metrics['muted_tracks'] = mutedCount;

    // Check volume levels (simulated)
    const avgVolume = tracks.reduce((sum, t) => sum + (t.volume || 0), 0) / trackCount;
    if (avgVolume > 0) {
      findings.push('Average volume is too high - leave headroom for mastering');
      healthScore -= 10;
      recommendations.push('Reduce master fader to -6dB or lower');
    }
    metrics['avg_volume'] = avgVolume;

    // Check for effects
    const tracksWithEffects = tracks.filter((t) => (t.inserts || []).length > 0).length;
    if (tracksWithEffects === 0) {
      findings.push('No effects applied - consider adding EQ and compression');
      healthScore -= 5;
      recommendations.push('Add EQ to at least 50% of tracks');
    }
    metrics['tracks_with_effects'] = tracksWithEffects;

    recommendations.push('Keep peak levels around -6dB for safety');
    recommendations.push('Use spectrum analyzer to check frequency balance');
    recommendations.push('A/B test mix on reference monitors and headphones');

    const result: AnalysisResult = {
      trackId: 'master',
      analysisType: 'session_health',
      score: Math.max(0, healthScore),
      findings,
      recommendations,
      reasoning: `Session health score based on ${trackCount} tracks, ${tracksWithEffects} with effects, avg volume ${avgVolume.toFixed(1)}dB`,
      metrics,
    };

    // Cache result
    this.analysisCache.set('master', result);
    this.confidenceScores.set('session_health', 0.82);

    return result;
  }

  /**
   * ABILITY 4: Teach Production Workflow
   * Guides through production stages
   */
  async teachProductionWorkflow(currentStage: string = 'arrangement'): Promise<LearningPath> {
    const workflow: Record<string, LearningPath> = {
      'arrangement': {
        id: 'wf-arrangement',
        title: 'Arrangement Workflow',
        description: 'Structure your song into verses, choruses, and bridges',
        skillLevel: 'intermediate',
        estimatedTime: 120,
        steps: [
          {
            title: 'Create basic form',
            description: 'Sketch verse, chorus, bridge sections',
            relatedFunctions: ['addTrack', 'seek', 'togglePlay'],
            tips: ['Start simple with 8-bar sections', 'Use loop feature', 'Listen for balance'],
          },
          {
            title: 'Add variations',
            description: 'Create interest with fills and breakdowns',
            relatedFunctions: ['addEffect', 'setTrackVolume'],
            tips: ['Copy-paste track to create variations', 'Automate volume for dynamics'],
          },
          {
            title: 'Balance transitions',
            description: 'Smooth flow between sections',
            relatedFunctions: ['addAutomationPoint', 'addEffect'],
            tips: ['Use filter sweep for transition', 'Overlap sections slightly'],
          },
        ],
      },
      'mixing': {
        id: 'wf-mixing',
        title: 'Mixing Workflow',
        description: 'Balance, process, and arrange tracks for clarity',
        skillLevel: 'advanced',
        estimatedTime: 240,
        steps: [
          {
            title: 'Gain staging',
            description: 'Set input levels properly',
            relatedFunctions: ['setTrackInputGain', 'setTrackVolume'],
            tips: ['Peak around -6dB on master', 'Leave 6dB headroom', 'Use gain staging for clean signal'],
          },
          {
            title: 'EQ and Compression',
            description: 'Shape tone and control dynamics',
            relatedFunctions: ['addEffect', 'setParameter'],
            tips: ['EQ before compression', 'Use gentle settings', 'A/B test changes'],
          },
          {
            title: 'Automation and Effects',
            description: 'Add movement and space',
            relatedFunctions: ['addAutomationPoint', 'addEffect'],
            tips: ['Automate volume for emphasis', 'Use reverb for space', 'Moderate effect levels'],
          },
        ],
      },
    };

    return workflow[currentStage] || workflow['arrangement'];
  }

  /**
   * ABILITY 5: Suggest Parameter Values
   * Recommends effect settings based on context
   */
  async suggestParameterValues(effectType: string, trackType: string = 'vocals'): Promise<CodetteSuggestion[]> {
    const suggestions: Record<string, Record<string, CodetteSuggestion>> = {
      'EQ': {
        'vocals': {
          type: 'optimization',
          title: 'Vocal EQ Starting Point',
          description: 'High-pass 80Hz (remove rumble), +2dB at 2kHz (presence), -1dB at 7kHz (sibilance)',
          confidence: 0.88,
        },
        'drums': {
          type: 'optimization',
          title: 'Drum EQ',
          description: 'Kick: +3dB at 60Hz, Snare: -2dB at 250Hz, Tom: +2dB at 4kHz',
          confidence: 0.85,
        },
      },
      'Compression': {
        'vocals': {
          type: 'optimization',
          title: 'Vocal Compression',
          description: 'Ratio 4:1, Attack 10ms, Release 100ms, Threshold -18dB',
          confidence: 0.89,
        },
        'bass': {
          type: 'optimization',
          title: 'Bass Compression',
          description: 'Ratio 3:1, Attack 20ms, Release 200ms for consistency',
          confidence: 0.86,
        },
      },
      'Reverb': {
        'vocals': {
          type: 'creative',
          title: 'Vocal Reverb',
          description: 'Room type, 2.5s decay, 100ms pre-delay, 20% mix',
          confidence: 0.81,
        },
        'drums': {
          type: 'creative',
          title: 'Drum Reverb',
          description: 'Small hall, 1.5s decay, 50% mix on parallel send',
          confidence: 0.78,
        },
      },
    };

    const typeMap = suggestions[effectType] || suggestions['EQ'];
    const suggestion = typeMap[trackType] || typeMap['vocals'];
    return [suggestion];
  }

  /**
   * ABILITY 6: Explain UI Components
   * Describes interface elements and their functions
   */
  async explainUIComponent(componentName: string): Promise<string> {
    const comp = this.uiComponents[componentName];
    if (!comp) {
      return `UI component "${componentName}" not found.`;
    }

    let explanation = `**${componentName}**\n\n`;
    explanation += `${comp.purpose}\n\n`;
    explanation += `**Location:** ${comp.location}\n`;
    explanation += `**Functions:**\n`;
    comp.functions.forEach((fn: string) => {
      explanation += `• ${fn}\n`;
    });
    explanation += `\n**Tips:**\n`;
    comp.tips.forEach((tip: string) => {
      explanation += `• ${tip}\n`;
    });

    return explanation;
  }

  /**
   * ABILITY 7: Provide Learning Paths
   * Suggests structured learning sequences
   */
  async provideLearningPaths(skillLevel: string = 'beginner'): Promise<LearningPath[]> {
    const paths: Record<string, LearningPath[]> = {
      'beginner': [
        {
          id: 'path-basics',
          title: 'DAW Basics',
          description: 'Getting comfortable with core features',
          skillLevel: 'beginner',
          estimatedTime: 90,
          steps: [
            { title: 'Navigation and UI', description: 'Learn the interface layout' },
            { title: 'Creating and editing tracks', description: 'Work with audio regions' },
            { title: 'Basic playback control', description: 'Play, stop, and navigate' },
          ],
        },
        {
          id: 'path-recording',
          title: 'Recording Audio',
          description: 'Capture your first recordings',
          skillLevel: 'beginner',
          estimatedTime: 60,
          steps: [
            { title: 'Input setup', description: 'Configure audio interface' },
            { title: 'Record a take', description: 'Hit record and play' },
            { title: 'Comping takes', description: 'Choose best takes' },
          ],
        },
      ],
      'intermediate': [
        {
          id: 'path-mixing',
          title: 'Intermediate Mixing',
          description: 'EQ, compression, and effects',
          skillLevel: 'intermediate',
          estimatedTime: 180,
          steps: [
            { title: 'EQ fundamentals', description: 'Shape tone with filters' },
            { title: 'Dynamic processing', description: 'Use compression and gates' },
            { title: 'Effects chains', description: 'Build creative processing' },
          ],
        },
      ],
    };

    return paths[skillLevel] || paths['beginner'];
  }

  /**
   * ABILITY 8: Explain Audio Theory
   * Teaches fundamental audio concepts
   */
  async explainAudioTheory(concept: string): Promise<string> {
    const theory: Record<string, string> = {
      'frequency': `
**Frequency**
Frequency is the number of oscillations per second, measured in Hertz (Hz).
- Bass (20-250Hz): Low-end power and depth
- Midrange (250Hz-4kHz): Clarity and presence
- Treble (4kHz+): Brightness and air

Use EQ to balance frequencies in your mix.
      `,
      'dynamic_range': `
**Dynamic Range**
The difference between the quietest and loudest parts of audio.
- Large dynamic range = big difference between soft and loud
- Compression reduces dynamic range for consistency
- A typical vocal might have 40dB dynamic range

Use compression to tame dynamics for better control.
      `,
      'phase': `
**Phase**
Two identical waves can cancel (phase inversion) or reinforce (phase alignment).
- Phase alignment: Waves stack stronger (constructive interference)
- Phase inversion: Waves cancel (destructive interference)
- Important when layering similar sounds

Use phase invert button to check for cancellation.
      `,
      'headroom': `
**Headroom**
Space between your mix peak and digital maximum (0dB).
- Aim for -6dB to -3dB headroom on master
- Prevents clipping and allows mastering room
- Use gain staging to maintain headroom

Keep peaks around -6dB during mixing.
      `,
    };

    return theory[concept] || theory['frequency'];
  }

  /**
   * ABILITY 9: Detect Issues
   * Identifies problems and suggests fixes
   */
  async detectIssues(tracks: Track[]): Promise<CodetteSuggestion[]> {
    const issues: CodetteSuggestion[] = [];

    // Check for potential phase issues
    if (tracks.length > 1) {
      issues.push({
        type: 'warning',
        title: 'Possible Phase Issues',
        description: 'Multiple tracks at similar frequencies - check for phase cancellation',
        confidence: 0.72,
        relatedAbility: 'detect_issues',
      });
    }

    // Check for clipping
    const highVolumeTracks = tracks.filter((t) => (t.volume || 0) > -3);
    if (highVolumeTracks.length > 0) {
      issues.push({
        type: 'warning',
        title: 'Clipping Risk',
        description: `${highVolumeTracks.length} tracks above -3dB - risk of distortion`,
        confidence: 0.85,
        relatedAbility: 'detect_issues',
      });
    }

    // Check for unused tracks
    const mutedTracks = tracks.filter((t) => t.muted && !t.soloed).length;
    if (mutedTracks > tracks.length * 0.3) {
      issues.push({
        type: 'optimization',
        title: 'Many Muted Tracks',
        description: 'Consider archiving unused tracks to simplify mixing',
        confidence: 0.68,
        relatedAbility: 'detect_issues',
      });
    }

    return issues;
  }

  /**
   * ABILITY 10: Suggest Enhancements
   * Recommends creative improvements
   */
  async suggestEnhancements(trackType: string = 'vocals'): Promise<CodetteSuggestion[]> {
    const enhancements: Record<string, CodetteSuggestion[]> = {
      'vocals': [
        {
          type: 'creative',
          title: 'Double Vocal Effect',
          description: 'Duplicate vocal track, add slight delay and chorus for width',
          confidence: 0.79,
          relatedAbility: 'suggest_enhancements',
        },
        {
          type: 'creative',
          title: 'Vocal Harmonies',
          description: 'Create stacked vocal layers at different octaves',
          confidence: 0.76,
          relatedAbility: 'suggest_enhancements',
        },
      ],
      'drums': [
        {
          type: 'creative',
          title: 'Drum Saturation',
          description: 'Add subtle distortion for punch and character',
          confidence: 0.74,
          relatedAbility: 'suggest_enhancements',
        },
        {
          type: 'creative',
          title: 'Drum Parallel Compression',
          description: 'Heavy compression on duplicate track for contrast',
          confidence: 0.81,
          relatedAbility: 'suggest_enhancements',
        },
      ],
      'bass': [
        {
          type: 'creative',
          title: 'Bass Harmonics',
          description: 'Add subtle harmonic enhancement for character',
          confidence: 0.70,
          relatedAbility: 'suggest_enhancements',
        },
      ],
    };

    return enhancements[trackType] || enhancements['vocals'];
  }

  /**
   * Send chat message to Codette backend
   */
  async sendMessage(message: string): Promise<string> {
    try {
      // First, add user message to history
      this.chatHistory.push({
        role: 'user',
        content: message,
        timestamp: Date.now(),
      });

      const response = await fetch(`${this.apiUrl}/codette/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          perspective: 'neuralnets',
          context: this.chatHistory.slice(-5),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.response || data.message || 'No response received';

      // Add assistant response to history
      this.chatHistory.push({
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      });

      return responseText;
    } catch (error) {
      console.error('Error communicating with Codette:', error);
      return 'Unable to reach Codette AI server. Please check if the backend is running on port 8000.';
    }
  }

  /**
   * Clear chat history
   */
  clearHistory(): void {
    this.chatHistory = [];
    this.analysisCache.clear();
  }

  /**
   * Get chat history
   */
  getHistory(): CodetteChatMessage[] {
    return this.chatHistory;
  }
}

// Singleton instance
let engineInstance: CodetteAIEngine | null = null;

export function getCodetteAIEngine(): CodetteAIEngine {
  if (!engineInstance) {
    engineInstance = new CodetteAIEngine();
  }
  return engineInstance;
}

export default CodetteAIEngine;
