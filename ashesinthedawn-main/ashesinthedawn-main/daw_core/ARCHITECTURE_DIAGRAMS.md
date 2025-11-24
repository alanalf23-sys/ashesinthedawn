# CoreLogic Studio - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     React TypeScript UI                         │
│  (Mixer, Timeline, TrackList, Plugin Rack, etc.)                │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/WebSocket API
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Python FastAPI Server                        │
│  (Request handlers, project management, persistence)            │
└────────────────────────┬────────────────────────────────────────┘
                         │ Direct Python Calls
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   daw_core/ (This Module)                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Layer 1: Signal Graph (graph.py)            │  │
│  │  - Node (base class)                                     │  │
│  │  - AudioInput, FXNode, MixerBus, OutputNode            │  │
│  │  - Port system for connections                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Layer 2: Engine & Scheduling (engine.py)         │  │
│  │  - AudioEngine (graph manager)                           │  │
│  │  - Topological sorting (Kahn's algorithm)                │  │
│  │  - Block processing & real-time scheduling              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │      Layer 3: Track Abstraction (track.py)               │  │
│  │  - Track class (high-level interface)                    │  │
│  │  - Parameter storage (volume, pan, mute, etc.)           │  │
│  │  - FX chain management                                   │  │
│  │  - Send system (parallel routing)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │      Layer 4: Routing System (routing.py)                │  │
│  │  - Router (connection manager)                           │  │
│  │  - Bus routing                                           │  │
│  │  - Cycle detection                                       │  │
│  │  - Routing matrix (for serialization)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Layer 5: Audio Hardware (future)                 │  │
│  │  - PortAudio / PyAudio integration                       │  │
│  │  - Real-time thread management                           │  │
│  │  - Lock-free audio queues                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                        │
│                    🔊 Audio Output                              │
│                  (Speakers/Headphones)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Signal Flow Architecture

### Simple Two-Track Mix with Reverb

```
┌─────────────────────────────────────────────────────────────────┐
│                        TRACK 1: Guitar                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [AudioInput] ──→ [Compressor] ──→ [Fader -3dB] ──→ [Pan 0.3]  │
│                                           │                      │
│                                           │ Send -6dB (post-fader)
│                                           ↓                      │
└─────────────────────────────────────────────┬────────────────────┘
                                              │
                        ┌─────────────────────┤
                        │                     │ Main Output
                        ↓                     ↓
          ┌──────────────────────┐  ┌──────────────────────┐
          │  TRACK 2: Drums      │  │  AUX: Reverb         │
          ├──────────────────────┤  ├──────────────────────┤
          │ [Input] → [Fader]    │  │ [Reverb FX] →[Fader -6dB]
          │    ↓                 │  │       ↑              │
          │ [Pan -0.3] → Output  │  │       │              │
          └──────────┬───────────┘  └───────┼──────────────┘
                     │                      │
                     └──────────┬───────────┘
                                ↓
                    ┌───────────────────────┐
                    │    MASTER BUS         │
                    ├───────────────────────┤
                    │  [Sum] → [Output]     │
                    │    ↓                  │
                    │  Monitor -0.5dB       │
                    └───────────┬───────────┘
                                ↓
                          [Hardware Out]
```

### Processing Order (Topological Sort)

```
1. Guitar Input          ┐
2. Guitar Compressor    ├─ Can process independently
3. Drums Input          ├─ (no dependencies)
4. Drums Fader          ┘

5. Guitar Fader         ┐ (needs Guitar Compressor output)
6. Guitar Pan           ├─ (needs Guitar Fader output)

7. Reverb Input         ├─ (needs Guitar Pan output/send)
8. Reverb FX            ├─ (needs Reverb Input output)
9. Reverb Fader         ┘ (needs Reverb FX output)

10. Master Bus          ┐ (needs Guitar, Drums, Reverb outputs)
11. Master Output       ┘ (needs Master Bus output)
```

---

## Node Graph Representation

```
Graph Structure (Adjacency List):

nodes = {
  "guitar_in": {
    "outputs": ["guitar_comp"],
    "type": "AudioInput"
  },
  "guitar_comp": {
    "inputs": ["guitar_in"],
    "outputs": ["guitar_fader"],
    "type": "FXNode"
  },
  "guitar_fader": {
    "inputs": ["guitar_comp"],
    "outputs": ["guitar_pan", "reverb_in"],  // Main + Send
    "type": "FXNode"
  },
  "guitar_pan": {
    "inputs": ["guitar_fader"],
    "outputs": ["master_bus"],
    "type": "FXNode"
  },
  "reverb_in": {
    "inputs": ["guitar_fader"],
    "outputs": ["reverb_fx"],
    "type": "MixerBus"
  },
  "reverb_fx": {
    "inputs": ["reverb_in"],
    "outputs": ["reverb_fader"],
    "type": "FXNode"
  },
  "reverb_fader": {
    "inputs": ["reverb_fx"],
    "outputs": ["master_bus"],
    "type": "FXNode"
  },
  "drums_in": {
    "outputs": ["drums_fader"],
    "type": "AudioInput"
  },
  "drums_fader": {
    "inputs": ["drums_in"],
    "outputs": ["drums_pan"],
    "type": "FXNode"
  },
  "drums_pan": {
    "inputs": ["drums_fader"],
    "outputs": ["master_bus"],
    "type": "FXNode"
  },
  "master_bus": {
    "inputs": ["guitar_pan", "reverb_fader", "drums_pan"],
    "outputs": ["master_out"],
    "type": "MixerBus"
  },
  "master_out": {
    "inputs": ["master_bus"],
    "type": "OutputNode"
  }
}
```

---

## Data Flow: UI → Engine → Audio

### Example: User Changes Track Volume

```
1. UI ACTION
   ┌─────────────────────────────────────────┐
   │ User drags fader in mixer to -6 dB      │
   └────────────────┬────────────────────────┘
                    ↓

2. API REQUEST
   ┌─────────────────────────────────────────┐
   │ POST /tracks/track_1/volume              │
   │ { "volume": -6.0 }                      │
   └────────────────┬────────────────────────┘
                    ↓

3. SERVER HANDLER (Python)
   ┌─────────────────────────────────────────┐
   │ @app.post("/tracks/{track_id}/volume")  │
   │ def set_volume(track_id, volume):       │
   │     track = engine.get_track(track_id)  │
   │     track.set_volume(volume)            │
   └────────────────┬────────────────────────┘
                    ↓

4. TRACK UPDATE
   ┌─────────────────────────────────────────┐
   │ Track.set_volume(-6.0)                  │
   │   → volume = -6.0 dB                    │
   │   → gain_linear = 10^(-6/20) ≈ 0.501   │
   │   → Update fader_node FX function       │
   └────────────────┬────────────────────────┘
                    ↓

5. NEXT AUDIO BLOCK
   ┌─────────────────────────────────────────┐
   │ engine.process_block()                  │
   │   → Topological sort                    │
   │   → Process each node in order          │
   │   → Fader node applies 0.501 gain       │
   │   → Output is 6 dB quieter              │
   └────────────────┬────────────────────────┘
                    ↓

6. UI FEEDBACK
   ┌─────────────────────────────────────────┐
   │ Meters update in real-time              │
   │ Track shows -6.0 dB label               │
   └─────────────────────────────────────────┘
```

---

## Class Hierarchy

```
Node (abstract base)
├── AudioInput
│   └── Reads audio data from source
├── FXNode
│   ├── Generic effect wrapper
│   ├── Subclasses (future):
│   │   ├── Compressor
│   │   ├── EQ
│   │   ├── Gate
│   │   ├── Saturation
│   │   ├── Delay
│   │   └── Reverb
├── MixerBus
│   └── Sums multiple inputs
└── OutputNode
    └── Final stage (metering, clipping)

Track (high-level wrapper)
├── name: str
├── type: TrackType
├── parameters: Volume, Pan, Mute, Solo, etc.
├── inserts: List[FXNode]
├── sends: List[Send]
└── nodes: {input_node, fader_node, output_node}

Router (graph manager)
├── tracks: Dict[id, Track]
├── buses: Dict[id, MixerBus]
├── routing_matrix: Dict[id, List[id]]
├── validate_routing()
└── topological_sort()

AudioEngine (scheduler)
├── nodes: List[Node]
├── graph: Dict[Node, List[Node]]
├── add_node()
├── connect()
├── topological_sort()
└── process_block()
```

---

## Port System

```
Port (connection point)
├── name: str
├── node: Node (owner)
├── buffer: numpy array
│   ├── shape: (NUM_CHANNELS, BUFFER_SIZE)
│   ├── dtype: float32 (-1.0 to 1.0 range)
│   └── BUFFER_SIZE: 1024 samples
└── channels: int (usually 2 for stereo)

Each node has:
├── input_ports: List[Port]  (receive audio from other nodes)
├── output_ports: List[Port] (send audio to other nodes)
└── buffer: np.array (internal working buffer)
```

---

## Thread Safety Model

```
┌──────────────────────────────────────────────────────────┐
│               Real-Time Audio Thread                     │
│  (Locked: Must not allocate, only process)               │
│                                                          │
│  while running:                                          │
│    for each node in sorted_order:                        │
│      node.process()  ← Read input ports, write output    │
│    Send audio to hardware                                │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│            UI/Control Thread (Lock-Free)                 │
│  (Non-real-time: Can allocate, update parameters)        │
│                                                          │
│  UI Event:                                               │
│    Lock-free queue → track.set_volume(value)             │
│    (Parameter updates don't require locking)             │
│                                                          │
│  Audio thread reads updated parameters each block        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Buffer Size | 1024 samples | ~23ms at 44.1kHz |
| Latency | 2-4 blocks | 46-92ms typical |
| Sample Rate | 44.1 / 48 / 96 kHz | Configurable |
| Max Tracks | 128+ | Limited by CPU |
| Max FX Chain | 32+ | Per track |
| Processing Order | O(n log n) | Topological sort per block |
| CPU Overhead | ~5% | Engine scheduling only |

---

## Future Extensibility Points

```
Plugin API (VST/AU)
├── Wrap VST as FXNode
├── Parameter mapping
└── Automation support

GPU Processing
├── CUDA/OpenCL delegates for effects
├── Offload heavy computations
└── Keep timing deterministic

Modular Synthesis
├── Oscillator nodes
├── Filter nodes
├── Envelope generators
└── Patch bay UI

MIDI Processing
├── MIDI input nodes
├── MIDI effect nodes
├── Note → CV conversion
└── Sequencer integration

Parameter Automation
├── Envelope per parameter
├── Automation lanes
└── Write/Read modes

Sidechain Routing
├── Effect input from one track's output
├── Metering for side-chain levels
└── Gate/Compressor sidechain
```

---

**Generated:** November 21, 2025  
**CoreLogic Studio v0.1.0**
