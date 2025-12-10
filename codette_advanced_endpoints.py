"""
Missing Advanced Analysis Endpoints for Codette Server
Add these to codette_server_unified.py right before the final WebSocket route

These endpoints are required by the frontend CodetteAdvancedTools component
"""

# ============================================================================
# ADVANCED ANALYSIS ENDPOINTS (Add to codette_server_unified.py)
# ============================================================================

@app.get("/api/analysis/delay-sync")
async def api_delay_sync(bpm: float = 120.0):
    """Calculate tempo-synced delay times for all note divisions"""
    try:
        # Calculate delay times for common note divisions
        divisions = {
            "Whole Note": round((60000 / bpm) * 4, 2),
            "Half Note": round((60000 / bpm) * 2, 2),
            "Quarter Note": round((60000 / bpm) * 1, 2),
            "Eighth Note": round((60000 / bpm) * 0.5, 2),
            "16th Note": round((60000 / bpm) * 0.25, 2),
            "Dotted Quarter": round((60000 / bpm) * 1.5, 2),
            "Dotted Eighth": round((60000 / bpm) * 0.75, 2),
            "Triplet Quarter": round((60000 / bpm) * (2/3), 2),
            "Triplet Eighth": round((60000 / bpm) * (1/3), 2),
        }
        
        logger.info(f"[API] Delay sync calculated for BPM {bpm}")
        return {
            "success": True,
            "bpm": bpm,
            "divisions": divisions,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"[API] Delay sync error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analysis/ear-training")
async def api_ear_training(exercise_type: str = "interval", difficulty: str = "beginner"):
    """Get ear training exercises and data"""
    try:
        result = await ear_training(exercise_type, difficulty)
        logger.info(f"[API] Ear training: {exercise_type}/{difficulty}")
        return result
    except Exception as e:
        logger.error(f"[API] Ear training error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analysis/production-checklist")
async def api_production_checklist(stage: str = "mixing"):
    """Get production workflow checklist for stage"""
    try:
        result = await production_checklist(stage)
        logger.info(f"[API] Production checklist: {stage}")
        return result
    except Exception as e:
        logger.error(f"[API] Production checklist error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analysis/instrument-info")
async def api_instrument_info(category: str = "vocals", instrument: str = "lead"):
    """Get instrument processing information"""
    try:
        result = await instrument_info(category, instrument)
        logger.info(f"[API] Instrument info: {category}/{instrument}")
        return result
    except Exception as e:
        logger.error(f"[API] Instrument info error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analysis/instruments-list")
async def api_instruments_list():
    """Get list of all available instruments by category"""
    try:
        instruments_list = {
            "vocals": ["lead", "harmony", "backing", "rap"],
            "drums": ["kick", "snare", "hi-hat", "tom", "crash", "ride"],
            "guitars": ["acoustic", "electric", "bass"],
            "keys": ["piano", "synth", "organ", "rhodes"],
            "strings": ["violin", "viola", "cello", "double-bass"],
            "brass": ["trumpet", "trombone", "saxophone", "french-horn"],
            "woodwinds": ["flute", "clarinet", "oboe", "bassoon"],
            "percussion": ["conga", "bongo", "shaker", "tambourine"]
        }
        
        logger.info("[API] Instruments list requested")
        return {
            "success": True,
            "categories": instruments_list,
            "total_instruments": sum(len(v) for v in instruments_list.values()),
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"[API] Instruments list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analysis/detect-genre")
async def api_detect_genre(request: Dict[str, Any]):
    """Detect genre from project metadata"""
    try:
        bpm = request.get("bpm", 120)
        tracks = request.get("tracks", [])
        
        # Simple genre detection based on BPM and track count
        genre = "Electronic"
        confidence = 0.5
        
        if bpm < 80:
            genre = "Ambient"
            confidence = 0.7
        elif bpm < 100:
            genre = "Hip-Hop"
            confidence = 0.75
        elif bpm < 120:
            genre = "Pop"
            confidence = 0.8
        elif bpm < 140:
            genre = "House"
            confidence = 0.75
        else:
            genre = "Drum & Bass"
            confidence = 0.7
        
        logger.info(f"[API] Genre detected: {genre} ({confidence * 100}%)")
        return {
            "success": True,
            "detected_genre": genre,
            "confidence": confidence,
            "bpm_range": [max(1, bpm - 10), bpm + 10],
            "candidates": [genre],
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"[API] Genre detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# INSTRUCTIONS FOR MANUAL INTEGRATION
# ============================================================================
"""
TO FIX THE 404 ERRORS:

1. Open codette_server_unified.py in your favorite text editor
2. Scroll to near the bottom (around line 2500-2600)
3. Find the WebSocket route (@app.websocket("/ws"))
4. **ABOVE** that WebSocket route, paste all the @app.get and @app.post endpoints from this file
5. Save the file
6. Restart the server: python codette_server_unified.py
7. Test: curl http://localhost:8000/api/analysis/delay-sync?bpm=120

The endpoints should then be available and the 404 errors will be resolved.
"""
