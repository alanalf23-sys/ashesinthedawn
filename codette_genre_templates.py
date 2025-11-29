"""
Genre-Specific Suggestion Templates for Codette AI
Provides context-aware mixing recommendations based on music genre
"""

GENRE_TEMPLATES = {
    "pop": {
        "name": "Pop/Commercial",
        "description": "Modern commercial pop mixing",
        "characteristics": {
            "vocals": "Prominent, close, detailed",
            "drums": "Punchy, compressed, forward",
            "bass": "Locked to kick, tight",
            "eq_focus": "Presence peak (2-5kHz)",
            "compression_style": "Aggressive on drums and vocals"
        },
        "suggestions": [
            {
                "type": "effect",
                "title": "Vocal Compression",
                "description": "Apply 4:1 ratio, -4dB threshold compression for consistent vocal presence",
                "parameters": {"ratio": 4, "threshold": -4, "makeup_gain": 2},
                "confidence": 0.92
            },
            {
                "type": "effect",
                "title": "Drum Bus Compression",
                "description": "New York-style compression for cohesive drum sound",
                "parameters": {"ratio": 4, "attack": 10, "release": 100},
                "confidence": 0.88
            },
            {
                "type": "routing",
                "title": "Parallel Compression",
                "description": "Create parallel compression bus for punchy drums",
                "parameters": {"blend": 0.3},
                "confidence": 0.85
            },
            {
                "type": "effect",
                "title": "Presence EQ",
                "description": "Boost 2-5kHz for vocal presence",
                "parameters": {"frequency": 3000, "gain": 2, "q": 0.7},
                "confidence": 0.89
            }
        ]
    },
    "hip-hop": {
        "name": "Hip-Hop/Rap",
        "description": "Hip-hop and rap production mixing",
        "characteristics": {
            "vocals": "Aggressive, distorted, centered",
            "drums": "Boom bap or trap, dynamic range",
            "bass": "Deep, sub-focused, locked",
            "eq_focus": "Sub bass and high-mid presence",
            "compression_style": "Moderate to aggressive"
        },
        "suggestions": [
            {
                "type": "effect",
                "title": "Vocal Saturation",
                "description": "Add subtle distortion for aggression (Tape emulation or soft clipper)",
                "parameters": {"drive": 3, "tone": 0.6},
                "confidence": 0.90
            },
            {
                "type": "effect",
                "title": "Bass Compression",
                "description": "Heavy compression on bass for clarity and punch",
                "parameters": {"ratio": 6, "threshold": -6, "attack": 30},
                "confidence": 0.87
            },
            {
                "type": "routing",
                "title": "Sub/Bass Split",
                "description": "Separate sub frequencies for independent control",
                "parameters": {"split_frequency": 150},
                "confidence": 0.86
            },
            {
                "type": "effect",
                "title": "High-Mid Presence",
                "description": "Boost 4-6kHz for vocal clarity and presence",
                "parameters": {"frequency": 5000, "gain": 3, "q": 1.0},
                "confidence": 0.88
            }
        ]
    },
    "rock": {
        "name": "Rock/Alternative",
        "description": "Rock and alternative music mixing",
        "characteristics": {
            "vocals": "Powerful, emotional, clear",
            "drums": "Natural, dynamic, uncompressed feel",
            "guitars": "Full-bodied, layered, spatial",
            "eq_focus": "Upper mids (3-5kHz) for presence",
            "compression_style": "Moderate, natural"
        },
        "suggestions": [
            {
                "type": "effect",
                "title": "Vocal Presence EQ",
                "description": "Boost upper mids for powerful vocal character",
                "parameters": {"frequency": 4000, "gain": 2.5, "q": 1.2},
                "confidence": 0.89
            },
            {
                "type": "effect",
                "title": "Drum Room Reverb",
                "description": "Add natural room ambience to drums",
                "parameters": {"size": 2.5, "decay": 1.5, "wet": 0.15},
                "confidence": 0.85
            },
            {
                "type": "routing",
                "title": "Guitar Doubling",
                "description": "Create wide stereo image with panned guitar doubles",
                "parameters": {"pan_separation": 0.8},
                "confidence": 0.84
            },
            {
                "type": "effect",
                "title": "Moderate Compression",
                "description": "Subtle compression for control without losing dynamics",
                "parameters": {"ratio": 2.5, "threshold": -3, "attack": 100},
                "confidence": 0.86
            }
        ]
    },
    "electronic": {
        "name": "Electronic/EDM",
        "description": "Electronic and dance music mixing",
        "characteristics": {
            "vocals": "Processed, layered, effects",
            "drums": "Precise, compressed, punchy",
            "synths": "Wide, layered, processed",
            "eq_focus": "Sub bass and presence peak",
            "compression_style": "Aggressive on drums"
        },
        "suggestions": [
            {
                "type": "effect",
                "title": "Kick Compression",
                "description": "Heavy compression for clean punch and impact",
                "parameters": {"ratio": 8, "threshold": -8, "makeup_gain": 3},
                "confidence": 0.91
            },
            {
                "type": "effect",
                "title": "Sub Bass Limiting",
                "description": "Protect subs with hard limiting above -0.5dB",
                "parameters": {"threshold": -0.5, "ratio": 10},
                "confidence": 0.93
            },
            {
                "type": "routing",
                "title": "Synth Bus Processing",
                "description": "Group synths for cohesive processing",
                "parameters": {"elements": ["synth_lead", "synth_pad", "synth_fx"]},
                "confidence": 0.82
            },
            {
                "type": "effect",
                "title": "Presence and Clarity",
                "description": "Boost 2-4kHz for presence in dense mixes",
                "parameters": {"frequency": 3000, "gain": 2.5, "q": 1.5},
                "confidence": 0.87
            }
        ]
    },
    "jazz": {
        "name": "Jazz/Acoustic",
        "description": "Jazz and acoustic music mixing",
        "characteristics": {
            "vocals": "Intimate, breathy, natural",
            "instruments": "Warm, spacious, dynamic",
            "mix": "Minimal compression, natural dynamics",
            "eq_focus": "Warm mids, smooth highs",
            "compression_style": "Minimal, transparent"
        },
        "suggestions": [
            {
                "type": "effect",
                "title": "Transparent Compression",
                "description": "Barely perceptible compression for control",
                "parameters": {"ratio": 1.5, "threshold": -2, "attack": 200},
                "confidence": 0.85
            },
            {
                "type": "effect",
                "title": "Warm Tone EQ",
                "description": "Gentle boost in warm mids (200-500Hz)",
                "parameters": {"frequency": 300, "gain": 1.5, "q": 1.0},
                "confidence": 0.83
            },
            {
                "type": "routing",
                "title": "Natural Spatial Imaging",
                "description": "Preserve instrument spatial placement with minimal EQ",
                "parameters": {"preserve_dynamics": True},
                "confidence": 0.84
            },
            {
                "type": "effect",
                "title": "Subtle Reverb",
                "description": "Add room acoustics for natural ambience",
                "parameters": {"size": 3.0, "decay": 2.5, "wet": 0.08},
                "confidence": 0.82
            }
        ]
    },
    "ambient": {
        "name": "Ambient/Experimental",
        "description": "Ambient and experimental music mixing",
        "characteristics": {
            "texture": "Layered, evolving, spatial",
            "dynamics": "Compressed, even levels",
            "effects": "Heavy, processed, artistic",
            "eq_focus": "Full spectrum, lush",
            "compression_style": "Aggressive, transparent"
        },
        "suggestions": [
            {
                "type": "effect",
                "title": "Lush Reverb",
                "description": "Large hall reverb for immersive space",
                "parameters": {"size": 5.0, "decay": 3.5, "wet": 0.3},
                "confidence": 0.88
            },
            {
                "type": "effect",
                "title": "Multiband Compression",
                "description": "Compress different frequency bands independently",
                "parameters": {"bands": 4, "responsive": True},
                "confidence": 0.85
            },
            {
                "type": "effect",
                "title": "Subtle Modulation",
                "description": "Add movement with chorus or flanger",
                "parameters": {"type": "chorus", "rate": 1.5, "depth": 0.2},
                "confidence": 0.80
            },
            {
                "type": "routing",
                "title": "Effects Chain Mastery",
                "description": "Create artistic effects chains for texture",
                "parameters": {"serial_processing": True},
                "confidence": 0.78
            }
        ]
    }
}

def get_genre_suggestions(genre: str, limit: int = 5) -> list:
    """Get genre-specific suggestions"""
    if genre not in GENRE_TEMPLATES:
        return []
    
    template = GENRE_TEMPLATES[genre]
    suggestions = template["suggestions"][:limit]
    return suggestions

def get_available_genres() -> list:
    """Get list of available genre templates"""
    return [{"id": genre, "name": data["name"], "description": data["description"]} 
            for genre, data in GENRE_TEMPLATES.items()]

def get_genre_characteristics(genre: str) -> dict:
    """Get mixing characteristics for a genre"""
    if genre not in GENRE_TEMPLATES:
        return {}
    
    return GENRE_TEMPLATES[genre]["characteristics"]

def combine_suggestions(base_suggestions: list, genre: str) -> list:
    """Combine base suggestions with genre-specific ones"""
    genre_sugg = get_genre_suggestions(genre, limit=2)
    # Increase confidence for genre-specific suggestions
    for sugg in genre_sugg:
        sugg["confidence"] = min(sugg.get("confidence", 0.8) * 1.05, 1.0)
    
    return genre_sugg + base_suggestions
