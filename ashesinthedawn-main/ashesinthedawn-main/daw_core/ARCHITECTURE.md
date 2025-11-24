"""
DAW Core Architecture Documentation & Examples

This document outlines the node-based signal graph design inspired by REAPER's architecture.

## Architecture Overview

### Node-Based Signal Graph
Every audio component is a Node with input and output ports:

```
[AudioInput] → [FXNode] → [FXNode] → [MixerBus] → [OutputNode]
   (source)      (EQ)       (Comp)     (sum)        (master)
```

### Key Concepts

1. **Nodes**: Independent DSP processors
   - AudioInput: Audio source
   - FXNode: Effect (EQ, Compressor, etc.)
   - MixerBus: Summing amplifier
   - OutputNode: Master output

2. **Ports**: Connection points between nodes
   - Each port has an audio buffer (stereo, 1024 samples)
   - Nodes read from input ports, write to output ports

3. **Graph Scheduler**: Ensures correct processing order
   - Topological sort determines which node processes first
   - Prevents feedback loops and ensures data consistency

4. **Tracks**: High-level abstraction wrapping nodes
   - Input → Pre-FX → Fader → Sends → Output
   - Simplifies UI while maintaining node-based flexibility

---

## Signal Flow Example

### Mono Track → Stereo Master

```python
from daw_core import AudioEngine, Track, AudioInput, FXNode, MixerBus, Router
import numpy as np

# Create engine
engine = AudioEngine(sample_rate=44100, buffer_size=1024)

# Create router
router = Router()

# Create a track
track1 = Track("track_1", "Guitar", track_type="audio")

# Create nodes for the track
input_node = AudioInput("Guitar In")
fx_node = FXNode("Compressor", lambda x: np.tanh(x * 2.0))  # Simple compressor

# Create master bus
master_bus = router.create_master_bus()

# Add nodes to engine
engine.add_node(input_node)
engine.add_node(fx_node)
engine.add_node(master_bus)

# Connect graph
engine.connect(input_node, fx_node)
engine.connect(fx_node, master_bus)

# Start processing
engine.start()
for _ in range(10):  # Process 10 blocks
    engine.process_block()

engine.stop()
```

---

## Track Parameter Storage

Tracks don't store audio buffers directly—they store parameters.
The engine executes the graph and handles actual DSP.

```python
track = Track("track_1", "Drums")
track.set_volume(-3.0)      # -3 dB fader
track.set_pan(0.5)           # Pan right
track.set_input_gain(6.0)    # +6 dB input gain
track.set_armed(True)        # Record arm
track.add_insert(compressor_fx, position=0)
track.add_send("aux_bus_1", level_db=-6.0, pre_fader=False)
```

The track stores all this data. When the UI updates a parameter,
it modifies the track, which then updates the corresponding node's settings.

---

## Sending & Parallel Processing

A send routes a copy of the signal to another bus:

```python
# Create auxiliary track for reverb
aux_reverb = Track("aux_reverb", "Reverb")
reverb_fx = FXNode("Reverb", reverb_algorithm)
aux_reverb.add_insert(reverb_fx)

# Main track sends to reverb (post-fader, -6dB)
track1.add_send(
    destination_id="aux_reverb",
    level_db=-6.0,
    pre_fader=False  # Post-fader
)

# Route aux back to master
router.route_track("aux_reverb", "master")
```

This creates a parallel processing chain:
```
Track → Fader → Main Output (to master)
     → Send (copy) → Reverb Aux → Master
```

---

## Project Serialization

Tracks and routing can be saved as JSON:

```python
import json

# Save project
project = {
    "tracks": [t.to_dict() for t in router.tracks.values()],
    "routing": router.to_dict(),
    "master": {"volume": 0.0},
}

with open("project.json", "w") as f:
    json.dump(project, f, indent=2)

# Load project
with open("project.json", "r") as f:
    data = json.load(f)
    for track_data in data["tracks"]:
        track = Track(track_data["id"], track_data["name"])
        track.from_dict(track_data)
        router.add_track(track)
```

---

## Real-Time Integration

The engine runs in a background thread:

```python
import threading
import time

def audio_thread():
    while engine.is_running:
        engine.process_block()
        time.sleep(buffer_size / sample_rate)  # Block duration

thread = threading.Thread(target=audio_thread, daemon=True)
thread.start()
```

The UI sends commands to modify track parameters:
- Channel changes go through thread-safe queues
- Node processes use atomic operations
- No locks needed for read-only DSP

---

## REAPER .RPP Parser

Parse REAPER project files to validate our architecture:

```python
def parse_rpp(filename):
    with open(filename) as f:
        lines = f.readlines()
    
    tracks = []
    for line in lines:
        if line.strip().startswith("<TRACK"):
            tracks.append(parse_track(lines, lines.index(line)))
    
    return tracks

def parse_track(lines, start_idx):
    track_data = {"fxchain": []}
    for line in lines[start_idx:]:
        if "NAME" in line:
            track_data["name"] = line.split('"')[1]
        elif "VST" in line or "AU" in line:
            track_data["fxchain"].append(parse_plugin(line))
        elif line.startswith(">"):
            break
    return track_data
```

---

## Future Extensibility

This architecture supports:

1. **Modular Synths**: Each oscillator/filter/envelope is a node
2. **Sidechain Routing**: Use one track's output as control signal for another
3. **MIDI Processing**: Node can accept MIDI events as well as audio
4. **Parameter Automation**: Each node's parameters can have automation envelopes
5. **GPU Processing**: Nodes could delegate to GPU for expensive effects
6. **Plugin API**: VST/AU wrappers become FXNodes
7. **Networked DAWs**: Send graph updates over the network for collaboration

The core design remains unchanged—everything is a node with ports.

---

## Testing & Validation

```python
def test_simple_graph():
    engine = AudioEngine()
    router = Router()
    
    # Create track
    track = Track("test_track", "Test")
    
    # Create nodes
    input_node = AudioInput("Input")
    master_bus = router.create_master_bus()
    
    # Build graph
    engine.add_node(input_node)
    engine.add_node(master_bus)
    engine.connect(input_node, master_bus)
    
    # Validate no cycles
    is_valid, msg = router.validate_routing()
    assert is_valid, msg
    
    # Process
    engine.start()
    engine.process_block()
    engine.stop()
    
    # Check output
    output_status = master_bus.get_status()
    print(f"Master peak: {output_status['peak_db']} dB")

if __name__ == "__main__":
    test_simple_graph()
```
"""

# This file serves as documentation. The actual implementation
# is in graph.py, engine.py, track.py, and routing.py
