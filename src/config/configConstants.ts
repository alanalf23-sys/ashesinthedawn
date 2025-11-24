/**
 * Configuration Constants Reference
 * 
 * This file documents all configuration options in INI-style format
 * for reference. The actual configuration is loaded from:
 * 1. Environment variables (REACT_APP_* prefix)
 * 2. appConfig.ts (with defaults)
 * 3. .env file (local overrides)
 */

export const CONFIG_REFERENCE = `
# ==========================================
# CoreLogic Studio Configuration Reference
# Version 7.0 (Phase 3 - GUI Integration)
# ==========================================

[System]
# General runtime settings
APP_NAME = CoreLogic Studio
VERSION = 7.0
BUILD = 0
DEFAULT_THEME = Graphite
SPLASH_ENABLED = true
SPLASH_FADE_DURATION_MS = 1000
SPLASH_LOAD_SIMULATION = true
FPS_LIMIT = 60
WINDOW_WIDTH = 1600
WINDOW_HEIGHT = 900
MIN_WINDOW_WIDTH = 640
MIN_WINDOW_HEIGHT = 480

[Display]
# Analog console view settings
CHANNEL_COUNT = 10
CHANNEL_WIDTH = 120
CHANNEL_MIN_WIDTH = 80
CHANNEL_MAX_WIDTH = 200
VU_REFRESH_MS = 150
RACK_COLLAPSED_DEFAULT = false
RACK_WIDTH_EXPANDED = 300
RACK_WIDTH_COLLAPSED = 60
SHOW_WATERMARK = true
SHOW_GRID = true
GRID_SIZE = 8

[Themes]
# Default color themes (can be extended)
AVAILABLE = Dark, Light, Graphite, Neon
DEFAULT = Graphite
ROTARY_CENTER = 0.5
ROTARY_MIN = -1
ROTARY_MAX = 1
TRANSITION_DURATION_MS = 200
HOVER_TRANSITION_MS = 100

[Behavior]
# Track + FX control sync between GUI and DSP
REAPER_TRACK_FOLLOWS = REAPER
DEVICE_TRACK_FOLLOWS = DEVICE
DEVICE_TRACK_BANK_FOLLOWS = DEVICE
DEVICE_FX_FOLLOWS = LAST_TOUCHED
DEVICE_EQ_MODE = INSERT
AUTO_SAVE_ENABLED = true
AUTO_SAVE_INTERVAL_MS = 60000
UNDO_STACK_SIZE = 100
REDO_ENABLED = true

[OSC]
# Optional OSC communication bridge (future)
ENABLED = false
HOST = localhost
PORT = 9000
DEVICE_TRACK_COUNT = 8
DEVICE_SEND_COUNT = 4
DEVICE_RECEIVE_COUNT = 4
DEVICE_FX_COUNT = 8
DEVICE_FX_PARAM_COUNT = 16
DEVICE_MARKER_COUNT = 0
DEVICE_REGION_COUNT = 0

[MIDI]
# Optional MIDI control layer (future)
ENABLED = false
DEFAULT_PORT = 1
MAP_CC_VOLUME = 7
MAP_CC_PAN = 10
MAP_CC_MOD = 1
MAP_CC_EXPRESSION = 11
NOTE_MIN = 0
NOTE_MAX = 127

[Transport]
# Transport and timeline behavior
SHOW_TIMER = true
TIMER_COLOR = #00FFFF (cyan)
TIMER_FORMAT = HH:MM:SS
ZOOM_MIN = 0.5
ZOOM_MAX = 3.0
ZOOM_STEP = 0.1
AUTOMATION_OVERLAY = true
AUTOMATION_DRAW_MODE = RAMP
CLICK_ENABLED = true
CLICK_VOLUME = 0.5
METRONOME_ENABLED = true
METRONOME_ACCENT = 120
METRONOME_BEAT = 60

[Audio]
# Audio processing settings
SAMPLE_RATE = 44100
BUFFER_SIZE = 256
MAX_CHANNELS = 64
MAX_TRACKS = 256
HEADROOM_DB = 6.0
NOMINAL_LEVEL_DBU = 0
METERING_RMS_WINDOW_MS = 300
METERING_PEAK_HOLD_MS = 3000

[Branding]
LOGO_TEXT = 🎧 CoreLogic Studio
LOGO_COLOR = #ffaa00
VERSION_LABEL = v7.0
FOOTER_TEXT = CoreLogic Studio • Professional Audio Workstation
WEBSITE_URL = https://example.com
DOCUMENTATION_URL = https://docs.example.com
SUPPORT_EMAIL = support@example.com

[Debug]
# Debug and development settings
ENABLED = (auto-detected: true in development, false in production)
LOG_LEVEL = warn (debug, info, warn, error)
SHOW_PERFORMANCE_MONITOR = false
SHOW_LAYOUT_GUIDES = false
ENABLE_REDUX_DEVTOOLS = true
MOCK_AUDIO_ENGINE = false
`;

export const THEME_COLORS = {
  Dark: {
    primary: '#1f2937',
    secondary: '#111827',
    accent: '#3b82f6',
    text: '#f3f4f6',
    textSecondary: '#d1d5db',
    border: '#374151',
  },
  Light: {
    primary: '#f3f4f6',
    secondary: '#ffffff',
    accent: '#2563eb',
    text: '#1f2937',
    textSecondary: '#4b5563',
    border: '#e5e7eb',
  },
  Graphite: {
    primary: '#2a2a2a',
    secondary: '#1a1a1a',
    accent: '#ffaa00',
    text: '#e0e0e0',
    textSecondary: '#b0b0b0',
    border: '#404040',
  },
  Neon: {
    primary: '#0a0e27',
    secondary: '#050812',
    accent: '#00ff88',
    text: '#00ffff',
    textSecondary: '#ff00ff',
    border: '#00ff88',
  },
} as const;

export const AUTOMATION_MODES = {
  RAMP: 'Linear ramp between points',
  SQUARE: 'Immediate step changes',
  TRIANGLE: 'Triangular interpolation',
  SINE: 'Smooth sinusoidal curve',
  EXPONENTIAL: 'Exponential curve',
} as const;

export const TIMER_FORMATS = {
  'HH:MM:SS': 'Hours:Minutes:Seconds (00:05:30)',
  'MM:SS': 'Minutes:Seconds (05:30)',
  'Measures': 'Measures.Beats.Ticks (001.002.000)',
} as const;

export const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

export const EQ_MODES = {
  INSERT: 'EQ as insert effect',
  MASTER: 'EQ on master bus only',
  PARAMETRIC: 'Full parametric EQ',
} as const;

export const FX_FOLLOW_MODES = {
  LAST_TOUCHED: 'Follow last touched effect',
  FIRST: 'Always follow first effect',
  CUSTOM: 'Custom follow logic',
} as const;

/**
 * Get theme colors for current theme
 */
export function getThemeColors(themeName: 'Dark' | 'Light' | 'Graphite' | 'Neon') {
  return THEME_COLORS[themeName];
}

/**
 * Format timer value based on format type
 */
export function formatTime(
  samples: number,
  sampleRate: number,
  format: 'HH:MM:SS' | 'MM:SS' | 'Measures'
): string {
  const seconds = samples / sampleRate;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const secs = Math.floor(seconds % 60);
  const mins = minutes % 60;

  switch (format) {
    case 'HH:MM:SS':
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    case 'MM:SS':
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    case 'Measures': {
      // Simplified: assumes 4/4 time signature and 120 BPM
      const measureDuration = (60 / 120) * 4;
      const measures = Math.floor(seconds / measureDuration);
      const remaining = seconds % measureDuration;
      const beats = Math.floor(remaining / (measureDuration / 4));
      return `${String(measures + 1).padStart(3, '0')}.${String(beats).padStart(2, '0')}.000`;
    }
    default:
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

/**
 * Convert dB to linear (for gain calculations)
 */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Convert linear to dB
 */
export function linearToDb(linear: number): number {
  if (linear <= 0) return -Infinity;
  return 20 * Math.log10(linear);
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default CONFIG_REFERENCE;
