"""
Codette AI Training Module
Comprehensive training data and context for Codette AI engine
Enables full system understanding and intelligent decision-making
"""

from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import json

# ==================== DOMAIN KNOWLEDGE ====================

class AudioDomain(Enum):
    """Audio production domain areas"""
    MIXING = "mixing"
    MASTERING = "mastering"
    RECORDING = "recording"
    SIGNAL_FLOW = "signal_flow"
    EFFECTS = "effects"
    METERING = "metering"
    DYNAMICS = "dynamics"
    FREQUENCY = "frequency"

class TrackType(Enum):
    """Track types in the DAW"""
    AUDIO = "audio"
    INSTRUMENT = "instrument"
    MIDI = "midi"
    AUX = "aux"
    VCA = "vca"
    MASTER = "master"

@dataclass
class AudioMetrics:
    """Audio analysis metrics"""
    peak_level: float  # -60 to 0 dB
    rms_level: float   # RMS in dB
    crest_factor: float  # Peak/RMS ratio
    loudness_lufs: float  # Loudness standard
    dynamic_range: float  # Max - Min
    thd: float  # Total Harmonic Distortion %
    frequency_balance: Dict[str, float]  # Freq bands: low, mid, high
    phase_correlation: float  # L/R phase: -1 to 1

@dataclass
class PluginConfig:
    """Plugin effect configuration"""
    plugin_id: str
    plugin_name: str
    category: str  # EQ, Compressor, Delay, Reverb, Saturation
    parameters: Dict[str, float]
    bypass: bool
    position: int  # In chain

# ==================== CORELOGIC STUDIO SYSTEM KNOWLEDGE ====================

SYSTEM_ARCHITECTURE = {
    "frontend": {
        "framework": "React 18.3 + TypeScript 5.5",
        "build_tool": "Vite 7.2.4",
        "port": 5174,
        "state_management": "DAWContext (React Context)",
        "audio_api": "Web Audio API",
        "ui_framework": "Tailwind CSS 3.4",
    },
    "backend": {
        "framework": "FastAPI + Uvicorn",
        "language": "Python 3.13.7",
        "port": 8000,
        "ai_engine": "Codette (BroaderPerspectiveEngine)",
        "dsp_library": "daw_core (NumPy/SciPy)",
    },
    "communication": {
        "protocol": "HTTP REST + JSON",
        "bridge_service": "codetteBridgeService.ts",
        "endpoints": [
            "/analyze/gain-staging",
            "/analyze/mixing",
            "/analyze/routing",
            "/analyze/session",
            "/analyze/mastering",
            "/analyze/creative"
        ],
    }
}

# ==================== AUDIO PRODUCTION BEST PRACTICES ====================

MIXING_STANDARDS = {
    "reference_levels": {
        "headroom": -3.0,  # dB
        "target_loudness": -14.0,  # LUFS (streaming)
        "master_peak": -1.0,  # dB (prevent clipping)
    },
    "frequency_targets": {
        "low_end": (20, 200),  # Hz - Bass frequencies
        "low_mids": (200, 500),  # Hz - Boxiness
        "mids": (500, 2000),  # Hz - Presence
        "high_mids": (2000, 8000),  # Hz - Clarity
        "high_end": (8000, 20000),  # Hz - Brilliance
    },
    "gain_staging": {
        "input_headroom": -6.0,  # dB recommended
        "send_level": -6.0,  # dB for effects sends
        "return_level": -12.0,  # dB for effect returns
    },
    "compression_ranges": {
        "ratio": (1.5, 8.0),  # 1.5:1 to 8:1
        "attack_ms": (1, 100),  # milliseconds
        "release_ms": (50, 500),  # milliseconds
    }
}

PLUGIN_CATEGORIES = {
    "EQ": {
        "types": ["Parametric", "Graphic", "Dynamic"],
        "use_cases": ["Balance frequencies", "Remove resonances", "Add presence"],
        "typical_settings": {
            "gain": (-12, 12),  # dB
            "q_factor": (0.5, 10),  # Bandwidth
            "frequency": (20, 20000),  # Hz
        }
    },
    "Compressor": {
        "types": ["Vocals", "Drums", "Mix bus"],
        "parameters": ["Ratio", "Threshold", "Attack", "Release", "Makeup Gain"],
        "recommended_settings": {
            "ratio": 4.0,  # 4:1
            "threshold": -20.0,  # dB
            "attack": 10,  # ms
            "release": 100,  # ms
        }
    },
    "Delay": {
        "types": ["Simple", "Ping-pong", "Multi-tap"],
        "time_sync": ["Note divisions", "BPM sync"],
        "feedback_range": (0, 0.9),  # Prevent feedback runaway
    },
    "Reverb": {
        "types": ["Room", "Hall", "Plate", "Spring"],
        "parameters": ["Room size", "Decay time", "Pre-delay", "Width"],
        "typical_predelay": (10, 100),  # ms
    },
    "Saturation": {
        "types": ["Soft clip", "Hard clip", "Waveshaper"],
        "use_cases": ["Add warmth", "Increase sustain", "Glue"],
        "drive_range": (0, 12),  # dB
    }
}

# ==================== ANALYSIS FRAMEWORKS ====================

ANALYSIS_CONTEXTS = {
    "gain_staging": {
        "description": "Analyze signal levels throughout the signal chain",
        "metrics": [
            "Input levels per track",
            "Send/return levels",
            "Master bus level",
            "Headroom available",
            "Clipping detection"
        ],
        "recommendations": [
            "Optimize input gains to -6dB on meters",
            "Set sends to -6dB for clean mixes",
            "Maintain 3dB headroom on master bus",
            "Monitor for clipping or noise floor issues"
        ]
    },
    "mixing": {
        "description": "Analyze mix balance and frequency distribution",
        "metrics": [
            "Track balance (volume levels)",
            "Frequency balance (EQ spectrum)",
            "Stereo width and imaging",
            "Compression and dynamics",
            "Effects send levels"
        ],
        "recommendations": [
            "Balance vocals upfront, drums in pocket",
            "Use EQ to separate frequency ranges",
            "Add reverb sparingly for depth",
            "Check mix on multiple speakers"
        ]
    },
    "routing": {
        "description": "Analyze signal flow and track organization",
        "metrics": [
            "Track types (audio, MIDI, instrument, aux)",
            "Buses and sub-groups",
            "Send/return chains",
            "Automation assignments",
            "Plugin chain organization"
        ],
        "recommendations": [
            "Group similar tracks into buses",
            "Color-code tracks by instrument family",
            "Use VCA masters for bus compression",
            "Organize effects in aux channels"
        ]
    },
    "session": {
        "description": "Analyze overall project health and efficiency",
        "metrics": [
            "CPU usage",
            "Total track count",
            "Plugin density",
            "File organization",
            "Project structure"
        ],
        "recommendations": [
            "Freeze/render heavy virtual instruments",
            "Group tracks efficiently",
            "Delete unused tracks",
            "Archive old sessions regularly"
        ]
    },
    "mastering": {
        "description": "Analyze mix readiness for mastering",
        "metrics": [
            "Loudness (LUFS)",
            "Dynamic range",
            "Peak levels",
            "Stereo balance",
            "Frequency response flatness"
        ],
        "recommendations": [
            "Achieve -14 LUFS (streaming target)",
            "Maintain 6dB dynamic range minimum",
            "Leave -1dB headroom on master",
            "Check on multiple playback systems"
        ]
    },
    "creative": {
        "description": "Suggest creative improvements and enhancements",
        "metrics": [
            "Harmonic interest",
            "Frequency excitement",
            "Dynamic interest",
            "Stereo imaging creativity",
            "Effect balance"
        ],
        "recommendations": [
            "Parallel compression for glue",
            "Harmonic saturation for warmth",
            "Stereo widening on pads",
            "Sidechain compression for punch",
            "Automation for movement"
        ]
    }
}

# ==================== DECISION TREES ====================

GAIN_STAGING_DECISIONS = {
    "peak_level_too_high": {
        "condition": "peak > 0 dB",
        "actions": [
            "Reduce input gain",
            "Check for clipping in chain",
            "Review compressor settings"
        ],
        "priority": "critical"
    },
    "rms_too_low": {
        "condition": "rms < -24 dB",
        "actions": [
            "Increase input gain",
            "Check source level",
            "Verify audio file integrity"
        ],
        "priority": "high"
    },
    "insufficient_headroom": {
        "condition": "peak > -3 dB",
        "actions": [
            "Reduce track volumes",
            "Lower send levels",
            "Apply gentle compression"
        ],
        "priority": "high"
    }
}

FREQUENCY_BALANCE_DECISIONS = {
    "too_much_bass": {
        "condition": "low_end_energy > 0.7",
        "actions": [
            "Apply high-pass filter (80-120Hz)",
            "Reduce bass track volume",
            "Use narrow EQ on problematic frequencies"
        ],
        "target_range": 0.4
    },
    "scooped_mids": {
        "condition": "mid_range_energy < 0.3",
        "actions": [
            "Add 3dB at 1kHz",
            "Check vocal levels",
            "Boost presence on lead instruments"
        ],
        "target_range": 0.5
    },
    "harsh_highs": {
        "condition": "high_end_energy > 0.8",
        "actions": [
            "Reduce 5kHz presence peak",
            "Lower high-frequency sensitive tracks",
            "Apply gentle high shelf cut"
        ],
        "target_range": 0.5
    }
}

# ==================== PLUGIN RECOMMENDATIONS ====================

PLUGIN_SUGGESTIONS = {
    "vocals": [
        {"category": "EQ", "suggestion": "Parametric EQ", "reason": "Remove low rumble, add presence"},
        {"category": "Compressor", "suggestion": "Vocal Compressor", "reason": "Control dynamics, add glue"},
        {"category": "Reverb", "suggestion": "Room/Hall", "reason": "Add space and depth"},
        {"category": "Saturation", "suggestion": "Soft Saturation", "reason": "Add warmth and smoothness"}
    ],
    "drums": [
        {"category": "Compressor", "suggestion": "Drum Compressor", "reason": "Tighten attack, add punch"},
        {"category": "EQ", "suggestion": "Graphic EQ", "reason": "Shape drum tone"},
        {"category": "Delay", "suggestion": "Ping-pong Delay", "reason": "Add space on overheads"}
    ],
    "bass": [
        {"category": "EQ", "suggestion": "Parametric EQ", "reason": "Define sub and fundamental"},
        {"category": "Compressor", "suggestion": "Multi-band Compressor", "reason": "Control dynamic range"},
        {"category": "Saturation", "suggestion": "Bass Saturation", "reason": "Add harmonics and sustain"}
    ],
    "master": [
        {"category": "EQ", "suggestion": "Parametric EQ", "reason": "Fine-tune frequency balance"},
        {"category": "Compressor", "suggestion": "VCA Compressor", "reason": "Add glue to mix"},
        {"category": "Limiter", "suggestion": "Limiter", "reason": "Prevent peaks and clipping"}
    ]
}

# ==================== MUSICAL THEORY & NOTATION ====================

MUSICAL_KNOWLEDGE = {
    "notes": {
        "chromatic_scale": ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        "natural_notes": ["C", "D", "E", "F", "G", "A", "B"],
        "octave_range": {
            "sub_bass": (20, 60),  # Hz - Below musical range
            "bass": (60, 250),  # Hz - E1 to B3
            "low_mid": (250, 500),  # Hz - C2 to B3
            "mid": (500, 2000),  # Hz - C3 to B5
            "high_mid": (2000, 4000),  # Hz - C5 to B6
            "treble": (4000, 8000),  # Hz - C6 to B7
            "presence": (8000, 20000)  # Hz - C8+
        },
        "piano_range": {
            "lowest_note": ("A0", 27.5),  # Hz
            "highest_note": ("C8", 4186),  # Hz
            "human_voice_range": (80, 1100)  # Hz - typical singing
        }
    },
    
    "scales": {
        "major": ["I", "II", "III", "IV", "V", "VI", "VII"],
        "minor_natural": ["I", "II", "III", "IV", "V", "VI", "VII"],
        "minor_harmonic": ["I", "II", "III", "IV", "V", "VI", "VII#"],
        "minor_melodic": ["I", "II", "III", "IV", "V", "VI", "VII"],
        "pentatonic_major": ["I", "II", "III", "V", "VI"],
        "pentatonic_minor": ["I", "III", "IV", "V", "VII"],
        "blues": ["I", "III", "IV", "V", "VI", "VII"],
        "modes": {
            "ionian": "Major",
            "dorian": "Minor with raised VI",
            "phrygian": "Minor with lowered II",
            "lydian": "Major with raised IV",
            "mixolydian": "Major with lowered VII",
            "aeolian": "Natural minor",
            "locrian": "Minor with lowered II and V"
        }
    },
    
    "chords": {
        "triads": {
            "major": ["I", "III", "V"],
            "minor": ["I", "III", "V"],
            "diminished": ["I", "III", "V"],
            "augmented": ["I", "III", "V#"]
        },
        "seventh_chords": {
            "major_7": ["I", "III", "V", "VII"],
            "minor_7": ["I", "III", "V", "VII"],
            "dominant_7": ["I", "III", "V", "VII"],
            "half_diminished": ["I", "III", "V", "VII"]
        },
        "chord_progressions": {
            "I_IV_V_I": "Classic progression",
            "I_V_VI_IV": "Popular progression",
            "II_V_I": "Jazz foundation",
            "I_VI_IV_V": "Pop standard",
            "VI_IV_I_V": "Minor key progression"
        }
    },
    
    "intervals": {
        "unison": 1,
        "minor_second": 1.059,
        "major_second": 1.122,
        "minor_third": 1.189,
        "major_third": 1.260,
        "perfect_fourth": 1.335,
        "tritone": 1.414,
        "perfect_fifth": 1.498,
        "minor_sixth": 1.587,
        "major_sixth": 1.682,
        "minor_seventh": 1.782,
        "major_seventh": 1.888,
        "octave": 2.0
    },
    
    "tuning_systems": {
        "equal_temperament": {
            "description": "Standard modern tuning (12 equal semitones per octave)",
            "a4_frequency": 440,
            "cents_per_semitone": 100
        },
        "just_intonation": {
            "description": "Pure harmonic ratios",
            "interval_ratios": {
                "perfect_fifth": "3:2",
                "perfect_fourth": "4:3",
                "major_third": "5:4",
                "minor_third": "6:5"
            }
        },
        "pythagorean": {
            "description": "Tuning based on perfect fifths",
            "basis": "3:2 ratios"
        }
    }
}

TEMPO_KNOWLEDGE = {
    "tempo_markings": {
        "grave": (20, 40),  # Very slow, solemn
        "largo": (40, 60),  # Broad, slow
        "adagio": (55, 75),  # Slow
        "andante": (75, 105),  # Walking pace
        "moderato": (105, 120),  # Moderate
        "allegro": (120, 140),  # Fast
        "vivace": (140, 160),  # Lively
        "presto": (160, 180),  # Very fast
        "prestissimo": (180, 220)  # Extremely fast
    },
    
    "time_signatures": {
        "simple_duple": {
            "2/4": {"beats": 2, "note_value": 4, "feel": "march, polka"},
            "2/2": {"beats": 2, "note_value": 2, "feel": "march, fast tempo"}
        },
        "simple_triple": {
            "3/4": {"beats": 3, "note_value": 4, "feel": "waltz, ballad"},
            "3/8": {"beats": 3, "note_value": 8, "feel": "jig, dance"}
        },
        "simple_quadruple": {
            "4/4": {"beats": 4, "note_value": 4, "feel": "common, straight"},
            "4/8": {"beats": 4, "note_value": 8, "feel": "fast or march"}
        },
        "compound_duple": {
            "6/8": {"beats": 2, "note_value": 8, "feel": "swing, bounce"}
        },
        "compound_triple": {
            "9/8": {"beats": 3, "note_value": 8, "feel": "folk, waltz"},
            "9/4": {"beats": 3, "note_value": 4, "feel": "rare, slow"}
        },
        "compound_quadruple": {
            "12/8": {"beats": 4, "note_value": 8, "feel": "blues, swing"}
        },
        "asymmetric": {
            "5/4": {"beats": 5, "note_value": 4, "feel": "progressive, complex"},
            "7/8": {"beats": 7, "note_value": 8, "feel": "complex, irregular"},
            "5/8": {"beats": 5, "note_value": 8, "feel": "folk, progressive"}
        }
    },
    
    "note_values": {
        "whole_note": 1.0,
        "dotted_half": 0.75,
        "half_note": 0.5,
        "dotted_quarter": 0.375,
        "quarter_note": 0.25,
        "dotted_eighth": 0.1875,
        "eighth_note": 0.125,
        "dotted_sixteenth": 0.09375,
        "sixteenth_note": 0.0625,
        "triplet_eighth": 0.0833,
        "triplet_sixteenth": 0.0417
    },
    
    "delay_sync": {
        "description": "Delay times synced to tempo",
        "bpm_120_examples": {
            "quarter_note": 500,  # ms
            "eighth_note": 250,  # ms
            "triplet_eighth": 333,  # ms
            "sixteenth_note": 125,  # ms
            "dotted_eighth": 375,  # ms
            "dotted_quarter": 1000  # ms
        },
        "formula": "60000 / BPM / (beat_division)"
    }
}

MUSIC_NOTATION = {
    "dynamics": {
        "ppp": "Pianississimo - extremely soft",
        "pp": "Pianissimo - very soft",
        "p": "Piano - soft",
        "mp": "Mezzo-piano - moderately soft",
        "mf": "Mezzo-forte - moderately loud",
        "f": "Forte - loud",
        "ff": "Fortissimo - very loud",
        "fff": "Fortississimo - extremely loud"
    },
    
    "articulation": {
        "staccato": "Short, detached notes",
        "legato": "Smooth, connected notes",
        "marcato": "Marked, emphasized notes",
        "accent": "Emphasized attack",
        "tenuto": "Held for full value",
        "glissando": "Smooth pitch slide",
        "portamento": "Smooth pitch transition",
        "vibrato": "Periodic pitch variation"
    },
    
    "expression_marks": {
        "crescendo": "Gradually get louder",
        "diminuendo": "Gradually get softer",
        "accelerando": "Gradually get faster",
        "ritardando": "Gradually get slower",
        "fermata": "Hold longer than normal",
        "breath_mark": "Brief pause for breath",
        "phrase_mark": "Smooth connected phrase"
    },
    
    "key_signatures": {
        "C_major_A_minor": 0,
        "G_major_E_minor": 1,
        "D_major_B_minor": 2,
        "A_major_Fsharp_minor": 3,
        "E_major_Csharp_minor": 4,
        "B_major_Gsharp_minor": 5,
        "F_sharp_major_Dsharp_minor": 6,
        "C_sharp_major_Asharp_minor": 7,
        "F_major_D_minor": -1,
        "B_flat_major_G_minor": -2,
        "E_flat_major_C_minor": -3,
        "A_flat_major_F_minor": -4,
        "D_flat_major_B_flat_minor": -5,
        "G_flat_major_E_flat_minor": -6,
        "C_flat_major_A_flat_minor": -7
    }
}

# ==================== GENRE-SPECIFIC MUSICAL KNOWLEDGE ====================

GENRE_KNOWLEDGE = {
    "pop": {
        "tempo_range": (90, 130),
        "time_signature": "4/4",
        "key_characteristics": ["Catchy melodies", "Simple chord progressions", "Strong beat"],
        "typical_chords": ["I", "V", "VI", "IV"],
        "instrumentation": ["Vocals", "Bass", "Drums", "Guitar/Keys"],
        "song_structure": "Intro-Verse-Chorus-Bridge-Chorus-Outro"
    },
    
    "rock": {
        "tempo_range": (100, 160),
        "time_signature": "4/4",
        "key_characteristics": ["Power chords", "Distortion", "Strong drums"],
        "typical_chords": ["I", "IV", "V"],
        "instrumentation": ["Vocals", "Electric Guitar", "Bass", "Drums"],
        "song_structure": "Intro-Verse-Chorus-Bridge-Chorus-Outro"
    },
    
    "jazz": {
        "tempo_range": (80, 200),
        "time_signature": ["4/4", "3/4"],
        "key_characteristics": ["Improvisation", "Complex harmonies", "Swing feel"],
        "typical_chords": ["II-V-I", "Seventh chords", "Extensions"],
        "instrumentation": ["Vocals/Horns", "Piano", "Bass", "Drums"],
        "comping_style": "Swing, stride, modal"
    },
    
    "classical": {
        "tempo_range": (40, 180),
        "time_signature": ["3/4", "4/4", "Complex"],
        "key_characteristics": ["Formal structure", "Orchestration", "Dynamics"],
        "typical_form": "Sonata, Concerto, Symphony",
        "instrumentation": ["Strings", "Woodwinds", "Brass", "Percussion"],
        "dynamics_range": "ppp to fff"
    },
    
    "electronic": {
        "tempo_range": (80, 160),
        "time_signature": "4/4",
        "key_characteristics": ["Repetitive beats", "Synths", "Sequencers"],
        "typical_rhythms": ["Four-on-the-floor", "Arpeggios", "Padding"],
        "instrumentation": ["Synthesizers", "Drum Machine", "Sampler"],
        "effects": ["Delay", "Reverb", "Filters"]
    },
    
    "hip_hop": {
        "tempo_range": (80, 130),
        "time_signature": "4/4",
        "key_characteristics": ["Sampled beats", "Rap vocals", "Boom-bap"],
        "instrumentation": ["Drums", "Bass", "Rap", "Chops/Samples"],
        "rhythm_patterns": ["Backbeat", "Syncopation", "Swing"],
        "note_emphasis": "Offbeat syncopation"
    },
    
    "funk": {
        "tempo_range": (95, 125),
        "time_signature": "4/4",
        "key_characteristics": ["Tight groove", "Syncopation", "Off-beat emphasis"],
        "typical_chords": ["I", "IV", "VII suspended"],
        "instrumentation": ["Bass (syncopated)", "Drums (tight)", "Guitar (rhythmic)", "Horns"],
        "rhythm_patterns": ["Clave patterns", "Shuffle feel", "Polyrhythmic"],
        "pocket": "Behind the beat slightly"
    },
    
    "soul": {
        "tempo_range": (70, 110),
        "time_signature": "4/4",
        "key_characteristics": ["Emotional vocals", "Bluesy feel", "Soulful phrasing"],
        "typical_chords": ["I", "IV", "V", "minor chords"],
        "instrumentation": ["Lead vocals", "Horn section", "Strings", "Bass", "Drums"],
        "emotional_quality": "Introspective, passionate",
        "typical_progressions": ["12-bar blues", "Soul changes"]
    },
    
    "country": {
        "tempo_range": (80, 140),
        "time_signature": "4/4",
        "key_characteristics": ["Storytelling", "Acoustic", "Twangy vocals"],
        "typical_chords": ["I", "IV", "V"],
        "instrumentation": ["Acoustic guitar", "Vocals", "Bass", "Drums", "Pedal steel"],
        "song_structure": "Verse-Chorus-Verse-Chorus-Bridge-Chorus",
        "lyrical_focus": "Narrative storytelling"
    },
    
    "latin": {
        "tempo_range": (90, 180),
        "time_signature": ["4/4", "3/4", "5/4"],
        "key_characteristics": ["Clave patterns", "Percussion", "Rhythmic complexity"],
        "typical_chords": ["I", "IV", "V", "minor"],
        "instrumentation": ["Percussion (congas, timbales)", "Piano", "Bass", "Horns", "Vocals"],
        "rhythm_foundation": "Clave-based (Son, Rumba, Mambo)",
        "percussion_critical": True
    },
    
    "reggae": {
        "tempo_range": (60, 100),
        "time_signature": "4/4",
        "key_characteristics": ["Off-beat emphasis", "One-drop rhythm", "Laid-back feel"],
        "typical_chords": ["I", "IV", "V"],
        "instrumentation": ["Bass (prominent)", "Drums", "Guitar (off-beat)", "Vocals", "Keys"],
        "groove_style": "One-drop drum pattern",
        "cultural_origins": "Jamaica",
        "lyrical_themes": ["Spiritual", "Social commentary", "Celebration"]
    }
}

# ==================== ADVANCED MUSICAL ANALYSIS ====================

HARMONIC_PROGRESSION_ANALYSIS = {
    "tension_levels": {
        "I": {"tension": 0, "description": "Home, resolved"},
        "V": {"tension": 8, "description": "Dominant, pulling back to I"},
        "IV": {"tension": 3, "description": "Subdominant, warm"},
        "VI": {"tension": 2, "description": "Relative minor, melancholic"},
        "II": {"tension": 5, "description": "Supertonic, moving forward"},
        "VII": {"tension": 9, "description": "Diminished, very tense"},
        "III": {"tension": 4, "description": "Mediant, minor tension"}
    },
    "tension_release_patterns": {
        "V-I": {"release_amount": 10, "feeling": "Perfect cadence, strong resolution"},
        "IV-I": {"release_amount": 5, "feeling": "Plagal cadence, soft resolution"},
        "I-V": {"release_amount": -8, "feeling": "Build tension, anticipation"},
        "II-V-I": {"release_amount": 12, "feeling": "Jazz progression, high resolution"},
        "VI-IV-I-V": {"release_amount": 8, "feeling": "Popular progression, emotional journey"}
    }
}

MELODIC_CONTOUR_ANALYSIS = {
    "shapes": {
        "ascending": {"character": "Hopeful, building, energetic", "usage": "Chorus builds, climaxes"},
        "descending": {"character": "Melancholic, resolution, falling", "usage": "Verses, resolution"},
        "arch": {"character": "Dramatic, peak in middle", "usage": "Main melodies, dramatic moments"},
        "valley": {"character": "Intimate, vulnerability", "usage": "Verses, intimate moments"},
        "wavy": {"character": "Natural, flowing", "usage": "Most songs, conversational"}
    },
    "range_classifications": {
        "narrow": {"range_semitones": (0, 6), "character": "Focused, limited expression"},
        "moderate": {"range_semitones": (6, 12), "character": "Balanced, natural"},
        "wide": {"range_semitones": (12, 24), "character": "Dramatic, virtuosic"},
        "extreme": {"range_semitones": (24, 50), "character": "Exceptional, genre-specific"}
    }
}

RHYTHM_PATTERN_RECOGNITION = {
    "common_patterns": {
        "straight_eighth": {"pattern": "1-2-3-4", "subdivision": 8, "feel": "Rock, pop"},
        "swing_eighth": {"pattern": "1-trip-let-2-trip-let", "subdivision": 12, "feel": "Jazz, blues"},
        "shuffle": {"pattern": "Long-short-long-short", "subdivision": 12, "feel": "Blues, funk"},
        "syncopation": {"pattern": "Off-beat emphasis", "subdivision": 16, "feel": "Funk, Latin"},
        "polyrhythm": {"pattern": "Conflicting divisions", "subdivision": "multiple", "feel": "Complex, experimental"},
        "triplet_feel": {"pattern": "Three-against-four", "subdivision": 12, "feel": "Waltz, ballad"},
        "backbeat": {"pattern": "Emphasis on 2-4", "subdivision": 8, "feel": "Pop, rock"}
    }
}

MICROTONALITY_KNOWLEDGE = {
    "quarter_tones": {
        "description": "Half of a semitone (50 cents)",
        "notation": "Half-sharp (↑) or half-flat (↓)",
        "usage": ["Middle Eastern music", "Contemporary classical", "Experimental"],
        "pitch_adjustment": 0.5  # semitones
    },
    "eighth_tones": {
        "description": "Quarter of a semitone (25 cents)",
        "notation": "Quarter-flat (ꜛ) or quarter-sharp (ꜜ)",
        "usage": ["Indian classical", "Persian music", "Microtonal composition"],
        "pitch_adjustment": 0.25  # semitones
    },
    "indian_raga_notes": {
        "natural_notes": ["Sa", "Re", "Ga", "Ma", "Pa", "Dha", "Ni"],
        "variants": {
            "Re": ["Komal Re (flat)", "Shuddha Re (natural)", "Tivra Re (sharp-ish)"],
            "Ga": ["Komal Ga (flat)", "Shuddha Ga (natural)"],
            "Ma": ["Shuddha Ma (natural)", "Tivra Ma (sharp)"],
            "Dha": ["Komal Dha (flat)", "Shuddha Dha (natural)"],
            "Ni": ["Komal Ni (flat)", "Shuddha Ni (natural)"]
        },
        "typical_frequency_offset": (0, 1)  # semitones, varies by raga
    }
}

SPECTRAL_ANALYSIS_ALIGNMENT = {
    "harmonic_series_alignment": {
        "fundamental": {"ratio": "1:1", "cents": 0, "harmonic_number": 1},
        "octave": {"ratio": "2:1", "cents": 1200, "harmonic_number": 2},
        "perfect_fifth": {"ratio": "3:2", "cents": 702, "harmonic_number": 3},
        "perfect_fourth": {"ratio": "4:3", "cents": 498, "harmonic_number": 4},
        "major_third": {"ratio": "5:4", "cents": 386, "harmonic_number": 5},
        "minor_third": {"ratio": "6:5", "cents": 316, "harmonic_number": 6}
    },
    "timbral_brightness": {
        "dark": {"harmonic_content": "1-6", "spectral_centroid_hz": (500, 1500)},
        "warm": {"harmonic_content": "1-10", "spectral_centroid_hz": (1500, 3000)},
        "bright": {"harmonic_content": "1-15", "spectral_centroid_hz": (3000, 8000)},
        "brilliant": {"harmonic_content": "1-20+", "spectral_centroid_hz": (8000, 20000)}
    }
}

COMPOSITION_SUGGESTION_ENGINE = {
    "starter_progressions": {
        "pop": {
            "simple": ["I-V-VI-IV", "I-IV-V-I"],
            "emotional": ["I-VI-IV-V", "VI-IV-I-V"],
            "modern": ["I-V-VI-IV", "I-IV-I-V"]
        },
        "jazz": {
            "standard": ["II-V-I", "I-VI-II-V"],
            "blues": ["I-IV-V-I (12-bar)"],
            "modern": ["I-III-VI-II"]
        },
        "classical": {
            "sonata": ["I-V", "V-I"],
            "rondo": ["A-B-A-C-A"],
            "theme_and_variations": ["Theme with variations"]
        }
    },
    "melodic_construction": {
        "singability": {
            "rules": [
                "Keep interval jumps ≤ octave",
                "Balance ascending/descending motion",
                "Use stepwise motion for singability",
                "Place highest notes on strong beats"
            ]
        },
        "phrase_structure": {
            "typical_length": 4,  # bars
            "question_answer": "First phrase rising, second phrase resolving",
            "motivic_development": "Repeat with variations"
        }
    }
}

EAR_TRAINING_EXERCISES = {
    "interval_recognition": {
        "levels": ["beginner", "intermediate", "advanced"],
        "exercises": {
            "ascending": "Identify intervals going up",
            "descending": "Identify intervals going down",
            "harmonic": "Identify simultaneous intervals",
            "melodic": "Identify intervals in melody"
        }
    },
    "rhythm_recognition": {
        "levels": ["beginner", "intermediate", "advanced"],
        "exercises": {
            "simple": "Tap along with simple patterns",
            "syncopated": "Identify syncopated rhythms",
            "polyrhythmic": "Recognize layered rhythms"
        }
    },
    "chord_recognition": {
        "levels": ["beginner", "intermediate", "advanced"],
        "exercises": {
            "major_minor": "Distinguish major from minor",
            "seventh_chords": "Identify various seventh chord types",
            "extended": "Recognize extended chord colors"
        }
    }
}

# ==================== REAL-TIME GENRE DETECTION ====================

GENRE_DETECTION_RULES = {
    "tempo_ranges": {
        "very_slow": (40, 70),
        "slow": (70, 90),
        "moderate": (90, 120),
        "fast": (120, 160),
        "very_fast": (160, 200)
    },
    "instrumentation_indicators": {
        "acoustic": ["acoustic_guitar", "upright_bass", "acoustic_drums", "strings"],
        "electronic": ["synth", "drum_machine", "sampler", "sequencer"],
        "percussive": ["percussion", "drums", "timpani", "vibraphone"],
        "melodic": ["piano", "guitar", "horn", "strings"],
        "vocal_focus": ["vocals_lead", "vocals_harmony", "vocals_background"]
    },
    "harmonic_complexity_levels": {
        "simple": 1,  # Diatonic only
        "moderate": 2,  # Some chromatic
        "complex": 3,  # Extended chords
        "very_complex": 4  # Modulation, poly-tonality
    },
    "rhythm_characteristics": {
        "straight": "Even grid, no swing",
        "swing": "Triplet feel, jazz-like",
        "syncopated": "Offbeat emphasis",
        "polyrhythmic": "Multiple rhythm layers"
    }
}

# ==================== HARMONIC PROGRESSION VALIDATOR ====================

HARMONIC_VALIDATION_RULES = {
    "valid_progressions": [
        "I-V-vi-IV",  # Very common pop
        "I-IV-V",  # Classic progression
        "vi-IV-I-V",  # Sad progression variant
        "I-vi-IV-V",  # Pop/rock standard
        "ii-V-I",  # Jazz standard (dominant movement)
        "I-IV-vi-V",  # Another variation
        "iii-vi-ii-V",  # Jazz extended
        "IV-I-V-vi",  # Modern variation
    ],
    "tension_progression": {
        "I": 0,  # Root - stable
        "ii": 3,  # Supertonic - mild tension
        "iii": 2,  # Mediant - mild
        "IV": 4,  # Subdominant - tension
        "V": 8,  # Dominant - high tension (needs resolution)
        "vi": 2,  # Relative minor - mild
        "vii°": 9,  # Leading tone - maximum tension
    },
    "resolution_rules": {
        "V": "I",  # Dominant resolves to tonic
        "vii°": "I",  # Leading tone to tonic
        "IV": "I",  # Can resolve down
        "ii": "V",  # Leads to dominant
    },
    "forbidden_progressions": [
        # Rare/awkward movements
        "V-vi",  # Deceptive cadence (not always bad)
        "I-ii",  # Weak start
        "IV-iii",  # Awkward
    ]
}

# ==================== VISUAL EAR TRAINING SYSTEM ====================

VISUAL_EAR_TRAINING = {
    "interval_visualization": {
        "unison": {"semitones": 0, "ratio": 1.0, "visual": "█", "description": "Same note"},
        "minor_second": {"semitones": 1, "ratio": 16/15, "visual": "▁", "description": "Half step"},
        "major_second": {"semitones": 2, "ratio": 9/8, "visual": "▂", "description": "Whole step"},
        "minor_third": {"semitones": 3, "ratio": 6/5, "visual": "▃", "description": "Small third"},
        "major_third": {"semitones": 4, "ratio": 5/4, "visual": "▄", "description": "Big third"},
        "perfect_fourth": {"semitones": 5, "ratio": 4/3, "visual": "▅", "description": "Perfect fourth"},
        "tritone": {"semitones": 6, "ratio": 45/32, "visual": "▆", "description": "Devil's interval"},
        "perfect_fifth": {"semitones": 7, "ratio": 3/2, "visual": "▇", "description": "Perfect fifth"},
        "minor_sixth": {"semitones": 8, "ratio": 8/5, "visual": "█", "description": "Small sixth"},
        "major_sixth": {"semitones": 9, "ratio": 5/3, "visual": "█", "description": "Big sixth"},
        "minor_seventh": {"semitones": 10, "ratio": 9/5, "visual": "█", "description": "Small seventh"},
        "major_seventh": {"semitones": 11, "ratio": 15/8, "visual": "█", "description": "Big seventh"},
        "octave": {"semitones": 12, "ratio": 2.0, "visual": "█", "description": "Octave"},
    },
    "exercise_types": {
        "interval_singing": {
            "steps": [
                "Hear first note (reference)",
                "Hear second note",
                "Sing interval",
                "Compare with original",
                "Adjust and retry"
            ],
            "feedback": "Pitch detection and visualization"
        },
        "chord_identification": {
            "steps": [
                "Hear chord",
                "Select type",
                "Identify root",
                "Score points"
            ],
            "feedback": "Real-time feedback with visual indicator"
        },
        "rhythm_tapping": {
            "steps": [
                "See rhythm pattern",
                "Tap tempo",
                "Tap pattern",
                "Compare accuracy"
            ],
            "feedback": "Timing deviation display"
        }
    }
}

# ==================== PRODUCTION CHECKLIST GENERATOR ====================

PRODUCTION_CHECKLIST = {
    "pre_production": {
        "planning": [
            "Define project genre and style",
            "Set target BPM and time signature",
            "Plan track count and arrangement",
            "Create reference playlists"
        ],
        "setup": [
            "Configure audio interface",
            "Set buffer size and latency",
            "Create DAW template",
            "Organize plugin chains"
        ]
    },
    "production": {
        "arrangement": [
            "Record/create intro section",
            "Build verse section",
            "Create chorus/hook",
            "Develop bridge/transition",
            "Plan breakdown"
        ],
        "recording": [
            "Set input levels (gain staging)",
            "Record vocals/instruments",
            "Organize takes",
            "Create backing vocals"
        ],
        "editing": [
            "Comp vocals",
            "Time-align drums",
            "Fix timing issues",
            "Crossfade edits"
        ]
    },
    "mixing": {
        "setup": [
            "Color-code tracks",
            "Organize into groups",
            "Create bus structure",
            "Set up aux sends"
        ],
        "levels": [
            "Set track levels (-6dB headroom)",
            "Balance drums",
            "Balance melody vs accompaniment",
            "Check mono compatibility"
        ],
        "eq": [
            "High-pass filter tracks",
            "Fix mud (200-500Hz)",
            "Add presence (2-4kHz)",
            "Manage clashing frequencies"
        ],
        "dynamics": [
            "Compress drums",
            "Compress vocals",
            "Gate noise sources",
            "Add sidechain if needed"
        ],
        "effects": [
            "Add reverb (buses)",
            "Add delay (tempo-locked)",
            "Add saturation (tone)",
            "Add modulation effects"
        ],
        "stereo": [
            "Pan instruments (width)",
            "Create stereo effects",
            "Check phase coherence",
            "Set width percent"
        ]
    },
    "mastering": {
        "preparation": [
            "Bounce stereo mix",
            "Leave headroom (3-6dB)",
            "Check loudness",
            "Compare with references"
        ],
        "mastering_chain": [
            "Linear phase EQ",
            "Multiband compression",
            "Limiting (prevent clipping)",
            "Metering/analysis"
        ],
        "optimization": [
            "Optimize for streaming",
            "Create radio edit",
            "Generate stems",
            "Archive project"
        ]
    }
}

# ==================== EXTENDED INSTRUMENTS DATABASE ====================

EXTENDED_INSTRUMENTS_DATABASE = {
    "drums": {
        "kick": {
            "frequency_range": (20, 250),
            "typical_frequencies": [60, 80, 100],
            "characteristics": "Deep low-end punch",
            "processing": ["EQ (sub-bass)", "Compression", "Saturation"],
            "mixing_tips": "High-pass at 20Hz, compress 4:1 ratio"
        },
        "snare": {
            "frequency_range": (100, 8000),
            "typical_frequencies": [200, 5000],
            "characteristics": "Sharp attack, sustained ring",
            "processing": ["Gate", "Compression", "Reverb"],
            "mixing_tips": "Gate at -40dB, compress 2:1"
        },
        "hihat_closed": {
            "frequency_range": (2000, 12000),
            "typical_frequencies": [8000],
            "characteristics": "Bright, shimmering",
            "processing": ["EQ (remove mud)", "Mild compression"],
            "mixing_tips": "Cut 2-4kHz, peak 8kHz"
        },
        "tom": {
            "frequency_range": (80, 3000),
            "typical_frequencies": [200, 1000],
            "characteristics": "Pitched, articulate",
            "processing": ["Gate", "EQ"],
            "mixing_tips": "Gate 30ms attack, pan for width"
        }
    },
    "bass": {
        "kick_bass": {
            "frequency_range": (20, 200),
            "typical_frequencies": [50, 100],
            "characteristics": "Deep, punchy foundation",
            "processing": ["EQ", "Compression", "Saturation"],
            "mixing_tips": "Lock to kick, use sidechain compression"
        },
        "electric_bass": {
            "frequency_range": (40, 2000),
            "typical_frequencies": [100, 600],
            "characteristics": "Warm, musical low-end",
            "processing": ["Compression", "Saturation"],
            "mixing_tips": "Compress 3:1, add harmonics with saturation"
        },
        "synth_bass": {
            "frequency_range": (30, 5000),
            "typical_frequencies": [80, 300],
            "characteristics": "Variable, can be bright or dark",
            "processing": ["EQ", "Filter", "Effects"],
            "mixing_tips": "Use filter sweep for movement"
        }
    },
    "guitars": {
        "acoustic_guitar": {
            "frequency_range": (80, 8000),
            "typical_frequencies": [200, 1000, 5000],
            "characteristics": "Warm, organic, sustaining",
            "processing": ["EQ", "Compression"],
            "mixing_tips": "Reduce mud at 200Hz, brighten at 8kHz"
        },
        "electric_guitar_clean": {
            "frequency_range": (100, 6000),
            "typical_frequencies": [400, 2000],
            "characteristics": "Bright, articulate",
            "processing": ["Compression", "Reverb"],
            "mixing_tips": "Compress 2:1, add room reverb"
        },
        "electric_guitar_distorted": {
            "frequency_range": (100, 4000),
            "typical_frequencies": [250, 1000],
            "characteristics": "Thick, aggressive",
            "processing": ["EQ (remove ice)", "Saturation"],
            "mixing_tips": "Cut 2kHz for thickness, 7kHz for harshness"
        }
    },
    "keyboards": {
        "piano": {
            "frequency_range": (27, 4000),
            "typical_frequencies": [300, 1000, 2000],
            "characteristics": "Warm, dynamic, percussive attack",
            "processing": ["Compression", "Reverb"],
            "mixing_tips": "Gentle compression 2:1, natural reverb"
        },
        "synth_pad": {
            "frequency_range": (30, 12000),
            "typical_frequencies": [100, 2000, 8000],
            "characteristics": "Lush, atmospheric, evolving",
            "processing": ["EQ", "Reverb", "Chorus"],
            "mixing_tips": "EQ for presence, add space with reverb"
        },
        "organ": {
            "frequency_range": (50, 8000),
            "typical_frequencies": [80, 500, 2000],
            "characteristics": "Full, harmonic-rich",
            "processing": ["Compression", "Reverb", "Saturation"],
            "mixing_tips": "Compress to control dynamics, add saturation"
        }
    },
    "vocals": {
        "lead_vocals": {
            "frequency_range": (50, 3500),
            "typical_frequencies": [200, 1000, 2000],
            "characteristics": "Primary focus, expressive",
            "processing": ["Compression", "EQ", "De-esser", "Reverb"],
            "mixing_tips": "Compress 4:1 ratio, de-ess at 7kHz, add presence"
        },
        "harmony_vocals": {
            "frequency_range": (60, 3000),
            "typical_frequencies": [300, 1200],
            "characteristics": "Supporting, blended",
            "processing": ["EQ", "Compression", "Reverb"],
            "mixing_tips": "Blend with leads, use same reverb for cohesion"
        },
        "background_vocals": {
            "frequency_range": (80, 5000),
            "typical_frequencies": [400, 2000],
            "characteristics": "Textural, atmospheric",
            "processing": ["EQ", "Compression", "Effects"],
            "mixing_tips": "Can be more heavily processed, add effects"
        }
    },
    "strings": {
        "violin": {
            "frequency_range": (196, 3000),
            "typical_frequencies": [400, 800, 2000],
            "characteristics": "Bright, piercing, expressive",
            "processing": ["Compression", "Reverb"],
            "mixing_tips": "Watch for harshness at 2-3kHz, add space"
        },
        "cello": {
            "frequency_range": (65, 1500),
            "typical_frequencies": [200, 600],
            "characteristics": "Warm, woody, sustaining",
            "processing": ["Compression", "Reverb"],
            "mixing_tips": "Warm compression, natural reverb for size"
        },
        "strings_section": {
            "frequency_range": (40, 3500),
            "typical_frequencies": [300, 1000, 2000],
            "characteristics": "Lush, full, layered",
            "processing": ["EQ", "Compression", "Reverb"],
            "mixing_tips": "Cut 250-500Hz mud, add presence, plenty of reverb"
        }
    },
    "brass": {
        "trumpet": {
            "frequency_range": (165, 4000),
            "typical_frequencies": [800, 2000],
            "characteristics": "Bright, piercing, articulate",
            "processing": ["EQ", "Compression"],
            "mixing_tips": "Cut harshness at 3-4kHz, compress gently"
        },
        "trombone": {
            "frequency_range": (70, 2500),
            "typical_frequencies": [300, 1000],
            "characteristics": "Warm, woody, vocal-like",
            "processing": ["Compression", "EQ"],
            "mixing_tips": "Warm tone, moderate compression"
        },
        "saxophone": {
            "frequency_range": (80, 3000),
            "typical_frequencies": [400, 1500],
            "characteristics": "Smooth, warm, expressive",
            "processing": ["Compression", "Saturation"],
            "mixing_tips": "Add body with saturation, smooth compression"
        }
    }
}

# ==================== TRAINING DATA ====================

class CodetteTrainingData:
    """Complete training dataset for Codette AI"""
    
    def __init__(self):
        self.system_knowledge = SYSTEM_ARCHITECTURE
        self.audio_standards = MIXING_STANDARDS
        self.plugin_knowledge = PLUGIN_CATEGORIES
        self.analysis_frameworks = ANALYSIS_CONTEXTS
        self.decision_trees = {
            "gain_staging": GAIN_STAGING_DECISIONS,
            "frequency_balance": FREQUENCY_BALANCE_DECISIONS
        }
        self.plugin_suggestions = PLUGIN_SUGGESTIONS
        self.musical_knowledge = MUSICAL_KNOWLEDGE
        self.tempo_knowledge = TEMPO_KNOWLEDGE
        self.music_notation = MUSIC_NOTATION
        self.genre_knowledge = GENRE_KNOWLEDGE
        # Extended analysis modules
        self.harmonic_analysis = HARMONIC_PROGRESSION_ANALYSIS
        # New advanced features
        self.genre_detection_rules = GENRE_DETECTION_RULES
        self.harmonic_validation_rules = HARMONIC_VALIDATION_RULES
        self.visual_ear_training = VISUAL_EAR_TRAINING
        self.production_checklist = PRODUCTION_CHECKLIST
        self.instruments_database = EXTENDED_INSTRUMENTS_DATABASE
        self.melodic_analysis = MELODIC_CONTOUR_ANALYSIS
        self.rhythm_patterns = RHYTHM_PATTERN_RECOGNITION
        self.microtonality = MICROTONALITY_KNOWLEDGE
        self.spectral_analysis = SPECTRAL_ANALYSIS_ALIGNMENT
        self.composition_engine = COMPOSITION_SUGGESTION_ENGINE
        self.ear_training = EAR_TRAINING_EXERCISES
    
    def get_context_for_analysis(self, analysis_type: str) -> Dict[str, Any]:
        """Get training context for specific analysis type"""
        return self.analysis_frameworks.get(
            analysis_type, 
            self.analysis_frameworks["session"]
        )
    
    def get_plugin_suggestion(self, track_type: str, current_plugins: List[str]) -> List[Dict]:
        """Get plugin suggestions based on track type"""
        suggestions = self.plugin_suggestions.get(track_type, [])
        # Filter out already applied plugins
        return [s for s in suggestions if s.get("suggestion") not in current_plugins]
    
    def get_decision_tree(self, metric_name: str, metric_value: float) -> Dict[str, Any]:
        """Get decision tree recommendations based on metric"""
        for tree_name, tree in self.decision_trees.items():
            for decision_key, decision in tree.items():
                # Evaluate condition (simplified)
                if "peak" in decision_key and metric_value > 0:
                    return decision
        return {"actions": ["Check audio levels"], "priority": "normal"}
    
    def get_mixing_standard(self, aspect: str) -> Dict[str, Any]:
        """Get standard values for mixing aspects"""
        if aspect == "levels":
            return self.audio_standards["reference_levels"]
        elif aspect == "frequencies":
            return self.audio_standards["frequency_targets"]
        elif aspect == "gain":
            return self.audio_standards["gain_staging"]
        elif aspect == "compression":
            return self.audio_standards["compression_ranges"]
        return {}
    
    def evaluate_session_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate overall session health"""
        health_score = 100
        recommendations = []
        
        # Check levels
        if metrics.get("peak_level", -100) > 0:
            health_score -= 25
            recommendations.append("Reduce peak levels to prevent clipping")
        elif metrics.get("peak_level", -60) < -24:
            health_score -= 10
            recommendations.append("Increase input levels for better signal")
        
        # Check headroom
        if metrics.get("headroom", -3) < -3:
            health_score -= 20
            recommendations.append("Maintain -3dB headroom on master")
        
        # Check frequency balance
        if metrics.get("frequency_balance"):
            fb = metrics["frequency_balance"]
            if fb.get("low", 0) > 0.7:
                health_score -= 15
                recommendations.append("Reduce low-end energy")
        
        return {
            "health_score": max(0, health_score),
            "recommendations": recommendations,
            "critical_issues": len([r for r in recommendations if "prevent" in r.lower()])
        }
    
    # ==================== MUSICAL KNOWLEDGE METHODS ====================
    
    def get_tempo_info(self, tempo_marking: str) -> Dict[str, Any]:
        """Get BPM range for tempo marking"""
        tempo_info = self.tempo_knowledge["tempo_markings"].get(tempo_marking.lower(), {})
        return {
            "marking": tempo_marking,
            "bpm_range": tempo_info,
            "description": f"{tempo_marking} tempo"
        }
    
    def get_time_signature_info(self, time_sig: str) -> Dict[str, Any]:
        """Get information about time signature"""
        for ts_type, signatures in self.tempo_knowledge["time_signatures"].items():
            if time_sig in signatures:
                sig_info = signatures[time_sig]
                return {
                    "time_signature": time_sig,
                    "beats": sig_info["beats"],
                    "note_value": sig_info["note_value"],
                    "feel": sig_info["feel"],
                    "type": ts_type
                }
        return {}
    
    def get_scale_info(self, scale_name: str) -> Dict[str, Any]:
        """Get scale degree information"""
        scale = self.musical_knowledge["scales"].get(scale_name.lower(), [])
        return {
            "scale": scale_name,
            "degrees": scale,
            "mode": self.musical_knowledge["scales"].get("modes", {}).get(scale_name.lower())
        }
    
    def get_note_frequency_range(self) -> Dict[str, tuple]:
        """Get frequency ranges for note ranges"""
        return self.musical_knowledge["notes"]["octave_range"]
    
    def get_chord_info(self, chord_type: str) -> Dict[str, Any]:
        """Get chord composition"""
        for chord_family, chords in self.musical_knowledge["chords"].items():
            if chord_type in chords:
                return {
                    "chord": chord_type,
                    "degrees": chords[chord_type],
                    "family": chord_family
                }
        return {}
    
    def get_delay_sync_time(self, bpm: int, note_division: str) -> float:
        """Calculate delay sync time in milliseconds"""
        # Formula: 60000 / BPM / (beat_division)
        note_values = self.tempo_knowledge["note_values"]
        if note_division in note_values:
            beat_value = note_values[note_division]
            return (60000 / bpm) / beat_value
        return 0.0
    
    def get_genre_knowledge(self, genre: str) -> Dict[str, Any]:
        """Get genre-specific musical knowledge"""
        return self.genre_knowledge.get(genre.lower(), {})
    
    def get_chromatic_scale(self) -> List[str]:
        """Get chromatic scale (all 12 notes)"""
        return self.musical_knowledge["notes"]["chromatic_scale"]
    
    def get_dynamic_mark(self, marking: str) -> str:
        """Get description of dynamic mark"""
        return self.music_notation["dynamics"].get(marking, "Unknown dynamic")
    
    def get_articulation_info(self, articulation: str) -> str:
        """Get articulation description"""
        return self.music_notation["articulation"].get(articulation, "Unknown articulation")
    
    def get_tuning_system_info(self, system: str) -> Dict[str, Any]:
        """Get tuning system information"""
        return self.musical_knowledge["tuning_systems"].get(system, {})
    
    def calculate_interval_frequency_ratio(self, interval_name: str) -> float:
        """Get frequency ratio for interval"""
        return self.musical_knowledge["intervals"].get(interval_name, 1.0)
    
    # ==================== EXTENDED GENRES ====================
    
    def get_extended_genre_knowledge(self, genre: str) -> Dict[str, Any]:
        """Get knowledge for extended genres (Funk, Soul, Country, Latin, Reggae)"""
        extended_genres = ["funk", "soul", "country", "latin", "reggae"]
        if genre.lower() in extended_genres:
            return self.genre_knowledge.get(genre.lower(), {})
        return {}
    
    def get_all_genres(self) -> List[str]:
        """Get list of all available genres"""
        return list(self.genre_knowledge.keys())
    
    # ==================== HARMONIC PROGRESSION ANALYSIS ====================
    
    def analyze_harmonic_progression(self, chord_sequence: List[str]) -> Dict[str, Any]:
        """Analyze harmonic progression for tension and release"""
        tension_data = HARMONIC_PROGRESSION_ANALYSIS["tension_levels"]
        progression_patterns = HARMONIC_PROGRESSION_ANALYSIS["tension_release_patterns"]
        
        analysis = {
            "chord_sequence": chord_sequence,
            "tension_profile": [],
            "tension_release_patterns_found": []
        }
        
        # Analyze each chord's tension
        for chord in chord_sequence:
            if chord in tension_data:
                analysis["tension_profile"].append({
                    "chord": chord,
                    "tension": tension_data[chord]["tension"],
                    "description": tension_data[chord]["description"]
                })
        
        # Find tension/release patterns
        for i in range(len(chord_sequence) - 1):
            pattern_key = f"{chord_sequence[i]}-{chord_sequence[i+1]}"
            if pattern_key in progression_patterns:
                analysis["tension_release_patterns_found"].append({
                    "pattern": pattern_key,
                    "release_amount": progression_patterns[pattern_key]["release_amount"],
                    "feeling": progression_patterns[pattern_key]["feeling"]
                })
        
        return analysis
    
    # ==================== MELODIC CONTOUR ANALYSIS ====================
    
    def analyze_melodic_contour(self, note_sequence: List[str]) -> Dict[str, Any]:
        """Analyze melodic contour for shape and range"""
        if not note_sequence or len(note_sequence) < 2:
            return {"error": "Need at least 2 notes"}
        
        # Determine contour direction
        note_values = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
        note_nums = [note_values.get(n[0], 0) for n in note_sequence]
        
        ascending = sum(1 for i in range(len(note_nums)-1) if note_nums[i+1] > note_nums[i])
        descending = sum(1 for i in range(len(note_nums)-1) if note_nums[i+1] < note_nums[i])
        
        if ascending > descending:
            shape = "ascending"
        elif descending > ascending:
            shape = "descending"
        else:
            shape = "wavy"
        
        # Calculate range in semitones
        range_semitones = max(note_nums) - min(note_nums)
        
        shape_info = MELODIC_CONTOUR_ANALYSIS["shapes"].get(shape, {})
        range_class = None
        for rc, info in MELODIC_CONTOUR_ANALYSIS["range_classifications"].items():
            if info["range_semitones"][0] <= range_semitones <= info["range_semitones"][1]:
                range_class = rc
                break
        
        return {
            "shape": shape,
            "shape_character": shape_info.get("character"),
            "range_semitones": range_semitones,
            "range_classification": range_class,
            "ascending_moves": ascending,
            "descending_moves": descending
        }
    
    # ==================== RHYTHM PATTERN RECOGNITION ====================
    
    def identify_rhythm_pattern(self, pattern_name: str) -> Dict[str, Any]:
        """Get information about a specific rhythm pattern"""
        return RHYTHM_PATTERN_RECOGNITION["common_patterns"].get(pattern_name, {})
    
    def list_rhythm_patterns(self) -> List[str]:
        """Get list of all recognized rhythm patterns"""
        return list(RHYTHM_PATTERN_RECOGNITION["common_patterns"].keys())
    
    # ==================== MICROTONALITY ====================
    
    def get_microtone_info(self, microtone_type: str) -> Dict[str, Any]:
        """Get information about microtonal divisions"""
        if microtone_type == "quarter_tones":
            return MICROTONALITY_KNOWLEDGE["quarter_tones"]
        elif microtone_type == "eighth_tones":
            return MICROTONALITY_KNOWLEDGE["eighth_tones"]
        elif microtone_type == "indian_raga":
            return MICROTONALITY_KNOWLEDGE["indian_raga_notes"]
        return {}
    
    def get_raga_note_variants(self, note_name: str) -> List[str]:
        """Get note variants available in Indian ragas"""
        raga_notes = MICROTONALITY_KNOWLEDGE["indian_raga_notes"]
        if "variants" in raga_notes and note_name in raga_notes["variants"]:
            return raga_notes["variants"][note_name]
        return []
    
    # ==================== SPECTRAL ANALYSIS ====================
    
    def get_harmonic_series_info(self) -> Dict[str, Any]:
        """Get natural harmonic series alignment"""
        return SPECTRAL_ANALYSIS_ALIGNMENT["harmonic_series_alignment"]
    
    def get_timbral_brightness_classification(self, brightness_level: str) -> Dict[str, Any]:
        """Get spectral characteristics for timbral brightness"""
        return SPECTRAL_ANALYSIS_ALIGNMENT["timbral_brightness"].get(brightness_level, {})
    
    # ==================== COMPOSITION SUGGESTIONS ====================
    
    def suggest_chord_progressions(self, genre: str, style: str = "simple") -> List[str]:
        """Get chord progression suggestions for a genre"""
        starters = COMPOSITION_SUGGESTION_ENGINE["starter_progressions"]
        genre_lower = genre.lower()
        
        if genre_lower in starters:
            if style in starters[genre_lower]:
                return starters[genre_lower][style]
            else:
                # Return all progressions if style not specified
                all_progressions = []
                for progressions in starters[genre_lower].values():
                    all_progressions.extend(progressions)
                return all_progressions
        return []
    
    def get_melodic_construction_rules(self) -> Dict[str, Any]:
        """Get rules for singability and melodic construction"""
        return COMPOSITION_SUGGESTION_ENGINE["melodic_construction"]
    
    # ==================== EAR TRAINING ====================
    
    def get_ear_training_exercise(self, exercise_type: str, level: str = "beginner") -> Dict[str, Any]:
        """Get ear training exercise"""
        exercises = EAR_TRAINING_EXERCISES
        
        if exercise_type in exercises and level in exercises[exercise_type].get("levels", []):
            return {
                "type": exercise_type,
                "level": level,
                "exercises": exercises[exercise_type]["exercises"]
            }
        return {"error": f"Exercise type '{exercise_type}' or level '{level}' not found"}
    
    def list_ear_training_types(self) -> List[str]:
        """List available ear training exercise types"""
        return list(EAR_TRAINING_EXERCISES.keys())

    # ==================== NEW ADVANCED FEATURES ====================

    def detect_genre_candidates(self, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Real-time genre detection based on audio metadata"""
        candidates = []
        tempo = metadata.get("tempo", 0)
        
        for genre, genre_data in self.genre_knowledge.items():
            min_bpm, max_bpm = genre_data.get("bpm_range", (0, 999))
            match_score = 0
            
            # Check tempo match
            if min_bpm <= tempo <= max_bpm:
                match_score += 30
            elif min_bpm - 10 <= tempo <= max_bpm + 10:
                match_score += 15
            
            # Check instrumentation match if available
            track_types = metadata.get("track_types", [])
            if track_types:
                genre_instruments = genre_data.get("instruments", [])
                matches = sum(1 for t in track_types if any(i in t.lower() for i in genre_instruments))
                match_score += min(40, matches * 10)
            
            # Check harmonic complexity
            harmonic_complexity = metadata.get("harmonic_complexity", 0)
            if 0 <= harmonic_complexity <= 4:
                match_score += 20
            
            if match_score > 20:
                candidates.append({
                    "genre": genre,
                    "score": match_score,
                    "confidence": min(100, match_score),
                    "characteristics": genre_data.get("characteristics", "")
                })
        
        return sorted(candidates, key=lambda x: x["score"], reverse=True)

    def validate_harmonic_progression(self, chord_sequence: List[str]) -> Dict[str, Any]:
        """Validate a chord progression against music theory rules"""
        validation_result = {
            "valid": True,
            "tension_map": [],
            "warnings": [],
            "suggestions": [],
            "score": 100
        }
        
        rules = self.harmonic_validation_rules
        valid_progressions = rules.get("valid_progressions", [])
        tension_profile = rules.get("tension_progression", {})
        forbidden = rules.get("forbidden_progressions", [])
        
        # Check chord sequence format
        progression_str = "-".join(chord_sequence)
        
        # Build tension map
        for chord in chord_sequence:
            tension = tension_profile.get(chord, 5)
            validation_result["tension_map"].append({
                "chord": chord,
                "tension": tension
            })
        
        # Check if progression matches known patterns
        found_match = False
        for valid_prog in valid_progressions:
            if progression_str in valid_prog or valid_prog in progression_str:
                found_match = True
                break
        
        if not found_match:
            validation_result["warnings"].append("Non-standard progression (may be intentional)")
            validation_result["score"] -= 15
        
        # Check for forbidden progressions
        for forbidden_prog in forbidden:
            if forbidden_prog in progression_str:
                validation_result["warnings"].append(f"Potentially problematic: {forbidden_prog}")
                validation_result["score"] -= 10
        
        # Suggest improvements
        if len(chord_sequence) >= 2:
            last_chord = chord_sequence[-1]
            if last_chord == "V":
                validation_result["suggestions"].append("Consider resolving V to I")
        
        return validation_result

    def get_ear_training_visual(self, interval_name: str) -> Dict[str, Any]:
        """Get visual representation for ear training"""
        intervals = self.visual_ear_training.get("interval_visualization", {})
        return intervals.get(interval_name, {
            "semitones": 0,
            "ratio": 1.0,
            "visual": "?",
            "description": "Unknown interval"
        })

    def get_production_checklist(self, stage: str = None) -> Dict[str, Any]:
        """Get production workflow checklist"""
        checklist = self.production_checklist
        
        if stage and stage in checklist:
            return {"stage": stage, "tasks": checklist[stage]}
        
        return checklist

    def get_instrument_info(self, instrument_category: str, instrument_name: str) -> Dict[str, Any]:
        """Get detailed information about an instrument"""
        instruments = self.instruments_database
        
        if instrument_category in instruments:
            category = instruments[instrument_category]
            if instrument_name in category:
                return {
                    "name": instrument_name,
                    "category": instrument_category,
                    **category[instrument_name]
                }
        
        return {"error": f"Instrument {instrument_name} not found in {instrument_category}"}

    def get_all_instruments(self) -> Dict[str, List[str]]:
        """Get list of all available instruments by category"""
        result = {}
        for category, instruments in self.instruments_database.items():
            result[category] = list(instruments.keys())
        return result

    def get_mixing_tips_for_instrument(self, instrument_category: str, instrument_name: str) -> str:
        """Get specific mixing tips for an instrument"""
        info = self.get_instrument_info(instrument_category, instrument_name)
        return info.get("mixing_tips", "No tips available")

    def suggest_processing_chain(self, instrument_category: str, instrument_name: str) -> List[str]:
        """Suggest a processing chain for an instrument"""
        info = self.get_instrument_info(instrument_category, instrument_name)
        return info.get("processing", [])

    def get_frequency_range(self, instrument_category: str, instrument_name: str) -> tuple:
        """Get frequency range for an instrument"""
        info = self.get_instrument_info(instrument_category, instrument_name)
        return info.get("frequency_range", (20, 20000))

    def get_typical_frequencies(self, instrument_category: str, instrument_name: str) -> List[int]:
        """Get typical emphasis frequencies for an instrument"""
        info = self.get_instrument_info(instrument_category, instrument_name)
        return info.get("typical_frequencies", [])



# ==================== EXPORT ====================

# Create global instance
training_data = CodetteTrainingData()

def get_training_context() -> Dict[str, Any]:
    """Get complete training context including musical knowledge"""
    return {
        "system": training_data.system_knowledge,
        "standards": training_data.audio_standards,
        "plugins": training_data.plugin_knowledge,
        "analysis": training_data.analysis_frameworks,
        "decisions": training_data.decision_trees,
        "suggestions": training_data.plugin_suggestions,
        "music": training_data.musical_knowledge,
        "notation": training_data.music_notation,
        "tempo": training_data.tempo_knowledge,
        "genres": training_data.genre_knowledge,
        "genre_detection": training_data.genre_detection_rules,
        "harmonic_validation": training_data.harmonic_validation_rules,
        "ear_training_visual": training_data.visual_ear_training,
        "production_checklist": training_data.production_checklist,
        "instruments": training_data.instruments_database,
    }
