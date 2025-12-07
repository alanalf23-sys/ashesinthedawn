# CoreLogic Studio - Development Guide

**Last Updated**: November 24, 2025 | Phase 7 Complete: Configuration & VU Meter Integration ✅

## Quick Start

### Prerequisites

- Node.js 18+ (for React UI)
- Python 3.10+ (for DSP backend)
- npm or yarn package manager
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ashesinthedawn

# Install Node dependencies
npm install

# Set up Python environment
python -m venv venv
venv\Scripts\activate  # On Windows
source venv/bin/activate  # On macOS/Linux

# Install Python dependencies (DSP)
pip install numpy scipy

# Set up environment variables
# Create .env file with:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Running Locally

```bash
# Development server (auto-reload on file changes)
npm run dev

# Open browser to: http://localhost:5173

# Run DSP tests (Python backend)
python -m pytest test_phase2_*.py -v

# Type checking (TypeScript)
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
ashesinthedawn/
├── src/                            # React/TypeScript UI
│   ├── components/
│   │   ├── TopBar.tsx              # Transport & system monitoring
│   │   ├── TrackList.tsx           # Track management interface
│   │   ├── Timeline.tsx            # Visual timeline
│   │   ├── Mixer.tsx               # Horizontal mixer strips
│   │   ├── Sidebar.tsx             # Multi-tab sidebar
│   │   ├── WelcomeModal.tsx        # Project creation modal
│   │   ├── VUMeterGfx.tsx          # VU Meter rendering engine ✨ NEW
│   │   └── VUMeterPanel.tsx        # VU Meter UI wrapper ✨ NEW
│   ├── contexts/
│   │   └── DAWContext.tsx          # Global state management
│   ├── hooks/
│   │   └── useVUMeterData.ts       # VU Meter data hook ✨ NEW
│   ├── lib/
│   │   ├── audioEngine.ts          # Web Audio API wrapper
│   │   └── supabase.ts             # Supabase client configuration
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # Entry point
│   ├── index.css                   # Global styles
│   └── vite-env.d.ts              # Vite environment types
│
├── daw_core/                       # Python DSP Backend (Phase 2)
│   ├── fx/
│   │   ├── __init__.py            # FX module exports
│   │   ├── eq_and_dynamics.py     # EQ & compressor effects
│   │   ├── dynamics_part2.py      # Gate, expander, noise gate
│   │   ├── saturation.py          # Saturation & distortion
│   │   ├── delays.py              # Delay effects
│   │   └── reverb.py              # Reverb engine (Freeverb)
│   ├── automation/
│   │   └── __init__.py            # Automation framework
│   └── metering/
│       └── __init__.py            # Metering & analysis tools
│
├── docs/                          # Documentation
│   ├── VU_METER_INTEGRATION_COMPLETE.md  # VU Meter guide ✨ NEW
│   └── ...other docs
│
├── supabase/
│   └── migrations/
│       └── 20251114213600_create_corelogic_schema.sql
│
├── Test Files (Python)
│   ├── test_phase2_effects.py     # EQ tests
│   ├── test_phase2_2_dynamics.py  # Dynamics tests
│   ├── test_phase2_4_saturation.py  # Saturation tests
│   ├── test_phase2_5_delays.py    # Delay tests
│   ├── test_phase2_6_reverb.py    # Reverb tests
│   ├── test_phase2_7_automation.py  # Automation tests
│   └── test_phase2_8_metering.py  # Metering tests
│
├── index.html                      # HTML entry point
├── package.json                    # Node dependencies & scripts
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── eslint.config.js               # ESLint configuration
├── README.md                      # Project overview
├── ARCHITECTURE.md                # Component documentation
├── PHASE_2_COMPLETE_SUMMARY.md    # Phase 2 achievements
└── Changelog.ipynb                # Version history

```

---

## Frontend Components - ✨ NEW: VU Meter System

### VU Meter GFX (JSFX Conversion)

**Component**: `src/components/VUMeterGfx.tsx` (1,050+ lines)

**Purpose**: Canvas-based analog VU meter with exact JSFX formula preservation

**Features**:
- ✅ Dual stereo meters (LEFT/RIGHT)
- ✅ Real-time needle animation (60 FPS)
- ✅ RMS and Peak displays
- ✅ Red clip indicators (>0 dBFS)
- ✅ Authentic scale markings (-20 to +3 dB)
- ✅ Exponential needle decay (realistic ballistics)
- ✅ Sample-accurate processing

**Usage**:
```typescript
import { VUMeterGfx } from './components/VUMeterGfx';

<VUMeterGfx
  leftLevel={0.5}      // 0-1 normalized
  rightLevel={0.6}     // 0-1 normalized
  responseMs={50}      // Attack time
  release={5}          // Release speed
  sampleRate={44100}
  width={425}
  height={520}
/>
```

### VU Meter Panel (Ready-to-Use)

**Component**: `src/components/VUMeterPanel.tsx` (150 lines)

**Purpose**: User-friendly VU meter with controls and audio engine integration

**Usage**:
```typescript
import { VUMeterPanel } from './components/VUMeterPanel';

<VUMeterPanel 
  trackId={selectedTrack?.id}  // Optional: track-specific
  responseMs={50}
  release={5}
  showControls={true}
/>
```

### VU Meter Data Hook

**Hook**: `src/hooks/useVUMeterData.ts` (70 lines)

**Purpose**: Extract real-time audio levels from audio engine

---

## DSP Backend - Phase 2 Architecture

### Effects Library (daw_core/fx/)

**19 Professional Audio Effects**:

| Effect        | Type       | File               | Status |
| ------------- | ---------- | ------------------ | ------ |
| EQ3Band       | EQ         | eq_and_dynamics.py | ✅     |
| HighLowPass   | EQ         | eq_and_dynamics.py | ✅     |
| Compressor    | Dynamics   | eq_and_dynamics.py | ✅     |
| Limiter       | Dynamics   | dynamics_part2.py  | ✅     |
| Expander      | Dynamics   | dynamics_part2.py  | ✅     |
| Gate          | Dynamics   | dynamics_part2.py  | ✅     |
| NoiseGate     | Dynamics   | dynamics_part2.py  | ✅     |
| Saturation    | Saturation | saturation.py      | ✅     |
| HardClip      | Saturation | saturation.py      | ✅     |
| Distortion    | Saturation | saturation.py      | ✅     |
| WaveShaper    | Saturation | saturation.py      | ✅     |
| SimpleDelay   | Delay      | delays.py          | ✅     |
| PingPongDelay | Delay      | delays.py          | ✅     |
| MultiTapDelay | Delay      | delays.py          | ✅     |
| StereoDelay   | Delay      | delays.py          | ✅     |
| Reverb        | Reverb     | reverb.py          | ✅     |
| HallReverb    | Reverb     | reverb.py          | ✅     |
| PlateReverb   | Reverb     | reverb.py          | ✅     |
| RoomReverb    | Reverb     | reverb.py          | ✅     |

### Automation Framework (daw_core/automation/)

**5 Core Classes**:

- `AutomationCurve`: Linear/Exponential/Step/Smooth interpolation
- `LFO`: 5 waveforms (Sine/Triangle/Square/Sawtooth/Random)
- `Envelope`: ADSR generation
- `AutomatedParameter`: Real-time modulation control
- `ParameterTrack`: Multi-parameter management

### Metering Tools (daw_core/metering/)

**4 Professional Tools**:

- `LevelMeter`: Peak/RMS detection with clipping
- `SpectrumAnalyzer`: FFT-based frequency analysis
- `VUMeter`: Logarithmic metering simulation
- `Correlometer`: Stereo correlation measurement

---

## Development Workflow

### Adding a New VU Meter

1. **Import the panel component**:
   ```typescript
   import { VUMeterPanel } from './VUMeterPanel';
   ```

2. **Add to your layout**:
   ```typescript
   <VUMeterPanel 
     trackId={selectedTrack?.id}
     responseMs={50}
     release={5}
   />
   ```

3. **Customize appearance** (optional):
   ```typescript
   <VUMeterPanel 
     className="custom-style"
     showControls={false}  // Hide sliders
   />
   ```

### Adding a New Feature

1. **Create the component** in `src/components/`

   ```typescript
   import { useDAW } from '../contexts/DAWContext';

   export default function NewComponent() {
     const { /* needed state */ } = useDAW();

     return (
       // Component JSX
     );
   }
   ```

2. **Use context hooks** for state management

   - Never pass props between components when context is available
   - Use `useDAW()` hook to access all state and functions

3. **Add TypeScript types** to `src/types/index.ts` if needed

4. **Update documentation** in README.md and ARCHITECTURE.md

5. **Test in browser**
   ```bash
   npm run dev
   ```

### Adding State to Context

1. Open `src/contexts/DAWContext.tsx`
2. Add state variable with `useState()`
3. Add to `DAWContextType` interface
4. Add to provider value object
5. Create setter/updater function if needed

Example:

```typescript
// Add state
const [newState, setNewState] = useState(initialValue);

// Add to interface
interface DAWContextType {
  newState: TypeOfState;
  setNewState: (value: TypeOfState) => void;
  // ... rest
}

// Add to provider value
value={{
  newState,
  setNewState,
  // ... rest
}}
```

### Styling Components

- Use **Tailwind CSS** utility classes
- Reference the **dark theme** palette:
  - Backgrounds: `bg-gray-900`, `bg-gray-800`, `bg-gray-950`
  - Borders: `border-gray-700`, `border-gray-600`
  - Text: `text-white`, `text-gray-300`, `text-gray-400`
- Accent colors:
  - Primary: `bg-blue-600`, `text-blue-400`
  - Success: `bg-green-600`
  - Warning: `bg-yellow-600`
  - Danger: `bg-red-600`

Example:

```typescript
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
  Click me
</button>
```

---

### Building Custom Waveforms

The Waveform component uses efficient peak-based rendering:

```typescript
// Component usage
import Waveform from "./components/Waveform";

<Waveform
  track={track}
  height={60}
  width={400}
  color="#3b82f6"
  showPlayhead={true}
  currentTime={currentTime}
/>;
```

**Peak Rendering Algorithm:**

- Computes min/max peaks per block of samples
- Renders O(width) line segments (1 per pixel)
- Fast rendering even for large audio files
- Dynamic opacity based on peak amplitude

**Timeline Zoom:**

- Built-in zoom controls (50%-300%)
- Zoom button: `+ / - / Reset`
- Visual percentage display
- Smooth scaling with pixel-perfect rendering

---

### Working with DSP Backend

#### Python Requirements

```bash
pip install numpy scipy
```

#### Running Tests

```bash
# All Phase 2 tests
python -m pytest test_phase2_*.py -v

# Specific test file
python -m pytest test_phase2_effects.py -v

# With coverage
python -m pytest test_phase2_*.py --cov=daw_core
```

#### PyQt6 Waveform Reference

The standalone `waveform_timeline.py` demonstrates:

- Audio file loading with soundfile
- Min/max peak computation
- Custom PyQt6 widget rendering
- Playback synchronization with sounddevice

Run with:

```bash
python waveform_timeline.py
```

Requires:

- PyQt6
- NumPy
- SoundFile
- SoundDevice

---

## Common Tasks

### Accessing DAW State

```typescript
const { currentProject, tracks, isPlaying } = useDAW();
```

### Using VU Meters

```typescript
// Get audio levels
const { leftLevel, rightLevel, leftPeak, rightPeak } = useVUMeterData();

// Display with VU meter
<VUMeterGfx 
  leftLevel={leftLevel}
  rightLevel={rightLevel}
  responseMs={50}
  release={5}
/>
```

### Adding a Track

```typescript
const { addTrack } = useDAW();

addTrack("audio"); // Audio track
addTrack("instrument"); // Instrument track
addTrack("midi"); // MIDI track
addTrack("aux"); // Aux/FX return
```

### Updating Track Properties

```typescript
const { updateTrack } = useDAW();

// Toggle mute
updateTrack(trackId, { muted: !track.muted });

// Change volume
updateTrack(trackId, { volume: -6 });

// Update multiple properties
updateTrack(trackId, {
  muted: true,
  volume: -12,
  pan: 0.5,
});
```

### Handling File Uploads

```typescript
const { uploadAudioFile, isUploadingFile, uploadError } = useDAW();

const handleDrop = async (e: React.DragEvent) => {
  const file = e.dataTransfer.files?.[0];
  if (file) {
    const success = await uploadAudioFile(file);
    if (success) {
      // Track created, refresh UI
    }
  }
};
```

### Persisting Projects

```typescript
const { saveProject, loadProject } = useDAW();

// Save current project
await saveProject();

// Load existing project
await loadProject("project-123");
```

---

## Debugging

### Enable React DevTools

```bash
# React DevTools browser extension recommended
# Helps inspect component props and state
```

### VU Meter Troubleshooting

**Needles not moving**:
```typescript
// Check audio engine
const { getAudioLevels } = getAudioEngine();
console.log('Levels:', getAudioLevels());
```

**Canvas is blank**:
```typescript
// Check canvas element
const canvas = document.querySelector('canvas');
console.log('Canvas dimensions:', canvas?.width, canvas?.height);
```

### Console Logging

```typescript
// Check state values
const daw = useDAW();
console.log("Current tracks:", daw.tracks);
console.log("Is playing:", daw.isPlaying);
```

### Type Errors

```bash
# Run type checking
npm run typecheck

# Errors will show incorrect type usage
```

### Linting Issues

```bash
# Run linter
npm run lint

# Fix automatically
npm run lint -- --fix
```

---

## Supabase Setup

### Database Schema

Located in: `supabase/migrations/20251114213600_create_corelogic_schema.sql`

### Connection

- Client configured in `src/lib/supabase.ts`
- Uses environment variables for credentials
- Falls back to demo mode if credentials missing

### Project Persistence

Projects are stored with:

- Project metadata (name, sample rate, bit depth, BPM)
- Session data (array of tracks with all properties)
- User ID (once auth implemented)
- Timestamps (created_at, updated_at)

### Environment Variables

Create `.env` or `.env.local`:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Testing Checklist

### UI Components

- [ ] All buttons respond to clicks
- [ ] Forms accept input correctly
- [ ] Dropdowns show/hide options
- [ ] Modals open and close
- [ ] Styling renders correctly

### VU Meters (✨ NEW)

- [ ] Meters render with correct dimensions
- [ ] Needles respond to audio input
- [ ] RMS and peak values display correctly
- [ ] Clip indicators activate above 0 dB
- [ ] Response time slider adjusts attack
- [ ] Release slider adjusts decay
- [ ] Canvas scales properly on window resize

### State Management

- [ ] Adding tracks updates list
- [ ] Deleting tracks removes from view
- [ ] Mute/Solo state changes
- [ ] Volume changes persist
- [ ] Transport controls work

### Data Persistence

- [ ] Projects save to Supabase
- [ ] Projects load from Supabase
- [ ] Session data persists
- [ ] Track properties preserved

### File Operations

- [ ] File upload accepts valid formats
- [ ] File upload rejects invalid formats
- [ ] Upload shows progress
- [ ] Success/error messages display
- [ ] New track created from upload

---

## Next Steps for Development

### Phase 2 - AI Features

1. Implement LogicCore analysis algorithms
2. Build gain staging analyzer
3. Create routing recommendations engine
4. Add session health checker

### Phase 3 - Audio & Hardware

1. Integrate Web Audio API for playback
2. Implement voice command recognition
3. Add MIDI controller mapping
4. Support OSC protocol

### Phase 4 - Polish

1. Implement theme switching
2. Add undo/redo system
3. Optimize performance
4. Prepare for beta release

---

## Resources

- **React Documentation**: https://react.dev
- **TypeScript Documentation**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vite**: https://vitejs.dev/guide
- **Supabase**: https://supabase.com/docs
- **Lucide Icons**: https://lucide.dev

### VU Meter Documentation

- **Integration Guide**: `docs/VU_METER_INTEGRATION_COMPLETE.md`
- **Original JSFX Plugin**: VU Meter by Liteon (GPL)
- **License**: GNU General Public License

---

**Last Updated**: November 24, 2025  
**Current Phase**: Phase 7 - Configuration & VU Meter Integration ✅
