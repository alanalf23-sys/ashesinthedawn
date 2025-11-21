# CoreLogic Studio - DAW Core Engine

## Overview

**CoreLogic Studio** is building a professional-grade Digital Audio Workstation (DAW) using a **modular, node-based signal graph** architecture inspired by REAPER's design philosophy.

This directory (`daw_core/`) contains the **pure DSP core** — the heart of the engine that:
- ✅ Manages audio signal processing
- ✅ Routes audio between tracks, effects, and buses
- ✅ Schedules real-time block processing
- ✅ Handles complex signal flows (sends, auxiliary tracks, sidechains)

The React/TypeScript UI layer (in `src/`) will communicate with this core via a WebSocket or HTTP API.

---

## Architecture Philosophy

### Why Node-Based?

Traditional DAW architectures are **hierarchical**:
```
Track → FX Chain → Fader → Master
```

This works, but it's rigid. You can't easily:
- Route a track to multiple destinations
- Create parallel processing chains
- Implement sidechains or complex modulation
- Support modular synths or CV routing

REAPER solved this with **free routing** and **flexible graph architecture**. Every component is a node:

```
[Input] → [Node] → [Node] → [Output]
```

Each node:
- Has N inputs and M outputs
- Processes audio in fixed-size blocks (128-1024 samples)
- Connects to other nodes via ports
- Can be bypassed or automated

---

## Architecture Layers

### Layer 1: Signal Graph (`graph.py`)

**Classes:**
- `Node` — Base class for all DSP components
- `AudioInput` — Audio source (file, hardware, generated)
- `FXNode` — Effect processor (EQ, compressor, reverb, etc.)
- `MixerBus` — Summing amplifier (stereo mixing)
- `OutputNode` — Master output stage

**Example:**
```python
from daw_core.graph import AudioInput, FXNode, MixerBus

# Create nodes
audio_in = AudioInput("MicIn")
compressor = FXNode("Compressor", compress_function)
master = MixerBus("Master")

# Connect graph
engine.add_node(audio_in)
engine.add_node(compressor)
engine.add_node(master)

engine.connect(audio_in, compressor)
engine.connect(compressor, master)
```

### Layer 2: Engine & Scheduling (`engine.py`)

**Class:**
- `AudioEngine` — Manages the entire signal graph

**Responsibilities:**
- Store nodes and connectivity
- Perform **topological sort** (Kahn's algorithm) to determine processing order
- Execute nodes in the correct sequence each block
- Prevent cycles in the graph
- Provide real-time control

**Key Methods:**
- `add_node(node)` — Add a node to the graph
- `connect(src, dst)` — Connect two nodes
- `process_block()` — Execute one block of audio
- `topological_sort()` — Get correct processing order

---

### Layer 3: Track Abstraction (`track.py`)

**Class:**
- `Track` — High-level track interface

A Track is a convenience wrapper around multiple nodes:

```
Input → InputGain → FXChain → Fader → Pan → Sends → Output
```

**Track Parameters (stored, not audio):**
- `volume` — Fader level (dB)
- `pan` — Stereo panning (-1.0 to +1.0)
- `muted` — Mute state
- `soloed` — Solo state
- `armed` — Record arm
- `inserts` — List of FX nodes
- `sends` — Parallel routing destinations
- `input_gain` — Pre-fader input level

**Example:**
```python
from daw_core.track import Track
from daw_core.graph import FXNode

track = Track("vocal_1", "Lead Vocal", track_type="audio")
track.set_volume(-3.0)      # -3 dB fader
track.set_pan(0.5)           # Pan right
track.add_insert(compressor) # Insert compression

# Track stores parameters; engine executes the graph
```

### Layer 4: Routing & Sends (`routing.py`)

**Class:**
- `Router` — Manages connections between tracks and buses

**Features:**
- Track routing (which bus does it output to?)
- Auxiliary tracks (submixes, reverb, compression)
- Pre/post-fader sends (parallel processing)
- Cycle detection (prevent feedback loops)
- Routing matrix export (for serialization/visualization)

**Example:**
```python
from daw_core.routing import Router

router = Router()

# Create auxiliary reverb track
aux_reverb = Track("aux_reverb", "Reverb")
router.add_track(aux_reverb)

# Main track sends to reverb
main_track.add_send("aux_reverb", level_db=-6.0, pre_fader=False)

# Route auxiliary back to master
router.route_track("aux_reverb", "master")

# Validate no cycles
is_valid, msg = router.validate_routing()
```

---

## Signal Flow Example

### Scenario: Two-Track Mix with Reverb Send

```
TRACK 1 (Guitar)
├─ Input (from file)
├─ Compressor (FX)
├─ Volume Fader (-3 dB)
├─ Pan (0.3 right)
├─ Main Output → Master
└─ Send → Reverb Aux (-6 dB, post-fader)

TRACK 2 (Drums)
├─ Input (from file)
├─ Volume Fader (0 dB)
├─ Pan (-0.3 left)
└─ Main Output → Master

AUX BUS (Reverb)
├─ Input (from Guitar send)
├─ Reverb FX
├─ Volume Fader (-6 dB)
└─ Output → Master

MASTER BUS
├─ Input (Guitar + Drums + Reverb Aux)
├─ Output Monitor
└─ Hardware Output
```

**Processing Order (Topological Sort):**
1. Guitar Input
2. Guitar Compressor
3. Drums Input
4. Guitar Fader
5. Drums Fader
6. Reverb Input (from send)
7. Reverb Fader
8. Master Bus (sum all inputs)
9. Master Output

---

## Data Model

### Track (Serialized Format)

```json
{
  "id": "track_1",
  "name": "Lead Vocal",
  "type": "audio",
  "color": "#FF5733",
  "muted": false,
  "soloed": false,
  "armed": true,
  "volume": -2.5,
  "pan": 0.1,
  "input_gain": 3.0,
  "stereo_width": 100.0,
  "phase_flip": false,
  "inserts": [
    { "name": "Compressor", "enabled": true },
    { "name": "EQ", "enabled": true }
  ],
  "sends": [
    {
      "destination": "aux_reverb",
      "level_db": -6.0,
      "pre_fader": false,
      "enabled": true
    }
  ],
  "output_routing": "master"
}
```

### Project (Serialized Format)

```json
{
  "name": "My Song",
  "sample_rate": 44100,
  "tracks": [ /* array of track objects */ ],
  "routing": {
    "track_1": ["master"],
    "track_2": ["master"],
    "aux_reverb": ["master"]
  },
  "master": {
    "volume": 0.0
  }
}
```

---

## Running the Examples

The `examples.py` file demonstrates the core architecture:

```bash
cd daw_core
python examples.py
```

This runs 5 examples:
1. **Simple Graph** — Basic signal routing
2. **Multi-Track Routing** — Multiple tracks to master
3. **Sends & Parallel** — Auxiliary track with sends
4. **Serialization** — Save/load track data
5. **Cycle Detection** — Validate routing integrity

---

## Integration with React UI

The React frontend (`src/`) will communicate with this core via API:

### Example: Updating Track Volume

1. **User moves fader in UI**
   ```typescript
   // React component
   const handleVolumeChange = (trackId: string, volumeDb: number) => {
     api.post(`/tracks/${trackId}/volume`, { volume: volumeDb });
   };
   ```

2. **API updates Track object**
   ```python
   # FastAPI endpoint
   @app.post("/tracks/{track_id}/volume")
   async def set_track_volume(track_id: str, volume: float):
       track = engine.get_track(track_id)
       track.set_volume(volume)
       return {"status": "ok"}
   ```

3. **Engine updates node and processes**
   ```python
   # Track updates its internal fader FX node
   track.set_volume(volume_db)
   # → Next block processes with new fader value
   ```

---

## Future Extensions

This architecture naturally supports:

- **Modular Synths** — Each osc/filter/env is a node
- **Sidechain Compression** — Route one track's output as control signal
- **Parameter Automation** — Envelopes on any parameter
- **GPU Acceleration** — Expensive effects delegate to GPU
- **VST/AU Plugins** — Wrapper FXNodes for third-party effects
- **MIDI Processing** — Nodes accept both audio and MIDI
- **Collaborative DAW** — Share graph updates over network
- **REAPER .RPP Parser** — Import REAPER projects

---

## Development Roadmap

| Phase | Goal | Status |
|-------|------|--------|
| 1 | Core node-based engine | ✅ Complete |
| 2 | Track abstraction layer | ✅ Complete |
| 3 | Routing & sends system | ✅ Complete |
| 4 | Basic FX library (EQ, Comp, Gate) | 🔄 Next |
| 5 | Real-time audio backend (PortAudio) | 🔄 Next |
| 6 | API bridge (FastAPI/WebSocket) | 🔄 Next |
| 7 | Project save/load (JSON) | 🔄 Next |
| 8 | React UI integration | 🔄 Next |
| 9 | REAPER .RPP parser (optional) | ⏳ Later |
| 10 | VST wrapper API | ⏳ Later |

---

## File Structure

```
daw_core/
├── __init__.py          # Package exports
├── graph.py             # Base Node classes
├── engine.py            # AudioEngine scheduler
├── track.py             # Track abstraction
├── routing.py           # Router & sends
├── examples.py          # Usage examples & tests
├── ARCHITECTURE.md      # Detailed design docs
└── README.md            # This file
```

---

## References

### Inspired By
- **REAPER** — Free routing, modular architecture
- **Ardour** — Open-source DAW philosophy
- **Max/MSP** — Node-based paradigm
- **PureData** — Modular signal processing

### DSP Resources
- "The Audio Programming Book" by Boulanger & Lazzarini
- JUCE Framework (C++ audio plugin standard)
- Web Audio API (browser-based audio)

---

## Contributing

This is an educational project. Contributions welcome!

**Current priorities:**
1. Implement basic FX nodes (EQ, Compressor, Gate)
2. Build real-time audio backend
3. Create REST API for React integration
4. Add comprehensive unit tests

---

## License

Same as CoreLogic Studio (MIT)

---

**Last Updated:** November 21, 2025  
**Version:** 0.1.0 (Core Architecture)
