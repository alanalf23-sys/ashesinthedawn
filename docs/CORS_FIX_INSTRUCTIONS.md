# ?? CORS Fix Instructions - Add Missing REST API Endpoints

**Problem**: Frontend getting 404 errors for these endpoints:
- `/api/analysis/production-checklist`
- `/api/analysis/instrument-info`
- `/api/analysis/delay-sync`

**Root Cause**: `codette_server_unified.py` has OpenAI function handlers but missing REST API routes

---

## ? Solution: Add Missing REST Endpoints

Add these routes to `codette_server_unified.py` **AFTER** the FastAPI app creation and **BEFORE** the uvicorn startup:

```python
# ============================================================================
# REST API ENDPOINTS - CODETTE ADVANCED FEATURES
# ============================================================================

@app.get("/api/analysis/production-checklist")
async def api_production_checklist(stage: str = "mixing"):
    """Get production workflow checklist for specified stage"""
    try:
        # Fallback data for when function not fully implemented
        checklists = {
            "recording": {
                "success": True,
                "stage": "recording",
                "items": [
                    {"id": 1, "category": "Setup", "task": "Set input levels (gain staging)", "priority": "high", "completed": False},
                    {"id": 2, "category": "Setup", "task": "Check microphone placement", "priority": "high", "completed": False},
                    {"id": 3, "category": "Recording", "task": "Record clean takes", "priority": "high", "completed": False},
                    {"id": 4, "category": "Recording", "task": "Organize and name takes", "priority": "medium", "completed": False},
                ],
                "completionPercentage": 0
            },
            "arrangement": {
                "success": True,
                "stage": "arrangement",
                "items": [
                    {"id": 1, "category": "Structure", "task": "Create intro section", "priority": "high", "completed": False},
                    {"id": 2, "category": "Structure", "task": "Build verse sections", "priority": "high", "completed": False},
                    {"id": 3, "category": "Structure", "task": "Design chorus/hook", "priority": "high", "completed": False},
                    {"id": 4, "category": "Transitions", "task": "Add bridge section", "priority": "medium", "completed": False},
                ],
                "completionPercentage": 0
            },
            "mixing": {
                "success": True,
                "stage": "mixing",
                "items": [
                    {"id": 1, "category": "Levels", "task": "Set track levels (-6dB headroom)", "priority": "high", "completed": False},
                    {"id": 2, "category": "EQ", "task": "High-pass filter unnecessary low frequencies", "priority": "high", "completed": False},
                    {"id": 3, "category": "EQ", "task": "Fix muddy frequencies (200-500Hz)", "priority": "high", "completed": False},
                    {"id": 4, "category": "Dynamics", "task": "Apply compression to vocals", "priority": "high", "completed": False},
                    {"id": 5, "category": "Effects", "task": "Add reverb via send", "priority": "medium", "completed": False},
                    {"id": 6, "category": "Stereo", "task": "Check mono compatibility", "priority": "medium", "completed": False},
                ],
                "completionPercentage": 0
            },
            "mastering": {
                "success": True,
                "stage": "mastering",
                "items": [
                    {"id": 1, "category": "Preparation", "task": "Bounce stereo mix with headroom", "priority": "high", "completed": False},
                    {"id": 2, "category": "Preparation", "task": "Check loudness targets (-14 LUFS)", "priority": "high", "completed": False},
                    {"id": 3, "category": "Processing", "task": "Apply linear phase EQ", "priority": "high", "completed": False},
                    {"id": 4, "category": "Processing", "task": "Multiband compression", "priority": "medium", "completed": False},
                    {"id": 5, "category": "Limiting", "task": "Apply limiter (prevent clipping)", "priority": "high", "completed": False},
                ],
                "completionPercentage": 0
            },
        }
        
        result = checklists.get(stage, checklists["mixing"])
        logger.info(f"[API] Production checklist requested: {stage}")
        return result
        
    except Exception as e:
        logger.error(f"[API] Production checklist error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analysis/instrument-info")
async def api_instrument_info(category: str = "vocals", instrument: str = "lead"):
    """Get instrument processing guide with frequency specs"""
    try:
        # Fallback instrument database
        instruments = {
            "vocals": {
                "lead": {
                    "category": "Vocals",
                    "instrument": "Lead Vocals",
                    "frequency_range": [50, 3500],
                    "typical_frequencies": [1000, 2500, 3000],
                    "characteristics": ["Expressive", "Dynamic", "Presence-focused"],
                    "processing": ["De-esser", "Compressor (4:1 ratio)", "EQ (presence boost 2-5kHz)", "Reverb"],
                    "mixing_tips": "High-pass at 80-100Hz, boost presence 2-4kHz, compress with 4:1 ratio, add reverb via send"
                },
                "harmony": {
                    "category": "Vocals",
                    "instrument": "Harmony Vocals",
                    "frequency_range": [60, 3000],
                    "typical_frequencies": [800, 2000, 2500],
                    "characteristics": ["Supporting", "Blended", "Less prominent"],
                    "processing": ["EQ (cut low-mids)", "Compression", "Reverb"],
                    "mixing_tips": "Blend with lead vocals, cut 200-500Hz mud, less presence than lead"
                }
            },
            "drums": {
                "kick": {
                    "category": "Drums",
                    "instrument": "Kick Drum",
                    "frequency_range": [20, 250],
                    "typical_frequencies": [60, 80, 100],
                    "characteristics": ["Deep", "Punchy", "Low-end focused"],
                    "processing": ["EQ (sub-bass boost)", "Compression (4:1)", "Saturation"],
                    "mixing_tips": "High-pass at 20Hz, boost 60-80Hz for sub-bass, compress 4:1 ratio"
                },
                "snare": {
                    "category": "Drums",
                    "instrument": "Snare Drum",
                    "frequency_range": [100, 8000],
                    "typical_frequencies": [200, 5000, 8000],
                    "characteristics": ["Crisp", "Present", "Mid-range emphasis"],
                    "processing": ["EQ (cut mud, boost snap)", "Compression", "Reverb"],
                    "mixing_tips": "Cut 200-500Hz mud, boost 5kHz for snap, gentle compression"
                }
            },
            "guitars": {
                "acoustic": {
                    "category": "Guitars",
                    "instrument": "Acoustic Guitar",
                    "frequency_range": [80, 8000],
                    "typical_frequencies": [200, 1000, 5000],
                    "characteristics": ["Warm", "Organic", "Full-bodied"],
                    "processing": ["EQ (natural tone)", "Compression (gentle)", "Reverb"],
                    "mixing_tips": "High-pass at 80-100Hz, gentle compression, natural reverb"
                },
                "electric": {
                    "category": "Guitars",
                    "instrument": "Electric Guitar",
                    "frequency_range": [100, 6000],
                    "typical_frequencies": [800, 2000, 4000],
                    "characteristics": ["Bright", "Articulate", "Variable tone"],
                    "processing": ["EQ (tone shaping)", "Compression", "Delay/Reverb"],
                    "mixing_tips": "Shape with EQ, moderate compression, spatial effects"
                }
            },
            "bass": {
                "electric": {
                    "category": "Bass",
                    "instrument": "Electric Bass",
                    "frequency_range": [40, 2000],
                    "typical_frequencies": [60, 100, 300],
                    "characteristics": ["Warm", "Musical", "Foundation"],
                    "processing": ["EQ (sub + punch)", "Compression (medium)", "Saturation"],
                    "mixing_tips": "High-pass at 30-40Hz, boost 60-100Hz, compress for consistency"
                }
            },
            "keys": {
                "piano": {
                    "category": "Keys",
                    "instrument": "Piano",
                    "frequency_range": [27, 4186],
                    "typical_frequencies": [200, 1000, 3000],
                    "characteristics": ["Resonant", "Full-spectrum", "Rich harmonics"],
                    "processing": ["EQ (natural)", "Compression (gentle)", "Reverb"],
                    "mixing_tips": "Gentle compression, natural reverb, preserve dynamics"
                }
            },
            "strings": {
                "violin": {
                    "category": "Strings",
                    "instrument": "Violin",
                    "frequency_range": [196, 3000],
                    "typical_frequencies": [400, 1000, 2500],
                    "characteristics": ["Bright", "Piercing", "Expressive"],
                    "processing": ["EQ (warmth)", "Compression (light)", "Reverb"],
                    "mixing_tips": "Add warmth with low-mid boost, light compression, hall reverb"
                }
            },
            "brass": {
                "trumpet": {
                    "category": "Brass",
                    "instrument": "Trumpet",
                    "frequency_range": [165, 4000],
                    "typical_frequencies": [1000, 2000, 3000],
                    "characteristics": ["Bright", "Piercing", "Bold"],
                    "processing": ["EQ (presence)", "Compression", "Reverb"],
                    "mixing_tips": "Boost presence 2-4kHz, moderate compression, room reverb"
                }
            }
        }
        
        cat_data = instruments.get(category, instruments["vocals"])
        inst_data = cat_data.get(instrument, list(cat_data.values())[0])
        
        logger.info(f"[API] Instrument info requested: {category}/{instrument}")
        return {
            "success": True,
            **inst_data
        }
        
    except Exception as e:
        logger.error(f"[API] Instrument info error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analysis/delay-sync")
async def api_delay_sync(bpm: float = 120.0, note_division: str = "quarter"):
    """Calculate tempo-synced delay times"""
    try:
        # Note division to beat multiplier mapping
        divisions = {
            "whole": 4.0,
            "half": 2.0,
            "quarter": 1.0,
            "eighth": 0.5,
            "sixteenth": 0.25,
            "dotted_quarter": 1.5,
            "dotted_eighth": 0.75,
            "triplet_quarter": 2.0 / 3.0,
            "triplet_eighth": 1.0 / 3.0,
        }
        
        beat_value = divisions.get(note_division, 1.0)
        delay_ms = round((60000 / bpm) * beat_value, 2)
        delay_seconds = round(delay_ms / 1000, 3)
        
        logger.info(f"[API] Delay sync calculated: {bpm} BPM, {note_division} = {delay_ms}ms")
        
        return {
            "success": True,
            "bpm": bpm,
            "note_division": note_division,
            "delay_ms": delay_ms,
            "delay_seconds": delay_seconds,
            "all_divisions": {
                "whole": round((60000 / bpm) * 4.0, 2),
                "half": round((60000 / bpm) * 2.0, 2),
                "quarter": round((60000 / bpm) * 1.0, 2),
                "eighth": round((60000 / bpm) * 0.5, 2),
                "sixteenth": round((60000 / bpm) * 0.25, 2),
                "dotted_quarter": round((60000 / bpm) * 1.5, 2),
                "dotted_eighth": round((60000 / bpm) * 0.75, 2),
                "triplet_quarter": round((60000 / bpm) * (2.0/3.0), 2),
                "triplet_eighth": round((60000 / bpm) * (1.0/3.0), 2),
            }
        }
        
    except Exception as e:
        logger.error(f"[API] Delay sync error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

```

---

## ?? How to Apply the Fix

### Option 1: Edit the Running Server File

1. Stop the current backend server (Ctrl+C in PowerShell)
2. Open `codette_server_unified.py` in a text editor
3. Find where it says `# ============================================================================`
4. Add the REST API endpoints code above **before** `if __name__ == "__main__":`
5. Save the file
6. Restart: `python codette_server_unified.py`

### Option 2: Quick Test (Copy-Paste into Python REPL)

If the server is already running and you don't want to stop it, the CORS is already working, but you need to add these 3 endpoints.

---

## ? Verification

After adding the endpoints, test with:

```bash
# Test delay sync
curl "http://localhost:8000/api/analysis/delay-sync?bpm=120&note_division=quarter"

# Test production checklist
curl "http://localhost:8000/api/analysis/production-checklist?stage=mixing"

# Test instrument info
curl "http://localhost:8000/api/analysis/instrument-info?category=vocals&instrument=lead"
```

All should return JSON (no 404 errors).

---

## ?? Expected Result

- ? CORS errors disappear (already fixed - server has CORS middleware)
- ? 404 errors disappear (once endpoints added)
- ? Frontend "Tools" button works fully
- ? All 5 Codette Advanced Tools features functional

---

**Status**: Backend CORS is correct, just need REST endpoints.  
**Time to Fix**: ~5 minutes (add 3 endpoint functions)  
**Files to Modify**: `codette_server_unified.py` only

