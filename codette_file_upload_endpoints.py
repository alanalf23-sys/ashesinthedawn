"""
File Upload and Timeline Context Endpoints
Add these endpoints to codette_server_unified.py after the existing /codette/ endpoints

Copy these function definitions into your codette_server_unified.py file around line 1800
(after the existing /codette/chat endpoint)
"""

# ============================================================================
# FILE UPLOAD ENDPOINTS
# ============================================================================

@app.post("/codette/upload")
@app.post("/api/codette/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Form("default")
):
    """
    Upload file for Codette analysis
    
    Supports: audio, MIDI, text, code files
    Max size: 50MB
    """
    try:
        # Validate file size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(400, f"File too large (max {MAX_FILE_SIZE/1024/1024}MB)")
        
        # Validate extension
        ext = Path(file.filename or "").suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(400, f"File type {ext} not allowed")
        
        # Save file
        file_path = UPLOAD_DIRECTORY / f"{user_id}_{int(time.time())}_{file.filename}"
        file_path.write_bytes(contents)
        
        # Analyze file
        analysis = await analyze_uploaded_file(file_path, file.content_type or "")
        
        # Add to history
        file_info = {
            "id": str(file_path),
            "filename": file.filename,
            "path": str(file_path),
            "analysis": analysis,
            "uploaded_at": get_timestamp()
        }
        file_history.add_file(user_id, file_info)
        
        return {
            "success": True,
            "file": file_info,
            "timestamp": get_timestamp()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(500, f"Upload failed: {str(e)}")


@app.get("/codette/files/{user_id}")
@app.get("/api/codette/files/{user_id}")
async def get_user_files(user_id: str, limit: int = 10):
    """Get recent uploaded files for user"""
    try:
        files = file_history.get_files(user_id, limit)
        return {
            "success": True,
            "files": files,
            "count": len(files),
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"Error retrieving files: {e}")
        raise HTTPException(500, f"Failed to retrieve files: {str(e)}")


@app.post("/codette/timeline-context")
@app.post("/api/codette/timeline-context")
async def analyze_timeline(timeline_data: Dict[str, Any]):
    """
    Analyze timeline/track context and provide suggestions
    
    Accepts:
    - tracks: List of track objects
    - regions: List of region objects
    - markers: List of markers
    - transport: Transport state
    """
    try:
        context = serialize_timeline_context(timeline_data)
        suggestions = generate_timeline_suggestions(context)
        
        return {
            "success": True,
            "context": context,
            "suggestions": suggestions,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"Timeline analysis error: {e}")
        raise HTTPException(500, f"Analysis failed: {str(e)}")


# ============================================================================
# UPDATE ChatRequest MODEL (around line 260)
# ============================================================================
# Replace the existing ChatRequest class with:

class ChatRequest(BaseModel):
    message: str
    perspective: Optional[str] = "mix_engineering"
    daw_context: Optional[Dict[str, Any]] = None
    timeline_context: Optional[Dict[str, Any]] = None  # NEW
    file_references: Optional[List[str]] = None  # NEW


# ============================================================================
# UPDATE ChatResponse MODEL (around line 270)
# ============================================================================
# Replace the existing ChatResponse class with:

class ChatResponse(BaseModel):
    response: str
    perspective: str
    confidence: Optional[float] = None
    timestamp: Optional[str] = None
    source: Optional[str] = None
    file_analysis: Optional[Dict[str, Any]] = None  # NEW
    timeline_suggestions: Optional[List[str]] = None  # NEW
