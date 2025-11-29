# Configuration Integration Guide

## Overview

This guide explains how to integrate the new `appConfig.ts` system throughout the CoreLogic Studio codebase. The configuration system is now fully implemented and ready for use across all components and services.

## Quick Integration Checklist (Updated Phase 7)

- [x] `appConfig.ts` created and exported
- [x] `configConstants.ts` created with utilities
- [x] `.env.example` updated with all options
- [x] `package.json` updated with metadata
- [x] `DAWContext.tsx` imports `APP_CONFIG`
- [x] Audio engine uses `APP_CONFIG` (Phase 7 ✅ FIXED)
- [x] Components use `APP_CONFIG` display settings (Phase 7 ✅ FIXED)
- [x] Module-level APP_CONFIG access issues resolved (Phase 7 ✅ FIXED)
- [ ] Theme system fully integrated (Phase 4 - Pending)

## Current Alignment Status (Updated Phase 7 ✅)

### Files Using APP_CONFIG - Phase 5 Integration Complete ✅
- ✅ `.env.example` - All 72 options documented
- ✅ `package.json` - Metadata updated to v7.0.0
- ✅ `src/contexts/DAWContext.tsx` - Imports available
- ✅ `src/themes/ThemeContext.tsx` - Themes match spec
- ✅ `src/themes/presets.ts` - 4 themes aligned
- ✅ `src/lib/audioEngine.ts` - Uses APP_CONFIG.transport (METRONOME_ENABLED) ✅ FIXED
- ✅ `src/components/TopBar.tsx` - Uses APP_CONFIG.transport (TIMER_FORMAT) ✅ VERIFIED
- ✅ `src/components/Mixer.tsx` - Uses APP_CONFIG.display (CHANNEL_WIDTH) & APP_CONFIG.audio (MAX_TRACKS) ✅ FIXED
- ✅ `src/components/TrackList.tsx` - Uses APP_CONFIG.audio (MAX_TRACKS) ✅ VERIFIED

### Phase 7 Integration Status ✅ COMPLETE
- ✅ **Phase 5 Components**: 4/4 integrated
- ✅ **Active Configuration Options**: 4/72 (METRONOME_ENABLED, TIMER_FORMAT, CHANNEL_WIDTH, MAX_TRACKS)
- ✅ **Module-Level Access Issues**: ALL RESOLVED
- ✅ **GUI Rendering**: WORKING at http://localhost:5173/
- ✅ **TypeScript Validation**: 0 ERRORS
- ✅ **Configuration System**: PRODUCTION READY

### Files Ready for Phase 4 Integration (5 Components Pending)
- ⏳ `src/components/Timeline.tsx` - Should use APP_CONFIG.display (ZOOM_MIN, ZOOM_MAX, AUTOMATION_OVERLAY)
- ⏳ `src/components/AdvancedMeter.tsx` - Should use APP_CONFIG.audio (VU_REFRESH_MS, METERING_PEAK_HOLD_MS)
- ⏳ `src/components/AudioSettingsModal.tsx` - Should use APP_CONFIG.audio (SAMPLE_RATE, BUFFER_SIZE)
- ⏳ `src/themes/ThemeContext.tsx` - Should use APP_CONFIG.theme (AVAILABLE_THEMES, DEFAULT_THEME)
- ⏳ `src/components/Sidebar.tsx` - Should use APP_CONFIG.display (SIDEBAR_WIDTH, SIDEBAR_VISIBILITY)

## Integration Patterns

### Pattern 1: Using Configuration in a Service

```typescript
// In src/lib/audioEngine.ts

import { APP_CONFIG } from '../config/appConfig';

export function initializeAudioEngine() {
  const sampleRate = APP_CONFIG.audio.SAMPLE_RATE;
  const bufferSize = APP_CONFIG.audio.BUFFER_SIZE;
  const maxChannels = APP_CONFIG.audio.MAX_CHANNELS;
  
  // Use in audio context initialization
  const audioContext = new AudioContext({
    sampleRate: sampleRate,
    // ...other config
  });
  
  return audioContext;
}
```

### Pattern 2: Using Configuration in a React Component

```typescript
// In src/components/Mixer.tsx

import { APP_CONFIG } from '../config/appConfig';

export function Mixer() {
  const channelCount = APP_CONFIG.display.CHANNEL_COUNT;
  const channelWidth = APP_CONFIG.display.CHANNEL_WIDTH;
  
  return (
    <div className="mixer">
      {Array.from({ length: channelCount }).map((_, i) => (
        <Channel 
          key={i}
          width={channelWidth}
          // ...other props
        />
      ))}
    </div>
  );
}
```

### Pattern 3: Using Configuration in Context

```typescript
// In DAWContext.tsx

import { APP_CONFIG } from '../config/appConfig';

export function DAWProvider({ children }: DAWProviderProps) {
  const [state, setState] = useState({
    maxTracks: APP_CONFIG.audio.MAX_TRACKS,
    undoStackSize: APP_CONFIG.behavior.UNDO_STACK_SIZE,
    autoSaveInterval: APP_CONFIG.behavior.AUTO_SAVE_INTERVAL_MS,
    // ...other state
  });
  
  return (
    <DAWContext.Provider value={state}>
      {children}
    </DAWContext.Provider>
  );
}
```

### Pattern 4: Conditional Rendering Based on Config

```typescript
// In src/components/UI.tsx

import { APP_CONFIG } from '../config/appConfig';

export function UILayout() {
  return (
    <>
      {APP_CONFIG.display.SHOW_WATERMARK && <Watermark />}
      {APP_CONFIG.transport.SHOW_TIMER && <Timer />}
      {APP_CONFIG.system.SPLASH_ENABLED && <SplashScreen />}
    </>
  );
}
```

### Pattern 5: Using Utility Functions

```typescript
// In components that display audio metrics

import { formatTime, dbToLinear, getThemeColors } from '../config/configConstants';

export function AudioMeter() {
  const timeString = formatTime(sampleIndex, APP_CONFIG.audio.SAMPLE_RATE, 'HH:MM:SS');
  const gain = dbToLinear(-6); // Convert -6dB to linear
  const themeColors = getThemeColors(APP_CONFIG.system.DEFAULT_THEME);
  
  return (
    <div style={{ color: themeColors.accent }}>
      {timeString}
    </div>
  );
}
```

## Component Integration Guide

### 1. TopBar Component
**File**: `src/components/TopBar.tsx`

**Required Changes**:
```typescript
import { APP_CONFIG } from '../config/appConfig';

export function TopBar() {
  const showTimer = APP_CONFIG.transport.SHOW_TIMER;
  const timerFormat = APP_CONFIG.transport.TIMER_FORMAT;
  const timerColor = APP_CONFIG.transport.TIMER_COLOR;
  
  // Use these values in component
}
```

**Impact**: Will make timer display configurable

### 2. Mixer Component
**File**: `src/components/Mixer.tsx`

**Required Changes**:
```typescript
import { APP_CONFIG } from '../config/appConfig';

export function Mixer() {
  const channelCount = APP_CONFIG.display.CHANNEL_COUNT;
  const channelWidth = APP_CONFIG.display.CHANNEL_WIDTH;
  const maxChannels = APP_CONFIG.audio.MAX_CHANNELS;
  
  // Use in layout calculations
}
```

**Impact**: Will make mixer channel count and width configurable

### 3. TrackList Component
**File**: `src/components/TrackList.tsx`

**Required Changes**:
```typescript
import { APP_CONFIG } from '../config/appConfig';

export function TrackList() {
  const maxTracks = APP_CONFIG.audio.MAX_TRACKS;
  const channelWidth = APP_CONFIG.display.CHANNEL_WIDTH;
  
  // Validate and use in track management
}
```

**Impact**: Will respect MAX_TRACKS limit from configuration

### 4. AdvancedMeter Component
**File**: `src/components/AdvancedMeter.tsx`

**Required Changes**:
```typescript
import { APP_CONFIG } from '../config/appConfig';

export function AdvancedMeter() {
  const refreshRate = APP_CONFIG.display.VU_REFRESH_MS;
  const rmsWindow = APP_CONFIG.audio.METERING_RMS_WINDOW_MS;
  const peakHold = APP_CONFIG.audio.METERING_PEAK_HOLD_MS;
  
  // Use in meter update intervals
}
```

**Impact**: Will make metering configurable and responsive

### 5. Timeline Component
**File**: `src/components/Timeline.tsx`

**Required Changes**:
```typescript
import { APP_CONFIG } from '../config/appConfig';

export function Timeline() {
  const zoomMin = APP_CONFIG.transport.ZOOM_MIN;
  const zoomMax = APP_CONFIG.transport.ZOOM_MAX;
  const zoomStep = APP_CONFIG.transport.ZOOM_STEP;
  
  // Use for zoom level constraints
}
```

**Impact**: Will make zoom constraints configurable

## Audio Engine Integration

### File: `src/lib/audioEngine.ts`

Add configuration support for:

```typescript
import { APP_CONFIG } from '../config/appConfig';

// Initialize with config values
const SAMPLE_RATE = APP_CONFIG.audio.SAMPLE_RATE;
const BUFFER_SIZE = APP_CONFIG.audio.BUFFER_SIZE;
const MAX_CHANNELS = APP_CONFIG.audio.MAX_CHANNELS;
const HEADROOM_DB = APP_CONFIG.audio.HEADROOM_DB;

// Use in audio context creation and processing
export function createAudioContext() {
  const ctx = new AudioContext({
    sampleRate: SAMPLE_RATE,
  });
  
  // Apply headroom limits
  const masterGain = ctx.createGain();
  masterGain.gain.value = dbToLinear(-HEADROOM_DB);
  
  return ctx;
}
```

## Behavior Configuration Integration

### Auto-Save

```typescript
// In DAWContext.tsx

useEffect(() => {
  if (!APP_CONFIG.behavior.AUTO_SAVE_ENABLED) return;
  
  const autoSaveTimer = setInterval(() => {
    saveProject();
  }, APP_CONFIG.behavior.AUTO_SAVE_INTERVAL_MS);
  
  return () => clearInterval(autoSaveTimer);
}, []);
```

### Undo/Redo Stack

```typescript
// In DAWContext.tsx state initialization

const MAX_UNDO_STACK = APP_CONFIG.behavior.UNDO_STACK_SIZE;
const [undoStack, setUndoStack] = useState<Action[]>([]);

// Maintain stack size
if (undoStack.length > MAX_UNDO_STACK) {
  setUndoStack(prev => prev.slice(1));
}
```

## Transport Configuration Integration

### Click Track

```typescript
// In audio engine or transport component

if (APP_CONFIG.transport.CLICK_ENABLED) {
  initializeClickTrack(
    APP_CONFIG.transport.CLICK_VOLUME,
    APP_CONFIG.audio.SAMPLE_RATE
  );
}
```

### Metronome

```typescript
// In metronome service

function initializeMetronome() {
  if (!APP_CONFIG.transport.METRONOME_ENABLED) return;
  
  const accent = APP_CONFIG.transport.METRONOME_ACCENT;
  const beat = APP_CONFIG.transport.METRONOME_BEAT;
  
  // Use in metronome calculation
}
```

## Branding Integration

### Header/Footer

```typescript
// In TopBar or Footer component

export function Header() {
  return (
    <header>
      <span style={{ color: APP_CONFIG.branding.LOGO_COLOR }}>
        {APP_CONFIG.branding.LOGO_TEXT}
      </span>
      <span>{APP_CONFIG.branding.VERSION_LABEL}</span>
    </header>
  );
}
```

### About Dialog

```typescript
// In AboutModal component

export function AboutModal() {
  return (
    <div>
      <h1>{APP_CONFIG.branding.LOGO_TEXT}</h1>
      <p>{APP_CONFIG.branding.FOOTER_TEXT}</p>
      <p>
        <a href={APP_CONFIG.branding.WEBSITE_URL}>Website</a>
        <a href={APP_CONFIG.branding.DOCUMENTATION_URL}>Docs</a>
        <a href={`mailto:${APP_CONFIG.branding.SUPPORT_EMAIL}`}>Support</a>
      </p>
    </div>
  );
}
```

## Debug Features

### Performance Monitoring

```typescript
// In development code

if (APP_CONFIG.debug.SHOW_PERFORMANCE_MONITOR) {
  // Render performance monitor component
  return <PerformanceMonitor />;
}
```

### Layout Guides

```typescript
// In layout components

{APP_CONFIG.debug.SHOW_LAYOUT_GUIDES && (
  <LayoutGuides gridSize={APP_CONFIG.display.GRID_SIZE} />
)}
```

### Logging

```typescript
// Throughout codebase

if (APP_CONFIG.debug.ENABLED && APP_CONFIG.debug.LOG_LEVEL === 'debug') {
  console.debug('Detailed debug information:', data);
}
```

## Migration Checklist

Follow this order when integrating:

### Phase 1: Services (Foundation)
- [ ] `src/lib/audioEngine.ts` - Use AUDIO_CONFIG
- [ ] `src/lib/automation.ts` - Use TRANSPORT_CONFIG if present

### Phase 2: Context (State Management)
- [ ] `src/contexts/DAWContext.tsx` - Use all relevant sections
- [ ] Ensure state defaults match APP_CONFIG

### Phase 3: Main Components
- [ ] `src/components/TopBar.tsx` - Use TRANSPORT_CONFIG
- [ ] `src/components/Mixer.tsx` - Use DISPLAY_CONFIG
- [ ] `src/components/Timeline.tsx` - Use TRANSPORT_CONFIG
- [ ] `src/components/TrackList.tsx` - Use DISPLAY_CONFIG

### Phase 4: UI Components
- [ ] `src/components/AdvancedMeter.tsx` - Use AUDIO_CONFIG
- [ ] `src/components/Waveform*.tsx` - Use AUDIO_CONFIG
- [ ] `src/components/Header.tsx` - Use BRANDING_CONFIG
- [ ] `src/components/Footer.tsx` - Use BRANDING_CONFIG

### Phase 5: Optional Features
- [ ] OSC integration (when enabled)
- [ ] MIDI integration (when enabled)
- [ ] Debug features (performance monitor, layout guides)

## Best Practices

### ✅ DO
- Use `APP_CONFIG` for configuration values
- Reference config in component initialization
- Use `getConfig<T>()` for type-safe access
- Leverage utility functions like `formatTime()`, `dbToLinear()`
- Check `APP_CONFIG.debug` for dev features

### ❌ DON'T
- Hardcode values that are in APP_CONFIG
- Duplicate configuration logic
- Create separate config objects
- Ignore environment variable overrides
- Store config in local component state (use props)

## Environment Variable Overrides

Users can override any configuration via `.env`:

```bash
# Development setup
REACT_APP_LOG_LEVEL=debug
REACT_APP_SHOW_PERF_MONITOR=true

# Production setup
REACT_APP_LOG_LEVEL=error
REACT_APP_AUTO_SAVE=true

# Large session setup
REACT_APP_CHANNEL_COUNT=16
REACT_APP_MAX_TRACKS=512
```

## Testing Configuration

```typescript
// In test files

import { APP_CONFIG, validateConfig } from '../config/appConfig';

describe('Configuration', () => {
  test('should be valid', () => {
    const errors = validateConfig();
    expect(errors).toHaveLength(0);
  });
  
  test('should have all required sections', () => {
    expect(APP_CONFIG.system).toBeDefined();
    expect(APP_CONFIG.display).toBeDefined();
    expect(APP_CONFIG.audio).toBeDefined();
  });
});
```

## Documentation Updates

After integrating APP_CONFIG into components, update:
- Component README files with configuration examples
- DEVELOPMENT.md with new configuration system
- API_REFERENCE.md with APP_CONFIG usage

## Support and Questions

For questions about:
- **Configuration options**: See `CONFIGURATION_GUIDE.md`
- **Quick reference**: See `CONFIG_QUICK_REFERENCE.md`
- **INI format**: See `CONFIG_INI_REFERENCE.md`
- **Integration details**: See this file

## Summary

The APP_CONFIG system is ready for integration. Components can start using configuration values immediately. The integration is:

- ✅ Non-breaking (no changes to component APIs)
- ✅ Gradual (can integrate components one at a time)
- ✅ Well-documented (multiple guides available)
- ✅ Type-safe (full TypeScript support)
- ✅ Flexible (environment variable overrides)

Start with Phase 1 (services) and work through the phases to fully align the codebase with the configuration system.
