/**
 * REAPER-Inspired Theme System for CoreLogic Studio
 * Defines all themeable colors, fonts, and layout parameters
 */

export interface ThemeColors {
  // Background colors
  bg: {
    primary: string;     // Main app background
    secondary: string;   // Panel backgrounds
    tertiary: string;    // Control backgrounds
    alt: string;         // Alternative backgrounds
    hover: string;       // Hover state
    selected: string;    // Selected state
  };

  // Text colors
  text: {
    primary: string;     // Main text
    secondary: string;   // Secondary text
    tertiary: string;    // Tertiary text (very dim)
    accent: string;      // Accent text
  };

  // Border colors
  border: {
    primary: string;     // Main borders
    secondary: string;   // Secondary borders
    divider: string;     // Dividers
  };

  // UI Elements
  ui: {
    mute: string;
    solo: string;
    record: string;
    play: string;
    stop: string;
    armed: string;
    success: string;
    warning: string;
    error: string;
  };

  // Meter colors
  meter: {
    background: string;
    filled: string;
    peak: string;
    clipping: string;
    rms: string;
  };

  // Fader colors
  fader: {
    background: string;
    thumb: string;
    hover: string;
    zeroLine: string;
  };

  // Waveform colors
  waveform: {
    background: string;
    foreground: string;
    peak: string;
    rms: string;
    selection: string;
  };

  // Track strip colors
  track: {
    background: string;
    backgroundSelected: string;
    nameBackground: string;
    border: string;
  };

  // Automation colors
  automation: {
    line: string;
    point: string;
    envelope: string;
  };
}

export interface ThemeFonts {
  family: {
    ui: string;          // Default UI font
    mono: string;        // Monospace for values
  };
  size: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
  };
  weight: {
    normal: number;
    semibold: number;
    bold: number;
  };
}

export interface ThemeLayout {
  // TCP (Track Control Panel) - left side track list
  tcp: {
    width: number;
    minHeight: number;
    folderIndent: number;
    defaultHeights: {
      superCollapsed: number;
      small: number;
      medium: number;
      full: number;
    };
  };

  // MCP (Mixer Control Panel) - bottom mixer
  mcp: {
    minHeight: number;
    stripWidth: number;
    masterMinHeight: number;
  };

  // Transport
  transport: {
    height: number;
  };

  // Timeline/arrange
  arrange: {
    rulerHeight: number;
  };

  // General
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  };

  // Border radius
  radius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
  };

  // Shadows
  shadow: {
    sm: string;
    md: string;
    lg: string;
  };
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: 'dark' | 'light' | 'custom';
  
  colors: ThemeColors;
  fonts: ThemeFonts;
  layout: ThemeLayout;

  // Metadata
  createdAt: string;
  updatedAt: string;
  isCustom: boolean;
}

export interface ThemeConfig {
  currentTheme: string;
  customThemes: Record<string, Theme>;
  autoSaveTheme: boolean;
  enableThemeTransitions: boolean;
}
