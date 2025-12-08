"""
Utility helpers for loading/saving a simple DAW project using `daw_core` classes.
This provides a minimal file-backed project store at `project.json` so CLI scripts
can query and modify tracks without a running DAW server.
"""
from pathlib import Path
import json
from typing import Tuple, Dict, Any

from daw_core.track import Track
from daw_core.routing import Router

PROJECT_FILE = Path("project.json")


def load_project(path: Path = PROJECT_FILE) -> Tuple[Router, Dict[str, Any]]:
    """Load project JSON from disk and return a Router with Track objects plus raw metadata.

    If the file does not exist an empty Router and default metadata are returned.
    """
    router = Router()
    meta: Dict[str, Any] = {"name": "Untitled Project", "bpm": 120}

    if not path.exists():
        return router, meta

    data = json.loads(path.read_text(encoding="utf-8"))
    meta = data.get("meta", meta)
    tracks = data.get("tracks", [])

    for t in tracks:
        track_id = t.get("id") or t.get("name")
        name = t.get("name", "Track")
        ttype = t.get("type", "audio")
        track = Track(track_id, name, track_type=ttype)
        track.from_dict(t)
        router.add_track(track)

    # restore routing info if present
    routing = data.get("routing")
    if routing and isinstance(routing, dict):
        router.routing_matrix = routing.get("routing_matrix", {})

    return router, meta


def save_project(router: Router, meta: Dict[str, Any] = None, path: Path = PROJECT_FILE) -> None:
    """Serialize router and tracks to disk as simple project JSON."""
    if meta is None:
        meta = {"name": "Untitled Project", "bpm": 120}

    tracks = [t.to_dict() for t in router.tracks.values()]
    data = {
        "meta": meta,
        "tracks": tracks,
        "routing": router.to_dict(),
    }

    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def get_track_by_name_or_id(router: Router, identifier: str):
    """Return a Track by id or name (case-insensitive name match)."""
    # Direct id match
    if identifier in router.tracks:
        return router.tracks[identifier]

    # Case-insensitive name match
    ident_lower = identifier.lower()
    for track in router.tracks.values():
        if track.name.lower() == ident_lower:
            return track

    # Partial name match
    for track in router.tracks.values():
        if ident_lower in track.name.lower():
            return track

    return None
