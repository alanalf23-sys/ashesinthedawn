# WALTER Layout System for CoreLogic Studio

**Last Updated**: November 24, 2025  
**System**: Window Arrangement Logic Template Engine (React)  
**Status**: ✅ Production Ready

---

## Overview

WALTER (Window Arrangement Logic Template Engine) brings REAPER's powerful layout system to CoreLogic Studio. Instead of hardcoded pixel positions, layouts are defined declaratively using:

- **Coordinate lists** `[x y w h ls ts rs bs]` - Position + edge attachment
- **Expressions** `w<100`, `h>200` - Responsive conditions
- **Scalar values** - Variables like `w` (width), `h` (height)
- **Macros & presets** - Reusable layout patterns

---

## Quick Start

### 1. Basic Layout Definition

```typescript
import { LayoutBuilder, coords, rgba, font, margin } from '@/config/walterConfig';

const myLayout = new LayoutBuilder('custom', 1920, 1080)
  .set('tcp.mute', coords(0, 0, 20, 20), {
    color: { foreground: rgba(200, 200, 200) }
  })
  .set('tcp.solo', coords(25, 0, 20, 20), {
    color: { foreground: rgba(200, 200, 200) }
  })
  .build();
```

### 2. Use in React Components

```typescript
import { WalterLayoutProvider, useWalterElement } from '@/components/WalterLayout';
import { TCP_STANDARD } from '@/config/walterLayouts';

function TrackPanel() {
  return (
    <WalterLayoutProvider layout={TCP_STANDARD} parentWidth={140} parentHeight={500}>
      <MuteButton />
      <VolumeSlider />
    </WalterLayoutProvider>
  );
}

function MuteButton() {
  const { style, colors } = useWalterElement('tcp.mute');
  return (
    <button style={{...style, color: colors.fg}}>
      Mute
    </button>
  );
}
```

### 3. Responsive Layouts

```typescript
const builder = new LayoutBuilder('responsive', 1920, 1080);

builder
  .set('tcp.volume', coords(5, 30, 110, 80))
  // Hide meter when width < 100px
  .addResponsiveRule('w<100', 'tcp.meter', { h: 0 })
  // Make fader wider on larger screens
  .addResponsiveRule('w>200', 'tcp.volume', { w: 150 })
  .build();
```

---

## Core Concepts

### Coordinates: `[x y w h ls ts rs bs]`

Eight-value array controlling position and responsive attachment:

```
[0 0 20 20 0 0 1 1]
 ^ ^ ^  ^  ^ ^ ^ ^
 | | |  |  | | | └─ Bottom attach scale (0-1)
 | | |  |  | | └──── Right attach scale (0-1)
 | | |  |  | └─────── Top attach scale (0-1)
 | | |  |  └──────── Left attach scale (0-1)
 | | |  └─────────── Height (before scaling)
 | | └─────────────── Width (before scaling)
 | └───────────────── Top position
 └─────────────────── Left position
```

**Example: Responsive width**
```typescript
// Fixed position, width scales with 100% of parent
coords(5, 30, 110, 80, 0, 0, 1, 0)
//                       ↑ left attachment (0 = fixed)
//                          ↑ top (0 = fixed)
//                             ↑ right (1 = scales)
//                                ↑ bottom (0 = fixed)
```

### Expressions & Conditions

Support responsive logic:

```typescript
// Comparisons
"w<100"      // If parent width < 100px
"h>200"      // If parent height > 200px
"w<=100"     // Less than or equal
"h>=200"     // Greater than or equal
"w==100"     // Exactly equal
"w!=100"     // Not equal

// Bitwise operations
"w<100&recarm"   // Width < 100 AND track record-armed

// Negation
"!recarm"        // Track NOT record-armed
"?recarm"        // Track IS record-armed
```

### Scalar Values

Variables in expressions:

```typescript
// Predefined
w              // Parent width
h              // Parent height
reaper_version // REAPER version (compatibility)
os_type        // 0=Windows, 1=macOS, 2=Linux

// Track-specific
recarm         // Record armed (0 or 1)
trackcolor_r   // Track color red component
trackcolor_g   // Track color green component
trackcolor_b   // Track color blue component
```

### Edge Attachment

Controls how element scales with parent:

```typescript
// Fixed (no scaling)
coords(10, 10, 100, 50, 0, 0, 0, 0)

// Responsive (scales with parent)
coords(10, 10, 100, 50, 0, 0, 1, 0)  // Right edge scales
coords(10, 10, 100, 50, 0, 0, 1, 1)  // Right and bottom scale

// 50% scaling
coords(10, 10, 100, 50, 0, 0, 0.5, 0)  // Right scales at 50%
```

---

## Pre-defined Layouts

### Track Control Panel (TCP)

```typescript
import { TCP_COMPACT, TCP_STANDARD, TCP_EXTENDED } from '@/config/walterLayouts';

// Compact: 110px width, minimal controls
TCP_COMPACT

// Standard: 140px width, full controls
TCP_STANDARD

// Extended: 180px width, all features
TCP_EXTENDED
```

**TCP Elements**:
- `tcp.label` - Track name
- `tcp.mute` - Mute button
- `tcp.solo` - Solo button
- `tcp.recarm` - Record arm button
- `tcp.volume` - Volume fader
- `tcp.volume.label` - Volume readout
- `tcp.pan` - Pan control
- `tcp.pan.label` - Pan readout
- `tcp.width` - Stereo width fader
- `tcp.meter` - Level meter
- `tcp.fxbyp` - FX bypass button
- `tcp.phase` - Phase flip button

### Mixer Control Panel (MCP)

```typescript
import { MCP_COMPACT, MCP_STANDARD } from '@/config/walterLayouts';

// Compact: 80px narrow mixer strip
MCP_COMPACT

// Standard: 120px normal mixer strip
MCP_STANDARD
```

**MCP Elements**:
- `mcp.label` - Track name
- `mcp.trackidx` - Track number
- `mcp.mute` - Mute button
- `mcp.solo` - Solo button
- `mcp.recarm` - Record arm button
- `mcp.volume` - Volume fader
- `mcp.volume.label` - Volume readout
- `mcp.pan` - Pan control
- `mcp.meter` - Level meter
- `mcp.fxin` - Input FX button
- `mcp.phase` - Phase flip button

### Master Tracks

```typescript
import { MASTER_TCP, MASTER_MCP } from '@/config/walterLayouts';

// Master track panel
MASTER_TCP

// Master mixer strip
MASTER_MCP
```

### Transport

```typescript
import { TRANSPORT_LAYOUT } from '@/config/walterLayouts';

TRANSPORT_LAYOUT  // Playback controls
```

**Transport Elements**:
- `trans.play` - Play button
- `trans.stop` - Stop button
- `trans.pause` - Pause button
- `trans.rec` - Record button
- `trans.bpm.edit` - BPM display
- `trans.curtimesig` - Time signature
- `trans.status` - Status message

---

## Usage Patterns

### Pattern 1: Responsive Track Panel

Adjust layout based on available width:

```typescript
const builder = new LayoutBuilder('adaptive', 1920, 1080);

builder
  // Standard controls (always visible)
  .set('tcp.label', coords(0, 0, 140, 24, 0, 0, 1, 0))
  .set('tcp.mute', coords(2, 28, 65, 20))
  .set('tcp.solo', coords(70, 28, 68, 20))
  // Volume (always visible)
  .set('tcp.volume', coords(5, 52, 130, 80, 0, 0, 1, 0))
  // Pan (show if width > 150px)
  .addResponsiveRule('w>150', 'tcp.pan', { x: 5, y: 135, w: 130, h: 40 })
  // Meter (show if width > 200px)
  .addResponsiveRule('w>200', 'tcp.meter', { x: 5, y: 180, w: 130, h: 80 })
  // Hide everything if width < 80px
  .addResponsiveRule('w<80', 'tcp.solo', { w: 0, h: 0 })
  .build();
```

### Pattern 2: Master Track Styling

Different colors and layout for master:

```typescript
const builder = new LayoutBuilder('master', 1920, 1080);

builder
  .set('master.tcp.label', coords(0, 0, 140, 32), {
    color: { foreground: rgba(202, 138, 4) }, // Yellow
    font: font(13, 'Inter', 'bold', 0),
  })
  .set('master.tcp.volume', coords(5, 65, 130, 100, 0, 0, 1, 0), {
    color: { foreground: rgba(202, 138, 4) }, // Master volume in yellow
  })
  .set('master.tcp.meter', coords(5, 170, 130, 100, 0, 0, 1, 0), {
    color: { foreground: rgba(202, 138, 4) }, // Master meter in yellow
  })
  .build();
```

### Pattern 3: Compact Mixer View

All strips at fixed narrow width:

```typescript
const mixerLayout = new LayoutBuilder('mixer', 1920, 1080);

// All strips use compact layout
const stripWidth = 100;

mixerLayout
  .set('mcp.label', coords(0, 0, stripWidth, 20))
  .set('mcp.mute', coords(2, 24, stripWidth / 2 - 2, 18))
  .set('mcp.solo', coords(stripWidth / 2 + 2, 24, stripWidth / 2 - 2, 18))
  .set('mcp.volume', coords(5, 46, stripWidth - 10, 150, 0, 0, 1, 0))
  .set('mcp.meter', coords(10, 200, stripWidth - 20, 100, 0, 0, 1, 0))
  // Respond to very narrow screens
  .addResponsiveRule('w<600', 'mcp.volume', { h: 100 })
  .addResponsiveRule('w<600', 'mcp.meter', { h: 50 })
  .build();
```

---

## React Hooks API

### `useWalterLayout()`

Get access to layout context:

```typescript
function MyComponent() {
  const {
    layout,                  // Current layout object
    parentWidth,             // Parent container width
    parentHeight,            // Parent container height
    getElementStyle,         // (name) => CSSProperties
    getElementColor,         // (name) => {fg, bg}
    getElementMargin,        // (name) => margin string
    getResponsiveCoords,     // (name) => Coordinates
    engine,                  // Expression engine
  } = useWalterLayout();
}
```

### `useWalterElement(elementName)`

Get style for specific element:

```typescript
function VolumeSlider() {
  const { style, colors, margin, coords } = useWalterElement('tcp.volume');

  return (
    <div
      style={{
        ...style,
        color: colors.fg,
        backgroundColor: colors.bg,
        margin,
      }}
    >
      Volume Slider
    </div>
  );
}
```

### `useWalterExpression(expression)`

Evaluate responsive condition:

```typescript
function OptionalMeter() {
  const shouldShow = useWalterExpression('w>200');

  return shouldShow ? <Meter /> : null;
}
```

### `StyledWalterElement`

Generic component with built-in styling:

```typescript
<StyledWalterElement
  elementName="tcp.mute"
  as="button"
  onClick={handleMute}
>
  Mute
</StyledWalterElement>
```

---

## Color System

### Predefined Colors (Codette Theme)

```typescript
import { COLORS } from '@/config/walterLayouts';

COLORS.bg_panel      // rgba(17, 24, 39) - gray-900
COLORS.bg_control    // rgba(31, 41, 55) - gray-800
COLORS.bg_dark       // rgba(3, 7, 18) - gray-950

COLORS.text_primary      // rgba(209, 213, 219) - gray-300
COLORS.text_secondary    // rgba(107, 114, 128) - gray-500
COLORS.text_highlight    // rgba(59, 130, 246) - blue-500

COLORS.accent_blue       // rgba(59, 130, 246) - blue-600
COLORS.accent_red        // rgba(220, 38, 38) - red-600
COLORS.accent_yellow     // rgba(202, 138, 4) - yellow-600

COLORS.border_light      // rgba(75, 85, 99) - gray-700
COLORS.border_dark       // rgba(55, 65, 81) - gray-600
```

### Custom Colors

```typescript
import { rgba } from '@/config/walterConfig';

const customLayout = new LayoutBuilder('custom', 1920, 1080)
  .set('tcp.mute', coords(0, 0, 20, 20), {
    color: {
      foreground: rgba(255, 100, 100, 200),  // Semi-transparent red
      background: rgba(50, 50, 50, 255),     // Dark gray
    }
  })
  .build();
```

---

## Integration Examples

### Integrating with Mixer Component

```typescript
import { useWalterLayout } from '@/components/WalterLayout';
import { MCP_STANDARD } from '@/config/walterLayouts';

export function MixerStrip({ trackId }) {
  return (
    <WalterLayoutProvider layout={MCP_STANDARD} parentWidth={120} parentHeight={500}>
      <div className="mixer-strip">
        <TrackLabel />
        <MuteButton />
        <SoloButton />
        <VolumeFader />
        <LevelMeter />
      </div>
    </WalterLayoutProvider>
  );
}

function TrackLabel() {
  const { style, colors } = useWalterElement('mcp.label');
  return <div style={{...style, color: colors.fg}}>Track Name</div>;
}

function VolumeFader() {
  const { style, colors } = useWalterElement('mcp.volume');
  return (
    <div style={{...style, backgroundColor: colors.bg}}>
      <input type="range" min="-60" max="6" defaultValue="0" />
    </div>
  );
}
```

### Responsive Navigation Bar

```typescript
function ResponsiveTransport() {
  const shouldShowBPM = useWalterExpression('w>300');
  const shouldShowTimeSig = useWalterExpression('w>400');

  return (
    <WalterLayoutProvider layout={TRANSPORT_LAYOUT} parentWidth={window.innerWidth} parentHeight={60}>
      <PlayButton />
      <StopButton />
      <RecordButton />
      {shouldShowBPM && <BPMDisplay />}
      {shouldShowTimeSig && <TimeSignatureDisplay />}
    </WalterLayoutProvider>
  );
}
```

---

## Advanced Features

### Macros (Future Feature)

Currently planning macro support:

```typescript
// Define macro
macro setall dest src
  set dest [src src src src src src src src]
  set master.##dest dest
endmacro

// Use macro
setall tcp.mute 1
```

### Parameters (Future Feature)

Theme parameters customizable per user:

```typescript
define_parameter "hide_mute" "Hide Mute Button" 0 0 1

// In layout
set tcp.mute hide_mute==1 [0] [10 10 20 20]
```

---

## Migration Guide

### From Old Hardcoded Layout

**Before**:
```typescript
<div style={{position: 'absolute', left: '0px', top: '0px', width: '20px', height: '20px'}}>
  Mute
</div>
```

**After**:
```typescript
import { useWalterElement } from '@/components/WalterLayout';

function MuteButton() {
  const { style } = useWalterElement('tcp.mute');
  return <button style={style}>Mute</button>;
}
```

---

## Performance Tips

1. **Memoize layouts** - Define layouts at module level, not per-component
2. **Use ResponsiveLayout** - Handles resize events efficiently
3. **Batch responsive rules** - Add multiple rules at once
4. **Avoid recalculating** - Use hook memoization

```typescript
// ✅ Good - Memoized
const myLayout = useMemo(() => TCP_STANDARD, []);

// ✅ Good - Hooks memoize internally
const { style } = useWalterElement('tcp.mute');

// ❌ Avoid - Recalculates every render
const myLayout = new LayoutBuilder('name', 1920, 1080).build();
```

---

## Debugging

### Log Layout Structure

```typescript
const { layout, engine } = useWalterLayout();
console.log('Layout elements:', Object.keys(layout.elements));
console.log('Layout rules:', layout.responsiveRules);
```

### Test Expressions

```typescript
const { engine } = useWalterLayout();
console.log(engine.evaluateCondition('w<100'));  // true/false
console.log(engine.evaluateValue('50*2'));       // 100
```

---

## REAPER WALTER Reference

This system brings REAPER's WALTER to React. Key mappings:

| REAPER WALTER | CoreLogic WALTER |
|---|---|
| `set tcp.mute [...]` | `.set('tcp.mute', coords(...))` |
| `clear tcp.mute` | `.clear('tcp.mute')` |
| `reset tcp.*` | `.clear('tcp.*')` (pattern support TBD) |
| `w<100 [...] [...]` | `.addResponsiveRule('w<100', ...)` |
| `[0 0 20 20 0 0 1 1]` | `coords(0, 0, 20, 20, 0, 0, 1, 1)` |
| Layouts | `WALTER_LAYOUTS` export |
| Presets | `WALTER_PRESETS` export |

---

## File Structure

```
src/
├── config/
│   ├── walterConfig.ts          # Core engine & types
│   └── walterLayouts.ts         # Pre-defined layouts
├── components/
│   └── WalterLayout.tsx         # React provider & hooks
└── docs/
    └── WALTER_LAYOUT_GUIDE.md   # This file
```

---

## Future Enhancements

- [ ] Macro system for layout templates
- [ ] User parameter customization
- [ ] Theme switcher UI
- [ ] Layout preview/editor
- [ ] Animation support (transition between layouts)
- [ ] Virtual scrolling for 100+ tracks
- [ ] Undo/redo for layout changes
- [ ] Export/import custom layouts

---

**Status**: ✅ Production Ready  
**TypeScript**: 0 errors  
**Browser Support**: All modern browsers (Chrome, Firefox, Safari, Edge)
