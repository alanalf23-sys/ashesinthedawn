# CoreLogic Studio DAW Core — Quick Start Guide

## ⚡ 5-Minute Overview

CoreLogic Studio DAW Core is a **modular, node-based audio processing engine** designed to power professional audio workstations.

### Key Concept: Everything is a Node

```python
[Audio Input] → [Compressor] → [EQ] → [Master] → [Speakers]
```

Each step is a **Node** with:
- Input ports (receive audio)
- Output ports (send audio)
- Internal processing

---

## 📦 Installation

### Requirements
```bash
python >= 3.8
numpy >= 1.20
scipy >= 1.6  # For examples
```

### Setup
```bash
# Install dependencies
pip install numpy scipy

# Navigate to project
cd daw_core

# Run examples
python examples.py
```

---

## 🎯 Five Examples

### Example 1: Simple Chain
```python
from daw_core.graph import AudioInput, FXNode, MixerBus, OutputNode
from daw_core.engine import AudioEngine
import numpy as np

# Create engine
engine = AudioEngine()

# Create nodes
audio_in = AudioInput("Input")
compressor = FXNode("Compressor", lambda x: np.tanh(x * 2.0))
master = MixerBus("Master")
output = OutputNode("Out")

# Add nodes
engine.add_node(audio_in)
engine.add_node(compressor)
engine.add_node(master)
engine.add_node(output)

# Connect
engine.connect(audio_in, compressor)
engine.connect(compressor, master)
engine.connect(master, output)

# Process
engine.start()
engine.process_block()
engine.stop()
```

### Example 2: Multiple Tracks
```python
from daw_core.track import Track
from daw_core.routing import Router

router = Router()

# Create tracks
track1 = Track("guitar", "Guitar")
track1.set_volume(-3.0)  # -3 dB

track2 = Track("drums", "Drums")
track2.set_volume(0.0)

# Add to router
router.add_track(track1)
router.add_track(track2)

# Route to master
router.create_master_bus()
router.route_track("guitar", "master")
router.route_track("drums", "master")

# Validate
is_valid, msg = router.validate_routing()
print(f"Valid: {is_valid}")
```

### Example 3: Parallel Processing (Sends)
```python
# Create main track
main = Track("vocal", "Vocal")

# Create auxiliary reverb track
aux_reverb = Track("aux_reverb", "Reverb")

# Add send from main to reverb
main.add_send(
    destination_id="aux_reverb",
    level_db=-6.0,
    pre_fader=False  # Post-fader
)

# Route to master
router.route_track("vocal", "master")
router.route_track("aux_reverb", "master")
```

### Example 4: Save & Load Project
```python
import json

# Serialize track
track_data = track1.to_dict()
print(json.dumps(track_data, indent=2))

# Load into new track
track2 = Track("new", "New Track")
track2.from_dict(track_data)
```

### Example 5: Detect Cycles
```python
# Create cycle: A → B → C → A
router.route_track("track_a", "track_b")
router.route_track("track_b", "track_c")
router.route_track("track_c", "track_a")

# Validate
is_valid, msg = router.validate_routing()
# Result: is_valid = False, detects cycle
```

---

## 🏗️ Architecture Layers

### Layer 1: Signal Graph
```python
from daw_core.graph import Node, AudioInput, FXNode, MixerBus, OutputNode
```
- Base DSP nodes
- Audio sources
- Effect processors
- Mixing/summing
- Output monitoring

### Layer 2: Engine
```python
from daw_core.engine import AudioEngine
```
- Graph management
- Scheduling
- Topological sort
- Block processing

### Layer 3: Tracks
```python
from daw_core.track import Track
```
- High-level interface
- Parameter storage
- FX chains
- Sends

### Layer 4: Routing
```python
from daw_core.routing import Router
```
- Connection management
- Auxiliary buses
- Cycle detection
- Routing matrix

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `README.md` | Architecture overview |
| `ARCHITECTURE.md` | Design deep dive |
| `ARCHITECTURE_DIAGRAMS.md` | Visual reference |
| `IMPLEMENTATION_ROADMAP.md` | Development plan |
| `PHASE_1_SUMMARY.md` | What we've built |
| `examples.py` | Runnable examples |

---

## 🎛 Common Tasks

### Create a Track
```python
from daw_core.track import Track

track = Track("track_1", "Guitar", track_type="audio")
track.set_volume(-3.0)
track.set_pan(0.5)
track.set_armed(True)
```

### Add an Effect
```python
from daw_core.graph import FXNode

def eq_function(signal):
    # EQ algorithm here
    return signal

eq = FXNode("EQ", eq_function)
track.add_insert(eq)
```

### Create a Send
```python
# Route copies to auxiliary track
track.add_send(
    destination_id="aux_reverb",
    level_db=-6.0,
    pre_fader=False
)
```

### Route Track to Bus
```python
router.route_track("track_1", "master")
# or to auxiliary bus
router.route_track("track_1", "aux_bus_1")
```

### Validate Routing (No Cycles)
```python
is_valid, msg = router.validate_routing()
if not is_valid:
    print(f"Error: {msg}")
```

### Save Project
```python
import json

project = {
    "name": "My Song",
    "tracks": [t.to_dict() for t in router.tracks.values()],
    "routing": router.to_dict(),
}

with open("project.json", "w") as f:
    json.dump(project, f, indent=2)
```

### Load Project
```python
with open("project.json") as f:
    project = json.load(f)

for track_data in project["tracks"]:
    track = Track(track_data["id"], track_data["name"])
    track.from_dict(track_data)
    router.add_track(track)
```

---

## 🔄 Signal Flow Diagram

```
┌─────────────────────────────────────────────────┐
│ TRACK: Guitar                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Input] → [Compressor] → [EQ] → [Fader -3dB] │
│                                     │           │
│                                     ├→ [Main Out]
│                                     │           │
│                                     └→ [Send -6dB]
│                                                 │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ AUX BUS: Reverb                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  [From Send] → [Reverb] → [Fader -6dB] ─────→ │
│                                                 │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ MASTER BUS                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Sum Inputs] → [Output Monitor] → [Speakers]  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Next Steps

1. **Try the examples**
   ```bash
   python examples.py
   ```

2. **Build a simple project**
   ```python
   # Create 2 tracks
   # Route to master
   # Save as JSON
   ```

3. **Explore the code**
   - Read `graph.py` for node design
   - Check `engine.py` for scheduling
   - Study `track.py` for parameters

4. **Look ahead to Phase 2**
   - DSP effects (EQ, Compressor, etc.)
   - Parameter automation
   - Metering system

---

## 📊 How It Works

### Processing Order

The engine uses **topological sort** to determine the correct processing order:

```
1. All input nodes (no dependencies)
2. Nodes that depend on inputs
3. Nodes that depend on #2
4. ...continuing until all nodes processed
```

This ensures:
- ✅ Each node receives valid input
- ✅ No feedback loops
- ✅ Deterministic processing

### Buffer System

```python
# Each node has buffers
node.input_ports[0].buffer  # (channels, samples) array
node.output_ports[0].buffer # (channels, samples) array

# Process one block
node.process()  # Read inputs, write outputs
```

### Real-Time Model

```
┌──────────────────────────────┐
│  Audio Thread (44.1kHz)      │
│                              │
│  Every 23ms:                 │
│  - Topological sort          │
│  - Process each node         │
│  - Send audio to hardware    │
│                              │
└──────────────────────────────┘

┌──────────────────────────────┐
│  UI Thread (Any time)        │
│                              │
│  When user changes param:    │
│  - Update Track object       │
│  - Effect applied next block │
│  (No locking needed)          │
│                              │
└──────────────────────────────┘
```

---

## 🎯 Design Principles

### 1. Modular
Every component is a node. Easy to add, remove, or replace.

### 2. Flexible
Any node can connect to any other node. Build any signal flow.

### 3. Real-Time Safe
Topological sort guarantees correct order, prevents cycles.

### 4. Serializable
Complete state can be saved/loaded as JSON.

### 5. Thread-Safe
Audio thread processes read-only buffers. UI thread updates parameters safely.

---

## 🔗 Integration Points

### React UI ↔ Python Engine

```
UI (React)
  │ HTTP/WebSocket
  ↓
FastAPI Server
  │ Direct Python Calls
  ↓
DAW Core (Python)
  │ Real-time Processing
  ↓
Audio Hardware
```

Example:
```typescript
// React: User moves fader
handleVolumeChange(trackId, -6.0);

// → API
POST /tracks/track_1/volume { volume: -6.0 }

// → Python
track.set_volume(-6.0)

// → Next block
engine.process_block()  // Uses new volume

// → Feedback
WebSocket: { levels: { track_1: -12.3 } }
```

---

## 📋 Troubleshooting

### `ImportError: No module named 'numpy'`
```bash
pip install numpy
```

### Graph contains a cycle error
```python
is_valid, msg = router.validate_routing()
print(msg)  # Shows which track causes cycle
```

### Track not producing audio
- Check input is connected
- Verify not muted
- Check volume isn't too low
- Ensure routed to master

---

## 🎓 Learning Path

1. **Beginner:** Run examples, understand signal flow
2. **Intermediate:** Modify examples, create custom effects
3. **Advanced:** Build new node types, extend engine
4. **Expert:** Integrate with audio hardware, optimize for real-time

---

## 💡 Tips & Tricks

### Bypass Effects
```python
fx_node.bypass()  # Skip processing
fx_node.unbypass()  # Re-enable
```

### Clone a Track
```python
track_copy = Track(f"{track.id}_copy", f"{track.name} Copy")
track_copy.from_dict(track.to_dict())
```

### Get Track Status
```python
status = track.to_dict()
print(f"Volume: {status['volume']} dB")
print(f"Muted: {status['muted']}")
```

### Debug Routing
```python
routing_matrix = router.get_graph_connections()
print(routing_matrix)
# Output: {'track_1': ['master'], 'track_2': ['master']}
```

---

## 🤝 Contributing

This is an educational project. Contributions welcome!

### Development Setup
```bash
git clone https://github.com/ashesinthedawn/corelogic-studio
cd corelogic-studio/daw_core

# Install development dependencies
pip install numpy scipy pytest

# Run tests
pytest tests/
```

### Future Contributions
- Phase 2: Implement DSP effects
- Phase 3: Real-time audio backend
- Phase 4: REST API server
- Phase 5: React UI integration

---

## 📞 Need Help?

- Read `ARCHITECTURE.md` for deep dives
- Check `examples.py` for code samples
- Review `ARCHITECTURE_DIAGRAMS.md` for visuals
- Consult `IMPLEMENTATION_ROADMAP.md` for the plan

---

**Ready to start?** Run:
```bash
python examples.py
```

**Happy DAW building!** 🎛️

---

**Version:** 1.0  
**Date:** November 21, 2025  
**CoreLogic Studio v0.1.0**
