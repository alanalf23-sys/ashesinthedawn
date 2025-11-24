/**
 * CoreLogic Studio WALTER Layouts
 * 
 * Pre-configured layouts matching REAPER's professional design patterns
 * - Compact: Minimal UI for tight spaces
 * - Standard: Default full-featured layout
 * - Extended: All controls visible
 * - Mixer: Specialized mixer panel layout
 * - Master: Master track layout
 */

import {
  Layout,
  coords,
  rgba,
  margin,
  font,
  LayoutBuilder,
} from '../config/walterConfig';

// ============================================================================
// COLOR PALETTE (Codette Theme)
// ============================================================================

const COLORS = {
  // Backgrounds
  bg_panel: rgba(17, 24, 39),        // gray-900
  bg_control: rgba(31, 41, 55),      // gray-800
  bg_dark: rgba(3, 7, 18),           // gray-950

  // Text
  text_primary: rgba(209, 213, 219),   // gray-300
  text_secondary: rgba(107, 114, 128), // gray-500
  text_highlight: rgba(59, 130, 246),  // blue-500

  // Accent
  accent_blue: rgba(59, 130, 246),     // blue-600
  accent_red: rgba(220, 38, 38),       // red-600
  accent_yellow: rgba(202, 138, 4),    // yellow-600

  // Borders
  border_light: rgba(75, 85, 99),      // gray-700
  border_dark: rgba(55, 65, 81),       // gray-600
};

// ============================================================================
// HELPER FUNCTION FOR RESPONSIVE LAYOUTS
// ============================================================================

function createResponsiveLayout(
  name: string,
  baseW: number,
  baseH: number,
  setupFn: (builder: LayoutBuilder) => LayoutBuilder
): Layout {
  const builder = new LayoutBuilder(name, baseW, baseH);
  return setupFn(builder).build();
}

// ============================================================================
// TRACK CONTROL PANEL LAYOUTS
// ============================================================================

/**
 * TCP Compact: Minimal track panel
 * Used when width < 120px
 */
export const TCP_COMPACT: Layout = createResponsiveLayout(
  'tcp_compact',
  110,
  400,
  (builder) =>
    builder
      // Track name (label)
      .set('tcp.label', coords(0, 0, 110, 24, 0, 0, 1, 0), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
        font: font(11, 'Inter', 'normal', 0),
        margin: margin(4, 2, 4, 2, 0.5),
      })
      // Mute button
      .set('tcp.mute', coords(0, 28, 50, 20), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
        zOrder: 10,
      })
      // Solo button
      .set('tcp.solo', coords(55, 28, 55, 20), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
        zOrder: 10,
      })
      // Volume fader (compact vertical)
      .set('tcp.volume', coords(5, 55, 100, 60, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
        zOrder: 5,
      })
      // Add responsive rule: hide meter if too narrow
      .addResponsiveRule('w<100', 'tcp.meter', { h: 0 })
);

/**
 * TCP Standard: Default track panel
 * Good for 120-160px width
 */
export const TCP_STANDARD: Layout = createResponsiveLayout(
  'tcp_standard',
  140,
  500,
  (builder) =>
    builder
      // Track index
      .set('tcp.trackidx', coords(0, 0, 30, 24), {
        color: { foreground: COLORS.text_secondary, background: COLORS.bg_control },
        font: font(10, 'Inter', 'normal', 0),
        margin: margin(2, 2, 2, 2, 0.5),
      })
      // Track name (label)
      .set('tcp.label', coords(32, 0, 108, 24, 0, 0, 1, 0), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
        font: font(11, 'Inter', 'normal', 0),
        margin: margin(4, 2, 4, 2, 0),
      })
      // Mute button
      .set('tcp.mute', coords(2, 28, 32, 20), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
        zOrder: 10,
      })
      // Solo button
      .set('tcp.solo', coords(36, 28, 32, 20), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
        zOrder: 10,
      })
      // Record arm button
      .set('tcp.recarm', coords(70, 28, 68, 20), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
        zOrder: 10,
      })
      // Volume fader
      .set('tcp.volume', coords(5, 52, 130, 80, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
        font: font(9, 'Inter', 'normal', 0),
      })
      // Volume label
      .set('tcp.volume.label', coords(5, 135, 130, 16, 0, 0, 1, 0), {
        color: { foreground: COLORS.text_secondary, background: undefined },
        font: font(9, 'Inter', 'normal', 0),
        margin: margin(2, 0, 2, 0, 0.5),
      })
      // Pan control
      .set('tcp.pan', coords(5, 155, 130, 40, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
        zOrder: 5,
      })
      // Pan label
      .set('tcp.pan.label', coords(5, 198, 130, 16, 0, 0, 1, 0), {
        color: { foreground: COLORS.text_secondary, background: undefined },
        font: font(9, 'Inter', 'normal', 0),
        margin: margin(2, 0, 2, 0, 0.5),
      })
      // Meter display
      .set('tcp.meter', coords(5, 220, 130, 80, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
        zOrder: 3,
      })
);

/**
 * TCP Extended: Full-featured track panel
 * Shows all controls when space available
 */
export const TCP_EXTENDED: Layout = createResponsiveLayout(
  'tcp_extended',
  180,
  700,
  (builder) =>
    builder
      // Track index
      .set('tcp.trackidx', coords(0, 0, 40, 28), {
        color: { foreground: COLORS.text_secondary, background: COLORS.bg_control },
        font: font(11, 'Inter', 'normal', 0),
        margin: margin(3, 3, 3, 3, 0.5),
      })
      // Track name
      .set('tcp.label', coords(42, 0, 138, 28, 0, 0, 1, 0), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
        font: font(12, 'Inter', 'normal', 0),
        margin: margin(4, 3, 4, 3, 0),
      })
      // Control row 1: Mute, Solo, RecArm
      .set('tcp.mute', coords(2, 32, 55, 24), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      .set('tcp.solo', coords(60, 32, 55, 24), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      .set('tcp.recarm', coords(118, 32, 62, 24), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      // Control row 2: Phase, FX Bypass
      .set('tcp.phase', coords(2, 60, 85, 24), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      .set('tcp.fxbyp', coords(91, 60, 89, 24), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      // Volume section
      .set('tcp.volume', coords(5, 90, 170, 90, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
        font: font(10, 'Inter', 'normal', 0),
      })
      .set('tcp.volume.label', coords(5, 183, 170, 18, 0, 0, 1, 0), {
        color: { foreground: COLORS.text_secondary, background: undefined },
        font: font(9, 'Inter', 'normal', 0),
        margin: margin(2, 0, 2, 0, 0.5),
      })
      // Pan section
      .set('tcp.pan', coords(5, 205, 170, 50, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
      })
      .set('tcp.pan.label', coords(5, 258, 170, 18, 0, 0, 1, 0), {
        color: { foreground: COLORS.text_secondary, background: undefined },
        font: font(9, 'Inter', 'normal', 0),
        margin: margin(2, 0, 2, 0, 0.5),
      })
      // Width section
      .set('tcp.width', coords(5, 280, 170, 50, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
      })
      .set('tcp.width.label', coords(5, 333, 170, 18, 0, 0, 1, 0), {
        color: { foreground: COLORS.text_secondary, background: undefined },
        font: font(9, 'Inter', 'normal', 0),
        margin: margin(2, 0, 2, 0, 0.5),
      })
      // Meter display
      .set('tcp.meter', coords(5, 355, 170, 100, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
      })
);

// ============================================================================
// MASTER TRACK LAYOUTS
// ============================================================================

/**
 * Master TCP: Master track panel
 */
export const MASTER_TCP: Layout = createResponsiveLayout(
  'master_tcp',
  140,
  600,
  (builder) =>
    builder
      // Label
      .set('master.tcp.label', coords(0, 0, 140, 32), {
        color: { foreground: COLORS.accent_yellow, background: COLORS.bg_control },
        font: font(13, 'Inter', 'bold', 0),
        margin: margin(4, 4, 4, 4, 0.5),
      })
      // Mono button
      .set('master.tcp.mono', coords(2, 36, 66, 24), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      // Mute button
      .set('master.tcp.mute', coords(70, 36, 68, 24), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      // Volume fader
      .set('master.tcp.volume', coords(5, 65, 130, 100, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_yellow,
          background: COLORS.bg_control,
        },
        font: font(10, 'Inter', 'normal', 0),
      })
      .set('master.tcp.volume.label', coords(5, 168, 130, 18, 0, 0, 1, 0), {
        color: { foreground: COLORS.text_secondary, background: undefined },
        font: font(9, 'Inter', 'normal', 0),
        margin: margin(2, 0, 2, 0, 0.5),
      })
      // Pan control
      .set('master.tcp.pan', coords(5, 190, 130, 50, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_yellow,
          background: COLORS.bg_control,
        },
      })
      // Meter (large for master)
      .set('master.tcp.meter', coords(5, 245, 130, 120, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_yellow,
          background: COLORS.bg_control,
        },
      })
);

// ============================================================================
// MIXER CONTROL PANEL LAYOUTS
// ============================================================================

/**
 * MCP Compact: Narrow mixer strip (80px)
 */
export const MCP_COMPACT: Layout = createResponsiveLayout(
  'mcp_compact',
  80,
  400,
  (builder) =>
    builder
      // Label (rotated for narrow space)
      .set('mcp.label', coords(0, 0, 80, 20), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
        font: font(9, 'Inter', 'normal', 0),
        margin: margin(2, 1, 2, 1, 0.5),
      })
      // Mute button
      .set('mcp.mute', coords(2, 24, 34, 18), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      // Solo button
      .set('mcp.solo', coords(40, 24, 38, 18), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      // Volume fader (vertical)
      .set('mcp.volume', coords(5, 46, 70, 150, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
      })
      // Meter (compact)
      .set('mcp.meter', coords(10, 200, 60, 150, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
      })
);

/**
 * MCP Standard: Normal mixer strip (120px)
 */
export const MCP_STANDARD: Layout = createResponsiveLayout(
  'mcp_standard',
  120,
  500,
  (builder) =>
    builder
      // Track index
      .set('mcp.trackidx', coords(0, 0, 30, 20), {
        color: { foreground: COLORS.text_secondary, background: COLORS.bg_control },
        font: font(9, 'Inter', 'normal', 0),
        margin: margin(1, 1, 1, 1, 0.5),
      })
      // Label
      .set('mcp.label', coords(32, 0, 88, 20), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
        font: font(10, 'Inter', 'normal', 0),
        margin: margin(2, 1, 2, 1, 0.5),
      })
      // Mute button
      .set('mcp.mute', coords(2, 24, 55, 18), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      // Solo button
      .set('mcp.solo', coords(61, 24, 57, 18), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      // Volume fader
      .set('mcp.volume', coords(5, 47, 110, 180, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
        font: font(9, 'Inter', 'normal', 0),
      })
      .set('mcp.volume.label', coords(5, 230, 110, 16, 0, 0, 1, 0), {
        color: { foreground: COLORS.text_secondary, background: undefined },
        font: font(8, 'Inter', 'normal', 0),
        margin: margin(1, 0, 1, 0, 0.5),
      })
      // Pan control
      .set('mcp.pan', coords(5, 250, 110, 40, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
      })
      // Meter
      .set('mcp.meter', coords(10, 295, 100, 150, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_blue,
          background: COLORS.bg_control,
        },
      })
);

// ============================================================================
// MASTER MIXER LAYOUTS
// ============================================================================

/**
 * Master MCP: Master channel in mixer
 */
export const MASTER_MCP: Layout = createResponsiveLayout(
  'master_mcp',
  120,
  500,
  (builder) =>
    builder
      // Label (styled differently for master)
      .set('master.mcp.label', coords(0, 0, 120, 24), {
        color: { foreground: COLORS.accent_yellow, background: COLORS.bg_control },
        font: font(11, 'Inter', 'bold', 0),
        margin: margin(2, 2, 2, 2, 0.5),
      })
      // Mono button
      .set('master.mcp.mono', coords(2, 28, 55, 18), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      // Mute button
      .set('master.mcp.mute', coords(61, 28, 57, 18), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
      })
      // Volume fader
      .set('master.mcp.volume', coords(5, 50, 110, 200, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_yellow,
          background: COLORS.bg_control,
        },
        font: font(10, 'Inter', 'normal', 0),
      })
      .set('master.mcp.volume.label', coords(5, 253, 110, 16, 0, 0, 1, 0), {
        color: { foreground: COLORS.text_secondary, background: undefined },
        font: font(9, 'Inter', 'normal', 0),
        margin: margin(1, 0, 1, 0, 0.5),
      })
      // Pan control
      .set('master.mcp.pan', coords(5, 273, 110, 50, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_yellow,
          background: COLORS.bg_control,
        },
      })
      // Large meter display
      .set('master.mcp.meter', coords(10, 328, 100, 150, 0, 0, 1, 0), {
        color: {
          foreground: COLORS.accent_yellow,
          background: COLORS.bg_control,
        },
      })
);

// ============================================================================
// TRANSPORT LAYOUTS
// ============================================================================

/**
 * Transport: Playback and recording controls
 */
export const TRANSPORT_LAYOUT: Layout = createResponsiveLayout(
  'transport',
  1920,
  60,
  (builder) =>
    builder
      // Play button
      .set('trans.play', coords(10, 5, 50, 50), {
        color: { foreground: COLORS.accent_blue, background: COLORS.bg_control },
        zOrder: 10,
      })
      // Stop button
      .set('trans.stop', coords(65, 5, 50, 50), {
        color: { foreground: COLORS.accent_blue, background: COLORS.bg_control },
        zOrder: 10,
      })
      // Record button
      .set('trans.rec', coords(120, 5, 50, 50), {
        color: { foreground: COLORS.accent_red, background: COLORS.bg_control },
        zOrder: 10,
      })
      // BPM display
      .set('trans.bpm.edit', coords(180, 10, 80, 40), {
        color: { foreground: COLORS.text_primary, background: COLORS.bg_control },
        font: font(14, 'Inter', 'normal', 0),
        margin: margin(4, 2, 4, 2, 0.5),
      })
      // Time signature
      .set('trans.curtimesig', coords(270, 10, 60, 40), {
        color: { foreground: COLORS.text_secondary, background: COLORS.bg_control },
        font: font(12, 'Inter', 'normal', 0),
        margin: margin(2, 2, 2, 2, 0.5),
      })
      // Status display (right-aligned)
      .set('trans.status', coords(1700, 10, 200, 40, 1, 0, 1, 0), {
        color: { foreground: COLORS.text_secondary, background: COLORS.bg_control },
        font: font(10, 'Inter', 'normal', 0),
        margin: margin(2, 2, 4, 2, 1),
      })
);

// ============================================================================
// LAYOUT EXPORT MAP
// ============================================================================

export const WALTER_LAYOUTS = {
  tcp_compact: TCP_COMPACT,
  tcp_standard: TCP_STANDARD,
  tcp_extended: TCP_EXTENDED,
  master_tcp: MASTER_TCP,
  mcp_compact: MCP_COMPACT,
  mcp_standard: MCP_STANDARD,
  master_mcp: MASTER_MCP,
  transport: TRANSPORT_LAYOUT,
};
