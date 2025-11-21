"""
CoreLogic Studio DAW Core Engine

A modular, node-based audio processing engine inspired by REAPER's architecture.
Designed for extensibility, real-time processing, and graph-based signal routing.

Architecture:
- Node-based signal graph (every track, FX, bus is a node)
- Input/output ports for flexible routing
- Buffer-based DSP with configurable block size
- Topological scheduling for correct processing order
"""

from .graph import Node, AudioInput, FXNode, MixerBus, OutputNode
from .engine import AudioEngine
from .track import Track
from .routing import Router

__version__ = "0.1.0"
__all__ = [
    "Node",
    "AudioInput",
    "FXNode",
    "MixerBus",
    "OutputNode",
    "AudioEngine",
    "Track",
    "Router",
]
