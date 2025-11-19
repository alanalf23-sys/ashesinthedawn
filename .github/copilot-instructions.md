# CoreLogic Studio - AI Coding Agent Instructions

## Project Overview
CoreLogic Studio is a React + TypeScript DAW (Digital Audio Workstation) featuring a Logic Pro-inspired UI, Web Audio API integration, and modular architecture for professional audio production.

**Tech Stack**: React 18, TypeScript 5.5, Vite 5.4, Tailwind CSS 3.4, Supabase

## Architecture Essentials

### Three-Layer Design
1. **Context Layer** (`src/contexts/DAWContext.tsx` - 567 lines)
   - Single source of truth for all DAW state (tracks, playback, recording, time)
   - Audio engine reference held here (singleton pattern via `getAudioEngine()`)
   - Branching functions for track creation by type (audio/instrument/midi/aux/vca)
   - **Critical insight**: Volume sync effect (lines 100-115) keeps audio parameters in sync during playback

2. **Audio Engine** (`src/lib/audioEngine.ts` - 492 lines)
   - Wrapper around Web Audio API with methods: `playAudio()`, `stopAudio()`, `setTrackVolume()`, `seek()`
   - **Key pattern**: dB ↔ Linear conversion via `dbToLinear()` (private method, line 475)
   - Waveform caching in `waveformCache` Map for performance
   - Source nodes stored per-track to enable resumable playback

3. **UI Components** (6 components, all consume `useDAW()` hook)
   - TopBar: Transport controls + time display + CPU/settings
   - TrackList: Add/select/delete tracks with sequential numbering per type
   - Timeline: Waveform visualization + playhead + click-to-seek
   - Mixer: Volume/pan/input-gain sliders for selected track
   - Sidebar: Multi-tab browser for files/plugins
   - WelcomeModal: Project creation

### Data Flow
```
User Action → Component → useDAW() → DAWContext method → AudioEngine → Web Audio API
   ↑                                                                        ↓
   └────────────────── State update triggers component re-render ─────────┘
```

## Component Communication Patterns

### Context Hook Usage
```typescript
import { useDAW } from '../contexts/DAWContext';

export default function MyComponent() {
  const { tracks, selectedTrack, togglePlay, seek } = useDAW();
  // Use values and methods directly
}
```

### Track Selection Model
- Single selected track at a time (`selectedTrack` state)
- All track modifications flow through `updateTrack(trackId, updates)`
- Mixer component shows controls for `selectedTrack` only

### Branching Functions (Anti-pattern to avoid)
`DAWContext` uses branching factory functions (`createAudioTrack()`, `createInstrumentTrack()`, etc.) before calling `addTrack()`. This pattern is **already in place** - follow it for consistency if adding new track types.

## Styling Conventions

### Colors & Tailwind
- **Background**: `bg-gray-950` (app), `bg-gray-900` (panels), `bg-gray-800` (controls)
- **Borders**: `border-gray-700` (all dividers)
- **Text**: `text-gray-300` (default), `text-gray-400` (secondary), `text-gray-100` (prominent)
- **Accents**: `bg-blue-600` (play/primary), `bg-red-600` (record), `bg-yellow-600` (solo)
- **Track colors**: 8-color palette in `DEVELOPMENT.md` line 289

### Component Sizing
- Left sidebar: `w-48` (tracks)
- Center timeline: `flex-1` (takes remaining space)
- Bottom mixer: `h-48` (fixed height for controls)
- Right sidebar: `w-64` (browser panel)

## Critical Functions & Their Behavior

### `togglePlay()`
- **Broken until fixed**: Only initializes AudioContext once; must properly handle pause/resume
- **Current impl** (lines 304-322): Starts playback or stops it based on `isPlaying` state
- **Audio wiring**: Plays all non-muted audio/instrument tracks from `currentTime`

### `seek(timeSeconds)`
- Stops existing sources and creates new ones from seek time to enable resumable playback
- **Not just updating currentTime**: Must restart audio from new position if playing

### `uploadAudioFile(file)`
- Validates MIME type + file size (100MB max, lines 406-418)
- Calls `audioEngine.loadAudioFile()` which:
  - Decodes audio file
  - Caches AudioBuffer
  - Pre-generates waveform data in `waveformCache`

### `setTrackInputGain()` vs `updateTrack({volume})`
- **Input Gain** (pre-fader): Set via `setTrackInputGain()` - affects only audio engine pre-pan node
- **Volume** (fader): Set via `updateTrack({volume})` - affects post-pan gain node
- Both convert dB values to linear in audio engine

## Common Development Tasks

### Adding a Track Type
1. Add type to `Track['type']` in `src/types/index.ts`
2. Create branching function `createXyzTrack()` in DAWContext (copy pattern from lines 178-212)
3. Add case in `addTrack()` switch statement
4. Add icon + label in TrackList `getTrackTypeLabel()` if needed

### Fixing Audio Playback Issues
- Check `togglePlay()` state management (line 304)
- Verify `playAudio()` call passes correct parameters: `(trackId, startTime, volumeDb, pan)`
- Remember: `playAudio()` expects **dB values**, not linear - conversion happens in engine

### Adding UI Controls to Mixer
- Mixer shows only `selectedTrack` (if null, shows "Select a track")
- Use `updateTrack(selectedTrack.id, {...})` to persist changes
- Use `setTrackInputGain()` specifically for pre-fader gain

### Creating Waveform Display
- Timeline.tsx (lines 32-40) shows the pattern: call `getWaveformData(trackId)` to retrieve cached data
- Engine returns empty array `[]` if buffer not loaded or duration is 0
- Waveform caching pre-generates on file load for performance

## Build & Deployment

### Commands
```bash
npm install              # Dependencies (includes Tailwind, Lucide, React Router if added)
npm run dev              # Vite dev server (default port 5173, fallback 5174)
npm run build            # Production build
npm run typecheck        # TypeScript validation
```

### Known Issues
- Supabase credentials optional - app runs in "demo mode" without auth
- `caniuse-lite` outdated warning is non-blocking
- Old CSS `appearance: slider-vertical` deprecated but functional

## Type Definitions

### Track Interface (src/types/index.ts)
```typescript
interface Track {
  id: string;              // Unique identifier
  name: string;            // Display name
  type: 'audio' | 'instrument' | 'midi' | 'aux' | 'vca' | 'master';
  color: string;           // Hex color for UI
  muted: boolean;          // Mute state
  soloed: boolean;         // Solo state  
  armed: boolean;          // Record arm
  inputGain: number;       // Pre-fader gain (dB)
  volume: number;          // Post-fader volume (dB)
  pan: number;             // -1 (L) to +1 (R)
  stereoWidth: number;     // 0-200% (100 = normal)
  phaseFlip: boolean;      // Phase invert
  inserts: string[];       // Plugin chain IDs
  sends: string[];         // Send destinations
  routing: string;         // Bus/output destination
  automationMode?: 'off' | 'read' | 'write' | 'touch';
}
```

### DAWContextType
- 13 state properties (tracks, selectedTrack, currentTime, isPlaying, etc.)
- 20+ context functions (addTrack, togglePlay, uploadAudioFile, etc.)
- All exported via `useDAW()` hook

## Performance Considerations

1. **Waveform caching**: Pre-computed on file load, stored in `waveformCache` Map
2. **Audio context singleton**: Use `getAudioEngine()` - don't create new contexts
3. **Volume sync effect**: Runs during playback only to sync parameter changes (line 100)
4. **Track number calculation**: O(n) filter operation - acceptable for <100 tracks

## Debugging Tips

### Console Logs Available
- `audioEngine.ts` logs: "Playing track...", "Stopped playback...", "Set volume..."
- `DAWContext.tsx` logs: "Recording started", "Audio Engine initialized"

### Common Errors
- `useDAW() must be used within DAWProvider` → Component not wrapped in `<DAWProvider>`
- "No audio buffer found for track X" → File didn't upload successfully, check `uploadError` state
- Volume not changing → Check if track is muted, verify `setTrackVolume()` called in audio engine

## Files to Review First
1. `src/contexts/DAWContext.tsx` - State management patterns
2. `src/lib/audioEngine.ts` - Web Audio API wrapper, volume handling
3. `src/types/index.ts` - Data model definitions
4. `src/components/Mixer.tsx` - UI control patterns (selected track editing)
5. `DEVELOPMENT.md` - Common tasks with code examples
6. `ARCHITECTURE.md` - Component-by-component documentation

## When Modifying Code
- Always maintain `useDAW()` hook pattern for context access
- Keep audio engine calls in DAWContext (not components directly)
- Update state via context methods, not by importing context directly
- Test with 0 TypeScript errors: `npm run typecheck`
- Preserve branching function structure for track factory pattern
