/**
 * Codette Quantum DAW Theme Presets
 * Based on Codette Python GUI design with 4 professional themes
 */

import { Theme } from './types';

/**
 * Codette Dark Theme - Teal/green accents on dark background
 */
export const codette_dark: Theme = {
  id: 'codette-dark',
  name: 'Codette Dark',
  description: 'Codette dark theme with teal/green accents for professional audio production',
  version: '1.0',
  author: 'CoreLogic Studio',
  category: 'dark',
  isCustom: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  colors: {
    bg: {
      primary: '#111111',
      secondary: '#1e1e1e',
      tertiary: '#2a2a2a',
      alt: '#0d0d0d',
      hover: '#333333',
      selected: '#404040',
    },
    text: {
      primary: '#cccccc',
      secondary: '#999999',
      tertiary: '#666666',
      accent: '#00ffaa',
    },
    border: {
      primary: '#444444',
      secondary: '#333333',
      divider: '#2a2a2a',
    },
    ui: {
      mute: '#00ffaa',
      solo: '#ffaa00',
      record: '#ff0000',
      play: '#00ff00',
      stop: '#cccccc',
      armed: '#ffaa00',
      success: '#00ffaa',
      warning: '#ffaa00',
      error: '#ff0000',
    },
    meter: {
      background: '#0a0a0a',
      filled: '#00ff00',
      peak: '#ffff00',
      clipping: '#ff0000',
      rms: '#00ffaa',
    },
    fader: {
      background: '#1a1a1a',
      thumb: '#666666',
      hover: '#888888',
      zeroLine: '#00ffaa',
    },
    waveform: {
      background: '#111111',
      foreground: '#00ffaa',
      peak: '#00ff00',
      rms: '#00ccaa',
      selection: '#00ffaa33',
    },
    track: {
      background: '#1e1e1e',
      backgroundSelected: '#2a2a2a',
      nameBackground: '#0d0d0d',
      border: '#444444',
    },
    automation: {
      line: '#ffcc00',
      point: '#ffcc00',
      envelope: '#00ffaa',
    },
  },

  fonts: {
    family: {
      ui: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
      mono: '"Consolas", "Monaco", "Courier New", monospace',
    },
    size: {
      xs: 10,
      sm: 11,
      base: 12,
      lg: 13,
      xl: 14,
    },
    weight: {
      normal: 400,
      semibold: 600,
      bold: 700,
    },
  },

  layout: {
    tcp: {
      width: 120,
      minHeight: 74,
      folderIndent: 22,
      defaultHeights: {
        superCollapsed: 24,
        small: 49,
        medium: 72,
        full: 150,
      },
    },
    mcp: {
      minHeight: 230,
      stripWidth: 120,
      masterMinHeight: 74,
    },
    transport: {
      height: 48,
    },
    arrange: {
      rulerHeight: 32,
    },
    spacing: {
      xs: 4,
      sm: 4,
      md: 8,
      lg: 12,
    },
    radius: {
      none: 0,
      sm: 4,
      md: 6,
      lg: 8,
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
      md: '0 4px 6px rgba(0, 0, 0, 0.6)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.8)',
    },
  },
};

/**
 * Codette Light Theme - Blue accents on light background
 */
export const codette_light: Theme = {
  id: 'codette-light',
  name: 'Codette Light',
  description: 'Codette light theme with blue accents for bright environments',
  version: '1.0',
  author: 'CoreLogic Studio',
  category: 'light',
  isCustom: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  colors: {
    bg: {
      primary: '#f5f5f5',
      secondary: '#e0e0e0',
      tertiary: '#d0d0d0',
      alt: '#ffffff',
      hover: '#c8c8c8',
      selected: '#b8b8b8',
    },
    text: {
      primary: '#222222',
      secondary: '#555555',
      tertiary: '#888888',
      accent: '#0099cc',
    },
    border: {
      primary: '#c0c0c0',
      secondary: '#d0d0d0',
      divider: '#e0e0e0',
    },
    ui: {
      mute: '#0099cc',
      solo: '#ff6600',
      record: '#ff0000',
      play: '#00aa00',
      stop: '#666666',
      armed: '#ff6600',
      success: '#00aa00',
      warning: '#ff6600',
      error: '#ff0000',
    },
    meter: {
      background: '#ffffff',
      filled: '#00aa00',
      peak: '#ffff00',
      clipping: '#ff0000',
      rms: '#0099cc',
    },
    fader: {
      background: '#e8e8e8',
      thumb: '#888888',
      hover: '#666666',
      zeroLine: '#0099cc',
    },
    waveform: {
      background: '#f5f5f5',
      foreground: '#0077aa',
      peak: '#0099cc',
      rms: '#0077aa',
      selection: '#0099cc33',
    },
    track: {
      background: '#e0e0e0',
      backgroundSelected: '#d0d0d0',
      nameBackground: '#ffffff',
      border: '#c0c0c0',
    },
    automation: {
      line: '#ff6600',
      point: '#ff6600',
      envelope: '#0099cc',
    },
  },

  fonts: {
    family: {
      ui: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
      mono: '"Consolas", "Monaco", "Courier New", monospace',
    },
    size: {
      xs: 10,
      sm: 11,
      base: 12,
      lg: 13,
      xl: 14,
    },
    weight: {
      normal: 400,
      semibold: 600,
      bold: 700,
    },
  },

  layout: {
    tcp: {
      width: 120,
      minHeight: 74,
      folderIndent: 22,
      defaultHeights: {
        superCollapsed: 24,
        small: 49,
        medium: 72,
        full: 150,
      },
    },
    mcp: {
      minHeight: 230,
      stripWidth: 120,
      masterMinHeight: 74,
    },
    transport: {
      height: 48,
    },
    arrange: {
      rulerHeight: 32,
    },
    spacing: {
      xs: 4,
      sm: 4,
      md: 8,
      lg: 12,
    },
    radius: {
      none: 0,
      sm: 4,
      md: 6,
      lg: 8,
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px rgba(0, 0, 0, 0.15)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.2)',
    },
  },
};

/**
 * Codette Graphite Theme - Orange accents on gray background (default)
 */
export const codette_graphite: Theme = {
  id: 'codette-graphite',
  name: 'Codette Graphite',
  description: 'Codette graphite theme with orange accents - professional audio grade',
  version: '1.0',
  author: 'CoreLogic Studio',
  category: 'dark',
  isCustom: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  colors: {
    bg: {
      primary: '#2a2a2a',
      secondary: '#3b3b3b',
      tertiary: '#4a4a4a',
      alt: '#1f1f1f',
      hover: '#4a4a4a',
      selected: '#565656',
    },
    text: {
      primary: '#dddddd',
      secondary: '#aaaaaa',
      tertiary: '#777777',
      accent: '#ffaa00',
    },
    border: {
      primary: '#555555',
      secondary: '#3f3f3f',
      divider: '#3f3f3f',
    },
    ui: {
      mute: '#ffaa00',
      solo: '#ffaa00',
      record: '#ff3333',
      play: '#00ff00',
      stop: '#aaaaaa',
      armed: '#ffaa00',
      success: '#00ff00',
      warning: '#ffaa00',
      error: '#ff3333',
    },
    meter: {
      background: '#151515',
      filled: '#00ff00',
      peak: '#ffff00',
      clipping: '#ff0000',
      rms: '#00ccff',
    },
    fader: {
      background: '#1f1f1f',
      thumb: '#666666',
      hover: '#888888',
      zeroLine: '#00ccff',
    },
    waveform: {
      background: '#2a2a2a',
      foreground: '#ffaa00',
      peak: '#ffff00',
      rms: '#ffaa00',
      selection: '#ffaa0044',
    },
    track: {
      background: '#3b3b3b',
      backgroundSelected: '#4a4a4a',
      nameBackground: '#1f1f1f',
      border: '#555555',
    },
    automation: {
      line: '#00ccff',
      point: '#00ccff',
      envelope: '#ffaa00',
    },
  },

  fonts: {
    family: {
      ui: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
      mono: '"Consolas", "Monaco", "Courier New", monospace',
    },
    size: {
      xs: 10,
      sm: 11,
      base: 12,
      lg: 13,
      xl: 14,
    },
    weight: {
      normal: 400,
      semibold: 600,
      bold: 700,
    },
  },

  layout: {
    tcp: {
      width: 120,
      minHeight: 74,
      folderIndent: 22,
      defaultHeights: {
        superCollapsed: 24,
        small: 49,
        medium: 72,
        full: 150,
      },
    },
    mcp: {
      minHeight: 230,
      stripWidth: 120,
      masterMinHeight: 74,
    },
    transport: {
      height: 48,
    },
    arrange: {
      rulerHeight: 32,
    },
    spacing: {
      xs: 4,
      sm: 4,
      md: 8,
      lg: 12,
    },
    radius: {
      none: 0,
      sm: 4,
      md: 6,
      lg: 8,
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
      md: '0 4px 6px rgba(0, 0, 0, 0.6)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.8)',
    },
  },
};

/**
 * Codette Neon Theme - Magenta/cyan accents on very dark background
 */
export const codette_neon: Theme = {
  id: 'codette-neon',
  name: 'Codette Neon',
  description: 'Codette neon theme with magenta/cyan accents for extreme contrast',
  version: '1.0',
  author: 'CoreLogic Studio',
  category: 'dark',
  isCustom: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  colors: {
    bg: {
      primary: '#0a0a0f',
      secondary: '#151522',
      tertiary: '#1f1f30',
      alt: '#050508',
      hover: '#2a2a40',
      selected: '#3a3a60',
    },
    text: {
      primary: '#f0f0f0',
      secondary: '#c0c0c0',
      tertiary: '#888888',
      accent: '#ff00ff',
    },
    border: {
      primary: '#4a4a7f',
      secondary: '#2a2a4f',
      divider: '#1a1a3a',
    },
    ui: {
      mute: '#00ffff',
      solo: '#ff33cc',
      record: '#ff0033',
      play: '#00ff00',
      stop: '#c0c0c0',
      armed: '#ff33cc',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0033',
    },
    meter: {
      background: '#050508',
      filled: '#00ffff',
      peak: '#ff00ff',
      clipping: '#ff0033',
      rms: '#00ff00',
    },
    fader: {
      background: '#0f0f1a',
      thumb: '#ff00ff',
      hover: '#00ffff',
      zeroLine: '#00ff00',
    },
    waveform: {
      background: '#0a0a0f',
      foreground: '#00ffff',
      peak: '#ff00ff',
      rms: '#00ff00',
      selection: '#00ffff55',
    },
    track: {
      background: '#151522',
      backgroundSelected: '#1f1f30',
      nameBackground: '#050508',
      border: '#4a4a7f',
    },
    automation: {
      line: '#ff33cc',
      point: '#00ffff',
      envelope: '#ff00ff',
    },
  },

  fonts: {
    family: {
      ui: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
      mono: '"Consolas", "Monaco", "Courier New", monospace',
    },
    size: {
      xs: 10,
      sm: 11,
      base: 12,
      lg: 13,
      xl: 14,
    },
    weight: {
      normal: 400,
      semibold: 600,
      bold: 700,
    },
  },

  layout: {
    tcp: {
      width: 120,
      minHeight: 74,
      folderIndent: 22,
      defaultHeights: {
        superCollapsed: 24,
        small: 49,
        medium: 72,
        full: 150,
      },
    },
    mcp: {
      minHeight: 230,
      stripWidth: 120,
      masterMinHeight: 74,
    },
    transport: {
      height: 48,
    },
    arrange: {
      rulerHeight: 32,
    },
    spacing: {
      xs: 4,
      sm: 4,
      md: 8,
      lg: 12,
    },
    radius: {
      none: 0,
      sm: 4,
      md: 6,
      lg: 8,
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.8)',
      md: '0 4px 6px rgba(0, 0, 0, 0.9)',
      lg: '0 10px 15px rgba(0, 0, 0, 1)',
    },
  },
};

// Export all Codette themes as default theme list
export const CODETTE_THEMES = [codette_dark, codette_light, codette_graphite, codette_neon];

// Maintain backward compatibility - export old REAPER theme names too
export const reaper_default = codette_graphite; // Default theme
export const reaper_light = codette_light;
export const high_contrast = codette_neon;
