"""
Signal Graph Base Classes

Implements node-based architecture where every audio component is a graph node.
Nodes communicate through input/output ports with configurable buffers.
"""

import numpy as np
from typing import List, Callable, Optional
from dataclasses import dataclass, field


# DSP Constants
SAMPLE_RATE = 44100
BUFFER_SIZE = 1024
NUM_CHANNELS = 2  # Stereo


@dataclass
class Port:
    """Represents a single audio port (input or output) on a node."""
    name: str
    node: "Node"
    channels: int = NUM_CHANNELS
    buffer: np.ndarray = field(default_factory=lambda: np.zeros((NUM_CHANNELS, BUFFER_SIZE)))

    def clear(self):
        """Clear the buffer."""
        self.buffer.fill(0)


class Node:
    """
    Base class for all DSP nodes in the signal graph.

    A node:
    - Has N input ports and M output ports
    - Processes audio each block (DSP cycle)
    - Can be connected to other nodes for signal routing
    - Maintains its own audio buffers
    """

    def __init__(self, name: str, num_inputs: int = 1, num_outputs: int = 1):
        self.name = name
        self.enabled = True
        self.input_ports: List[Port] = [
            Port(f"in_{i}", self) for i in range(num_inputs)
        ]
        self.output_ports: List[Port] = [
            Port(f"out_{i}", self) for i in range(num_outputs)
        ]
        self.connections: List[tuple] = []  # (src_node, src_port, dst_port)

    def process(self):
        """
        Core DSP logic. Override in subclasses.
        This is called once per buffer cycle.
        """
        pass

    def get_input(self, port_idx: int = 0) -> np.ndarray:
        """Get the audio buffer from an input port."""
        if port_idx < len(self.input_ports):
            return self.input_ports[port_idx].buffer
        return np.zeros((NUM_CHANNELS, BUFFER_SIZE))

    def get_output(self, port_idx: int = 0) -> np.ndarray:
        """Get the audio buffer from an output port."""
        if port_idx < len(self.output_ports):
            return self.output_ports[port_idx].buffer
        return np.zeros((NUM_CHANNELS, BUFFER_SIZE))

    def set_output(self, data: np.ndarray, port_idx: int = 0):
        """Write audio data to an output port."""
        if port_idx < len(self.output_ports):
            self.output_ports[port_idx].buffer = data.copy()

    def connect_to(self, target_node: "Node", src_port: int = 0, dst_port: int = 0):
        """Connect this node's output to another node's input."""
        self.connections.append((target_node, src_port, dst_port))

    def bypass(self):
        """Disable this node (no processing)."""
        self.enabled = False

    def unbypass(self):
        """Enable this node."""
        self.enabled = True


class AudioInput(Node):
    """
    Represents an audio input source (file, hardware, or generated signal).
    """

    def __init__(self, name: str, data: Optional[np.ndarray] = None):
        super().__init__(name, num_inputs=0, num_outputs=1)
        self.data = data if data is not None else np.zeros((NUM_CHANNELS, BUFFER_SIZE))
        self.position = 0  # For streaming through file data

    def set_data(self, data: np.ndarray):
        """Load audio data (e.g., from file or recording)."""
        self.data = data

    def process(self):
        """Stream audio data to output port."""
        if not self.enabled:
            self.set_output(np.zeros((NUM_CHANNELS, BUFFER_SIZE)))
            return

        # For now, just return the data as-is
        # Later, this will handle streaming, file position, etc.
        self.set_output(self.data)


class FXNode(Node):
    """
    Generic effect node that applies a DSP function to input signal.
    """

    def __init__(self, name: str, fx_fn: Callable[[np.ndarray], np.ndarray]):
        super().__init__(name, num_inputs=1, num_outputs=1)
        self.fx_fn = fx_fn

    def process(self):
        """Apply effect function to input."""
        if not self.enabled:
            self.set_output(self.get_input(0))
            return

        input_signal = self.get_input(0)
        output = self.fx_fn(input_signal)
        self.set_output(output)


class MixerBus(Node):
    """
    Mixes multiple input signals into a single output.
    Implements summing amplifier behavior.
    """

    def __init__(self, name: str, num_inputs: int = 16):
        super().__init__(name, num_inputs=num_inputs, num_outputs=1)
        self.gain = 1.0  # Post-fader gain

    def set_gain(self, gain_db: float):
        """Set bus gain in dB."""
        self.gain = 10.0 ** (gain_db / 20.0)

    def process(self):
        """Sum all inputs and apply gain."""
        if not self.enabled:
            self.set_output(np.zeros((NUM_CHANNELS, BUFFER_SIZE)))
            return

        # Sum all input ports
        mixed = np.zeros((NUM_CHANNELS, BUFFER_SIZE))
        for port in self.input_ports:
            mixed += port.buffer

        # Apply gain and soft clipping
        output = np.tanh(mixed * self.gain)
        self.set_output(output)


class OutputNode(Node):
    """
    Final output stage. Represents the hardware output or file output.
    """

    def __init__(self, name: str = "Master"):
        super().__init__(name, num_inputs=1, num_outputs=0)
        self.peak_level = 0.0
        self.clipped = False

    def process(self):
        """Monitor output and detect clipping."""
        input_signal = self.get_input(0)
        self.peak_level = np.max(np.abs(input_signal))
        self.clipped = self.peak_level > 1.0

    def get_status(self) -> dict:
        """Return output status (peak level, clipping, etc.)."""
        return {
            "peak_db": 20.0 * np.log10(max(self.peak_level, 1e-6)),
            "clipped": self.clipped,
        }
