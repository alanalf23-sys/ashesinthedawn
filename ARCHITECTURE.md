# CoreLogic Studio - Component Documentation

## Component Overview & Props

### TopBar Component
**File**: `src/components/TopBar.tsx`

**Purpose**: Main transport control bar and system monitoring display

**Props**: None (uses DAW context)

**Features**:
- Play/Pause button with toggle state
- Stop button (resets timeline to 0)
- Record button with record-active indication
- Time display in MM:SS:MS format
- LogicCore mode selector (dropdown: ON/SILENT/OFF)
- Voice control toggle button
- CPU usage display (%)
- Storage capacity display (GB)
- Project name display

**Connected Context Values**:
```typescript
currentProject, isPlaying, isRecording, currentTime, logicCoreMode, voiceControlActive, cpuUsage
```

**Context Functions Used**:
```typescript
togglePlay, toggleRecord, stop, setLogicCoreMode, toggleVoiceControl
```

---

### TrackList Component
**File**: `src/components/TrackList.tsx`

**Purpose**: Track management interface for adding, selecting, and controlling tracks

**Props**: None (uses DAW context)

**Features**:
- Add track dropdown menu with track type options
- Track list with scrolling
- Per-track display with:
  - Color indicator (dot)
  - Track type icon
  - Track name
  - Delete button
- Per-track controls:
  - Mute (M) - yellow when active
  - Solo (S) - green when active
  - Record Arm (R) - red when active
- Track selection highlighting (blue left border)

**Track Type Icons**:
- Audio: Microphone icon
- Instrument: Piano icon
- MIDI: Music note icon
- Aux: Radio icon
- Master: Volume icon

**Connected Context Values**:
```typescript
tracks, selectedTrack
```

**Context Functions Used**:
```typescript
addTrack, selectTrack, deleteTrack, updateTrack
```

**Styling**:
- Dark gray background (bg-gray-900)
- Hover effects on tracks
- Color-coded control buttons

---

### Timeline Component
**File**: `src/components/Timeline.tsx`

**Purpose**: Visual timeline representation for session arrangement

**Props**: None (uses DAW context)

**Features**:
- Horizontal bar ruler (32 bars default)
- Numbered bar/beat indicators
- Blue playhead with triangle marker
- Playhead updates with currentTime
- Per-track horizontal lanes (one per track)
- Dark theme with grid lines
- Sticky header ruler (stays visible when scrolling)

**Constants**:
- `bars = 32` - number of visible bars
- `pixelsPerBar = 120` - pixel width per bar

**Playhead Calculation**:
```
left position = (currentTime / 4) * pixelsPerBar
```

**Connected Context Values**:
```typescript
tracks, currentTime, currentProject
```

---

### Mixer Component
**File**: `src/components/Mixer.tsx`

**Purpose**: Horizontal mixer for track-level volume and status control

**Props**: None (uses DAW context)

**Features**:
- Horizontal strip layout (scrollable)
- Per-track strip display with:
  - Volume level meter (gradient: green → yellow → red)
  - Vertical volume fader (-60dB to +12dB)
  - Volume value display in dB
  - Mute button (yellow when active)
  - Solo button (green when active)
  - Track name label (truncated with title tooltip)
  - Track color indicator (bottom bar)
- Empty state message when no tracks
- Dark gradient background

**Volume Fader Range**:
- Minimum: -60dB
- Maximum: +12dB
- Real-time display with decimal precision

**Connected Context Values**:
```typescript
tracks
```

**Context Functions Used**:
```typescript
updateTrack
```

---

### Sidebar Component
**File**: `src/components/Sidebar.tsx`

**Purpose**: Multi-tab interface for file management, plugins, templates, and AI features

**Props**: None (uses DAW context)

**Features**:

#### File Browser Tab
- Drag-and-drop zone with hover effects
- Click-to-upload functionality
- Supported formats: MP3, WAV, OGG, AAC, FLAC, M4A
- States:
  - Default: Upload icon + instructions
  - Uploading: Spinning upload icon + "Uploading..."
  - Success: Green checkmark + "Upload successful!" (2s timeout)
  - Error: Red alert + error message
- Browser list: My Projects, Audio Files, Samples, Loops

#### Plugins Tab
- 8 clickable plugin buttons:
  - Channel EQ
  - Channel Compressor
  - Gate/Expander
  - Saturation
  - Delay
  - Reverb
  - Utility
  - Metering
- Each click adds an audio track
- Plugin description text

#### Templates Tab
- 5 template buttons:
  - Rock Band (4 tracks)
  - Electronic Production (6 tracks)
  - Podcast Mix (3 tracks)
  - Orchestral (5 tracks)
  - Hip Hop (4 tracks)
- Auto-populates tracks on selection

#### AI Tab
- 4 AI feature buttons:
  - Smart Gain Staging
  - Routing Assistant
  - Session Health Check
  - Create Template from Session
- AI tips section with instructions
- Voice control usage hints

**Connected Context Values**:
```typescript
isUploadingFile, uploadError
```

**Context Functions Used**:
```typescript
addTrack, uploadAudioFile
```

**File Upload Validation**:
- Type: MP3, WAV, OGG, AAC, FLAC, M4A
- Size: Max 100MB
- Error: Returns false on validation failure

---

### WelcomeModal Component
**File**: `src/components/WelcomeModal.tsx`

**Purpose**: Initial project creation and settings configuration

**Props**:
```typescript
interface WelcomeModalProps {
  onClose: () => void;
}
```

**Features**:
- Modal overlay with dark background
- Dismissible with X button
- Welcome message and description
- Three quick-access buttons:
  - New Project (blue border)
  - Open Project (gray border)
  - Templates (gray border)
- Project settings form:
  - Project Name (text input)
  - Sample Rate dropdown (44100, 48000, 96000 Hz)
  - Bit Depth dropdown (16, 24, 32 bit)
  - BPM input (default 120)
  - Time Signature dropdown (4/4, 3/4, 6/8)
- Cancel and Create buttons

**New Project Defaults**:
```typescript
{
  sampleRate: 48000,
  bitDepth: 24,
  bpm: 120,
  timeSignature: '4/4',
  tracks: [],
  buses: [],
}
```

**Connected Context Values**: None (direct)

**Context Functions Used**:
```typescript
setCurrentProject
```

---

### AudioMeter Component
**File**: `src/components/AudioMeter.tsx`

**Purpose**: Real-time frequency spectrum visualization and audio metering

**Props**: None (uses audio engine directly)

**Features**:
- Canvas-based frequency spectrum visualization
- Real-time audio level monitoring
- Color-coded frequency bars:
  - Green: Normal levels
  - Amber: High levels
  - Red: Clipping danger (>80%)
- Smooth animation using requestAnimationFrame
- Responsive to audio engine output

---

## Audio Engine System

### AudioEngine Class
**File**: `src/lib/audioEngine.ts`

**Purpose**: Core audio playback, recording, and analysis using Web Audio API

**Methods:**

#### `initialize(): Promise<void>`
- Initializes AudioContext and creates master nodes
- Must be called before playback
- Creates master gain and analyser nodes
- Idempotent - safe to call multiple times

#### `loadAudioFile(trackId: string, file: File): Promise<boolean>`
- Loads and decodes audio file into AudioBuffer
- Caches decoded audio for efficient playback
- Supports: MP3, WAV, OGG, AAC, FLAC, M4A
- Returns success boolean

#### `playAudio(trackId: string, startTime?: number, volume?: number): boolean`
- Plays audio from specified track
- startTime: Beginning offset in seconds
- volume: Initial volume in dB (-60 to +12)
- Stops existing playback for track before starting
- Returns success boolean

#### `stopAudio(trackId: string): void`
- Stops playback for specific track
- Removes track from active playback nodes

#### `stopAllAudio(): void`
- Stops all active playback
- Clears all playing nodes

#### `setMasterVolume(volumeDb: number): void`
- Sets master output volume
- Affects all playback
- Range: -∞ to 0 dB

#### `setTrackVolume(trackId: string, volumeDb: number): void`
- Sets volume for specific track
- Only affects actively playing tracks

#### `startRecording(): Promise<boolean>`
- Begins microphone recording
- Requests user permission
- Uses MediaRecorder API
- Returns success boolean

#### `stopRecording(): Promise<Blob | null>`
- Stops recording and returns audio blob
- Blob type: 'audio/webm'
- Returns null if not recording

#### `getCurrentTime(): number`
- Returns current playback position
- Uses AudioContext.currentTime

#### `getAudioLevels(): Uint8Array | null`
- Returns frequency data for current playback
- Used for metering and visualization
- Contains 1024 frequency values (0-255)

#### `isPlaying(): boolean`
- Returns true if any tracks are playing

#### `dispose(): void`
- Cleanup method
- Stops all playback
- Closes AudioContext
- Clears buffers and nodes

### Audio Utilities
**File**: `src/lib/audioUtils.ts`

**Helper Functions:**

#### Gain Conversion
- `dbToLinear(db: number): number` - Convert dB to linear gain (0-1)
- `linearToDb(linear: number): number` - Convert linear gain to dB

#### Level Analysis
- `calculateRMSLevel(audioData: Uint8Array): number` - RMS level calculation
- `getPeakLevel(audioData: Uint8Array): number` - Peak level (0-1)
- `calculateLUFS(audioData: Uint8Array): number` - Loudness in LUFS

#### Spectrum Analysis
- `analyzeFrequencySpectrum(audioData: Uint8Array)` - Returns {bass, mid, treble}
- `normalizeAudioData(audioData: Uint8Array): number[]` - Normalize to 0-1

#### Utilities
- `formatTime(seconds: number): string` - Format time as MM:SS:MS
- `isAudioContextAvailable(): boolean` - Check audio support
- `getAudioContext(): AudioContext | null` - Get or create context
- `generateTestTone(frequency, duration, sampleRate): AudioBuffer` - Create sine wave

#### Advanced
- `smoothGain(fromGain, toGain, duration): number[]` - Gain ramp array
- `blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer>` - Blob conversion

---

**File**: `src/contexts/DAWContext.tsx`

### Context Interface

```typescript
interface DAWContextType {
  // State
  currentProject: Project | null;
  tracks: Track[];
  selectedTrack: Track | null;
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  zoom: number;
  logicCoreMode: LogicCoreMode;
  voiceControlActive: boolean;
  cpuUsage: number;
  isUploadingFile: boolean;
  uploadError: string | null;

  // Functions
  setCurrentProject: (project: Project | null) => void;
  addTrack: (type: Track['type']) => void;
  selectTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  deleteTrack: (trackId: string) => void;
  togglePlay: () => void;
  toggleRecord: () => void;
  stop: () => void;
  setLogicCoreMode: (mode: LogicCoreMode) => void;
  toggleVoiceControl: () => void;
  saveProject: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  uploadAudioFile: (file: File) => Promise<boolean>;
}
```

### Hook Usage

```typescript
const daw = useDAW();
// Now access: daw.currentProject, daw.togglePlay(), etc.
```

### State Details

#### currentProject
- Type: `Project | null`
- Default: `null`
- Updated by: `setCurrentProject`, `loadProject`
- Used by: All components for session context

#### tracks
- Type: `Track[]`
- Default: `[]`
- Updated by: `addTrack`, `updateTrack`, `deleteTrack`, `loadProject`
- Synced with: `currentProject.tracks`

#### selectedTrack
- Type: `Track | null`
- Default: `null`
- Updated by: `selectTrack`, `deleteTrack`
- Used by: Components needing selection context

#### isPlaying
- Type: `boolean`
- Default: `false`
- Updated by: `togglePlay`, `stop`, `toggleRecord`
- Effects: Timeline playhead movement via effect

#### isRecording
- Type: `boolean`
- Default: `false`
- Updated by: `toggleRecord`, `stop`
- Behavior: Starts playback if not already playing

#### currentTime
- Type: `number` (seconds)
- Default: `0`
- Updated by: Effect incrementing by 0.1s every 100ms when isPlaying
- Reset by: `stop()` function

#### zoom
- Type: `number`
- Default: `1`
- Current usage: Ready for timeline zoom feature
- Updated by: (prepared for future implementation)

#### logicCoreMode
- Type: `'ON' | 'SILENT' | 'OFF'`
- Default: `'ON'`
- Updated by: `setLogicCoreMode`
- Displayed in: TopBar dropdown

#### voiceControlActive
- Type: `boolean`
- Default: `false`
- Updated by: `toggleVoiceControl`
- Used by: TopBar voice button, UI indicators

#### cpuUsage
- Type: `number` (0-100)
- Default: `12`
- Currently static demo value
- Displayed in: TopBar

#### isUploadingFile
- Type: `boolean`
- Default: `false`
- Updated by: `uploadAudioFile`
- Used by: Sidebar upload UI state

#### uploadError
- Type: `string | null`
- Default: `null`
- Set by: `uploadAudioFile` validation failures
- Displayed in: Sidebar upload zone

### Function Details

#### setCurrentProject(project: Project | null)
- Sets the active project
- Triggers tracks state update via useEffect
- No return value

#### addTrack(type: Track['type'])
- Creates new track with:
  - Unique ID (track-{timestamp})
  - Auto-generated name (e.g., "Audio 1")
  - Blue color default
  - Empty inserts/sends arrays
  - "Master" routing default
- Appends to tracks array

#### selectTrack(trackId: string)
- Finds track by ID
- Updates selectedTrack state
- Sets to null if not found

#### updateTrack(trackId: string, updates: Partial<Track>)
- Partial update to specific track properties
- Finds track by ID and merges updates
- Leaves unchanged properties intact

#### deleteTrack(trackId: string)
- Removes track from array by ID
- Clears selectedTrack if deleted track was selected
- No effect if track not found

#### togglePlay()
- Flips isPlaying state
- Stops recording if active
- Triggers currentTime effect

#### toggleRecord()
- Flips isRecording state
- Starts playback if not already playing
- Stops playback in togglePlay if active

#### stop()
- Sets isPlaying to false
- Sets isRecording to false
- Resets currentTime to 0

#### setLogicCoreMode(mode: LogicCoreMode)
- Sets logicCoreMode state
- Mode persists across component rerenders
- Used by AI selector in TopBar

#### toggleVoiceControl()
- Flips voiceControlActive state
- Updates voice button UI in TopBar
- No audio processing currently

#### saveProject()
- Async function
- Gets current user from Supabase
- Upserts project with session data
- Logs errors to console
- Requires active project

#### loadProject(projectId: string)
- Async function
- Fetches project from Supabase by ID
- Reconstructs Project object from DB data
- Updates currentProject state
- Logs errors to console

#### uploadAudioFile(file: File)
- Returns `Promise<boolean>`
- Validations:
  - File type: MP3, WAV, OGG, AAC, FLAC, M4A
  - File size: Max 100MB
  - Creates new audio track on success
  - Simulates 1s upload delay
- Sets isUploadingFile and uploadError states
- Track named after filename (extension removed)

---

## Type Definitions

**File**: `src/types/index.ts`

### Track Interface
```typescript
interface Track {
  id: string;                              // Unique identifier
  name: string;                            // Display name
  type: 'audio'|'instrument'|'midi'|'aux'|'vca'|'master';
  color: string;                           // Hex color code (#RRGGBB)
  muted: boolean;                          // Mute state
  soloed: boolean;                         // Solo state
  armed: boolean;                          // Record arm state
  volume: number;                          // Volume in dB (-60 to +12)
  pan: number;                             // Pan (-1.0 to +1.0, where 0 is center)
  inserts: Plugin[];                       // Effect chain
  sends: Send[];                           // Send destinations
  routing: string;                         // Output destination (e.g., "Master")
  input?: string;                          // Optional input source
}
```

### Plugin Interface
```typescript
interface Plugin {
  id: string;                              // Unique identifier
  name: string;                            // Display name
  type: 'eq'|'compressor'|'gate'|'saturation'|'delay'|'reverb'|'utility'|'meter'|'third-party';
  enabled: boolean;                        // Plugin active state
  parameters: Record<string, number>;      // Dynamic parameter storage
}
```

### Send Interface
```typescript
interface Send {
  id: string;                              // Unique identifier
  destination: string;                     // Target bus/track name
  level: number;                           // Send level in dB
  prePost: 'pre'|'post';                   // Pre or post fader
  enabled: boolean;                        // Send active state
}
```

### Project Interface
```typescript
interface Project {
  id: string;                              // Unique identifier
  name: string;                            // Project name
  sampleRate: number;                      // Hz (44100, 48000, 96000, etc.)
  bitDepth: number;                        // Bits (16, 24, 32)
  bpm: number;                             // Beats per minute
  timeSignature: string;                   // Format: "4/4", "3/4", "6/8"
  tracks: Track[];                         // All tracks in project
  buses: Track[];                          // Bus/aux tracks
  createdAt: string;                       // ISO 8601 timestamp
  updatedAt: string;                       // ISO 8601 timestamp
}
```

### AIPattern Interface
```typescript
interface AIPattern {
  type: string;                            // Pattern type identifier
  data: Record<string, unknown>;           // Flexible pattern data
  usageCount: number;                      // Times pattern was used
}
```

### Template Interface
```typescript
interface Template {
  id: string;                              // Unique identifier
  name: string;                            // Template name
  description: string;                     // Template description
  category: string;                        // Category (e.g., "music", "podcast")
  tracks: Track[];                         // Pre-configured track layout
}
```

### LogicCoreMode Type
```typescript
type LogicCoreMode = 'ON' | 'SILENT' | 'OFF';
```

---

## Component Dependencies & Data Flow

```
App.tsx
├── DAWProvider (Context provider)
│   ├── TopBar
│   │   └── Uses: togglePlay, toggleRecord, stop, setLogicCoreMode, toggleVoiceControl
│   │
│   ├── TrackList
│   │   └── Uses: addTrack, selectTrack, deleteTrack, updateTrack
│   │
│   ├── Timeline
│   │   └── Uses: tracks, currentTime (for playhead movement)
│   │
│   ├── Mixer
│   │   └── Uses: updateTrack for volume changes
│   │
│   ├── Sidebar
│   │   └── Uses: addTrack, uploadAudioFile
│   │
│   └── WelcomeModal
│       └── Uses: setCurrentProject
```

---

## Styling Notes

- **Theme**: Dark theme (Tailwind dark colors)
- **Color Scheme**:
  - Background: Gray-900 to Gray-950
  - Borders: Gray-700
  - Buttons: Blue-600 (primary), Gray-700 (secondary)
  - Active states: Various (green for solo, yellow for mute, red for recording)
- **Layout**: Flexbox layout with Tailwind utility classes
- **Icons**: Lucide React icons
- **Responsive**: Currently desktop-optimized, not mobile-responsive

---

**Document Last Updated**: November 17, 2025
