"""
Audio Engine & Graph Scheduler

Implements real-time graph scheduling and block-based processing.
Handles topological sorting to ensure correct DSP order.
"""

from typing import List, Dict, Set
from .graph import Node, OutputNode


class AudioEngine:
    """
    Main audio engine that manages the signal graph and processes audio in real-time blocks.
    
    Responsibilities:
    - Maintain graph topology
    - Schedule nodes in correct order (topological sort)
    - Process blocks of audio
    - Handle thread-safe state updates
    """

    def __init__(self, sample_rate: int = 44100, buffer_size: int = 1024):
        self.sample_rate = sample_rate
        self.buffer_size = buffer_size
        self.nodes: List[Node] = []
        self.graph: Dict[Node, List[Node]] = {}  # Adjacency list
        self.is_running = False
        self.block_count = 0

    def add_node(self, node: Node):
        """Add a node to the engine."""
        if node not in self.nodes:
            self.nodes.append(node)
            self.graph[node] = []

    def remove_node(self, node: Node):
        """Remove a node from the engine."""
        if node in self.nodes:
            self.nodes.remove(node)
            del self.graph[node]
            # Remove connections to this node
            for connected_nodes in self.graph.values():
                if node in connected_nodes:
                    connected_nodes.remove(node)

    def connect(self, src_node: Node, dst_node: Node):
        """Connect two nodes in the graph."""
        if src_node in self.graph and dst_node in self.graph:
            if dst_node not in self.graph[src_node]:
                self.graph[src_node].append(dst_node)

    def topological_sort(self) -> List[Node]:
        """
        Kahn's algorithm for topological sorting.
        Returns nodes in the correct processing order.
        """
        # Calculate in-degree for each node
        in_degree = {node: 0 for node in self.nodes}
        for node in self.nodes:
            for neighbor in self.graph.get(node, []):
                in_degree[neighbor] += 1

        # Queue of nodes with no incoming edges
        queue = [node for node in self.nodes if in_degree[node] == 0]
        sorted_nodes = []

        while queue:
            node = queue.pop(0)
            sorted_nodes.append(node)

            # Reduce in-degree of neighbors
            for neighbor in self.graph.get(node, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        # Check for cycles
        if len(sorted_nodes) != len(self.nodes):
            raise RuntimeError("Graph contains a cycle!")

        return sorted_nodes

    def process_block(self):
        """
        Process one block of audio through the entire graph.
        This is the main DSP loop.
        """
        if not self.is_running:
            return

        # Get correct processing order
        sorted_nodes = self.topological_sort()

        # Process each node in order
        for node in sorted_nodes:
            node.process()

        self.block_count += 1

    def start(self):
        """Start the audio engine."""
        self.is_running = True
        print(f"[AudioEngine] Started. Sample rate: {self.sample_rate}, Buffer: {self.buffer_size}")

    def stop(self):
        """Stop the audio engine."""
        self.is_running = False
        print("[AudioEngine] Stopped")

    def get_stats(self) -> dict:
        """Return engine statistics."""
        return {
            "sample_rate": self.sample_rate,
            "buffer_size": self.buffer_size,
            "num_nodes": len(self.nodes),
            "block_count": self.block_count,
            "is_running": self.is_running,
        }
