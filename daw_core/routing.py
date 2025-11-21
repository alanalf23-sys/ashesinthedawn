"""
Routing & Send System

Implements flexible audio routing with sends, buses, and auxiliary tracks.
Supports both pre-fader and post-fader sends.
"""

from typing import Dict, List, Optional, Tuple
from .track import Track
from .graph import MixerBus, Node


class Router:
    """
    Manages signal routing between tracks, buses, and sends.
    
    Tracks can route to:
    - Master bus (default)
    - Auxiliary tracks (submixes)
    - Other tracks (for routing chains)
    
    Sends allow parallel processing:
    - Pre-fader sends (before gain)
    - Post-fader sends (after gain)
    """

    def __init__(self):
        self.tracks: Dict[str, Track] = {}
        self.buses: Dict[str, MixerBus] = {}
        self.master_bus: Optional[MixerBus] = None
        self.routing_matrix: Dict[str, List[str]] = {}  # src_id -> [dest_ids]

    def add_track(self, track: Track):
        """Register a track."""
        self.tracks[track.id] = track

    def remove_track(self, track_id: str):
        """Unregister a track."""
        if track_id in self.tracks:
            del self.tracks[track_id]
        # Remove from routing matrix
        if track_id in self.routing_matrix:
            del self.routing_matrix[track_id]
        for dests in self.routing_matrix.values():
            if track_id in dests:
                dests.remove(track_id)

    def add_bus(self, bus_id: str, bus_node: MixerBus):
        """Register an auxiliary bus."""
        self.buses[bus_id] = bus_node

    def create_master_bus(self) -> MixerBus:
        """Create the master output bus."""
        self.master_bus = MixerBus("Master", num_inputs=32)
        return self.master_bus

    def route_track(self, src_track_id: str, dest_bus_id: str):
        """
        Route a track to a destination bus or track.
        
        Args:
            src_track_id: Source track ID
            dest_bus_id: Destination bus/track ID
        """
        if src_track_id not in self.routing_matrix:
            self.routing_matrix[src_track_id] = []

        if dest_bus_id not in self.routing_matrix[src_track_id]:
            self.routing_matrix[src_track_id].append(dest_bus_id)

    def get_routing_for_track(self, track_id: str) -> List[str]:
        """Get all destinations for a track."""
        return self.routing_matrix.get(track_id, ["master"])

    def set_send_level(
        self,
        src_track_id: str,
        dest_track_id: str,
        level_db: float,
        pre_fader: bool = False,
    ):
        """
        Update a send level.
        
        Args:
            src_track_id: Source track
            dest_track_id: Destination track
            level_db: Send level in dB
            pre_fader: Pre-fader (True) or post-fader (False)
        """
        if src_track_id in self.tracks:
            track = self.tracks[src_track_id]
            for send in track.sends:
                if send["destination"] == dest_track_id:
                    send["level_db"] = level_db
                    send["pre_fader"] = pre_fader

    def get_send_destinations(self, track_id: str) -> List[Dict]:
        """Get all send destinations for a track."""
        if track_id in self.tracks:
            return self.tracks[track_id].sends
        return []

    def get_graph_connections(self) -> Dict[str, List[str]]:
        """
        Export the routing matrix as a graph.
        Useful for visualization and serialization.
        """
        return self.routing_matrix.copy()

    def validate_routing(self) -> Tuple[bool, str]:
        """
        Validate that routing doesn't create cycles.
        
        Returns:
            (is_valid, error_message)
        """
        # Build adjacency list from routing matrix
        graph = {}
        for src, dests in self.routing_matrix.items():
            graph[src] = dests

        # DFS to detect cycles
        visited = set()
        rec_stack = set()

        def has_cycle(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)

            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    if has_cycle(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True

            rec_stack.remove(node)
            return False

        for track_id in self.tracks.keys():
            if track_id not in visited:
                if has_cycle(track_id):
                    return False, f"Routing cycle detected involving {track_id}"

        return True, "Routing is valid"

    def to_dict(self) -> Dict:
        """Serialize routing to dict (for project save)."""
        return {
            "routing_matrix": self.routing_matrix,
            "buses": {bid: {"name": b.name} for bid, b in self.buses.items()},
        }
