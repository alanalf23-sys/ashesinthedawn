/**
 * CoreLogic Studio Configuration
 * Version 7.0 (Phase 3 - GUI Integration)
 * 
 * Centralized application settings for the Codette Quantum DAW
 * All configuration values can be overridden via environment variables
 */

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

export const SYSTEM_CONFIG = {
  // Application identification
  APP_NAME: process.env.REACT_APP_NAME || 'CoreLogic Studio',
  VERSION: process.env.REACT_APP_VERSION || '7.0',
  BUILD_NUMBER: process.env.REACT_APP_BUILD || '0',
  
  // UI Rendering
  DEFAULT_THEME: (process.env.REACT_APP_DEFAULT_THEME || 'Graphite') as 'Dark' | 'Light' | 'Graphite' | 'Neon',
  FPS_LIMIT: parseInt(process.env.REACT_APP_FPS_LIMIT || '60', 10),
  
  // Splash screen
  SPLASH_ENABLED: process.env.REACT_APP_SPLASH_ENABLED !== 'false',
  SPLASH_FADE_DURATION_MS: parseInt(process.env.REACT_APP_SPLASH_DURATION || '1000', 10),
  SPLASH_LOAD_SIMULATION: process.env.REACT_APP_SPLASH_SIMULATION !== 'false',
  
  // Window dimensions
  WINDOW_WIDTH: parseInt(process.env.REACT_APP_WINDOW_WIDTH || '1600', 10),
  WINDOW_HEIGHT: parseInt(process.env.REACT_APP_WINDOW_HEIGHT || '900', 10),
  MIN_WINDOW_WIDTH: parseInt(process.env.REACT_APP_MIN_WINDOW_WIDTH || '640', 10),
  MIN_WINDOW_HEIGHT: parseInt(process.env.REACT_APP_MIN_WINDOW_HEIGHT || '480', 10),
} as const;

// ============================================================================
// DISPLAY CONFIGURATION
// ============================================================================

export const DISPLAY_CONFIG = {
  // Analog console view settings
  CHANNEL_COUNT: parseInt(process.env.REACT_APP_CHANNEL_COUNT || '10', 10),
  CHANNEL_WIDTH: parseInt(process.env.REACT_APP_CHANNEL_WIDTH || '120', 10),
  CHANNEL_MIN_WIDTH: parseInt(process.env.REACT_APP_CHANNEL_MIN_WIDTH || '80', 10),
  CHANNEL_MAX_WIDTH: parseInt(process.env.REACT_APP_CHANNEL_MAX_WIDTH || '200', 10),
  
  // VU meter refresh rate (milliseconds)
  VU_REFRESH_MS: parseInt(process.env.REACT_APP_VU_REFRESH || '150', 10),
  
  // Rack behavior
  RACK_COLLAPSED_DEFAULT: process.env.REACT_APP_RACK_COLLAPSED === 'true',
  RACK_WIDTH_EXPANDED: parseInt(process.env.REACT_APP_RACK_WIDTH_EXPANDED || '300', 10),
  RACK_WIDTH_COLLAPSED: parseInt(process.env.REACT_APP_RACK_WIDTH_COLLAPSED || '60', 10),
  
  // Visual elements
  SHOW_WATERMARK: process.env.REACT_APP_SHOW_WATERMARK !== 'false',
  SHOW_GRID: process.env.REACT_APP_SHOW_GRID !== 'false',
  GRID_SIZE: parseInt(process.env.REACT_APP_GRID_SIZE || '8', 10),
} as const;

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

export const THEME_CONFIG = {
  AVAILABLE_THEMES: ['Dark', 'Light', 'Graphite', 'Neon'] as const,
  DEFAULT_THEME: (process.env.REACT_APP_DEFAULT_THEME || 'Graphite') as 'Dark' | 'Light' | 'Graphite' | 'Neon',
  
  // Rotary control centering
  ROTARY_CENTER: parseFloat(process.env.REACT_APP_ROTARY_CENTER || '0.5'),
  ROTARY_MIN: parseFloat(process.env.REACT_APP_ROTARY_MIN || '-1'),
  ROTARY_MAX: parseFloat(process.env.REACT_APP_ROTARY_MAX || '1'),
  
  // Animation settings
  TRANSITION_DURATION_MS: parseInt(process.env.REACT_APP_TRANSITION_DURATION || '200', 10),
  HOVER_TRANSITION_MS: parseInt(process.env.REACT_APP_HOVER_TRANSITION || '100', 10),
} as const;

// ============================================================================
// BEHAVIOR CONFIGURATION
// ============================================================================

export const BEHAVIOR_CONFIG = {
  // Track and FX control sync
  REAPER_TRACK_FOLLOWS: (process.env.REACT_APP_REAPER_TRACK_FOLLOWS || 'REAPER') as 'REAPER' | 'CUSTOM',
  DEVICE_TRACK_FOLLOWS: (process.env.REACT_APP_DEVICE_TRACK_FOLLOWS || 'DEVICE') as 'DEVICE' | 'CUSTOM',
  DEVICE_TRACK_BANK_FOLLOWS: (process.env.REACT_APP_DEVICE_TRACK_BANK_FOLLOWS || 'DEVICE') as 'DEVICE' | 'CUSTOM',
  DEVICE_FX_FOLLOWS: (process.env.REACT_APP_DEVICE_FX_FOLLOWS || 'LAST_TOUCHED') as 'LAST_TOUCHED' | 'FIRST' | 'CUSTOM',
  DEVICE_EQ_MODE: (process.env.REACT_APP_DEVICE_EQ_MODE || 'INSERT') as 'INSERT' | 'MASTER' | 'PARAMETRIC',
  
  // Auto-save
  AUTO_SAVE_ENABLED: process.env.REACT_APP_AUTO_SAVE !== 'false',
  AUTO_SAVE_INTERVAL_MS: parseInt(process.env.REACT_APP_AUTO_SAVE_INTERVAL || '60000', 10), // 1 minute default
  
  // Undo/redo
  UNDO_STACK_SIZE: parseInt(process.env.REACT_APP_UNDO_STACK_SIZE || '100', 10),
  REDO_ENABLED: process.env.REACT_APP_REDO_ENABLED !== 'false',
} as const;

// ============================================================================
// OSC CONFIGURATION (Optional - Future Integration)
// ============================================================================

export const OSC_CONFIG = {
  ENABLED: process.env.REACT_APP_OSC_ENABLED === 'true',
  HOST: process.env.REACT_APP_OSC_HOST || 'localhost',
  PORT: parseInt(process.env.REACT_APP_OSC_PORT || '9000', 10),
  
  // Device mapping
  DEVICE_TRACK_COUNT: parseInt(process.env.REACT_APP_DEVICE_TRACK_COUNT || '8', 10),
  DEVICE_SEND_COUNT: parseInt(process.env.REACT_APP_DEVICE_SEND_COUNT || '4', 10),
  DEVICE_RECEIVE_COUNT: parseInt(process.env.REACT_APP_DEVICE_RECEIVE_COUNT || '4', 10),
  DEVICE_FX_COUNT: parseInt(process.env.REACT_APP_DEVICE_FX_COUNT || '8', 10),
  DEVICE_FX_PARAM_COUNT: parseInt(process.env.REACT_APP_DEVICE_FX_PARAM_COUNT || '16', 10),
  DEVICE_MARKER_COUNT: parseInt(process.env.REACT_APP_DEVICE_MARKER_COUNT || '0', 10),
  DEVICE_REGION_COUNT: parseInt(process.env.REACT_APP_DEVICE_REGION_COUNT || '0', 10),
} as const;

// ============================================================================
// MIDI CONFIGURATION (Optional - Future Integration)
// ============================================================================

export const MIDI_CONFIG = {
  ENABLED: process.env.REACT_APP_MIDI_ENABLED === 'true',
  DEFAULT_PORT: parseInt(process.env.REACT_APP_MIDI_DEFAULT_PORT || '1', 10),
  
  // CC mappings
  MAP_CC_VOLUME: parseInt(process.env.REACT_APP_MAP_CC_VOLUME || '7', 10),
  MAP_CC_PAN: parseInt(process.env.REACT_APP_MAP_CC_PAN || '10', 10),
  MAP_CC_MOD: parseInt(process.env.REACT_APP_MAP_CC_MOD || '1', 10),
  MAP_CC_EXPRESSION: parseInt(process.env.REACT_APP_MAP_CC_EXPRESSION || '11', 10),
  
  // Note range
  NOTE_MIN: parseInt(process.env.REACT_APP_NOTE_MIN || '0', 10),
  NOTE_MAX: parseInt(process.env.REACT_APP_NOTE_MAX || '127', 10),
} as const;

// ============================================================================
// TRANSPORT CONFIGURATION
// ============================================================================

export const TRANSPORT_CONFIG = {
  // Display settings
  SHOW_TIMER: process.env.REACT_APP_SHOW_TIMER !== 'false',
  TIMER_COLOR: process.env.REACT_APP_TIMER_COLOR || '#00FFFF', // cyan
  TIMER_FORMAT: (process.env.REACT_APP_TIMER_FORMAT || 'HH:MM:SS') as 'HH:MM:SS' | 'MM:SS' | 'Measures',
  
  // Timeline behavior
  ZOOM_MIN: parseFloat(process.env.REACT_APP_ZOOM_MIN || '0.5'),
  ZOOM_MAX: parseFloat(process.env.REACT_APP_ZOOM_MAX || '3.0'),
  ZOOM_STEP: parseFloat(process.env.REACT_APP_ZOOM_STEP || '0.1'),
  
  // Automation
  AUTOMATION_OVERLAY: process.env.REACT_APP_AUTOMATION_OVERLAY !== 'false',
  AUTOMATION_DRAW_MODE: (process.env.REACT_APP_AUTOMATION_DRAW_MODE || 'RAMP') as 'RAMP' | 'SQUARE' | 'TRIANGLE',
  
  // Click track
  CLICK_ENABLED: process.env.REACT_APP_CLICK_ENABLED !== 'false',
  CLICK_VOLUME: parseFloat(process.env.REACT_APP_CLICK_VOLUME || '0.5'),
  
  // Metronome
  METRONOME_ENABLED: process.env.REACT_APP_METRONOME_ENABLED !== 'false',
  METRONOME_ACCENT: parseInt(process.env.REACT_APP_METRONOME_ACCENT || '120', 10),
  METRONOME_BEAT: parseInt(process.env.REACT_APP_METRONOME_BEAT || '60', 10),
} as const;

// ============================================================================
// BRANDING CONFIGURATION
// ============================================================================

export const BRANDING_CONFIG = {
  LOGO_TEXT: process.env.REACT_APP_LOGO_TEXT || '🎧 CoreLogic Studio',
  LOGO_COLOR: process.env.REACT_APP_LOGO_COLOR || '#ffaa00',
  VERSION_LABEL: process.env.REACT_APP_VERSION_LABEL || 'v7.0',
  FOOTER_TEXT: process.env.REACT_APP_FOOTER_TEXT || 'CoreLogic Studio • Professional Audio Workstation',
  
  // Contact and links
  WEBSITE_URL: process.env.REACT_APP_WEBSITE_URL || 'https://example.com',
  DOCUMENTATION_URL: process.env.REACT_APP_DOCS_URL || 'https://docs.example.com',
  SUPPORT_EMAIL: process.env.REACT_APP_SUPPORT_EMAIL || 'support@example.com',
} as const;

// ============================================================================
// AUDIO CONFIGURATION
// ============================================================================

export const AUDIO_CONFIG = {
  // Sample rate and buffer
  SAMPLE_RATE: parseInt(process.env.REACT_APP_SAMPLE_RATE || '44100', 10),
  BUFFER_SIZE: parseInt(process.env.REACT_APP_BUFFER_SIZE || '256', 10),
  
  // Audio device limits
  MAX_CHANNELS: parseInt(process.env.REACT_APP_MAX_CHANNELS || '64', 10),
  MAX_TRACKS: parseInt(process.env.REACT_APP_MAX_TRACKS || '256', 10),
  
  // DSP settings
  HEADROOM_DB: parseFloat(process.env.REACT_APP_HEADROOM_DB || '6.0'),
  NOMINAL_LEVEL_DBU: parseFloat(process.env.REACT_APP_NOMINAL_LEVEL_DBU || '0'),
  
  // Metering
  METERING_RMS_WINDOW_MS: parseInt(process.env.REACT_APP_METERING_RMS_WINDOW || '300', 10),
  METERING_PEAK_HOLD_MS: parseInt(process.env.REACT_APP_METERING_PEAK_HOLD || '3000', 10),
} as const;

// ============================================================================
// DEVELOPMENT/DEBUG CONFIGURATION
// ============================================================================

export const DEBUG_CONFIG = {
  ENABLED: process.env.NODE_ENV === 'development',
  LOG_LEVEL: (process.env.REACT_APP_LOG_LEVEL || 'warn') as 'debug' | 'info' | 'warn' | 'error',
  SHOW_PERFORMANCE_MONITOR: process.env.REACT_APP_SHOW_PERF_MONITOR === 'true',
  SHOW_LAYOUT_GUIDES: process.env.REACT_APP_SHOW_LAYOUT_GUIDES === 'true',
  ENABLE_REDUX_DEVTOOLS: process.env.REACT_APP_REDUX_DEVTOOLS !== 'false',
  MOCK_AUDIO_ENGINE: process.env.REACT_APP_MOCK_AUDIO === 'true',
} as const;

// ============================================================================
// COMPOSITE CONFIGURATION OBJECT
// ============================================================================

export const APP_CONFIG = {
  system: SYSTEM_CONFIG,
  display: DISPLAY_CONFIG,
  theme: THEME_CONFIG,
  behavior: BEHAVIOR_CONFIG,
  osc: OSC_CONFIG,
  midi: MIDI_CONFIG,
  transport: TRANSPORT_CONFIG,
  branding: BRANDING_CONFIG,
  audio: AUDIO_CONFIG,
  debug: DEBUG_CONFIG,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a configuration value with type safety
 * @param path - Dot-separated path to config value (e.g., 'system.APP_NAME')
 * @returns Configuration value or undefined
 */
export function getConfig<T = unknown>(path: string): T | undefined {
  const keys = path.split('.');
  let value: any = APP_CONFIG;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return undefined;
  }
  
  return value as T;
}

/**
 * Validate configuration at runtime
 * @returns Array of validation errors, empty if valid
 */
export function validateConfig(): string[] {
  const errors: string[] = [];
  
  // Validate dimensions
  if (SYSTEM_CONFIG.WINDOW_WIDTH < SYSTEM_CONFIG.MIN_WINDOW_WIDTH) {
    errors.push(`WINDOW_WIDTH (${SYSTEM_CONFIG.WINDOW_WIDTH}) must be >= MIN_WINDOW_WIDTH (${SYSTEM_CONFIG.MIN_WINDOW_WIDTH})`);
  }
  if (SYSTEM_CONFIG.WINDOW_HEIGHT < SYSTEM_CONFIG.MIN_WINDOW_HEIGHT) {
    errors.push(`WINDOW_HEIGHT (${SYSTEM_CONFIG.WINDOW_HEIGHT}) must be >= MIN_WINDOW_HEIGHT (${SYSTEM_CONFIG.MIN_WINDOW_HEIGHT})`);
  }
  
  // Validate zoom range
  if (TRANSPORT_CONFIG.ZOOM_MIN > TRANSPORT_CONFIG.ZOOM_MAX) {
    errors.push(`ZOOM_MIN (${TRANSPORT_CONFIG.ZOOM_MIN}) must be <= ZOOM_MAX (${TRANSPORT_CONFIG.ZOOM_MAX})`);
  }
  
  // Validate theme
  if (!THEME_CONFIG.AVAILABLE_THEMES.includes(THEME_CONFIG.DEFAULT_THEME as any)) {
    errors.push(`DEFAULT_THEME (${THEME_CONFIG.DEFAULT_THEME}) must be one of: ${THEME_CONFIG.AVAILABLE_THEMES.join(', ')}`);
  }
  
  // Validate audio settings
  if (AUDIO_CONFIG.SAMPLE_RATE < 8000 || AUDIO_CONFIG.SAMPLE_RATE > 192000) {
    errors.push(`SAMPLE_RATE (${AUDIO_CONFIG.SAMPLE_RATE}) must be between 8000 and 192000`);
  }
  if (AUDIO_CONFIG.BUFFER_SIZE < 64 || AUDIO_CONFIG.BUFFER_SIZE > 8192) {
    errors.push(`BUFFER_SIZE (${AUDIO_CONFIG.BUFFER_SIZE}) must be between 64 and 8192`);
  }
  
  return errors;
}

/**
 * Initialize configuration with validation
 * Logs warnings if configuration is invalid
 */
export function initializeConfig(): void {
  const errors = validateConfig();
  if (errors.length > 0) {
    console.warn('Configuration validation errors:', errors);
  }
  
  if (DEBUG_CONFIG.ENABLED) {
    console.log('App Configuration Loaded:', APP_CONFIG);
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeConfig();
}

export default APP_CONFIG;
