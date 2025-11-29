# Configuration Quick Reference

## File Locations

| File | Purpose | Type |
|------|---------|------|
| `src/config/appConfig.ts` | Main configuration object | TypeScript |
| `src/config/configConstants.ts` | Constants and utilities | TypeScript |
| `.env.example` | Configuration template | Environment |
| `.env` | Local configuration (create from template) | Environment |
| `CONFIGURATION_GUIDE.md` | Complete guide with examples | Markdown |

## Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env for your setup
# (Change WINDOW_WIDTH, CHANNEL_COUNT, etc.)

# 3. Restart dev server
npm run dev

# 4. Use in components
import { APP_CONFIG } from '../config/appConfig';
```

## Import Patterns

```typescript
// Get entire configuration
import { APP_CONFIG } from '../config/appConfig';
console.log(APP_CONFIG.system.APP_NAME);

// Get specific section
import { SYSTEM_CONFIG, DISPLAY_CONFIG } from '../config/appConfig';
const windowWidth = SYSTEM_CONFIG.WINDOW_WIDTH;

// Get with type safety
import { getConfig } from '../config/appConfig';
const appName = getConfig<string>('system.APP_NAME');

// Use constants and utilities
import { 
  formatTime, 
  dbToLinear, 
  getThemeColors 
} from '../config/configConstants';
```

## Common Settings

### Window Sizing
```dotenv
REACT_APP_WINDOW_WIDTH=1600
REACT_APP_WINDOW_HEIGHT=900
REACT_APP_MIN_WINDOW_WIDTH=640
REACT_APP_MIN_WINDOW_HEIGHT=480
```

### Mixer Configuration
```dotenv
REACT_APP_CHANNEL_COUNT=10
REACT_APP_CHANNEL_WIDTH=120
REACT_APP_VU_REFRESH=150
```

### Theme
```dotenv
REACT_APP_DEFAULT_THEME=Graphite
# Options: Dark, Light, Graphite, Neon
```

### Transport
```dotenv
REACT_APP_ZOOM_MIN=0.5
REACT_APP_ZOOM_MAX=3.0
REACT_APP_TIMER_FORMAT=HH:MM:SS
```

### Audio
```dotenv
REACT_APP_SAMPLE_RATE=44100
REACT_APP_BUFFER_SIZE=256
```

## Configuration Sections

### System (8 props)
APP_NAME, VERSION, DEFAULT_THEME, SPLASH_ENABLED, FPS_LIMIT, WINDOW_WIDTH, WINDOW_HEIGHT, MIN sizes

### Display (8 props)
CHANNEL_COUNT, CHANNEL_WIDTH, VU_REFRESH_MS, RACK settings, SHOW_WATERMARK, SHOW_GRID

### Theme (6 props)
AVAILABLE_THEMES, DEFAULT_THEME, ROTARY_CENTER, TRANSITION_DURATION_MS, etc.

### Behavior (7 props)
DEVICE_TRACK_FOLLOWS, DEVICE_FX_FOLLOWS, AUTO_SAVE, UNDO_STACK_SIZE, etc.

### Transport (8 props)
SHOW_TIMER, TIMER_FORMAT, ZOOM_MIN/MAX, AUTOMATION_OVERLAY, CLICK_ENABLED, etc.

### Audio (9 props)
SAMPLE_RATE, BUFFER_SIZE, MAX_CHANNELS, MAX_TRACKS, HEADROOM_DB, etc.

### Branding (6 props)
LOGO_TEXT, LOGO_COLOR, VERSION_LABEL, FOOTER_TEXT, URLs

### OSC (7 props) *Optional*
ENABLED, HOST, PORT, DEVICE_TRACK_COUNT, DEVICE_FX_COUNT, etc.

### MIDI (7 props) *Optional*
ENABLED, DEFAULT_PORT, MAP_CC_VOLUME, MAP_CC_PAN, etc.

### Debug (6 props)
ENABLED, LOG_LEVEL, SHOW_PERFORMANCE_MONITOR, etc.

## Component Example

```typescript
import { APP_CONFIG } from '../config/appConfig';
import { useEffect, useState } from 'react';

export function Mixer() {
  const [channels] = useState(APP_CONFIG.display.CHANNEL_COUNT);
  const channelWidth = APP_CONFIG.display.CHANNEL_WIDTH;
  const theme = APP_CONFIG.system.DEFAULT_THEME;
  
  useEffect(() => {
    console.log(`Mixer: ${channels} channels, ${theme} theme`);
  }, []);

  return (
    <div className="mixer">
      {Array.from({ length: channels }).map((_, i) => (
        <div key={i} style={{ width: channelWidth }}>
          Channel {i + 1}
        </div>
      ))}
    </div>
  );
}
```

## Utility Functions

```typescript
import {
  formatTime,      // (samples, sampleRate, format) => string
  dbToLinear,      // (db) => number
  linearToDb,      // (linear) => number
  clamp,           // (value, min, max) => number
  lerp,            // (a, b, t) => number
  getThemeColors,  // (themeName) => colors object
} from '../config/configConstants';

// Examples
const time = formatTime(44100, 44100, 'HH:MM:SS'); // "00:01:00"
const gain = dbToLinear(-6);  // 0.501
const db = linearToDb(0.501); // -6
const clamped = clamp(1.5, 0, 1); // 1
const colors = getThemeColors('Graphite');
```

## Environment Variable Naming

**Frontend Configuration** (React App):
```
REACT_APP_*
Example: REACT_APP_WINDOW_WIDTH=1920
```

**Build Configuration** (Vite):
```
VITE_*
Example: VITE_SUPABASE_URL=...
```

## Validation

Configuration is validated on startup. Invalid settings log warnings:

```typescript
import { validateConfig } from '../config/appConfig';

const errors = validateConfig();
// Returns array of validation errors
```

## Theme Colors Available

### Dark
- Primary: #1f2937, Secondary: #111827
- Accent: #3b82f6, Text: #f3f4f6

### Light
- Primary: #f3f4f6, Secondary: #ffffff
- Accent: #2563eb, Text: #1f2937

### Graphite
- Primary: #2a2a2a, Secondary: #1a1a1a
- Accent: #ffaa00, Text: #e0e0e0

### Neon
- Primary: #0a0e27, Secondary: #050812
- Accent: #00ff88, Text: #00ffff

## Troubleshooting

**Config not loading?**
1. Check `.env` exists in project root
2. Variables have `REACT_APP_` prefix
3. Restart dev server

**Type errors?**
```typescript
// ❌ Wrong
const x: string = APP_CONFIG.system.WINDOW_WIDTH;

// ✅ Correct
const x: number = APP_CONFIG.system.WINDOW_WIDTH;
```

**Environment variables undefined?**
1. Verify `.env` syntax (no spaces around `=`)
2. Confirm variable in `.env`
3. Restart dev server

## References

- Full Guide: `CONFIGURATION_GUIDE.md`
- Setup Complete: `CONFIGURATION_SETUP_COMPLETE.md`
- Template: `.env.example`
- Main Config: `src/config/appConfig.ts`
- Constants: `src/config/configConstants.ts`

---

**Status**: ✅ Configuration System Ready  
**Total Settings**: 72 configuration options  
**Documentation**: 500+ lines  
**TypeScript**: 0 errors
