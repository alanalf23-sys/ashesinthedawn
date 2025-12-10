"""
File Upload and Timeline Integration for Codette Chat
Adds support for file uploads and DAW timeline context
"""

import os
import json
import logging
import mimetypes
from typing import Dict, Any, List, Optional
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

# ============================================================================
# FILE STORAGE CONFIGURATION
# ============================================================================

UPLOAD_DIRECTORY = Path("uploads")
UPLOAD_DIRECTORY.mkdir(exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {
    # Audio
    ".wav", ".mp3", ".flac", ".aiff", ".ogg", ".m4a",
    # MIDI
    ".mid", ".midi",
    # Project files
    ".json", ".xml",
    # Text/Code
    ".txt", ".md", ".py", ".js", ".ts"
}

# ============================================================================
# FILE ANALYSIS HELPERS
# ============================================================================

async def analyze_uploaded_file(file_path: Path, file_type: str) -> Dict[str, Any]:
    """
    Analyze uploaded file and extract metadata
    
    Args:
        file_path: Path to uploaded file
        file_type: MIME type of file
        
    Returns:
        Dictionary with file analysis results
    """
    try:
        analysis = {
            "filename": file_path.name,
            "size_bytes": file_path.stat().st_size,
            "mime_type": file_type,
            "extension": file_path.suffix.lower(),
            "created_at": datetime.now().isoformat()
        }
        
        # Audio file analysis
        if file_path.suffix.lower() in [".wav", ".mp3", ".flac", ".aiff", ".ogg", ".m4a"]:
            analysis.update(await analyze_audio_file(file_path))
        
        # MIDI file analysis
        elif file_path.suffix.lower() in [".mid", ".midi"]:
            analysis.update(await analyze_midi_file(file_path))
        
        # Text/code file analysis
        elif file_path.suffix.lower() in [".txt", ".md", ".py", ".js", ".ts", ".json", ".xml"]:
            analysis.update(await analyze_text_file(file_path))
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing file {file_path}: {e}")
        return {
            "filename": file_path.name,
            "error": str(e)
        }


async def analyze_audio_file(file_path: Path) -> Dict[str, Any]:
    """Extract audio file metadata"""
    try:
        # Try to use pydub for audio analysis
        try:
            from pydub import AudioSegment
            audio = AudioSegment.from_file(str(file_path))
            
            return {
                "duration_ms": len(audio),
                "duration_seconds": len(audio) / 1000.0,
                "channels": audio.channels,
                "sample_width": audio.sample_width,
                "frame_rate": audio.frame_rate,
                "frame_count": int(len(audio) / 1000.0 * audio.frame_rate),
                "dBFS": audio.dBFS,
                "max_dBFS": audio.max_dBFS,
                "analysis_type": "audio_full"
            }
        except ImportError:
            # Fallback: basic file info only
            logger.warning("pydub not available, using basic file analysis")
            return {
                "analysis_type": "audio_basic",
                "note": "Install pydub for detailed audio analysis"
            }
            
    except Exception as e:
        logger.error(f"Error analyzing audio file: {e}")
        return {"error": str(e)}


async def analyze_midi_file(file_path: Path) -> Dict[str, Any]:
    """Extract MIDI file metadata"""
    try:
        # Try to use mido for MIDI analysis
        try:
            import mido
            mid = mido.MidiFile(str(file_path))
            
            # Count events
            note_events = 0
            tempo_changes = 0
            time_signature_changes = 0
            
            for track in mid.tracks:
                for msg in track:
                    if msg.type in ['note_on', 'note_off']:
                        note_events += 1
                    elif msg.type == 'set_tempo':
                        tempo_changes += 1
                    elif msg.type == 'time_signature':
                        time_signature_changes += 1
            
            return {
                "type_format": mid.type,
                "tracks": len(mid.tracks),
                "ticks_per_beat": mid.ticks_per_beat,
                "total_time": mid.length,
                "note_events": note_events,
                "tempo_changes": tempo_changes,
                "time_signature_changes": time_signature_changes,
                "analysis_type": "midi_full"
            }
        except ImportError:
            logger.warning("mido not available, using basic file analysis")
            return {
                "analysis_type": "midi_basic",
                "note": "Install mido for detailed MIDI analysis"
            }
            
    except Exception as e:
        logger.error(f"Error analyzing MIDI file: {e}")
        return {"error": str(e)}


async def analyze_text_file(file_path: Path) -> Dict[str, Any]:
    """Extract text file content and metadata"""
    try:
        content = file_path.read_text(encoding='utf-8')
        
        return {
            "line_count": len(content.split('\n')),
            "char_count": len(content),
            "word_count": len(content.split()),
            "preview": content[:500],  # First 500 chars
            "full_content": content if len(content) < 10000 else None,  # Full content if small
            "analysis_type": "text"
        }
        
    except Exception as e:
        logger.error(f"Error analyzing text file: {e}")
        return {"error": str(e)}


# ============================================================================
# TIMELINE CONTEXT SERIALIZATION
# ============================================================================

def serialize_timeline_context(timeline_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Serialize DAW timeline/track context for Codette
    
    Args:
        timeline_data: Raw timeline data from frontend
        
    Returns:
        Cleaned and structured timeline context
    """
    try:
        context = {
            "tracks": [],
            "regions": [],
            "markers": [],
            "transport": {},
            "session": {}
        }
        
        # Serialize tracks
        if "tracks" in timeline_data:
            for track in timeline_data["tracks"]:
                context["tracks"].append({
                    "id": track.get("id"),
                    "name": track.get("name"),
                    "type": track.get("type"),
                    "volume": track.get("volume"),
                    "pan": track.get("pan"),
                    "muted": track.get("muted"),
                    "soloed": track.get("soloed"),
                    "armed": track.get("armed"),
                    "color": track.get("color"),
                    "inserts": track.get("inserts", []),
                    "sends": track.get("sends", [])
                })
        
        # Serialize regions
        if "regions" in timeline_data:
            for region in timeline_data["regions"]:
                context["regions"].append({
                    "id": region.get("id"),
                    "track_id": region.get("trackId"),
                    "start_time": region.get("startTime"),
                    "duration": region.get("duration"),
                    "name": region.get("name"),
                    "color": region.get("color")
                })
        
        # Serialize markers
        if "markers" in timeline_data:
            context["markers"] = timeline_data["markers"]
        
        # Serialize transport state
        if "transport" in timeline_data:
            context["transport"] = {
                "playing": timeline_data["transport"].get("playing"),
                "recording": timeline_data["transport"].get("recording"),
                "time_seconds": timeline_data["transport"].get("timeSeconds"),
                "bpm": timeline_data["transport"].get("bpm"),
                "time_signature": timeline_data["transport"].get("timeSignature")
            }
        
        # Session metadata
        context["session"] = {
            "track_count": len(context["tracks"]),
            "region_count": len(context["regions"]),
            "total_duration": max([r["start_time"] + r["duration"] for r in context["regions"]], default=0),
            "armed_tracks": len([t for t in context["tracks"] if t.get("armed")]),
            "soloed_tracks": len([t for t in context["tracks"] if t.get("soloed")]),
            "muted_tracks": len([t for t in context["tracks"] if t.get("muted")])
        }
        
        return context
        
    except Exception as e:
        logger.error(f"Error serializing timeline context: {e}")
        return {"error": str(e)}


def generate_timeline_suggestions(timeline_context: Dict[str, Any]) -> List[str]:
    """
    Generate suggestions based on timeline/track context
    
    Args:
        timeline_context: Serialized timeline data
        
    Returns:
        List of actionable suggestions
    """
    suggestions = []
    
    try:
        session = timeline_context.get("session", {})
        tracks = timeline_context.get("tracks", [])
        transport = timeline_context.get("transport", {})
        
        # Track count suggestions
        if session.get("track_count", 0) > 32:
            suggestions.append("💡 Consider freezing some tracks to improve performance with 32+ tracks")
        
        # Muted tracks warning
        if session.get("muted_tracks", 0) > 5:
            suggestions.append("🔇 You have multiple muted tracks - consider cleaning up unused tracks")
        
        # Solo mode warning
        if session.get("soloed_tracks", 0) > 0:
            suggestions.append("🎧 Solo mode is active - remember to unsolo before final mix")
        
        # BPM analysis
        bpm = transport.get("bpm", 120)
        if bpm < 80:
            suggestions.append("🎵 Slow tempo detected - consider adding warmth and space with reverb")
        elif bpm > 140:
            suggestions.append("⚡ Fast tempo detected - keep low-end tight and focused")
        
        # Track type analysis
        track_types = {}
        for track in tracks:
            track_type = track.get("type", "audio")
            track_types[track_type] = track_types.get(track_type, 0) + 1
        
        if track_types.get("audio", 0) > 16:
            suggestions.append("🎼 Many audio tracks detected - consider using buses for groups")
        
        # Armed tracks warning
        if session.get("armed_tracks", 0) > 1 and transport.get("recording"):
            suggestions.append("🔴 Multiple tracks armed - verify you want to record all simultaneously")
        
        return suggestions
        
    except Exception as e:
        logger.error(f"Error generating timeline suggestions: {e}")
        return ["Error analyzing timeline"]


# ============================================================================
# FILE HISTORY MANAGEMENT
# ============================================================================

class FileHistory:
    """Manage uploaded file history for chat sessions"""
    
    def __init__(self):
        self.history = {}  # user_id -> List[file_info]
    
    def add_file(self, user_id: str, file_info: Dict[str, Any]):
        """Add file to user's history"""
        if user_id not in self.history:
            self.history[user_id] = []
        self.history[user_id].append(file_info)
    
    def get_files(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent files for user"""
        return self.history.get(user_id, [])[-limit:]
    
    def get_file_by_id(self, user_id: str, file_id: str) -> Optional[Dict[str, Any]]:
        """Get specific file by ID"""
        files = self.history.get(user_id, [])
        for file in files:
            if file.get("id") == file_id:
                return file
        return None
    
    def clear_history(self, user_id: str):
        """Clear file history for user"""
        if user_id in self.history:
            del self.history[user_id]


# Global file history instance
file_history = FileHistory()
