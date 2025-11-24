/**
 * WALTER Layout Quick Reference & Examples
 * 
 * Copy-paste ready examples for common layout tasks
 */

import {
  LayoutBuilder,
  coords,
  rgba,
  font,
  WalterExpressionEngine,
} from './walterConfig';
import {
  TCP_STANDARD,
  TCP_COMPACT,
  TCP_EXTENDED,
  MCP_STANDARD,
  MCP_COMPACT,
  MASTER_TCP,
  MASTER_MCP,
  TRANSPORT_LAYOUT,
} from './walterLayouts';
import { useWalterElement, useWalterExpression } from '../components/useWalterLayout';

// ============================================================================
// QUICK REFERENCE: COMMON TASKS
// ============================================================================

/**
 * TASK 1: Create a simple track panel layout
 */
export function example_simpleTrackPanel() {
  const layout = new LayoutBuilder('my_track_panel', 140, 500)
    // Track label at top
    .set('tcp.label', coords(0, 0, 140, 24, 0, 0, 1, 0), {
      color: { foreground: rgba(200, 200, 200) },
    })
    // Mute and Solo buttons
    .set('tcp.mute', coords(2, 28, 65, 20))
    .set('tcp.solo', coords(70, 28, 68, 20))
    // Volume fader fills remaining space
    .set('tcp.volume', coords(5, 52, 130, 150, 0, 0, 1, 1))
    .build();

  return layout;
}

/**
 * TASK 2: Responsive layout that adapts to width
 */
export function example_responsiveLayout() {
  const layout = new LayoutBuilder('responsive_tcp', 1920, 1080)
    .set('tcp.label', coords(0, 0, 140, 24, 0, 0, 1, 0))
    .set('tcp.mute', coords(2, 28, 65, 20))
    .set('tcp.solo', coords(70, 28, 68, 20))
    .set('tcp.volume', coords(5, 52, 130, 80, 0, 0, 1, 0))
    // Show pan control only if width > 160px
    .addResponsiveRule('w>160', 'tcp.pan', {
      y: 135,
      w: 130,
      h: 50,
    })
    // Show meter only if width > 200px
    .addResponsiveRule('w>200', 'tcp.meter', {
      y: 190,
      w: 130,
      h: 80,
    })
    // Hide solo if width < 100px (emergency compact mode)
    .addResponsiveRule('w<100', 'tcp.solo', {
      w: 0,
      h: 0,
    })
    .build();

  return layout;
}

/**
 * TASK 3: Master track with custom colors
 */
export function example_masterTrackLayout() {
  const layout = new LayoutBuilder('master_panel', 160, 600)
    // Master label in gold/yellow
    .set('master.tcp.label', coords(0, 0, 160, 32), {
      color: {
        foreground: rgba(202, 138, 4),     // Gold
        background: rgba(31, 41, 55),      // Dark
      },
      font: font(14, 'Inter', 'bold', 0),
    })
    // Controls
    .set('master.tcp.mono', coords(2, 36, 75, 24))
    .set('master.tcp.mute', coords(80, 36, 78, 24))
    // Master volume in gold
    .set('master.tcp.volume', coords(5, 65, 150, 120, 0, 0, 1, 0), {
      color: {
        foreground: rgba(202, 138, 4),     // Gold volume
        background: rgba(31, 41, 55),
      },
    })
    // Meter in gold
    .set('master.tcp.meter', coords(5, 190, 150, 100, 0, 0, 1, 0), {
      color: {
        foreground: rgba(202, 138, 4),
        background: rgba(31, 41, 55),
      },
    })
    .build();

  return layout;
}

/**
 * TASK 4: Mixer strip with proportional spacing
 */
export function example_mixerStrip() {
  const layout = new LayoutBuilder('mixer_strip', 120, 600)
    // Track index (small)
    .set('mcp.trackidx', coords(0, 0, 30, 20), {
      color: { foreground: rgba(150, 150, 150) },
    })
    // Track name (fills width)
    .set('mcp.label', coords(32, 0, 88, 20, 0, 0, 1, 0), {
      color: { foreground: rgba(200, 200, 200) },
    })
    // Buttons (50/50 split)
    .set('mcp.mute', coords(2, 24, 55, 18))
    .set('mcp.solo', coords(61, 24, 57, 18))
    // Volume fader (takes up most height)
    .set('mcp.volume', coords(5, 47, 110, 200, 0, 0, 1, 0), {
      color: { foreground: rgba(100, 150, 255) },
    })
    // Meter at bottom
    .set('mcp.meter', coords(10, 252, 100, 120, 0, 0, 1, 0))
    .build();

  return layout;
}

/**
 * TASK 5: Use expressions to show/hide elements
 */
export function example_conditionalLayout() {
  const layout = new LayoutBuilder('conditional', 1920, 1080)
    .set('tcp.label', coords(0, 0, 140, 24, 0, 0, 1, 0))
    // Always show mute/solo
    .set('tcp.mute', coords(2, 28, 65, 20))
    .set('tcp.solo', coords(70, 28, 68, 20))
    // Volume always visible
    .set('tcp.volume', coords(5, 52, 130, 80, 0, 0, 1, 0))
    // Show advanced controls for record-armed tracks
    .addResponsiveRule('?recarm', 'tcp.recmon', {
      y: 135,
      w: 130,
      h: 40,
    })
    .addResponsiveRule('?recarm', 'tcp.recinput', {
      y: 180,
      w: 130,
      h: 25,
    })
    .build();

  return layout;
}

// ============================================================================
// COMPONENT EXAMPLES
// ============================================================================

/**
 * Example: Track Panel Component
 */
export function ExampleTrackPanel() {
  const { style: labelStyle, colors: labelColors } = useWalterElement('tcp.label');
  const { style: muteStyle, colors: muteColors } = useWalterElement('tcp.mute');
  const { style: volumeStyle } = useWalterElement('tcp.volume');

  return (
    <div className="track-panel">
      <div style={{ ...labelStyle, color: labelColors.fg }}>
        Track Name
      </div>
      <button style={{ ...muteStyle, color: muteColors.fg }}>
        Mute
      </button>
      <div style={{ ...volumeStyle }}>
        <input type="range" />
      </div>
    </div>
  );
}

/**
 * Example: Responsive Mixer Strip
 */
export function ExampleMixerStrip() {
  const shouldShowMeter = useWalterExpression('w>150');
  const { style: nameStyle } = useWalterElement('mcp.label');
  const { style: volumeStyle } = useWalterElement('mcp.volume');

  return (
    <div className="mixer-strip">
      <div style={nameStyle}>Strip Name</div>
      <div style={volumeStyle}>
        <input type="range" />
      </div>
      {shouldShowMeter && (
        <div>Meter</div>
      )}
    </div>
  );
}

/**
 * Example: Master Track
 */
export function ExampleMasterTrack() {
  const { style: labelStyle } = useWalterElement('master.tcp.label');
  const { style: volumeStyle } = useWalterElement('master.tcp.volume');
  const { style: meterStyle } = useWalterElement('master.tcp.meter');

  return (
    <div className="master-track">
      <div style={labelStyle}>Master</div>
      <div style={volumeStyle}>
        <input type="range" />
      </div>
      <div style={meterStyle}>Meter</div>
    </div>
  );
}

/**
 * Example: Using Expression Engine Directly
 */
export function ExampleExpressionEngine() {
  const engine = new WalterExpressionEngine(1920, 1080);

  // Test conditions
  const isNarrow = engine.evaluateCondition('w<100');
  const isTall = engine.evaluateCondition('h>600');
  const compactMode = engine.evaluateCondition('w<100&h<600');

  console.log('Narrow?', isNarrow);
  console.log('Tall?', isTall);
  console.log('Compact mode?', compactMode);

  // Test arithmetic
  const halfWidth = engine.evaluateValue('w/2');
  const doubled = engine.evaluateValue('100*2');

  console.log('Half width:', halfWidth);
  console.log('Doubled:', doubled);
}

// ============================================================================
// LAYOUT COMPARISON TABLE
// ============================================================================

/**
 * Choose a layout:
 *
 * Layout              | Width | Height | Best For
 * ------------------- | ----- | ------ | -------
 * TCP_COMPACT         | 110px | 400px  | Narrow views, emergency compact
 * TCP_STANDARD        | 140px | 500px  | Default track panel (RECOMMENDED)
 * TCP_EXTENDED        | 180px | 700px  | Large displays with all controls
 * MCP_COMPACT         | 80px  | 400px  | Narrow mixer strips
 * MCP_STANDARD        | 120px | 500px  | Default mixer strip (RECOMMENDED)
 * MASTER_TCP          | 160px | 600px  | Master track panel
 * MASTER_MCP          | 120px | 500px  | Master mixer strip
 * TRANSPORT_LAYOUT    | 1920px| 60px   | Playback controls
 */

// ============================================================================
// COLOR PALETTE REFERENCE
// ============================================================================

export const COLOR_PALETTE = {
  // Standard UI
  primary_bg: rgba(17, 24, 39),       // Main background
  secondary_bg: rgba(31, 41, 55),     // Control backgrounds
  tertiary_bg: rgba(3, 7, 18),        // Darkest background

  // Text
  text_bright: rgba(255, 255, 255),   // White text
  text_normal: rgba(209, 213, 219),   // Normal text
  text_dim: rgba(107, 114, 128),      // Dim/secondary text

  // Accents
  blue: rgba(59, 130, 246),           // Primary accent
  red: rgba(220, 38, 38),             // Error/record
  yellow: rgba(202, 138, 4),          // Master/warning
  green: rgba(34, 197, 94),           // Success/armed

  // Borders
  border_light: rgba(75, 85, 99),
  border_dark: rgba(55, 65, 81),
};

// ============================================================================
// DEBUGGING HELPERS
// ============================================================================

/**
 * Log layout structure for debugging
 */
export function debugLayout(layout: any) {
  console.group('Layout Debug Info');
  console.log('Name:', layout.name);
  console.log('Elements:', Object.keys(layout.elements || {}).length);
  console.log('Element names:', Object.keys(layout.elements || {}));
  if (layout.responsiveRules) {
    console.log('Responsive rules:');
    layout.responsiveRules.forEach((rule: any) => {
      console.log(`  ${rule.condition} → ${rule.elementName}`);
    });
  }
  console.groupEnd();
}

/**
 * Test coordinate values
 */
export function debugCoordinates(coords: any) {
  console.group('Coordinate Debug');
  console.log('Position:', `(${coords.x}, ${coords.y})`);
  console.log('Size:', `${coords.w}x${coords.h}px`);
  console.log('Attachment:', `[${coords.ls} ${coords.ts} ${coords.rs} ${coords.bs}]`);
  console.log('Responsive?', coords.ls !== 0 || coords.ts !== 0 || coords.rs !== 0 || coords.bs !== 0);
  console.groupEnd();
}

/**
 * Test expressions
 */
export function debugExpression(expression: string, engine: WalterExpressionEngine) {
  console.group(`Expression: "${expression}"`);
  const result = engine.evaluateCondition(expression);
  console.log('Result:', result);
  console.groupEnd();
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

/**
 * Minimal DAW interface (compact everything)
 */
export function createMinimalLayout() {
  return {
    tcp: TCP_COMPACT,
    mcp: MCP_COMPACT,
    master_tcp: MASTER_TCP,
    master_mcp: MASTER_MCP,
    transport: TRANSPORT_LAYOUT,
  };
}

/**
 * Standard DAW interface (balanced)
 */
export function createStandardLayout() {
  return {
    tcp: TCP_STANDARD,
    mcp: MCP_STANDARD,
    master_tcp: MASTER_TCP,
    master_mcp: MASTER_MCP,
    transport: TRANSPORT_LAYOUT,
  };
}

/**
 * Extended DAW interface (maximum features)
 */
export function createExtendedLayout() {
  return {
    tcp: TCP_EXTENDED,
    mcp: MCP_STANDARD,
    master_tcp: MASTER_TCP,
    master_mcp: MASTER_MCP,
    transport: TRANSPORT_LAYOUT,
  };
}
