# CoreLogic Studio - Tech Specs & Usage

## Overview
CoreLogic Studio is a next-generation Digital Audio Workstation (DAW) designed for professional and serious project studios. It combines a classic console-style workflow with adaptive AI assistance, integrated voice control, and tight hardware integration.

## Supported Platforms
- Windows 10 or later (64-bit)
- macOS 13+ (Apple Silicon & Intel)

## Engine & Performance
- 64-bit floating point processing
- Latency below 10ms with compatible interfaces
- Multi-core processing and thread parallelism
- Plugin delay compensation

## Architecture
- Modular design: real-time core, UI, AI, and I/O separated
- Supports dynamic buffers, MIDI/MPE routing, and session management
- AI subsystem runs asynchronously with undo support
- Hardware abstraction layer
- Optional voice command control

## User Interface & Workflow
- Familiar layout similar to industry-standard DAWs
- Dockable panels: track list, timeline, mixer, plugin browser
- Themes: Vintage Heritage and Modern Dark
- Multitrack recording, editing, automation, and mixing

## Tracks, Routing & Mixer
- Track types: audio, MIDI, instrument, aux, VCA, master
- Unlimited bus routing, sidechains, pre/post sends
- Mixer with EQ, plugins, sends, meters, groupings

## Plugin Ecosystem
- Support for VST3 (Windows & macOS) & AU (macOS)
- Stock plugins: EQ, compressor, gate, saturation, delay, reverb, utility, meters
- Plugin quarantine for unstable plugins

## AI & LogicCore
- Modes: ON, SILENT, OFF
- Features: gain staging, routing recommendations, session health reports
- Performs analysis asynchronously with undo/redo

## Hardware & External Control
- MIDI, OSC, HID, and external I/O support
- Dedicated external gear control and insert control

## Development Phases
- Phase 1: Core DAW, routing, mixer, plugins, project management ✅ (Currently Implemented)
- Phase 2: AI enhancements & macros
- Phase 3: Hardware mapping & voice interface
- Phase 4: Optimization, UI refinement, and public beta

---

## Current Implementation Status

### ✅ Fully Implemented Features

#### Core UI Components

**TopBar**
- Transport controls: Play, Pause, Stop, Record buttons
- Real-time time display (MM:SS:MS format)
- LogicCore mode selector (ON/SILENT/OFF)
- Voice control toggle button
- CPU usage monitoring (percentage display)
- Storage capacity display (GB)
- Project name display

**TrackList**
- Add new tracks dropdown menu (Audio, Instrument, MIDI, Aux/FX Return)
- Track browser with scrollable list
- Per-track controls:
  - Mute (M) button - toggle track muting
  - Solo (S) button - isolate track playback
  - Record Arm (R) button - enable recording
  - Delete (trash icon) - remove track
- Track color coding
- Track type icons (microphone, piano, music note, etc.)
- Track selection highlighting

**Timeline**
- Bar/beat ruler with numbered measures (1-32)
- Visual playhead indicator
- Horizontal scrolling for long sessions
- Per-track lane display
- Hover highlighting for interaction

**Mixer**
- Horizontal strip mixer layout
- Per-track volume faders (-60dB to +12dB)
- Volume level display in dB
- Gradient metering visualization (green/yellow/red)
- Mute and Solo per track
- Track name labels
- Color-coded track indicators

**Sidebar (Tabbed Interface)**
- **File Browser Tab**:
  - Drag-and-drop audio upload zone
  - Click-to-upload functionality
  - File format support: MP3, WAV, OGG, AAC, FLAC, M4A
  - Upload progress indicator
  - Success/error feedback display
  - Project browser (My Projects, Audio Files, Samples, Loops)
  
- **Plugins Tab**:
  - 8 stock plugins available
  - Click to add audio track with plugin preset
  - Plugins: Channel EQ, Channel Compressor, Gate/Expander, Saturation, Delay, Reverb, Utility, Metering
  
- **Templates Tab**:
  - 5 pre-configured templates
  - Templates: Rock Band (4 tracks), Electronic Production (6 tracks), Podcast Mix (3 tracks), Orchestral (5 tracks), Hip Hop (4 tracks)
  - Auto-populate tracks on selection
  
- **LogicCore AI Tab**:
  - Smart Gain Staging button
  - Routing Assistant button
  - Session Health Check button
  - Create Template from Session button
  - AI tips and instructions

**WelcomeModal**
- Project creation interface
- Customizable project settings:
  - Project name
  - Sample rate (44100 Hz, 48000 Hz, 96000 Hz)
  - Bit depth (16-bit, 24-bit, 32-bit)
  - BPM (default 120)
  - Time signature (4/4, 3/4, 6/8)
- New Project, Open Project, and Templates quick-access buttons
- Cancel and Create buttons

#### DAW Context State Management (DAWContext.tsx)

**State Properties:**
- `currentProject: Project | null` - Active project object
- `tracks: Track[]` - Array of all tracks in current project
- `selectedTrack: Track | null` - Currently selected/focused track
- `isPlaying: boolean` - Transport playback status
- `isRecording: boolean` - Active recording status
- `currentTime: number` - Current playback position (seconds)
- `zoom: number` - Timeline zoom factor
- `logicCoreMode: 'ON' | 'SILENT' | 'OFF'` - AI operation mode
- `voiceControlActive: boolean` - Voice control enabled state
- `cpuUsage: number` - Current CPU usage percentage
- `isUploadingFile: boolean` - File upload in progress indicator
- `uploadError: string | null` - Last upload error message (if any)

**Functions (API):**

**Project Management:**
- `setCurrentProject(project: Project | null): void` - Set/change active project
- `saveProject(): Promise<void>` - Save project to Supabase with session data
- `loadProject(projectId: string): Promise<void>` - Load project from Supabase

**Track Operations:**
- `addTrack(type: Track['type']): void` - Create new track (audio, instrument, midi, aux, vca, master)
- `selectTrack(trackId: string): void` - Select track for editing
- `updateTrack(trackId: string, updates: Partial<Track>): void` - Modify track properties (volume, pan, mute, solo, etc.)
- `deleteTrack(trackId: string): void` - Remove track from project

**Transport Controls:**
- `togglePlay(): void` - Toggle play/pause, stops recording if active
- `toggleRecord(): void` - Toggle recording, starts playback if not playing
- `stop(): void` - Stop playback and recording, reset timeline to start

**AI & Control:**
- `setLogicCoreMode(mode: LogicCoreMode): void` - Change LogicCore AI mode
- `toggleVoiceControl(): void` - Enable/disable voice control

**Audio Upload:**
- `uploadAudioFile(file: File): Promise<boolean>` - Upload audio file and create track
  - Validates file type (MP3, WAV, OGG, AAC, FLAC, M4A)
  - Validates file size (max 100MB)
  - Returns success/failure boolean
  - Creates new audio track on success

#### Type System (types/index.ts)

**Track Interface:**
```typescript
interface Track {
  id: string;                              // Unique identifier
  name: string;                            // Display name
  type: 'audio'|'instrument'|'midi'|'aux'|'vca'|'master';
  color: string;                           // Hex color code
  muted: boolean;                          // Mute state
  soloed: boolean;                         // Solo state
  armed: boolean;                          // Record arm state
  volume: number;                          // Volume in dB (-60 to +12)
  pan: number;                             // Pan value (-1 to +1)
  inserts: Plugin[];                       // Insert effects chain
  sends: Send[];                           // Send destinations
  routing: string;                         // Output bus name
  input?: string;                          // Input source
}
```

**Plugin Interface:**
```typescript
interface Plugin {
  id: string;
  name: string;
  type: 'eq'|'compressor'|'gate'|'saturation'|'delay'|'reverb'|'utility'|'meter'|'third-party';
  enabled: boolean;
  parameters: Record<string, number>;      // Dynamic plugin parameters
}
```

**Send Interface:**
```typescript
interface Send {
  id: string;
  destination: string;                     // Target bus name
  level: number;                           // Send level in dB
  prePost: 'pre'|'post';                   // Pre/post fader
  enabled: boolean;
}
```

**Project Interface:**
```typescript
interface Project {
  id: string;
  name: string;
  sampleRate: number;                      // Hz
  bitDepth: number;                        // Bits
  bpm: number;
  timeSignature: string;                   // e.g., "4/4"
  tracks: Track[];
  buses: Track[];
  createdAt: string;                       // ISO timestamp
  updatedAt: string;                       // ISO timestamp
}
```

**Template Interface:**
```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tracks: Track[];
}
```

#### Supabase Integration
- Database connection configured with environment variables
- Fallback demo mode when credentials unavailable
- Project table for persistence
- Session data storage with tracks and settings
- User authentication infrastructure (prepared for implementation)

#### Audio Engine (audioEngine.ts)
- Web Audio API integration for playback and recording
- Audio file loading and decoding (MP3, WAV, OGG, AAC, FLAC, M4A)
- Real-time track playback with gain control
- Microphone input recording with MediaRecorder API
- Frequency analysis and metering (AnalyserNode)
- Master gain control and per-track volume adjustment
- Audio buffer caching for efficient playback
- Graceful initialization and cleanup

#### Audio Utilities (audioUtils.ts)
- dB ↔ Linear gain conversion functions
- Audio level calculation (RMS, peak, LUFS)
- Frequency spectrum analysis (bass, mid, treble)
- Time formatting utilities
- Test tone generation
- Audio normalization and analysis helpers

### 🔄 In Progress / Partially Implemented

- **Voice Control**: UI toggle implemented, backend processing not yet implemented
- **LogicCore AI Features**: UI buttons present, actual analysis algorithms not yet implemented
- **Audio Engine**: Web Audio API integration complete with playback and recording ✅
- **Plugin Loading**: Stock plugin list UI only, no actual plugin instances
- **Automation**: Infrastructure ready, recording not yet implemented

### 📋 Planned (Future Phases)

**Phase 2 - AI Enhancements:**
- Smart gain staging analysis
- Routing recommendations
- Session health reports
- Undo/redo support for AI operations
- Macro recording and playback

**Phase 3 - Hardware & Voice:**
- Complete voice command implementation
- MIDI hardware control mapping
- External gear integration
- OSC protocol support
- HID device support

**Phase 4 - Optimization & Polish:**
- Performance optimization
- UI refinement (theme support: Vintage Heritage, Modern Dark)
- Bug fixes and stability improvements
- Public beta release

---

## API Usage Examples

### Creating a Project
```typescript
const { setCurrentProject } = useDAW();

const newProject = {
  id: `project-${Date.now()}`,
  name: 'My New Song',
  sampleRate: 48000,
  bitDepth: 24,
  bpm: 120,
  timeSignature: '4/4',
  tracks: [],
  buses: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

setCurrentProject(newProject);
```

### Adding a Track
```typescript
const { addTrack } = useDAW();

addTrack('audio');          // Add audio track
addTrack('instrument');     // Add instrument track
addTrack('midi');          // Add MIDI track
```

### Managing Track Properties
```typescript
const { updateTrack } = useDAW();

// Mute a track
updateTrack('track-123', { muted: true });

// Change volume
updateTrack('track-123', { volume: -6 });

// Solo track
updateTrack('track-123', { soloed: true });

// Arm for recording
updateTrack('track-123', { armed: true });
```

### Transport Control
```typescript
const { togglePlay, toggleRecord, stop } = useDAW();

togglePlay();    // Play/pause
toggleRecord();  // Start/stop recording
stop();         // Stop and reset
```

### Uploading Audio
```typescript
const { uploadAudioFile, isUploadingFile, uploadError } = useDAW();

const handleFileUpload = async (file: File) => {
  const success = await uploadAudioFile(file);
  if (success) {
    console.log('Track created from uploaded file');
  } else {
    console.error('Upload failed');
  }
};
```

---

## Usage Guide

1. **Launch Application**: Start CoreLogic Studio
2. **Create Project**: Fill in project settings in welcome modal (sample rate, BPM, etc.)
3. **Add Tracks**: Use the TrackList "+" button to add audio, MIDI, or instrument tracks
4. **Upload Audio**: Drag and drop audio files in the File Browser sidebar tab
5. **Manage Mix**: 
   - Use TrackList for track selection and muting/soloing
   - Use Mixer panel for volume control
   - Use Sidebar templates to quickly populate pre-configured track setups
6. **Transport**: Use TopBar buttons for play, pause, stop, and record
7. **LogicCore AI**: Experiment with AI features (when implemented) in AI tab
8. **Save**: Project auto-saves with Supabase backend

## Licensing & Updates
- Perpetual license: $250
- Rent-to-own: $25/month for 12 months
- 7-day trial: full features for 24 hours after purchase
- Update cycle includes AI and voice features within major releases

## Support & Contact
Visit the official website for updates, support, and community resources.
