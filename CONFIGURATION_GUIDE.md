# CoreLogic Studio Configuration Guide

## Overview

CoreLogic Studio uses a three-tier configuration system to provide flexibility and environment-specific settings.

## Configuration Hierarchy

1. **Default Values** (in `src/config/appConfig.ts`)
2. **Environment Variables** (from `.env` file or system environment)
3. **Runtime Overrides** (application-level settings)

## File Locations

- **Main Config**: `src/config/appConfig.ts` - TypeScript configuration object with all settings
- **Constants**: `src/config/configConstants.ts` - Reference constants and utility functions
- **Environment Template**: `.env.example` - All available environment variables documented
- **Local Override**: `.env` - Your local settings (ignored by git)

## Setting Up Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Edit `.env` for Your Environment

```dotenv
# System
REACT_APP_APP_NAME=CoreLogic Studio
REACT_APP_VERSION=7.0
REACT_APP_WINDOW_WIDTH=1600
REACT_APP_WINDOW_HEIGHT=900

# Display
REACT_APP_CHANNEL_COUNT=10
REACT_APP_VU_REFRESH=150

# Theme
REACT_APP_DEFAULT_THEME=Graphite

# Transport
REACT_APP_ZOOM_MIN=0.5
REACT_APP_ZOOM_MAX=3.0
```

### 3. Use Configuration in React Components

```typescript
import { APP_CONFIG } from '../config/appConfig';

export function MyComponent() {
  return (
    <div>
      <h1>{APP_CONFIG.system.APP_NAME}</h1>
      <p>Version: {APP_CONFIG.system.VERSION}</p>
    </div>
  );
}
```

## Configuration Sections

### System

Controls core application behavior and window properties.

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| APP_NAME | string | CoreLogic Studio | Application name |
| VERSION | string | 7.0 | Version number |
| DEFAULT_THEME | string | Graphite | Initial theme |
| WINDOW_WIDTH | number | 1600 | Initial window width |
| WINDOW_HEIGHT | number | 900 | Initial window height |
| MIN_WINDOW_WIDTH | number | 640 | Minimum window width |
| MIN_WINDOW_HEIGHT | number | 480 | Minimum window height |
| SPLASH_ENABLED | boolean | true | Show splash screen |
| SPLASH_FADE_DURATION_MS | number | 1000 | Splash fade duration |
| FPS_LIMIT | number | 60 | Frame rate limit |

### Display

Configures visual elements and analog console view.

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| CHANNEL_COUNT | number | 10 | Number of mixer channels |
| CHANNEL_WIDTH | number | 120 | Channel fader width |
| VU_REFRESH_MS | number | 150 | VU meter update rate |
| RACK_COLLAPSED_DEFAULT | boolean | false | Rack state on startup |
| SHOW_WATERMARK | boolean | true | Show watermark |
| SHOW_GRID | boolean | true | Show background grid |

### Theme

Controls theme selection and color schemes.

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| DEFAULT_THEME | string | Graphite | Active theme |
| AVAILABLE_THEMES | array | Dark, Light, Graphite, Neon | Available themes |
| ROTARY_CENTER | number | 0.5 | Rotary control center |
| TRANSITION_DURATION_MS | number | 200 | UI transition speed |

### Behavior

Controls how controls and features behave.

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| DEVICE_TRACK_FOLLOWS | string | DEVICE | Track selection behavior |
| DEVICE_FX_FOLLOWS | string | LAST_TOUCHED | Effect selection behavior |
| AUTO_SAVE_ENABLED | boolean | true | Auto-save projects |
| AUTO_SAVE_INTERVAL_MS | number | 60000 | Auto-save interval |
| UNDO_STACK_SIZE | number | 100 | Maximum undo steps |

### Transport

Controls timeline, playback, and automation.

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| SHOW_TIMER | boolean | true | Show time display |
| TIMER_COLOR | string | #00FFFF | Timer color |
| TIMER_FORMAT | string | HH:MM:SS | Time format |
| ZOOM_MIN | number | 0.5 | Minimum zoom level |
| ZOOM_MAX | number | 3.0 | Maximum zoom level |
| AUTOMATION_OVERLAY | boolean | true | Show automation |
| CLICK_ENABLED | boolean | true | Enable click track |
| METRONOME_ENABLED | boolean | true | Enable metronome |

### Audio

Audio engine and DSP settings.

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| SAMPLE_RATE | number | 44100 | Sample rate (Hz) |
| BUFFER_SIZE | number | 256 | Audio buffer size |
| MAX_CHANNELS | number | 64 | Maximum channels |
| MAX_TRACKS | number | 256 | Maximum tracks |
| HEADROOM_DB | number | 6.0 | Headroom in dB |

### Branding

Branding and UI text.

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| LOGO_TEXT | string | 🎧 CoreLogic Studio | Logo text |
| LOGO_COLOR | string | #ffaa00 | Logo color |
| VERSION_LABEL | string | v7.0 | Version label |
| FOOTER_TEXT | string | ... | Footer text |

### OSC (Optional)

Open Sound Control integration.

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| ENABLED | boolean | false | Enable OSC |
| HOST | string | localhost | OSC host |
| PORT | number | 9000 | OSC port |
| DEVICE_TRACK_COUNT | number | 8 | Device tracks |
| DEVICE_FX_COUNT | number | 8 | Device effects |

### MIDI (Optional)

MIDI control integration.

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| ENABLED | boolean | false | Enable MIDI |
| DEFAULT_PORT | number | 1 | MIDI port |
| MAP_CC_VOLUME | number | 7 | Volume CC |
| MAP_CC_PAN | number | 10 | Pan CC |

### Debug

Development and debug settings.

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| ENABLED | boolean | auto | Debug mode |
| LOG_LEVEL | string | warn | Log level |
| SHOW_PERFORMANCE_MONITOR | boolean | false | Show perf monitor |
| SHOW_LAYOUT_GUIDES | boolean | false | Show layout guides |

## Usage Examples

### Example 1: Using Configuration in a Component

```typescript
import { APP_CONFIG } from '../config/appConfig';
import { useEffect, useState } from 'react';

export function Mixer() {
  const [channels] = useState(APP_CONFIG.display.CHANNEL_COUNT);
  const channelWidth = APP_CONFIG.display.CHANNEL_WIDTH;
  
  return (
    <div className="mixer">
      {Array.from({ length: channels }).map((_, i) => (
        <div key={i} style={{ width: channelWidth }}>
          {/* Channel content */}
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Conditional Rendering Based on Config

```typescript
import { APP_CONFIG } from '../config/appConfig';

export function UI() {
  return (
    <>
      {APP_CONFIG.display.SHOW_WATERMARK && <Watermark />}
      {APP_CONFIG.transport.SHOW_TIMER && <Timer />}
      {APP_CONFIG.system.SPLASH_ENABLED && <SplashScreen />}
    </>
  );
}
```

### Example 3: Getting Typed Config Values

```typescript
import { getConfig } from '../config/appConfig';

// Get a nested config value with type safety
const appName = getConfig<string>('system.APP_NAME');
const channelCount = getConfig<number>('display.CHANNEL_COUNT');
```

### Example 4: Using Utility Functions

```typescript
import { 
  formatTime, 
  dbToLinear, 
  clamp,
  getThemeColors 
} from '../config/configConstants';

// Format time for display
const timeStr = formatTime(44100, 44100, 'HH:MM:SS'); // "00:01:00"

// Convert dB to linear gain
const gain = dbToLinear(-6); // 0.501...

// Clamp values
const volume = clamp(0.8, 0, 1); // 0.8

// Get theme colors
const colors = getThemeColors('Graphite');
console.log(colors.accent); // "#ffaa00"
```

## Environment Variable Naming Convention

All environment variables follow this pattern:

- **React App Settings**: `REACT_APP_*` (for frontend configuration)
- **Vite Settings**: `VITE_*` (for build-time configuration)
- **External APIs**: `VITE_*` (e.g., Supabase, Codette)

Example:
```
REACT_APP_WINDOW_WIDTH=1920
VITE_SUPABASE_URL=https://...
```

## Validation

Configuration is validated on startup. Warnings are logged for invalid values.

```typescript
import { validateConfig, initializeConfig } from '../config/appConfig';

// Manual validation
const errors = validateConfig();
if (errors.length > 0) {
  console.error('Config errors:', errors);
}

// Auto-initialization (called on module load)
initializeConfig();
```

## Hot Reload During Development

During development, changing `.env` file requires:

1. Stop the dev server: `Ctrl+C`
2. Rebuild: `npm run dev`

Changes take effect immediately with Vite's HMR.

## Production Deployment

For production:

1. Create a `.env.production` file with production values
2. Build: `npm run build`
3. Environment variables are baked into the build
4. For dynamic changes, use a config API endpoint

```typescript
// Example: Loading config from API
async function loadProductionConfig() {
  const response = await fetch('/api/config');
  const config = await response.json();
  return config;
}
```

## Troubleshooting

### Configuration Not Loading

1. Check `.env` file exists in project root
2. Verify variable names use `REACT_APP_` prefix
3. Restart dev server after changing `.env`

### Type Errors in TypeScript

Ensure you're using the correct types:

```typescript
// ❌ Wrong
const width: string = APP_CONFIG.system.WINDOW_WIDTH;

// ✅ Correct
const width: number = APP_CONFIG.system.WINDOW_WIDTH;
```

### Environment Variables Undefined

Check:
1. Variable is in `.env` file
2. Variable name has correct prefix
3. No spaces around `=` in `.env`
4. Dev server restarted

## Advanced: Custom Configuration

To add custom configuration:

1. Add to `appConfig.ts`:
```typescript
export const CUSTOM_CONFIG = {
  MY_SETTING: process.env.REACT_APP_MY_SETTING || 'default',
} as const;
```

2. Add to `.env`:
```
REACT_APP_MY_SETTING=my_value
```

3. Use in components:
```typescript
import { CUSTOM_CONFIG } from '../config/appConfig';
console.log(CUSTOM_CONFIG.MY_SETTING);
```

## Related Files

- `src/config/appConfig.ts` - Main configuration object
- `src/config/configConstants.ts` - Constants and utilities
- `.env.example` - Environment variable template
- `.env` - Local configuration (create from template)

## See Also

- [DEVELOPMENT.md](../DEVELOPMENT.md) - Development guide
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architecture overview
- `.env.example` - All available configuration options
