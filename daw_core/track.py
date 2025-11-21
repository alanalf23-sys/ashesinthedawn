"""
Track Abstraction Layer

A Track is a high-level abstraction wrapping multiple nodes:
- Input stage (pre-fader)
- FX chain (insert effects)
- Gain fader
- Sends (pre/post-fader)
- Output routing

This makes the UI layer cleaner by exposing a "track" metaphor
while the underlying engine is node-based.
"""

from typing import List, Optional, Dict, Any
from .graph import Node, FXNode, MixerBus
import numpy as np


class Track:
    """
    High-level track abstraction for a DAW.
    
    Signal flow:
    Input → PreFader FX → Fader → Sends → Output Routing
    
    Properties:
    - name: Track name
    - color: UI color identifier
    - muted: Whether track output is silenced
    - soloed: Solo state
    - armed: Record arm state
    - volume: Post-fader gain (dB)
    - pan: Stereo panning (-1.0 to +1.0)
    - inserts: List of FX nodes in chain
    - sends: List of (destination_track, level, pre/post) tuples
    """

    def __init__(self, track_id: str, name: str, track_type: str = "audio"):
        self.id = track_id
        self.name = name
        self.type = track_type  # "audio", "instrument", "aux", "vca", "master"
        self.color = "#808080"  # Hex color

        # State
        self.muted = False
        self.soloed = False
        self.armed = False

        # Audio parameters (in dB / normalized units)
        self.volume = 0.0  # dB
        self.pan = 0.0  # -1.0 (L) to +1.0 (R)
        self.input_gain = 0.0  # Pre-fader gain (dB)
        self.stereo_width = 100.0  # % (100 = normal)

        # DSP Effects
        self.phase_flip = False
        self.inserts: List[FXNode] = []  # Insert effects chain
        self.sends: List[Dict[str, Any]] = []  # Send destinations

        # Routing
        self.output_routing = "master"  # Default: route to master bus

        # Internal nodes (managed by engine)
        self.input_node: Optional[Node] = None
        self.fader_node: Optional[FXNode] = None
        self.output_node: Optional[MixerBus] = None

    def add_insert(self, fx_node: FXNode, position: Optional[int] = None):
        """
        Insert an effect into the FX chain.
        
        Args:
            fx_node: The effect node to insert
            position: Position in chain (None = end)
        """
        if position is None:
            self.inserts.append(fx_node)
        else:
            self.inserts.insert(position, fx_node)

    def remove_insert(self, fx_index: int):
        """Remove an effect from the chain."""
        if 0 <= fx_index < len(self.inserts):
            self.inserts.pop(fx_index)

    def reorder_inserts(self, old_idx: int, new_idx: int):
        """Reorder effects in the chain."""
        if 0 <= old_idx < len(self.inserts) and 0 <= new_idx < len(self.inserts):
            fx = self.inserts.pop(old_idx)
            self.inserts.insert(new_idx, fx)

    def add_send(self, destination_id: str, level_db: float = 0.0, pre_fader: bool = False):
        """
        Add a send to another track.
        
        Args:
            destination_id: ID of destination track
            level_db: Send level in dB
            pre_fader: If True, send is pre-fader; else post-fader
        """
        self.sends.append({
            "destination": destination_id,
            "level_db": level_db,
            "pre_fader": pre_fader,
            "enabled": True,
        })

    def remove_send(self, destination_id: str):
        """Remove a send to a track."""
        self.sends = [s for s in self.sends if s["destination"] != destination_id]

    def set_volume(self, gain_db: float):
        """Set track fader level."""
        self.volume = gain_db
        if self.fader_node:
            self.fader_node.fx_fn = self._make_fader_fn()

    def set_pan(self, pan: float):
        """Set stereo panning (-1.0 to +1.0)."""
        self.pan = np.clip(pan, -1.0, 1.0)

    def set_input_gain(self, gain_db: float):
        """Set pre-fader input gain."""
        self.input_gain = gain_db

    def set_armed(self, armed: bool):
        """Set record arm state."""
        self.armed = armed

    def set_muted(self, muted: bool):
        """Set mute state."""
        self.muted = muted

    def set_soloed(self, soloed: bool):
        """Set solo state."""
        self.soloed = soloed

    def set_phase_flip(self, enabled: bool):
        """Enable/disable phase invert."""
        self.phase_flip = enabled

    def _make_fader_fn(self):
        """Create the fader processing function."""
        gain_linear = 10.0 ** (self.volume / 20.0)
        pan = self.pan

        def fader_process(signal: np.ndarray) -> np.ndarray:
            # Apply gain
            processed = signal * gain_linear

            # Apply panning (stereo)
            if processed.shape[0] == 2:
                # L/R panning
                left_gain = np.sqrt(0.5 * (1.0 - pan))
                right_gain = np.sqrt(0.5 * (1.0 + pan))
                processed[0] *= left_gain
                processed[1] *= right_gain

            # Apply mute
            if self.muted:
                processed *= 0.0

            # Apply phase flip
            if self.phase_flip:
                processed *= -1.0

            return processed

        return fader_process

    def to_dict(self) -> Dict[str, Any]:
        """Serialize track to dictionary (for saving/networking)."""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "color": self.color,
            "muted": self.muted,
            "soloed": self.soloed,
            "armed": self.armed,
            "volume": self.volume,
            "pan": self.pan,
            "input_gain": self.input_gain,
            "stereo_width": self.stereo_width,
            "phase_flip": self.phase_flip,
            "inserts": [{"name": fx.name, "enabled": fx.enabled} for fx in self.inserts],
            "sends": self.sends,
            "output_routing": self.output_routing,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load track state from dictionary."""
        self.name = data.get("name", self.name)
        self.type = data.get("type", self.type)
        self.color = data.get("color", self.color)
        self.muted = data.get("muted", False)
        self.soloed = data.get("soloed", False)
        self.armed = data.get("armed", False)
        self.volume = data.get("volume", 0.0)
        self.pan = data.get("pan", 0.0)
        self.input_gain = data.get("input_gain", 0.0)
        self.stereo_width = data.get("stereo_width", 100.0)
        self.phase_flip = data.get("phase_flip", False)
        self.output_routing = data.get("output_routing", "master")
