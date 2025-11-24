/**
 * CoreLogic Studio Configuration (Vite-Compatible)
 * Version 7.0 (Phase 3 - GUI Integration)
 * 
 * Centralized application settings for the Codette Quantum DAW
 * All configuration values can be overridden via environment variables
 */

const env = import.meta.env; // ✅ Vite environment object

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

export const SYSTEM_CONFIG = {
  APP_NAME: env.VITE_APP_NAME || 'CoreLogic Studio',
  VERSION: env.VITE_APP_VERSION || '7.0',
  BUILD_NUMBER: env.VITE_APP_BUILD || '0',
  DEFAULT_THEME: (env.VITE_DEFAULT_THEME || 'Graphite') as 'Dark' | 'Light' | 'Graphite' | 'Neon',
  FPS_LIMIT: parseInt(env.VITE_FPS_LIMIT || '60', 10),
  SPLASH_ENABLED: env.VITE_SPLASH_ENABLED !== 'false',
  SPLASH_FADE_DURATION_MS: parseInt(env.VITE_SPLASH_DURATION || '1000', 10),
  SPLASH_LOAD_SIMULATION: env.VITE_SPLASH_SIMULATION !== 'false',
  WINDOW_WIDTH: parseInt(env.VITE_WINDOW_WIDTH || '1600', 10),
  WINDOW_HEIGHT: parseInt(env.VITE_WINDOW_HEIGHT || '900', 10),
  MIN_WINDOW_WIDTH: parseInt(env.VITE_MIN_WINDOW_WIDTH || '640', 10),
  MIN_WINDOW_HEIGHT: parseInt(env.VITE_MIN_WINDOW_HEIGHT || '480', 10),
} as const;

// ============================================================================
// DISPLAY CONFIGURATION
// ============================================================================

export const DISPLAY_CONFIG = {
  CHANNEL_COUNT: parseInt(env.VITE_CHANNEL_COUNT || '10', 10),
  CHANNEL_WIDTH: parseInt(env.VITE_CHANNEL_WIDTH || '120', 10),
  CHANNEL_MIN_WIDTH: parseInt(env.VITE_CHANNEL_MIN_WIDTH || '80', 10),
  CHANNEL_MAX_WIDTH: parseInt(env.VITE_CHANNEL_MAX_WIDTH || '200', 10),
  VU_REFRESH_MS: parseInt(env.VITE_VU_REFRESH || '150', 10),
  RACK_COLLAPSED_DEFAULT: env.VITE_RACK_COLLAPSED === 'true',
  RACK_WIDTH_EXPANDED: parseInt(env.VITE_RACK_WIDTH_EXPANDED || '300', 10),
  RACK_WIDTH_COLLAPSED: parseInt(env.VITE_RACK_WIDTH_COLLAPSED || '60', 10),
  SHOW_WATERMARK: env.VITE_SHOW_WATERMARK !== 'false',
  SHOW_GRID: env.VITE_SHOW_GRID !== 'false',
  GRID_SIZE: parseInt(env.VITE_GRID_SIZE || '8', 10),
} as const;

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

export const THEME_CONFIG = {
  AVAILABLE_THEMES: ['Dark', 'Light', 'Graphite', 'Neon'] as const,
  DEFAULT_THEME: (env.VITE_DEFAULT_THEME || 'Graphite') as 'Dark' | 'Light' | 'Graphite' | 'Neon',
  ROTARY_CENTER: parseFloat(env.VITE_ROTARY_CENTER || '0.5'),
  ROTARY_MIN: parseFloat(env.VITE_ROTARY_MIN || '-1'),
  ROTARY_MAX: parseFloat(env.VITE_ROTARY_MAX || '1'),
  TRANSITION_DURATION_MS: parseInt(env.VITE_TRANSITION_DURATION || '200', 10),
  HOVER_TRANSITION_MS: parseInt(env.VITE_HOVER_TRANSITION || '100', 10),
} as const;

// ============================================================================
// DEBUG CONFIGURATION
// ============================================================================

export const DEBUG_CONFIG = {
  ENABLED: env.DEV,
  LOG_LEVEL: (env.VITE_LOG_LEVEL || 'warn') as 'debug' | 'info' | 'warn' | 'error',
  SHOW_PERFORMANCE_MONITOR: env.VITE_SHOW_PERF_MONITOR === 'true',
  SHOW_LAYOUT_GUIDES: env.VITE_SHOW_LAYOUT_GUIDES === 'true',
  ENABLE_REDUX_DEVTOOLS: env.VITE_REDUX_DEVTOOLS !== 'false',
  MOCK_AUDIO_ENGINE: env.VITE_MOCK_AUDIO === 'true',
} as const;

// ============================================================================
// COMPOSITE CONFIGURATION OBJECT
// ============================================================================

export const APP_CONFIG = {
  system: SYSTEM_CONFIG,
  display: DISPLAY_CONFIG,
  theme: THEME_CONFIG,
  debug: DEBUG_CONFIG,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Initialize configuration
 * Logs configuration if debug is enabled
 */
export function initializeConfig(): void {
  if (DEBUG_CONFIG.ENABLED) {
    console.log('App Configuration Loaded:', APP_CONFIG);
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeConfig();
}

export default APP_CONFIG;
