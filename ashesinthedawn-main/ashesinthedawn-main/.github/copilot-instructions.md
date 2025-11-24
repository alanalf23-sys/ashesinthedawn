# CoreLogic Studio - AI Coding Agent Instructions

**Last Updated**: November 22, 2025 (23:52 UTC)
**Session**: Audio System Stabilization & Documentation Refresh

## Project Overview

CoreLogic Studio is a **dual-platform DAW** (Digital Audio Workstation):

- **Frontend**: React 18 + TypeScript UI with Web Audio API for real-time playback
- **Backend**: Python DSP library (`daw_core/`) with 19 professional audio effects, automation framework, and metering tools

**Tech Stack**: React 18, TypeScript 5.5, Vite 5.4, Tailwind CSS 3.4, Supabase | Python 3.10+, NumPy, SciPy

## Architecture Essentials

### Dual-Stack Architecture

This is a **federated mono-repo** with separate frontend and backend concerns:

1. **React Frontend** (`src/`)

   - Handles UI, state management, user interactions
   - Uses Web Audio API for real-time playback/mixing
   - Does NOT perform audio DSP - all effects processing would eventually call Python backend

2. **Python DSP Backend** (`daw_core/`)
   - 19 audio effects across 5 categories (EQ, Dynamics, Saturation, Delays, Reverb)
   - Automation framework (AutomationCurve, LFO, Envelope, AutomatedParameter)
   - Metering tools (LevelMeter, SpectrumAnalyzer, VUMeter, Correlometer)
   - Currently **not integrated** with React frontend (separate development phase)
   - All effects tested via pytest (197 tests passing)

### Frontend Three-Layer Design (React Only)

1. **Context Layer** (`src/contexts/DAWContext.tsx` - 639 lines)

   - Single source of truth for all DAW state (tracks, playback, recording, time)
   - Audio engine reference held here (singleton pattern via `getAudioEngine()`)
   - Branching functions for track creation by type (audio/instrument/midi/aux/vca)
   - **Critical insight**: Volume sync effect (lines 100-115) keeps audio parameters in sync during playback

2. **Audio Engine** (`src/lib/audioEngine.ts` - 500 lines)

   - Wrapper around Web Audio API with methods: `playAudio()`, `stopAudio()`, `setTrackVolume()`, `seek()`
   - **Key pattern**: dB ↔ Linear conversion via `dbToLinear()` (private method, line 475)
   - Waveform caching in `waveformCache` Map for performance
   - Source nodes stored per-track to enable resumable playback

3. **UI Components** (15 components, all consume `useDAW()` hook)
   - TopBar: Transport controls + time display + CPU/settings
   - TrackList: Add/select/delete tracks with sequential numbering per type
   - Timeline: Waveform visualization + playhead + click-to-seek
   - Mixer: Volume/pan/input-gain sliders for selected track + plugin rack
   - Sidebar: Multi-tab browser for files/plugins
   - WelcomeModal: Project creation
   - DraggableWindow, ResizableWindow: Detachable mixer UI
   - PluginRack, AudioMeter: Effects and metering displays

### Data Flow

```
User Action → Component → useDAW() → DAWContext method → AudioEngine → Web Audio API
   ↑                                                                        ↓
   └────────────────── State update triggers component re-render ─────────┘
```

## Component Communication Patterns

### Context Hook Usage

```typescript
import { useDAW } from "../contexts/DAWContext";

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

### Critical Functions & Their Behavior

### `togglePlay()`

- **Status**: FIXED (native looping now handles continuous playback)
- **Implementation** (DAWContext): Starts playback or stops it based on `isPlaying` state
- **Audio wiring**: Plays all non-muted audio/instrument tracks from `currentTime`
- **Key detail**: Relies on native `source.loop = true` in Web Audio API (audioEngine.ts:106)

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

### Frontend Development

```bash
npm install              # Install Node dependencies (includes Tailwind, Lucide)
npm run dev              # Vite dev server (default port 5173, fallback 5174)
npm run build            # Production build
npm run typecheck        # TypeScript validation (0 errors required)
npm run lint             # ESLint validation
```

### Backend Development

```bash
# One-time setup
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install numpy scipy

# Run tests (197 tests currently passing)
python -m pytest test_phase2_*.py -v                    # All tests
python -m pytest test_phase2_effects.py -v --cov=daw_core  # With coverage
```

### Testing Strategy

- **Frontend**: Manual testing in dev server (no automated test suite yet)
- **Backend**: pytest-based testing with 197 tests across 6 test files:
  - `test_phase2_effects.py` - EQ filters
  - `test_phase2_2_dynamics.py` - Compressor, Limiter, Expander, Gate
  - `test_phase2_4_saturation.py` - Saturation, Distortion, WaveShaper
  - `test_phase2_5_delays.py` - SimpleDelay, PingPong, MultiTap, Stereo
  - `test_phase2_6_reverb.py` - Freeverb, Hall, Plate, Room presets
  - `test_phase2_7_automation.py` - Curves, LFO, Envelopes
  - `test_phase2_8_metering.py` - Level, Spectrum, VU, Correlometer

### Frontend-Backend Architecture

- **Currently**: Frontend and backend are separate concerns with independent test suites
- **Future integration**: Python DSP backend will be called from DAWContext for effect processing
- **Development workflow**: Work on frontend (npm) and backend (Python) independently
- **Type definitions**: `src/types/index.ts` defines Plugin interface that will eventually call Python effects

### Known Issues & Limitations

- Supabase credentials optional - app runs in "demo mode" without auth
- Python backend not yet integrated with React frontend (integration phase TBD)
- Web Audio API playback limitations handled via native looping (`source.loop = true`)
- sounddevice (audio I/O) and websockets are optional dependencies (installed, wrapped in try-except)

## Recent Fixes (Session Notes)

### Audio System Improvements

- **Fixed audio fade-out**: Removed complex DAWContext restart logic, now relies on native Web Audio looping
- **Fixed waveform caching**: Enhanced `getWaveformData()` to check cache first before computation
- **TypeScript**: Fixed improper `any` type casting to proper `unknown` with type narrowing in audioEngine initialization

### Code Quality

- Cleaned all unused imports across frontend and backend
- Fixed CSS conflicts in ANIMATION_PATTERNS.md (consolidated redundant transitions)
- Removed unnecessary inline comments from engine.py while preserving docstrings
- Updated VSCode Python debugger config from deprecated `python` type to `debugpy`

## Type Definitions

### Track Interface (src/types/index.ts)

```typescript
interface Track {
  id: string; // Unique identifier
  name: string; // Display name
  type: "audio" | "instrument" | "midi" | "aux" | "vca" | "master";
  color: string; // Hex color for UI
  muted: boolean; // Mute state
  soloed: boolean; // Solo state
  armed: boolean; // Record arm
  inputGain: number; // Pre-fader gain (dB)
  volume: number; // Post-fader volume (dB)
  pan: number; // -1 (L) to +1 (R)
  stereoWidth: number; // 0-200% (100 = normal)
  phaseFlip: boolean; // Phase invert
  inserts: string[]; // Plugin chain IDs
  sends: string[]; // Send destinations
  routing: string; // Bus/output destination
  automationMode?: "off" | "read" | "write" | "touch";
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
- Waveform not displaying → Check browser console for "No waveform data for track" warnings

### Real-Time Audio Patterns to Know

1. **Native Looping**: Web Audio `source.loop = true` handles continuous playback (no manual restart needed)
2. **Volume Sync**: DAWContext effect syncs volume changes during playback (100-115 lines)
3. **Waveform Cache**: Two-tier system - checks cache first, computes if missing, stores result
4. **Audio State**: Managed in `playingTracksState` Map to track `isPlaying` + `currentOffset` per track

## Files to Review First

1. `src/contexts/DAWContext.tsx` - State management patterns, track factory functions
2. `src/lib/audioEngine.ts` - Web Audio API wrapper, volume handling, playback logic
3. `src/types/index.ts` - Data model definitions (Track, Plugin, Project)
4. `daw_core/fx/*.py` - 19 professional audio effects implementations
5. `daw_core/automation/*.py` - Automation framework (AutomationCurve, LFO, Envelope)
6. `src/components/TopBar.tsx` - Transport controls and UI pattern reference
7. `src/components/Mixer.tsx` - Selected-track editing pattern
8. `DEVELOPMENT.md` - Common development tasks and setup instructions

## When Modifying Code

### Frontend Changes (React/TypeScript)

- Always maintain `useDAW()` hook pattern for context access
- Keep audio engine calls in DAWContext (not components directly)
- Update state via context methods, not by importing context directly
- Test with 0 TypeScript errors: `npm run typecheck`
- Preserve branching function structure for track factory pattern
- Use Tailwind dark theme utilities (bg-gray-950, text-gray-300, border-gray-700)

### Backend Changes (Python DSP)

- Follow existing effects structure in `daw_core/fx/` (class per effect)
- All effects inherit from base Effect class
- Include comprehensive docstrings with parameters and examples
- Write pytest tests in matching `test_phase2_*.py` files
- Use NumPy for array operations, SciPy for signal processing
- Return audio in same dtype as input (prevents clipping through format conversion)

### Cross-Layer Integration

- Frontend Plugin type matches Python effect parameters
- dB conversion happens in audio engine, not components or effects
- Automation framework in Python can be consumed by React via API layer (future)
- Test Python effects independently before integration with React UI
