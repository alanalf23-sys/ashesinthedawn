"""
File Upload and Timeline Integration Endpoints
Add these endpoints to codette_server_unified.py after the existing /codette/ endpoints

This module provides the three key endpoints for file upload and timeline integration:
1. POST /codette/upload - File upload endpoint
2. GET /codette/files/{user_id} - Get user files
3. POST /codette/timeline-context - Timeline analysis
"""

from fastapi import HTTPException, UploadFile, File, Form, FastAPI
from pathlib import Path
import time
import logging

logger = logging.getLogger(__name__)

# Import file upload functionality
try:
    from codette_file_upload import (
        analyze_uploaded_file,
        serialize_timeline_context,
        generate_timeline_suggestions,
        file_history,
        UPLOAD_DIRECTORY,
        MAX_FILE_SIZE,
        ALLOWED_EXTENSIONS,
        get_timestamp
    )
except ImportError:
    logger.error("Failed to import codette_file_upload module")
    raise


async def register_file_upload_endpoints(app: FastAPI):
    """
    Register file upload and timeline integration endpoints to FastAPI app
    
    Usage in codette_server_unified.py after app initialization:
        from codette_file_upload_integration import register_file_upload_endpoints
        # ... after app creation ...
        await register_file_upload_endpoints(app)
    """
    
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
            
            logger.info(f"File uploaded: {file.filename} ({len(contents)} bytes)")
            
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
            logger.info(f"Retrieved {len(files)} files for user {user_id}")
            
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
    async def analyze_timeline(timeline_data: dict):
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
            
            logger.info(f"Timeline analyzed: {len(context.get('tracks', []))} tracks")
            
            return {
                "success": True,
                "context": context,
                "suggestions": suggestions,
                "timestamp": get_timestamp()
            }
        except Exception as e:
            logger.error(f"Timeline analysis error: {e}")
            raise HTTPException(500, f"Analysis failed: {str(e)}")


def install_file_upload_integration(app: FastAPI):
    """
    Synchronous wrapper to register endpoints (if not using async initialization)
    
    Usage in codette_server_unified.py:
        from codette_file_upload_integration import install_file_upload_integration
        # ... after app creation ...
        install_file_upload_integration(app)
    """
    
    @app.post("/codette/upload")
    @app.post("/api/codette/upload")
    async def upload_file(
        file: UploadFile = File(...),
        user_id: str = Form("default")
    ):
        """Upload file for Codette analysis"""
        try:
            contents = await file.read()
            if len(contents) > MAX_FILE_SIZE:
                raise HTTPException(400, f"File too large (max {MAX_FILE_SIZE/1024/1024}MB)")
            
            ext = Path(file.filename or "").suffix.lower()
            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(400, f"File type {ext} not allowed")
            
            file_path = UPLOAD_DIRECTORY / f"{user_id}_{int(time.time())}_{file.filename}"
            file_path.write_bytes(contents)
            
            analysis = await analyze_uploaded_file(file_path, file.content_type or "")
            
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
    async def analyze_timeline(timeline_data: dict):
        """Analyze timeline/track context and provide suggestions"""
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
