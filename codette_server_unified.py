#!/usr/bin/env python
"""
Codette AI Unified Server
Combined FastAPI server for CoreLogic Studio DAW integration
Includes both standard endpoints and production-optimized features
"""

import sys
import os
from pathlib import Path
from typing import Optional, Dict, Any, List
import json
import logging
from datetime import datetime
from collections import Counter
import asyncio
import time
import traceback

# Setup paths
codette_path = Path(__file__).parent / "Codette"
sys.path.insert(0, str(codette_path))
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import genre templates
try:
    from codette_genre_templates import (
        get_genre_suggestions,
        get_available_genres,
        get_genre_characteristics,
        combine_suggestions
    )
    GENRE_TEMPLATES_AVAILABLE = True
except ImportError:
    GENRE_TEMPLATES_AVAILABLE = False
    print("[WARNING] Genre templates not available")

# Try to import numpy for audio analysis
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    print("[WARNING] NumPy not available - some analysis features will be limited")

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# REAL CODETTE AI ENGINE & TRAINING DATA
# ============================================================================

# Try to import real Codette engine
try:
    from codette_real_engine import get_real_codette_engine
    codette_engine = get_real_codette_engine()
    logger.info("✅ Real Codette AI Engine initialized successfully")
    USE_REAL_ENGINE = True
except Exception as e:
    logger.warning(f"⚠️ Failed to load real Codette engine: {e}")
    codette_engine = None
    USE_REAL_ENGINE = False

# Try to import training data and analysis
try:
    from codette_training_data import training_data, get_training_context
    from codette_analysis_module import analyze_session as enhanced_analyze, CodetteAnalyzer
    TRAINING_AVAILABLE = True
    analyzer = CodetteAnalyzer()
    logger.info("[OK] Codette training data loaded successfully")
    logger.info("[OK] Codette analyzer initialized")
except ImportError as e:
    logger.warning(f"[WARNING] Could not import Codette training modules: {e}")
    TRAINING_AVAILABLE = False
    training_data = None
    get_training_context = None
    enhanced_analyze = None
    analyzer = None

# Try to import BroaderPerspectiveEngine
try:
    from codette import BroaderPerspectiveEngine
    Codette = BroaderPerspectiveEngine
    codette = Codette()
    logger.info("[OK] Codette (BroaderPerspectiveEngine) imported and initialized")
except Exception as e:
    logger.warning(f"[WARNING] Could not import BroaderPerspectiveEngine: {e}")
    Codette = None
    codette = None

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="Codette AI Unified Server",
    description="Combined Codette AI server for CoreLogic Studio DAW",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("✅ FastAPI app created with CORS enabled")

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ChatRequest(BaseModel):
    message: str
    perspective: Optional[str] = "neuralnets"
    context: Optional[List[Dict[str, Any]]] = None
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    perspective: str
    confidence: Optional[float] = None
    timestamp: Optional[str] = None

class AudioAnalysisRequest(BaseModel):
    audio_data: Optional[Dict[str, Any]] = None
    analysis_type: Optional[str] = "spectrum"
    track_data: Optional[Dict[str, Any]] = None
    track_id: Optional[str] = None

class AudioAnalysisResponse(BaseModel):
    trackId: str
    analysis: Dict[str, Any]
    status: str
    timestamp: Optional[str] = None

class SuggestionRequest(BaseModel):
    context: Dict[str, Any]
    limit: Optional[int] = 5

class SuggestionResponse(BaseModel):
    suggestions: List[Dict[str, Any]]
    confidence: Optional[float] = None
    timestamp: Optional[str] = None

class ProcessRequest(BaseModel):
    id: str
    type: str
    payload: Dict[str, Any]
    timestamp: int

class ProcessResponse(BaseModel):
    id: str
    status: str
    data: Dict[str, Any]
    processingTime: float

# Transport models
class TransportState(BaseModel):
    playing: bool
    time_seconds: float
    sample_pos: int
    bpm: float
    beat_pos: float
    loop_enabled: bool
    loop_start_seconds: float
    loop_end_seconds: float

class TransportCommandResponse(BaseModel):
    success: bool
    message: str
    state: Optional[TransportState] = None

# ============================================================================
# TRANSPORT CLOCK MANAGER
# ============================================================================

class TransportManager:
    """Manages DAW transport state and synchronization"""
    
    def __init__(self):
        self.playing = False
        self.time_seconds = 0.0
        self.sample_pos = 0
        self.bpm = 120.0
        self.sample_rate = 44100
        self.start_time = None
        self.loop_enabled = False
        self.loop_start_seconds = 0.0
        self.loop_end_seconds = 10.0
        self.connected_clients: set = set()
    
    def get_state(self) -> TransportState:
        """Get current transport state"""
        if self.playing and self.start_time:
            elapsed = time.time() - self.start_time
            self.time_seconds = elapsed
            self.sample_pos = int(self.time_seconds * self.sample_rate)
        
        # Calculate beat position (4 beats per measure)
        beat_duration = 60.0 / self.bpm
        self.beat_pos = (self.time_seconds % (beat_duration * 4)) / beat_duration
        
        return TransportState(
            playing=self.playing,
            time_seconds=self.time_seconds,
            sample_pos=self.sample_pos,
            bpm=self.bpm,
            beat_pos=self.beat_pos,
            loop_enabled=self.loop_enabled,
            loop_start_seconds=self.loop_start_seconds,
            loop_end_seconds=self.loop_end_seconds
        )
    
    def play(self) -> TransportState:
        """Start playback"""
        if not self.playing:
            self.playing = True
            self.start_time = time.time() - self.time_seconds
        return self.get_state()
    
    def stop(self) -> TransportState:
        """Stop playback and reset"""
        self.playing = False
        self.time_seconds = 0.0
        self.sample_pos = 0
        self.start_time = None
        return self.get_state()
    
    def pause(self) -> TransportState:
        """Pause playback (time remains)"""
        if self.playing:
            self.time_seconds = time.time() - self.start_time
            self.playing = False
        return self.get_state()
    
    def resume(self) -> TransportState:
        """Resume playback from pause"""
        if not self.playing:
            self.playing = True
            self.start_time = time.time() - self.time_seconds
        return self.get_state()
    
    def seek(self, time_seconds: float) -> TransportState:
        """Seek to time position"""
        self.time_seconds = max(0.0, time_seconds)
        self.sample_pos = int(self.time_seconds * self.sample_rate)
        if self.playing:
            self.start_time = time.time() - self.time_seconds
        return self.get_state()
    
    def set_tempo(self, bpm: float) -> TransportState:
        """Set BPM"""
        self.bpm = max(1.0, min(300.0, bpm))  # Clamp 1-300 BPM
        return self.get_state()
    
    def set_loop(self, enabled: bool, start: float = 0.0, end: float = 10.0) -> TransportState:
        """Configure loop region"""
        self.loop_enabled = enabled
        self.loop_start_seconds = max(0.0, start)
        self.loop_end_seconds = max(self.loop_start_seconds + 0.1, end)
        return self.get_state()

# Initialize transport manager
transport_manager = TransportManager()

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_timestamp():
    """Get ISO format timestamp"""
    return datetime.utcnow().isoformat() + "Z"

def to_db(value):
    """Convert linear amplitude to dB"""
    if value <= 0 or not NUMPY_AVAILABLE:
        return -96.0
    return float(20 * np.log10(np.clip(value, 1e-7, 1.0)))

def get_training_context_safe():
    """Safely get training context"""
    if TRAINING_AVAILABLE and get_training_context:
        try:
            return get_training_context()
        except Exception as e:
            logger.warning(f"Error getting training context: {e}")
            return {}
    return {}

# ============================================================================
# ROOT & HEALTH ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "ok",
        "service": "Codette AI Unified Server",
        "version": "2.0.0",
        "docs": "/docs",
        "real_engine": USE_REAL_ENGINE,
        "training_available": TRAINING_AVAILABLE,
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        return {
            "status": "healthy",
            "service": "Codette AI Unified Server",
            "real_engine": USE_REAL_ENGINE,
            "training_available": TRAINING_AVAILABLE,
            "codette_available": codette is not None,
            "analyzer_available": analyzer is not None,
            "timestamp": get_timestamp(),
        }
    except Exception as e:
        logger.error(f"ERROR in /health: {e}")
        return {"status": "error", "error": str(e)}

@app.get("/api/health")
@app.post("/api/health")
async def api_health():
    """API health check endpoint"""
    return {
        "success": True,
        "data": {"status": "ok", "service": "codette"},
        "duration": 0,
        "timestamp": get_timestamp(),
    }

# ============================================================================
# TRAINING DATA ENDPOINTS
# ============================================================================

@app.get("/api/training/context")
async def get_training_context_endpoint():
    """Get Codette AI training context"""
    try:
        if TRAINING_AVAILABLE and get_training_context:
            context = get_training_context()
            return {
                "success": True,
                "data": context,
                "message": "Training context available",
                "timestamp": get_timestamp(),
            }
        else:
            return {
                "success": False,
                "data": None,
                "message": "Training context not available",
                "timestamp": get_timestamp(),
            }
    except Exception as e:
        logger.error(f"ERROR in /api/training/context: {e}")
        return {
            "success": False,
            "data": None,
            "error": str(e),
            "timestamp": get_timestamp(),
        }

@app.get("/api/training/health")
async def training_health():
    """Check training module health"""
    try:
        return {
            "success": True,
            "training_available": TRAINING_AVAILABLE,
            "modules": {
                "training_data": TRAINING_AVAILABLE,
                "analysis": TRAINING_AVAILABLE and enhanced_analyze is not None,
                "analyzer": analyzer is not None,
            },
            "timestamp": get_timestamp(),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "timestamp": get_timestamp(),
        }

# ============================================================================
# CHAT ENDPOINTS
# ============================================================================

@app.post("/codette/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat with Codette using training data and real engine"""
    try:
        perspective = request.perspective or "neuralnets"
        message = request.message.lower()
        
        # Get training context
        training_context = get_training_context_safe()
        daw_functions = training_context.get("daw_functions", {})
        ui_components = training_context.get("ui_components", {})
        codette_abilities = training_context.get("codette_abilities", {})
        
        response = None
        confidence = 0.5
        
        # Check if question is about DAW functions
        for category, functions in daw_functions.items():
            for func_name, func_data in functions.items():
                if func_name in message or func_data.get("name", "").lower() in message:
                    response = f"**{func_data['name']}** ({func_data['category']})\n\n{func_data['description']}\n\n"
                    response += f"📋 Parameters: {', '.join(func_data['parameters']) or 'None'}\n"
                    response += f"⏱️ Hotkey: {func_data.get('hotkey', 'N/A')}\n"
                    response += f"💡 Tips:\n" + "\n".join([f"  • {tip}" for tip in func_data.get('tips', [])])
                    confidence = 0.92
                    break
            if response:
                break
        
        # Check if question is about UI components
        if not response:
            for comp_name, comp_data in ui_components.items():
                if comp_name.lower() in message:
                    response = f"**{comp_name}** - {comp_data['description']}\n\n"
                    response += f"📍 Location: {comp_data['location']}\n"
                    response += f"📏 Size: {comp_data['size']}\n"
                    response += f"⚙️ Functions: {', '.join(comp_data['functions'])}\n"
                    response += f"💡 Tips:\n" + "\n".join([f"  • {tip}" for tip in comp_data.get('teaching_tips', [])])
                    confidence = 0.89
                    break
        
        # Try real Codette engine if available
        perspective_source = "fallback"
        if not response and USE_REAL_ENGINE and codette_engine:
            try:
                result = codette_engine.process_chat_real(request.message, "default")
                if isinstance(result, dict) and "perspectives" in result:
                    # Format multi-perspective response
                    response = "🧠 **Codette's Multi-Perspective Analysis**\n\n"
                    perspectives_list = result.get("perspectives", [])
                    for perspective in perspectives_list:
                        perspective_name = perspective.get('name', 'Insight')
                        perspective_response = perspective.get('response', '')
                        response += f"**{perspective_name}**: {perspective_response}\n\n"
                    confidence = result.get("confidence", 0.88)
                    perspective_source = "real-engine"
                elif isinstance(result, str):
                    response = result
                    confidence = 0.88
                    perspective_source = "real-engine"
            except Exception as e:
                logger.warning(f"Real engine error: {e}")
        
        # Fallback to generic response
        if not response:
            response = f"""I'm Codette, your AI assistant for CoreLogic Studio! 🎵

I can help you with:
• **DAW Functions** ({len(daw_functions)} categories)
• **UI Components** ({len(ui_components)} components)
• **Audio Production** techniques

What would you like to learn?"""
            confidence = 0.75
            perspective_source = "fallback"
        
        return ChatResponse(
            response=response,
            perspective=perspective_source,
            confidence=min(confidence, 1.0),
            timestamp=get_timestamp(),
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return ChatResponse(
            response="I'm having trouble understanding. Could you rephrase your question?",
            perspective=request.perspective or "neuralnets",
            confidence=0.5,
            timestamp=get_timestamp(),
        )

# ============================================================================
# AUDIO ANALYSIS ENDPOINTS
# ============================================================================

@app.post("/codette/analyze", response_model=AudioAnalysisResponse)
async def analyze_audio(request: AudioAnalysisRequest):
    """Analyze audio using CodetteAnalyzer"""
    try:
        track_id = request.track_data.get("track_id", "unknown") if request.track_data else "unknown"
        
        if not request.audio_data:
            return AudioAnalysisResponse(
                trackId=track_id,
                analysis={
                    "quality_score": 0.5,
                    "findings": ["No audio data provided"],
                    "recommendations": ["Upload audio data to analyze"],
                },
                status="success",
                timestamp=get_timestamp(),
            )
        
        if not TRAINING_AVAILABLE or analyzer is None:
            return AudioAnalysisResponse(
                trackId=track_id,
                analysis={"error": "Training data not available"},
                status="fallback",
                timestamp=get_timestamp(),
            )
        
        # Extract metrics
        audio_metrics = request.audio_data
        sample_rate = audio_metrics.get("sample_rate", 44100)
        duration = audio_metrics.get("duration", 0)
        peak_level = audio_metrics.get("peak_level", -96.0)
        rms_level = audio_metrics.get("rms_level", -96.0)
        
        track_metrics = [{
            "name": request.track_data.get("track_name", "Unknown") if request.track_data else "Unknown",
            "level": rms_level,
            "peak": peak_level,
            "rms": rms_level,
        }]
        
        # Perform analysis
        analysis_type = request.analysis_type or "spectrum"
        
        if analysis_type == "dynamic":
            result = analyzer.analyze_gain_staging(track_metrics)
        elif analysis_type == "loudness":
            result = analyzer.analyze_mastering_readiness(track_metrics)
        elif analysis_type == "quality":
            result = analyzer.analyze_session_health(track_metrics, {})
        else:
            result = analyzer.analyze_gain_staging(track_metrics)
        
        analysis = {
            "analysis_type": analysis_type,
            "quality_score": result.score,
            "findings": result.findings,
            "recommendations": result.recommendations,
            "metrics": {
                "duration": duration,
                "sample_rate": sample_rate,
                "peak_level": peak_level,
                "rms_level": rms_level,
            }
        }

        return AudioAnalysisResponse(
            trackId=track_id,
            analysis=analysis,
            status="success",
            timestamp=get_timestamp(),
        )
    except Exception as e:
        logger.error(f"Error in audio analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SUGGESTIONS ENDPOINTS
# ============================================================================

@app.post("/codette/suggest", response_model=SuggestionResponse)
async def get_suggestions(request: SuggestionRequest):
    """Get AI-powered suggestions with genre support"""
    try:
        suggestions = []
        context_type = request.context.get("type", "general") if request.context else "general"
        genre = request.context.get("genre", "") if request.context else ""
        
        # Use genre templates if available
        if GENRE_TEMPLATES_AVAILABLE and genre:
            genre_lower = genre.lower().strip()
            genre_suggestions = get_genre_suggestions(genre_lower, limit=min(3, request.limit))
            if genre_suggestions:
                suggestions.extend(genre_suggestions)
        
        # Use real suggestions from training data
        if context_type == "gain-staging":
            base_suggestions = [
                {
                    "type": "optimization",
                    "title": "Peak Level Optimization",
                    "description": "Maintain -3dB headroom as per industry standard",
                    "confidence": 0.92,
                },
                {
                    "type": "optimization",
                    "title": "Clipping Prevention",
                    "description": "Ensure no signal exceeds 0dBFS",
                    "confidence": 0.95,
                },
            ]
            if not suggestions:
                suggestions.extend(base_suggestions)
        elif context_type == "mixing":
            base_suggestions = [
                {
                    "type": "effect",
                    "title": "EQ for Balance",
                    "description": "Apply EQ to balance frequency content",
                    "confidence": 0.88,
                },
                {
                    "type": "routing",
                    "title": "Bus Architecture",
                    "description": "Create buses for better mix control",
                    "confidence": 0.85,
                },
            ]
            if not suggestions:
                suggestions.extend(base_suggestions)
        elif context_type == "mastering":
            base_suggestions = [
                {
                    "type": "optimization",
                    "title": "Loudness Target",
                    "description": "Target -14 LUFS for streaming platforms",
                    "confidence": 0.93,
                },
                {
                    "type": "effect",
                    "title": "Linear Phase EQ",
                    "description": "Use linear phase EQ in mastering",
                    "confidence": 0.87,
                },
            ]
            if not suggestions:
                suggestions.extend(base_suggestions)
        else:
            if not suggestions:
                base_suggestions = [
                    {
                        "type": "optimization",
                        "title": "Gain Optimization",
                        "description": "Maintain proper gain levels throughout signal chain",
                        "confidence": 0.85,
                    },
                ]
                suggestions.extend(base_suggestions)
        
        # Limit suggestions
        suggestions = suggestions[:request.limit]
        
        # Calculate average confidence
        avg_confidence = sum(s["confidence"] for s in suggestions) / len(suggestions) if suggestions else 0.5

        return SuggestionResponse(
            suggestions=suggestions,
            confidence=min(avg_confidence, 1.0),
            timestamp=get_timestamp(),
        )
    except Exception as e:
        logger.error(f"Error generating suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GENERIC PROCESS ENDPOINT
# ============================================================================

@app.post("/codette/process", response_model=ProcessResponse)
async def process_request(request: ProcessRequest):
    """Generic request processor"""
    import time

    start_time = time.time()

    try:
        result_data: Dict[str, Any] = {}

        if request.type == "chat":
            payload = request.payload
            message = payload.get("message", "")
            
            # Use chat endpoint logic
            chat_req = ChatRequest(message=message)
            chat_resp = await chat_endpoint(chat_req)
            result_data = {
                "response": chat_resp.response,
                "perspective": chat_resp.perspective,
                "confidence": chat_resp.confidence,
            }

        elif request.type == "audio_analysis":
            result_data = {
                "analysis": "Audio analysis completed",
                "status": "success",
                "trackId": request.payload.get("trackId"),
            }

        elif request.type == "suggestion":
            result_data = {
                "suggestions": [
                    {
                        "type": "optimization",
                        "title": "Gain Optimization",
                        "confidence": 0.85,
                    }
                ]
            }

        else:
            result_data = {"message": f"Request type: {request.type}"}

        processing_time = time.time() - start_time

        return ProcessResponse(
            id=request.id,
            status="success",
            data=result_data,
            processingTime=processing_time,
        )

    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Error in process endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}",
        )

# ============================================================================
# TRANSPORT CONTROL ENDPOINTS
# ============================================================================

@app.websocket("/ws")
async def websocket_general(websocket: WebSocket):
    """General WebSocket endpoint with analysis streaming support"""
    try:
        await websocket.accept()
    except Exception as e:
        logger.error(f"Failed to accept WebSocket on /ws: {e}")
        return
    
    transport_manager.connected_clients.add(websocket)
    logger.info(f"WebSocket connected to /ws. Clients: {len(transport_manager.connected_clients)}")
    
    # Track streaming state
    streaming_analysis = False
    analysis_type = "spectrum"
    stream_interval = 0.1  # 100ms default
    last_analysis_send = time.time()
    
    try:
        last_send = time.time()
        send_interval = 1.0 / 60.0  # 60 FPS
        
        # Send initial state
        try:
            state = transport_manager.get_state()
            await websocket.send_json({
                "type": "state",
                "data": state.dict()
            })
        except Exception as e:
            logger.error(f"Failed to send initial state on /ws: {e}")
            return
        
        while True:
            try:
                # Non-blocking receive
                try:
                    data = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=0.001
                    )
                    try:
                        message = json.loads(data)
                        
                        # Handle commands
                        if message.get("type") == "play":
                            transport_manager.play()
                        elif message.get("type") == "stop":
                            transport_manager.stop()
                        elif message.get("type") == "pause":
                            transport_manager.pause()
                        elif message.get("type") == "resume":
                            transport_manager.resume()
                        elif message.get("type") == "seek":
                            transport_manager.seek(message.get("time_seconds", 0))
                        elif message.get("type") == "tempo":
                            transport_manager.set_tempo(message.get("bpm", 120))
                        elif message.get("type") == "loop":
                            transport_manager.set_loop(
                                message.get("enabled", False),
                                message.get("start_seconds", 0),
                                message.get("end_seconds", 10)
                            )
                        # NEW: Handle analysis streaming
                        elif message.get("type") == "analyze_stream":
                            streaming_analysis = True
                            analysis_type = message.get("analysis_type", "spectrum")
                            stream_interval = message.get("interval_ms", 100) / 1000.0
                            logger.info(f"Started analysis streaming: {analysis_type} (interval: {stream_interval}s)")
                        elif message.get("type") == "stop_stream":
                            streaming_analysis = False
                            logger.info("Stopped analysis streaming")
                    except json.JSONDecodeError:
                        pass
                    
                except asyncio.TimeoutError:
                    pass
                
                # Send state update
                current_time = time.time()
                if current_time - last_send >= send_interval:
                    try:
                        state = transport_manager.get_state()
                        await websocket.send_json({
                            "type": "state",
                            "data": state.dict()
                        })
                        last_send = current_time
                    except RuntimeError as e:
                        logger.warning(f"Connection closed on /ws: {e}")
                        break
                    except Exception as e:
                        logger.error(f"Unexpected error in /ws loop: {e}")
                        break
                
                # Send streaming analysis data if enabled
                if streaming_analysis and (current_time - last_analysis_send >= stream_interval):
                    try:
                        # Generate mock analysis data
                        analysis_data = {
                            "type": "analysis_update",
                            "analysis_type": analysis_type,
                            "timestamp": datetime.now().isoformat(),
                            "payload": {
                                "peak_level": np.random.uniform(-20, -3) if NUMPY_AVAILABLE else -10,
                                "rms_level": np.random.uniform(-30, -15) if NUMPY_AVAILABLE else -20,
                                "frequency_balance": {
                                    "low": np.random.uniform(-12, 6) if NUMPY_AVAILABLE else 0,
                                    "mid": np.random.uniform(-12, 6) if NUMPY_AVAILABLE else 0,
                                    "high": np.random.uniform(-12, 6) if NUMPY_AVAILABLE else 0,
                                },
                                "quality_score": np.random.uniform(0.6, 1.0) if NUMPY_AVAILABLE else 0.8,
                            }
                        }
                        await websocket.send_json(analysis_data)
                        last_analysis_send = current_time
                    except Exception as e:
                        logger.error(f"Error sending analysis data: {e}")
                
                # Small sleep
                await asyncio.sleep(0.001)
                
            except WebSocketDisconnect:
                logger.info("WebSocket /ws disconnected")
                break
            except Exception as e:
                logger.error(f"Unexpected error in /ws loop: {e}")
                break
    
    finally:
        try:
            transport_manager.connected_clients.discard(websocket)
            logger.info(f"WebSocket cleanup on /ws. Remaining: {len(transport_manager.connected_clients)}")
        except Exception as e:
            logger.error(f"Error during /ws cleanup: {e}")

@app.websocket("/ws/transport/clock")
async def websocket_transport_clock(websocket: WebSocket):
    """WebSocket endpoint for transport clock"""
    try:
        await websocket.accept()
    except Exception as e:
        logger.error(f"Failed to accept WebSocket: {e}")
        return
    
    transport_manager.connected_clients.add(websocket)
    logger.info(f"WebSocket client connected. Total: {len(transport_manager.connected_clients)}")
    
    try:
        last_send = time.time()
        send_interval = 1.0 / 60.0
        
        # Send initial state
        try:
            state = transport_manager.get_state()
            await websocket.send_json({
                "type": "state",
                "data": state.dict()
            })
        except Exception as e:
            logger.error(f"Failed to send initial state: {e}")
            return
        
        while True:
            try:
                # Non-blocking receive
                try:
                    data = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=0.001
                    )
                    try:
                        message = json.loads(data)
                        
                        # Handle commands
                        if message.get("type") == "play":
                            transport_manager.play()
                        elif message.get("type") == "stop":
                            transport_manager.stop()
                        elif message.get("type") == "pause":
                            transport_manager.pause()
                        elif message.get("type") == "resume":
                            transport_manager.resume()
                        elif message.get("type") == "seek":
                            transport_manager.seek(message.get("time_seconds", 0))
                        elif message.get("type") == "tempo":
                            transport_manager.set_tempo(message.get("bpm", 120))
                        elif message.get("type") == "loop":
                            transport_manager.set_loop(
                                message.get("enabled", False),
                                message.get("start_seconds", 0),
                                message.get("end_seconds", 10)
                            )
                    except json.JSONDecodeError:
                        pass
                    
                except asyncio.TimeoutError:
                    pass
                
                # Send state update
                current_time = time.time()
                if current_time - last_send >= send_interval:
                    try:
                        state = transport_manager.get_state()
                        await websocket.send_json({
                            "type": "state",
                            "data": state.dict()
                        })
                        last_send = current_time
                    except RuntimeError as e:
                        logger.warning(f"Connection closed: {e}")
                        break
                    except Exception as e:
                        logger.error(f"Send error: {e}")
                        break
                
                # Minimal sleep
                await asyncio.sleep(0.0001)
            
            except asyncio.CancelledError:
                logger.info("WebSocket task cancelled")
                break
            except Exception as e:
                logger.error(f"Unexpected error in loop: {type(e).__name__}: {e}")
                break
    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected (clean)")
    except Exception as e:
        logger.error(f"WebSocket handler error: {type(e).__name__}: {e}")
    finally:
        transport_manager.connected_clients.discard(websocket)
        logger.info(f"WebSocket cleanup. Remaining: {len(transport_manager.connected_clients)}")

# ============================================================================
# REST TRANSPORT ENDPOINTS
# ============================================================================

@app.post("/transport/play")
async def transport_play() -> TransportCommandResponse:
    """Start playback"""
    try:
        state = transport_manager.play()
        return TransportCommandResponse(
            success=True,
            message="Playback started",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transport/stop")
async def transport_stop() -> TransportCommandResponse:
    """Stop playback"""
    try:
        state = transport_manager.stop()
        return TransportCommandResponse(
            success=True,
            message="Playback stopped",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transport/pause")
async def transport_pause() -> TransportCommandResponse:
    """Pause playback"""
    try:
        state = transport_manager.pause()
        return TransportCommandResponse(
            success=True,
            message="Playback paused",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transport/resume")
async def transport_resume() -> TransportCommandResponse:
    """Resume playback"""
    try:
        state = transport_manager.resume()
        return TransportCommandResponse(
            success=True,
            message="Playback resumed",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transport/seek")
async def transport_seek(seconds: float) -> TransportCommandResponse:
    """Seek to time position"""
    try:
        state = transport_manager.seek(seconds)
        return TransportCommandResponse(
            success=True,
            message=f"Seeked to {seconds} seconds",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transport/tempo")
async def transport_tempo(bpm: float) -> TransportCommandResponse:
    """Set playback tempo"""
    try:
        if not 1 <= bpm <= 300:
            raise ValueError("BPM must be between 1 and 300")
        state = transport_manager.set_tempo(bpm)
        return TransportCommandResponse(
            success=True,
            message=f"Tempo set to {bpm} BPM",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transport/loop")
async def transport_loop(
    enabled: bool,
    start_seconds: float = 0.0,
    end_seconds: float = 10.0
) -> TransportCommandResponse:
    """Configure loop region"""
    try:
        state = transport_manager.set_loop(enabled, start_seconds, end_seconds)
        return TransportCommandResponse(
            success=True,
            message=f"Loop {'enabled' if enabled else 'disabled'}",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transport/status")
async def transport_status() -> TransportState:
    """Get current transport state"""
    return transport_manager.get_state()

@app.get("/transport/metrics")
async def transport_metrics() -> Dict[str, Any]:
    """Get transport metrics"""
    state = transport_manager.get_state()
    return {
        "state": state.dict(),
        "connected_clients": len(transport_manager.connected_clients),
        "timestamp": get_timestamp(),
        "beat_fraction": state.beat_pos,
        "sample_rate": transport_manager.sample_rate
    }

# ============================================================================
# STATUS ENDPOINT
# ============================================================================

@app.get("/codette/status")
async def get_status():
    """Get current status"""
    return {
        "status": "running",
        "version": "2.0.0",
        "real_engine": USE_REAL_ENGINE,
        "training_available": TRAINING_AVAILABLE,
        "codette_available": codette is not None,
        "perspectives_available": [
            "neuralnets",
            "newtonian",
            "davinci",
            "quantum",
        ],
        "features": [
            "chat",
            "audio_analysis",
            "suggestions",
            "transport_control",
            "training_data",
        ],
        "timestamp": get_timestamp(),
    }

# ============================================================================
# DSP EFFECTS ENDPOINTS
# ============================================================================

# Try to import DSP effects
try:
    from daw_core.fx.eq_and_dynamics import EQ3Band, HighLowPass, Compressor
    from daw_core.fx.dynamics_part2 import Limiter, Expander, Gate, NoiseGate
    from daw_core.fx.saturation import Saturation, HardClip, Distortion, WaveShaper
    from daw_core.fx.delays import SimpleDelay, PingPongDelay, MultiTapDelay, StereoDelay
    from daw_core.fx.reverb import HallReverb, PlateReverb, RoomReverb, Reverb
    from daw_core.fx.modulation_and_utility import Chorus, Flanger, Tremolo, Gain, WidthControl, DynamicEQ
    DSP_EFFECTS_AVAILABLE = True
except ImportError as e:
    DSP_EFFECTS_AVAILABLE = False
    logger.warning(f"[WARNING] DSP effects not available: {e}")


EFFECTS_REGISTRY = {
    "eq_3band": {"class": EQ3Band, "name": "3-Band EQ", "category": "eq"},
    "compressor": {"class": Compressor, "name": "Compressor", "category": "dynamics"},
    "limiter": {"class": Limiter, "name": "Limiter", "category": "dynamics"},
    "gate": {"class": Gate, "name": "Gate", "category": "dynamics"},
    "reverb_plate": {"class": PlateReverb, "name": "Plate Reverb", "category": "reverb"},
    "reverb_hall": {"class": HallReverb, "name": "Hall Reverb", "category": "reverb"},
    "chorus": {"class": Chorus, "name": "Chorus", "category": "modulation"},
    "delay": {"class": SimpleDelay, "name": "Simple Delay", "category": "delay"},
    "delay_pingpong": {"class": PingPongDelay, "name": "Ping Pong Delay", "category": "delay"},
    "distortion": {"class": Distortion, "name": "Distortion", "category": "saturation"},
    "saturation": {"class": Saturation, "name": "Saturation", "category": "saturation"},
    "gain": {"class": Gain, "name": "Gain", "category": "utility"},
}


@app.get("/daw/effects/list")
async def list_effects():
    """Get list of all available DSP effects"""
    try:
        if not DSP_EFFECTS_AVAILABLE:
            return {"effects": [], "status": "dsp_unavailable"}

        effects_list = []
        for effect_id, effect_config in EFFECTS_REGISTRY.items():
            effects_list.append({
                "id": effect_id,
                "name": effect_config["name"],
                "category": effect_config["category"],
                "parameters": {}
            })
        
        logger.info(f"[DSP Effects] Listed {len(effects_list)} effects")
        return {"effects": effects_list, "count": len(effects_list), "status": "success"}
    except Exception as e:
        logger.error(f"[DSP Effects] Error listing effects: {e}", exc_info=True)
        return {"effects": [], "status": "error", "error": str(e)}


@app.get("/daw/effects/{effect_id}")
async def get_effect_info(effect_id: str):
    """Get detailed information about a specific effect"""
    try:
        if effect_id not in EFFECTS_REGISTRY:
            return {"status": "not_found", "error": f"Effect '{effect_id}' not found"}

        effect_config = EFFECTS_REGISTRY[effect_id]
        return {
            "id": effect_id,
            "name": effect_config["name"],
            "category": effect_config["category"],
            "status": "success"
        }
    except Exception as e:
        logger.error(f"[DSP Effects] Error getting effect info: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}


@app.post("/daw/effects/process")
async def process_audio(request_data: dict):
    """Process audio through a specific effect"""
    try:
        if not DSP_EFFECTS_AVAILABLE:
            return {"success": False, "error": "DSP effects not available", "audioData": request_data.get("audioData", [])}

        effect_type = request_data.get("effectType", "")
        if effect_type not in EFFECTS_REGISTRY:
            return {"success": False, "error": f"Effect '{effect_type}' not found", "audioData": request_data.get("audioData", [])}

        audio_data = request_data.get("audioData", [])
        parameters = request_data.get("parameters", {})

        # Convert to numpy array
        audio_array = np.array(audio_data, dtype=np.float32)
        
        # Get effect class and instantiate
        effect_class = EFFECTS_REGISTRY[effect_type]["class"]
        effect = effect_class(effect_type)

        # Apply parameters if they have setter methods
        for param_id, param_value in parameters.items():
            method_name = f"set_{param_id}"
            if hasattr(effect, method_name):
                try:
                    getattr(effect, method_name)(param_value)
                except Exception as e:
                    logger.warning(f"[DSP Effects] Failed to set parameter {param_id}: {e}")

        # Process audio
        import time
        start_time = time.time()
        processed = effect.process(audio_array)
        processing_time = (time.time() - start_time) * 1000

        # Convert back to list
        processed_list = processed.tolist() if hasattr(processed, 'tolist') else list(processed)

        logger.info(f"[DSP Effects] Processed {len(audio_data)} samples through {effect_type} in {processing_time:.2f}ms")
        
        return {
            "audioData": processed_list,
            "success": True,
            "processingTime": processing_time
        }
    except Exception as e:
        logger.error(f"[DSP Effects] Error processing audio: {e}", exc_info=True)
        return {
            "audioData": request_data.get("audioData", []),
            "success": False,
            "error": str(e),
            "processingTime": 0
        }


# ============================================================================
# GENRE TEMPLATES ENDPOINTS
# ============================================================================

@app.get("/codette/genres")
async def get_available_genres_endpoint():
    """Get list of available genre templates"""
    try:
        if GENRE_TEMPLATES_AVAILABLE:
            genres = get_available_genres()
            return {
                "genres": genres,
                "status": "success",
                "timestamp": get_timestamp(),
            }
        return {
            "genres": [],
            "status": "templates_unavailable",
            "timestamp": get_timestamp(),
        }
    except Exception as e:
        logger.error(f"Error retrieving genres: {e}", exc_info=True)
        return {
            "genres": [],
            "status": "error",
            "error": str(e),
            "timestamp": get_timestamp(),
        }


@app.get("/codette/genre/{genre_id}")
async def get_genre_characteristics_endpoint(genre_id: str):
    """Get mixing characteristics for a specific genre"""
    try:
        if GENRE_TEMPLATES_AVAILABLE:
            characteristics = get_genre_characteristics(genre_id.lower())
            if characteristics:
                return {
                    "genre": genre_id,
                    "characteristics": characteristics,
                    "status": "success",
                    "timestamp": get_timestamp(),
                }
            return {
                "genre": genre_id,
                "status": "genre_not_found",
                "timestamp": get_timestamp(),
            }
        return {
            "genre": genre_id,
            "status": "templates_unavailable",
            "timestamp": get_timestamp(),
        }
    except Exception as e:
        logger.error(f"Error retrieving genre {genre_id}: {e}", exc_info=True)
        return {
            "genre": genre_id,
            "status": "error",
            "error": str(e),
            "timestamp": get_timestamp(),
        }

# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == "__main__":
    # Always use port 8000 for backend
    port = 8000
    
    logger.info("=" * 80)
    logger.info("Starting Codette AI Unified Server")
    logger.info("=" * 80)
    logger.info(f"Real Engine: {USE_REAL_ENGINE}")
    logger.info(f"Training Data: {TRAINING_AVAILABLE}")
    logger.info(f"NumPy Available: {NUMPY_AVAILABLE}")
    logger.info(f"Port: {port}")
    logger.info("=" * 80)
    logger.info(f"🌐 WebSocket: ws://localhost:{port}/ws")
    logger.info(f"📡 API Docs: http://localhost:{port}/docs")
    logger.info("=" * 80)
    
    try:
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            log_level="info",
        )
    except Exception as e:
        logger.error(f"Server failed to start: {e}")
        traceback.print_exc()
