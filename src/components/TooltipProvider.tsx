import React, { useState, useRef, useCallback } from 'react';

/**
 * Advanced Tooltip System with Codette Teaching Integration
 * Features:
 * - Hover tooltips with keyboard hotkey display
 * - Codette teaching mode for learning DAW functions
 * - Function documentation with code examples
 * - Real-time performance metrics
 * - Accessibility support (ARIA labels)
 */

interface TooltipContent {
  title: string;
  description: string;
  hotkey?: string;
  category: 'transport' | 'mixer' | 'effects' | 'automation' | 'tools' | 'settings';
  relatedFunctions?: string[];
  performanceTip?: string;
  examples?: string[];
  documentation?: string;
}

interface TooltipProviderProps {
  children: React.ReactNode;
  teachingMode?: boolean;
  onTeachingModeChange?: (enabled: boolean) => void;
}

export interface TooltipProps {
  content: TooltipContent;
  children: React.ReactNode;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
  showCodetteTip?: boolean;
  onCodetteLinkClick?: (content: TooltipContent) => void;
}

/**
 * Tooltip Context for managing teaching mode
 */
const TooltipContext = React.createContext<{
  teachingMode: boolean;
  setTeachingMode: (enabled: boolean) => void;
}>({
  teachingMode: false,
  setTeachingMode: () => {},
});

export function useTooltipContext() {
  return React.useContext(TooltipContext);
}

/**
 * Tooltip Provider Component - wraps entire app
 */
export function TooltipProviderWrapper({
  children,
  teachingMode: initialTeachingMode = false,
}: TooltipProviderProps) {
  const [teachingMode, setTeachingMode] = useState(initialTeachingMode);

  return (
    <TooltipContext.Provider value={{ teachingMode, setTeachingMode }}>
      {children}
    </TooltipContext.Provider>
  );
}

/**
 * Tooltip Component - individual tooltip for buttons/controls
 */
export function Tooltip({
  content,
  children,
  delay = 500,
  position = 'bottom',
  maxWidth = 300,
  showCodetteTip: initialShowCodette = true,
  onCodetteLinkClick,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showCodettePanel, setShowCodettePanel] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { teachingMode } = useTooltipContext();

  // Show tooltip after delay
  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay]);

  // Hide tooltip
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setShowCodettePanel(false);
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Calculate position
  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50 px-3 py-2 rounded-lg text-xs pointer-events-none';
    const positionClasses: Record<string, string> = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };
    return `${baseClasses} ${positionClasses[position]}`;
  };

  // Get arrow position
  const getArrowClasses = () => {
    const arrowClasses: Record<string, string> = {
      top: 'bottom-[-4px] left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent',
      bottom: 'top-[-4px] left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent',
      left: 'left-[-4px] top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent',
      right: 'right-[-4px] top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent',
    };
    return `absolute w-0 h-0 ${arrowClasses[position]} border-gray-800`;
  };

  return (
    <div className="relative inline-block group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}

      {/* Tooltip */}
      {isVisible && (
        <div
          className={getPositionClasses()}
          style={{ maxWidth: `${maxWidth}px` }}
          role="tooltip"
          aria-label={content.title}
        >
          <div className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-3 pointer-events-auto">
            {/* Arrow */}
            <div className={getArrowClasses()} />

            {/* Title */}
            <div className="font-semibold text-gray-100 mb-1">{content.title}</div>

            {/* Category Badge */}
            <div className="inline-block mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono text-purple-300 bg-purple-900/50 border border-purple-700">
                {content.category}
              </span>
            </div>

            {/* Description */}
            <div className="text-gray-300 mb-2 leading-snug">{content.description}</div>

            {/* Hotkey */}
            {content.hotkey && (
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="text-gray-500">Hotkey:</span>
                <kbd className="px-2 py-1 bg-gray-900 border border-gray-600 rounded font-mono text-yellow-400">
                  {content.hotkey}
                </kbd>
              </div>
            )}

            {/* Performance Tip */}
            {content.performanceTip && (
              <div className="mb-2 p-2 bg-blue-900/30 border border-blue-700/50 rounded text-xs text-blue-200">
                <div className="font-semibold mb-1">⚡ Performance Tip:</div>
                {content.performanceTip}
              </div>
            )}

            {/* Codette Teaching Toggle */}
            {initialShowCodette && teachingMode && (
              <button
                onClick={() => {
                  setShowCodettePanel(!showCodettePanel);
                  onCodetteLinkClick?.(content);
                }}
                className="mt-2 w-full px-2 py-1 text-xs rounded bg-purple-600 hover:bg-purple-500 text-white transition flex items-center justify-center gap-1"
              >
                <span>🧠</span>
                {showCodettePanel ? 'Hide' : 'Show'} Codette Teaching
              </button>
            )}

            {/* Codette Teaching Content */}
            {showCodettePanel && teachingMode && (
              <div className="mt-2 pt-2 border-t border-gray-700 space-y-2">
                {/* Related Functions */}
                {content.relatedFunctions && content.relatedFunctions.length > 0 && (
                  <div>
                    <div className="font-semibold text-purple-300 text-xs mb-1">Related Functions:</div>
                    <ul className="text-xs text-gray-400 space-y-0.5 ml-2">
                      {content.relatedFunctions.map((fn, idx) => (
                        <li key={idx}>• {fn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Code Examples */}
                {content.examples && content.examples.length > 0 && (
                  <div>
                    <div className="font-semibold text-purple-300 text-xs mb-1">Code Examples:</div>
                    <div className="bg-gray-900 rounded p-1.5 font-mono text-xs text-green-400 max-h-24 overflow-y-auto">
                      {content.examples.map((example, idx) => (
                        <div key={idx} className="mb-1">
                          <code>{example}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Documentation Link */}
                {content.documentation && (
                  <a
                    href={content.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                  >
                    📚 Full Documentation
                  </a>
                )}
              </div>
            )}

            {/* Related Functions */}
            {content.relatedFunctions && content.relatedFunctions.length > 0 && !teachingMode && (
              <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
                <div className="font-semibold text-gray-300 mb-1">Also see:</div>
                <div className="space-y-0.5">
                  {content.relatedFunctions.map((fn, idx) => (
                    <div key={idx} className="text-gray-500">• {fn}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Tooltip Library - Pre-defined tooltips for DAW functions
 */
export const TOOLTIP_LIBRARY: Record<string, TooltipContent> = {
  // Transport Controls
  'play': {
    title: 'Play',
    description: 'Start playback from current position',
    hotkey: 'Space',
    category: 'transport',
    relatedFunctions: ['Pause', 'Stop', 'Loop'],
    performanceTip: 'Playback uses Web Audio API with synchronized timing for accurate sync at any tempo',
    examples: [
      'togglePlay() - Toggle play/pause',
      'seek(timeSeconds) - Jump to position',
      'isPlaying - Current playback state',
    ],
    documentation: 'https://github.com/Raiff1982/ashesinthedawn/wiki/Transport-Controls',
  },
  'stop': {
    title: 'Stop',
    description: 'Stop playback and return to start position',
    hotkey: 'Space (when playing)',
    category: 'transport',
    relatedFunctions: ['Play', 'Pause'],
    performanceTip: 'Stops all audio nodes and resets playback position to 0',
    examples: [
      'stop() - Stop playback',
      'currentTime = 0 - Return to start',
    ],
  },
  'record': {
    title: 'Record',
    description: 'Start recording audio input to selected track',
    hotkey: 'Ctrl+R',
    category: 'transport',
    relatedFunctions: ['Play', 'Monitor', 'Arm Track'],
    performanceTip: 'Recording writes to browser memory; export to save. Max ~100MB per session',
    examples: [
      'toggleRecord() - Start/stop recording',
      'isRecording - Check recording state',
      'selectedTrack.armed - Track record arm state',
    ],
  },
  'loop': {
    title: 'Loop',
    description: 'Enable/disable looping between In and Out markers',
    hotkey: 'Ctrl+L',
    category: 'transport',
    relatedFunctions: ['Play', 'Markers', 'Set In/Out'],
    performanceTip: 'Loop calculation: samples * (tempo / 60) / sampleRate',
    examples: [
      'toggleLoop() - Toggle loop',
      'loopRegion - {enabled, start, end}',
      'currentTime >= loopRegion.end - Auto-loop trigger',
    ],
  },

  // Mixing
  'volume': {
    title: 'Volume Fader',
    description: 'Adjust track output volume in decibels (dB)',
    hotkey: 'Scroll wheel (drag)',
    category: 'mixer',
    relatedFunctions: ['Pan', 'Input Gain', 'Meter'],
    performanceTip: 'Volume uses logarithmic dB scaling: linear = 10^(dB/20)',
    examples: [
      'updateTrack(trackId, {volume: -6}) - Set to -6dB',
      'dbToLinear(dB) - Convert to linear gain',
      'linearToDb(0.5) - Convert to decibels',
    ],
  },
  'pan': {
    title: 'Pan',
    description: 'Position track in stereo field (-100% left to +100% right)',
    hotkey: 'Alt+Scroll',
    category: 'mixer',
    relatedFunctions: ['Volume', 'Stereo Width', 'Balance'],
    performanceTip: 'Pan law: constant power (-3dB at center)',
    examples: [
      'updateTrack(trackId, {pan: -0.5}) - 50% left',
      'pan range: -1.0 (left) to +1.0 (right)',
    ],
  },
  'mute': {
    title: 'Mute',
    description: 'Toggle track mute (silent output)',
    hotkey: 'M',
    category: 'mixer',
    relatedFunctions: ['Solo', 'Volume'],
    performanceTip: 'Mute saves CPU by disconnecting audio nodes',
    examples: [
      'updateTrack(trackId, {muted: true})',
      'isMuted - Current mute state',
    ],
  },
  'solo': {
    title: 'Solo',
    description: 'Isolate track (mute all others)',
    hotkey: 'S',
    category: 'mixer',
    relatedFunctions: ['Mute', 'Volume'],
    performanceTip: 'Solo affects mix only; does not affect recording',
    examples: [
      'updateTrack(trackId, {soloed: true})',
    ],
  },

  // Effects
  'eq': {
    title: 'EQ (Parametric)',
    description: 'Adjust tone with low/mid/high frequency bands',
    hotkey: 'Double-click plugin',
    category: 'effects',
    relatedFunctions: ['Compressor', 'Saturation', 'Filter'],
    performanceTip: 'EQ uses 2nd-order Butterworth filters (~12dB/octave)',
    examples: [
      'addPluginToTrack(trackId, "eq")',
      'Low: 80Hz, Mid: 500Hz, High: 12kHz (typical)',
    ],
  },
  'compression': {
    title: 'Compressor',
    description: 'Reduce dynamic range with adjustable ratio and threshold',
    hotkey: 'Double-click plugin',
    category: 'effects',
    relatedFunctions: ['EQ', 'Limiter', 'Gate', 'Gain'],
    performanceTip: 'Compression ratio: output dB = (input - threshold) / ratio',
    examples: [
      'Ratio 4:1: Every 4dB over threshold = 1dB output',
      'Typical: Threshold -20dB, Ratio 4:1, Attack 5ms, Release 100ms',
    ],
  },
  'reverb': {
    title: 'Reverb',
    description: 'Add spatial ambience with room simulation',
    hotkey: 'Double-click plugin',
    category: 'effects',
    relatedFunctions: ['Delay', 'Saturation', 'Decay'],
    performanceTip: 'Freeverb algorithm: 8 delay lines, feedback ~0.84',
    examples: [
      'Room presets: Small, Medium, Hall, Plate',
      'Decay time = room size (0.5-10 seconds)',
    ],
  },
  'delay': {
    title: 'Delay',
    description: 'Create echoing repeats synced to tempo',
    hotkey: 'Double-click plugin',
    category: 'effects',
    relatedFunctions: ['Reverb', 'Feedback', 'Tempo Sync'],
    performanceTip: 'Sync to tempo: delay_ms = (60000 / BPM) * note_value',
    examples: [
      'Quarter note at 120 BPM = 500ms',
      'Eighth triplet at 120 BPM = 333ms',
    ],
  },

  // Waveform
  'waveform-zoom': {
    title: 'Waveform Zoom',
    description: 'Magnify timeline view (0.5x to 4.0x)',
    hotkey: 'Scroll wheel on waveform',
    category: 'tools',
    relatedFunctions: ['Timeline', 'Seek', 'Grid'],
    performanceTip: 'Zoom affects peak calculation resolution for accurate display',
    examples: [
      'setZoom(1.5) - 150% magnification',
      'Higher zoom = more detail but slower rendering',
    ],
  },
  'waveform-scale': {
    title: 'Waveform Scale',
    description: 'Adjust vertical amplitude display (0.5x to 3.0x)',
    hotkey: 'Alt+Scroll on waveform',
    category: 'tools',
    relatedFunctions: ['Waveform Zoom', 'Peak Meter'],
    performanceTip: 'Scale does not affect actual audio, only display',
    examples: [
      'setScale(1.5) - Expand peaks 1.5x',
      'Useful for seeing quiet audio details',
    ],
  },
  'seek': {
    title: 'Seek (Click Timeline)',
    description: 'Jump to any position by clicking waveform',
    hotkey: 'Click on waveform',
    category: 'tools',
    relatedFunctions: ['Play', 'Loop', 'Markers'],
    performanceTip: 'Seek latency: <100ms for smooth scrubbing',
    examples: [
      'Click at 50% position to jump to middle',
      'Drag to scrub continuously',
    ],
  },

  // Settings
  'settings': {
    title: 'Settings',
    description: 'Configure audio output and application preferences',
    hotkey: 'Ctrl+,',
    category: 'settings',
    relatedFunctions: ['Audio Device', 'Buffer Size', 'Sample Rate'],
    performanceTip: 'Lower buffer size = lower latency but more CPU',
    examples: [
      'Buffer sizes: 128, 256, 512, 1024, 2048 samples',
      'Typical: 256 samples @ 48kHz = 5.3ms latency',
    ],
  },

  // Additional Transport Controls
  'undo': {
    title: 'Undo',
    description: 'Revert last action',
    hotkey: 'Ctrl+Z',
    category: 'transport',
    relatedFunctions: ['Redo', 'History'],
    performanceTip: 'Undo history stored in memory; limited by available RAM',
    examples: [
      'undo() - Revert last action',
      'canUndo - Check if undo available',
    ],
  },
  'redo': {
    title: 'Redo',
    description: 'Repeat the last undone action',
    hotkey: 'Ctrl+Shift+Z',
    category: 'transport',
    relatedFunctions: ['Undo', 'History'],
    performanceTip: 'Redo history cleared when new edit made after undo',
    examples: [
      'redo() - Repeat last undone action',
      'canRedo - Check if redo available',
    ],
  },
  'metronome': {
    title: 'Metronome',
    description: 'Enable/disable click track for timing reference',
    hotkey: 'M',
    category: 'transport',
    relatedFunctions: ['Tempo', 'Beat Sound', 'Volume'],
    performanceTip: 'Metronome runs independently of playback; no CPU impact when muted',
    examples: [
      'toggleMetronome() - Enable/disable',
      'metronomeSettings.volume - 0-1 level',
      'metronomeSettings.beatSound - click/cowbell/woodblock',
    ],
  },
  'addMarker': {
    title: 'Add Marker',
    description: 'Create cue point for quick navigation',
    hotkey: 'M',
    category: 'transport',
    relatedFunctions: ['Navigate Markers', 'Delete Marker', 'Marker List'],
    performanceTip: 'Markers stored in project; useful for locating sections',
    examples: [
      'addMarker(currentTime, "Verse") - Create marker',
      'markers array contains all markers with time and name',
    ],
  },
};

export default Tooltip;
