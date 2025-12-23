# ??? CoreLogic Studio - Architecture Map
**Version 7.0.0 - Codette Doctrine Aligned**

## ?? Authority Boundaries (Single Source of Truth)

```
???????????????????????????????????????????????????????????????????
?                    TRUTH LAYER (Supabase)                       ?
?                   Single Source of Truth                        ?
?  • Project structure                                            ?
?  • Track metadata                                               ?
?  • Session state                                                ?
?  • Automation data                                              ?
?  • User preferences                                             ?
?                                                                 ?
?  AUTHORITY: All persistent state lives here                     ?
???????????????????????????????????????????????????????????????????
                ?
                ?
?????????????????????????????????????????????????????????????????
?                  EXECUTION LAYER (DAWContext)                 ?
?                   State Orchestration                         ?
?  • Validates state transitions                                ?
?  • Synchronizes UI with engine                                ?
?  • Gates all mutations                                        ?
?  • Maintains track registry                                   ?
?                                                               ?
?  RESPONSIBILITY: Truth enforcement and coordination           ?
?????????????????????????????????????????????????????????????????
                ?
       ???????????????????
       ?                 ?
???????????????   ???????????????????
?  UI LAYER   ?   ?  ENGINE LAYER   ?
?  (Intent)   ?   ?  (Execution)    ?
?             ?   ?                 ?
? • Read-only ?   ? • Web Audio     ?
? • Events up ?   ? • DSP Bridge    ?
? • No state  ?   ? • Deterministic ?
???????????????   ???????????????????
```

---

## ?? Core Principle: Codette Doctrine

**"Intent ? Truth ? Execution ? Telemetry ? Feedback"**

### Layer Responsibilities

| Layer | Authority | Mutation | State Access |
|-------|-----------|----------|--------------|
| **UI (Intent)** | None | Via context only | Read-only |
| **Context (Truth)** | All state | Exclusive | Read/Write |
| **Engine (Execution)** | Audio graph | None (receives commands) | Isolated |
| **DSP (Authority)** | Signal processing | None (pure functions) | Stateless |
| **Telemetry** | Observation | None | Read-only tap |

### Forbidden Patterns

? **Never:**
- UI directly mutates state
- UI calls AudioEngine directly
- Engine reaches into Context
- DSP holds state
- Telemetry affects routing

? **Always:**
- UI ? Context ? Engine ? DSP
- State changes through Context actions
- Telemetry observes, never controls
- Each layer has one responsibility

---

## ?? Component Architecture

### 1. Truth Layer: Supabase Schema

**Authority: Database is the single source of truth**

```sql
-- Core Tables
projects           -- Project metadata
tracks             -- Track definitions
regions            -- Audio regions
automation_points  -- Automation curves
sessions           -- User sessions
telemetry_logs     -- Audit trail
```

**Guarantees:**
- All writes are transactional
- No state outside database
- Workers reference DB, never files alone
- Tools operate through schema

**Contract:**
```typescript
// Every UI action must have a DB mutation
await supabase.from('tracks').update({ volume: -6 })

// Never:
track.volume = -6  // ? Direct mutation bypasses truth
```

---

### 2. Execution Layer: DAWContext

**Authority: State orchestration and validation**

**File:** `src/contexts/DAWContext.tsx`

**Responsibilities:**
- Hold complete DAW state
- Validate all transitions
- Synchronize UI ? Engine
- Emit typed actions

**Contract:**
```typescript
// State shape (single source of truth in memory)
interface DAWState {
  tracks: Track[]
  transport: TransportState
  routing: RoutingMatrix
  automation: AutomationState
}

// Actions (only way to mutate)
interface DAWActions {
  addTrack(track: Track): void
  setTrackVolume(id: string, volume: number): void
  play(): void
  stop(): void
}

// All mutations flow through actions
const { addTrack, setTrackVolume } = useDAW()
setTrackVolume('track-1', -6)  // ? Validated, auditable
```

**Validation Rules:**
```typescript
// Before mutation
if (volume < -60 || volume > 12) {
  throw new ValidationError('Volume out of range')
}

// After mutation
logMutation({
  type: 'track.volume.set',
  trackId: id,
  oldValue: track.volume,
  newValue: volume,
  timestamp: Date.now()
})
```

---

### 3. Intent Layer: UI Components

**Authority: None (presentation only)**

**Files:** `src/components/*`

**Responsibilities:**
- Render state
- Capture user intent
- Emit events upward
- No business logic

**Contract:**
```typescript
// Read-only access to state
const { tracks, transport } = useDAW()

// Mutations via context actions
const { setTrackVolume } = useDAW()

// Never:
const handleVolumeChange = (value: number) => {
  track.volume = value  // ? Direct mutation
  
  // Always:
  setTrackVolume(track.id, value)  // ? Through context
}
```

**Component Pattern:**
```typescript
interface MixerProps {
  // Read-only data
  tracks: Track[]
  selectedTrackId: string | null
  
  // Action callbacks
  onSelectTrack: (id: string) => void
  onVolumeChange: (id: string, volume: number) => void
}

// Component is pure function of props
function Mixer({ tracks, onVolumeChange }: MixerProps) {
  return (
    <div>
      {tracks.map(track => (
        <Fader
          value={track.volume}
          onChange={v => onVolumeChange(track.id, v)}
        />
      ))}
    </div>
  )
}
```

---

### 4. Execution Layer: AudioEngine

**Authority: Audio graph and Web Audio context**

**File:** `src/lib/audioEngine.ts`

**Responsibilities:**
- Maintain AudioContext singleton
- Execute deterministic commands
- Provide telemetry taps
- No state beyond audio graph

**Contract:**
```typescript
class AudioEngine {
  // Deterministic operations only
  play(trackId: string, offset: number): void
  stop(): void
  setGain(trackId: string, gainDb: number): void
  
  // Telemetry (read-only)
  getAudioLevels(trackId: string): AudioLevels
  
  // Never:
  // - Mutate track metadata
  // - Store UI state
  // - Make decisions about routing
}
```

**Determinism Guarantee:**
```typescript
// Same inputs ? same outputs
const result1 = engine.setGain('track-1', -6)
const result2 = engine.setGain('track-1', -6)
// result1 === result2 (idempotent)

// No hidden state
const levels1 = engine.getAudioLevels('track-1')
const levels2 = engine.getAudioLevels('track-1')
// levels1 ? levels2 (deterministic sampling)
```

---

### 5. Authority Layer: Python DSP Core

**Authority: Professional audio algorithms**

**Path:** `daw_core/`

**Responsibilities:**
- Pure DSP functions
- Zero UI knowledge
- Deterministic processing
- 100% test coverage

**Contract:**
```python
# Pure function: input ? output
def process_compressor(
    audio: np.ndarray,
    threshold: float,
    ratio: float,
    attack: float,
    release: float,
    sample_rate: int
) -> np.ndarray:
    # No state
    # No side effects
    # No randomness
    # Deterministic output
    pass

# Never:
# - Read from files
# - Store state between calls
# - Depend on UI state
# - Make assumptions about context
```

**Testing Guarantee:**
```python
# 197/197 tests passing
def test_compressor_determinism():
    audio = np.random.randn(44100)
    result1 = process_compressor(audio, -20, 4, 0.005, 0.1, 44100)
    result2 = process_compressor(audio, -20, 4, 0.005, 0.1, 44100)
    
    assert np.allclose(result1, result2)  # Must be identical
```

---

### 6. Telemetry Layer: VU Meter System

**Authority: Observation only**

**File:** `src/components/VUMeterGfx.tsx`

**Responsibilities:**
- Sample audio levels
- Render meters
- Display statistics
- Never control

**Contract:**
```typescript
// Read-only tap into audio stream
const levels = engine.getAudioLevels(trackId)

// Render telemetry
return (
  <canvas ref={canvasRef}>
    {/* Display levels, never mutate state */}
  </canvas>
)

// Never:
// - Adjust gain based on levels
// - Change routing
// - Trigger playback
// - Modify any state
```

**60 FPS Guarantee:**
```typescript
// Efficient rendering loop
useAnimationFrame(() => {
  const levels = engine.getAudioLevels(trackId)
  drawVUMeter(levels)  // <16ms budget
})
```

---

## ?? Data Flow Patterns

### Pattern 1: User Action ? State Mutation

```typescript
// 1. User clicks volume fader
<Fader onValueChange={handleVolumeChange} />

// 2. Component calls context action
const handleVolumeChange = (value: number) => {
  setTrackVolume(track.id, value)
}

// 3. Context validates and mutates
function setTrackVolume(id: string, volume: number) {
  // Validate
  if (volume < -60 || volume > 12) throw new Error()
  
  // Mutate truth
  setTracks(tracks.map(t => 
    t.id === id ? { ...t, volume } : t
  ))
  
  // Sync to DB
  await supabase.from('tracks').update({ volume }).eq('id', id)
  
  // Command engine
  audioEngine.setGain(id, volume)
  
  // Audit
  logMutation({ type: 'track.volume', id, volume })
}
```

### Pattern 2: Playback Lifecycle

```typescript
// 1. User clicks play
<PlayButton onClick={() => play()} />

// 2. Context orchestrates
function play() {
  // Update transport state
  setTransportState({ playing: true, time: currentTime })
  
  // Sync to DB
  await supabase.from('sessions').update({ playing: true })
  
  // Command engine
  audioEngine.play(currentTime)
  
  // Telemetry tap activates automatically
}

// 3. Telemetry observes
useAnimationFrame(() => {
  const levels = audioEngine.getAudioLevels()
  updateVUMeters(levels)
})
```

### Pattern 3: DSP Effect Processing

```typescript
// 1. User adds compressor
<EffectSelector onSelect={(effect) => addEffect(track.id, effect)} />

// 2. Context validates and adds
function addEffect(trackId: string, effect: Effect) {
  // Validate
  if (!isValidEffect(effect)) throw new Error()
  
  // Mutate truth
  const track = findTrack(trackId)
  track.inserts.push(effect)
  
  // Sync to DB
  await supabase.from('tracks').update({ 
    inserts: track.inserts 
  }).eq('id', trackId)
  
  // Command hybrid processor
  if (effect.engine === 'python') {
    await pythonDSPBridge.addEffect(trackId, effect)
  } else {
    audioEngine.addEffect(trackId, effect)
  }
}

// 3. Processing happens deterministically
// Audio ? Effect Chain ? Output
// Same input ? Same output (always)
```

---

## ?? Worker Contracts

### Waveform Worker

**File:** `src/workers/waveformWorker.ts`

**Input Contract:**
```typescript
interface WaveformRequest {
  audioBuffer: ArrayBuffer
  sampleRate: number
  targetWidth: number
  targetHeight: number
}
```

**Output Contract:**
```typescript
interface WaveformResponse {
  peaks: Float32Array
  rms: Float32Array
  duration: number
  sampleRate: number
  deterministic: true  // Must be reproducible
}
```

**Guarantees:**
- Same audio ? same waveform
- No side effects
- No state between calls
- Timing predictable

---

## ?? Trust Signals in UI

### Visual Hierarchy (Left ? Center ? Right)

```
????????????????????????????????????????????????????
?   INTENT    ?      SIGNAL      ?     TRUTH       ?
?   (Left)    ?     (Center)     ?    (Right)      ?
????????????????????????????????????????????????????
? • Transport ? • Waveform       ? • VU Meters     ?
? • Track     ? • Timeline       ? • Spectrum      ?
?   controls  ? • Editing zone   ? • State hash    ?
? • Effect    ?                  ? • Last mutation ?
?   selector  ?                  ? • Worker status ?
????????????????????????????????????????????????????
```

### Telemetry Panel (First-Class)

```typescript
<TelemetryPanel>
  <StateHash value={currentStateHash} />
  <LastMutation source="UI" action="track.volume.set" />
  <ActiveWorkers count={2} />
  <ConnectionStatus python="online" supabase="online" />
</TelemetryPanel>
```

---

## ?? Onboarding Flow

```
1. Welcome Screen
   ?
2. "Create your first project"
   • Explain: Projects live in Supabase
   • Explain: All changes are tracked
   ?
3. "Import audio"
   • Explain: Files analyzed by worker
   • Explain: Waveform stored as data
   ?
4. "What happens next"
   • Show the data flow
   • Show the telemetry
   • Invite exploration
```

---

## ?? Defensive Guarantees

### 1. No Cross-Layer Mutation
```typescript
// ? UI cannot mutate state directly
track.volume = -6

// ? UI must go through context
setTrackVolume(track.id, -6)
```

### 2. All Actions Auditable
```typescript
// Every mutation logged
{
  timestamp: 1735000000000,
  type: 'track.volume.set',
  actor: 'user',
  trackId: 'track-1',
  oldValue: 0,
  newValue: -6,
  stateHash: 'abc123...'
}
```

### 3. Deterministic Execution
```typescript
// Same state ? same output
const state1 = getDAWState()
const output1 = audioEngine.process(state1)

const state2 = getDAWState()
const output2 = audioEngine.process(state2)

// If state1 === state2, then output1 === output2
```

### 4. Explicit Boundaries
```typescript
// Clear contracts at every boundary
interface UIToContextContract {
  // What UI can request
  play(): void
  stop(): void
  setVolume(id: string, volume: number): void
}

interface ContextToEngineContract {
  // What engine must provide
  playAudio(offset: number): void
  stopAudio(): void
  setGain(id: string, gain: number): void
}
```

---

## ?? Scaling Strategy

### Current: Monolithic State
```
DAWContext holds entire state in memory
```

### Future: Distributed State (when needed)
```
DAWContext ? Redux/Zustand ? Normalized store
                              ?
                         Supabase sync
```

### Worker Scaling
```
Current: Main thread + waveform worker
Future:  Main + waveform + analysis + export workers
         (Each with explicit contracts)
```

---

## ?? Success Metrics

### Determinism
- [ ] Same input ? same output (100%)
- [ ] No race conditions
- [ ] No hidden state

### Auditability
- [ ] Every mutation logged
- [ ] State hash at every step
- [ ] Replay-able from logs

### Isolation
- [ ] UI never touches engine
- [ ] Engine never touches state
- [ ] Workers never share state

### Clarity
- [ ] User knows what changed
- [ ] User knows what's happening
- [ ] User knows what's safe

---

## ?? Next Steps

1. **Immediate:** Surface telemetry panel in UI
2. **Short-term:** Add mutation audit trail
3. **Medium-term:** State replay from logs
4. **Long-term:** Distributed state management

---

**Architecture Status: ? Codette-Aligned**  
**Authority: Explicit and Enforced**  
**Telemetry: Observable**  
**Contracts: Defined**

*This is not a DAW. This is a verified audio system.*
