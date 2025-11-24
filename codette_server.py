"""
Codette AI FastAPI Server
Bridges CoreLogic Studio frontend with Codette Python AI engine
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from collections import Counter
import sys
import os
import importlib.util
from pathlib import Path
import asyncio
import json
import time

# Verify dependencies on startup
def verify_dependencies():
    """Verify all required dependencies are installed"""
    missing = []
    # Only check for the critical ones for the server to function
    required = ['vaderSentiment', 'fastapi', 'uvicorn']
    
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"\n[WARNING] Missing required packages: {', '.join(missing)}")
        print(f"   Install with: pip install {' '.join(missing)}\n")
        return False
    
    # Try optional packages but don't fail if they're missing
    optional = ['nltk', 'numpy', 'scipy']
    optional_missing = []
    for package in optional:
        try:
            __import__(package)
        except (ImportError, Exception):
            optional_missing.append(package)
    
    if optional_missing:
        print(f"\n[NOTE] Some optional packages may be missing: {', '.join(optional_missing)}")
        print(f"   Codette AI may have reduced functionality.\n")
    
    return True

# Check dependencies
verify_dependencies()

# Add Codette to path
codette_path = Path(__file__).parent / "Codette"
sys.path.insert(0, str(codette_path))

# Try to import Codette, but provide fallback
Codette = None
codette = None  # Instance of Codette
try:
    # Try importing from the codette package (Codette/codette/__init__.py)
    from codette import BroaderPerspectiveEngine
    Codette = BroaderPerspectiveEngine
    print("[OK] Codette (BroaderPerspectiveEngine) imported successfully from package")
    
    # Instantiate it
    codette = Codette()
    print("[OK] Codette AI engine initialized")
    
except ImportError as ie:
    print(f"[WARNING] Could not import Codette: {ie}")
    print(f"   Codette will work in demo/fallback mode")
    Codette = None
    codette = None
except Exception as e:
    print(f"[WARNING] Could not initialize Codette: {e}")
    print(f"   Backend will operate in demo mode with fallback responses")
    Codette = None
    codette = None

try:
    app = FastAPI(title="Codette AI Server", version="1.0.0")
    print("[DEBUG] FastAPI app created")
except Exception as e:
    print(f"[ERROR] Failed to create FastAPI app: {e}")
    import traceback
    traceback.print_exc()
    raise

try:
    # Enable CORS for React frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    print("[DEBUG] CORS middleware added")
except Exception as e:
    print(f"[ERROR] Failed to add CORS middleware: {e}")
    import traceback
    traceback.print_exc()
    raise

# Models
class ChatRequest(BaseModel):
    message: str
    perspective: Optional[str] = "neuralnets"
    context: Optional[List[Dict[str, Any]]] = None

class ChatResponse(BaseModel):
    response: str
    perspective: str
    confidence: Optional[float] = None

class AudioAnalysisRequest(BaseModel):
    trackId: str
    audioData: List[float]
    sampleRate: int = 44100
    contentType: Optional[str] = None

class AudioAnalysisResponse(BaseModel):
    trackId: str
    analysis: Dict[str, Any]
    status: str

class SuggestionRequest(BaseModel):
    context: Dict[str, Any]

class SuggestionResponse(BaseModel):
    suggestions: List[Dict[str, Any]]
    confidence: Optional[float] = None

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

# Transport Clock Models
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

# Global Transport State Manager
class TransportManager:
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
            import time
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
            import time
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
            import time
            self.time_seconds = time.time() - self.start_time
            self.playing = False
        return self.get_state()
    
    def resume(self) -> TransportState:
        """Resume playback from pause"""
        if not self.playing:
            import time
            self.playing = True
            self.start_time = time.time() - self.time_seconds
        return self.get_state()
    
    def seek(self, time_seconds: float) -> TransportState:
        """Seek to time position"""
        self.time_seconds = max(0.0, time_seconds)
        self.sample_pos = int(self.time_seconds * self.sample_rate)
        if self.playing:
            import time
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

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "ok",
        "service": "Codette AI Server",
        "version": "1.0.0",
        "docs": "/docs",
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        return {
            "status": "healthy",
            "service": "Codette AI Server",
            "codette_available": codette is not None,
        }
    except Exception as e:
        print(f"ERROR in /health: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e)}

@app.post("/codette/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat with Codette using specified perspective"""
    if not codette:
        return ChatResponse(
            response="Codette backend not available. Please ensure Codette is installed.",
            perspective=request.perspective or "neuralnets",
            confidence=0,
        )

    try:
        perspective = request.perspective or "neuralnets"

        # Route to perspective-specific methods
        if perspective == "neuralnets":
            response = codette.neuralNetworkPerspective(request.message)
        elif perspective == "newtonian":
            response = codette.newtonianLogic(request.message)
        elif perspective == "davinci":
            response = codette.daVinciSynthesis(request.message)
        else:
            # Fallback to neural nets
            response = codette.neuralNetworkPerspective(request.message)

        return ChatResponse(
            response=response,
            perspective=perspective,
            confidence=0.85,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/codette/analyze", response_model=AudioAnalysisResponse)
async def analyze_audio(request: AudioAnalysisRequest):
    """Analyze audio and provide insights"""
    try:
        # Placeholder for actual audio analysis
        analysis = {
            "trackId": request.trackId,
            "sampleRate": request.sampleRate,
            "duration": len(request.audioData) / request.sampleRate,
            "contentType": request.contentType or "mixed",
            "analysis": "Audio analysis placeholder",
        }

        return AudioAnalysisResponse(
            trackId=request.trackId,
            analysis=analysis,
            status="success",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/codette/suggest", response_model=SuggestionResponse)
async def get_suggestions(request: SuggestionRequest):
    """Get AI-powered suggestions based on context"""
    try:
        # Generate suggestions based on context
        suggestions = [
            {
                "type": "optimization",
                "title": "Gain Optimization",
                "description": "Consider adjusting gain levels for better headroom",
                "confidence": 0.85,
            },
            {
                "type": "effect",
                "title": "EQ Suggestion",
                "description": "Add EQ to balance frequency content",
                "confidence": 0.72,
            },
            {
                "type": "routing",
                "title": "Routing Optimization",
                "description": "Consider using buses for better mix control",
                "confidence": 0.68,
            },
        ]

        return SuggestionResponse(
            suggestions=suggestions,
            confidence=0.75,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/codette/process", response_model=ProcessResponse)
async def process_request(request: ProcessRequest):
    """Generic request processor for various Codette functions"""
    import time

    start_time = time.time()

    try:
        result_data: Dict[str, Any] = {}

        if request.type == "chat":
            payload = request.payload
            perspective = payload.get("perspective", "neuralnets")
            message = payload.get("message", "")

            if codette:
                if perspective == "neuralnets":
                    response = codette.neuralNetworkPerspective(message)
                elif perspective == "newtonian":
                    response = codette.newtonianLogic(message)
                elif perspective == "davinci":
                    response = codette.daVinciSynthesis(message)
                else:
                    response = codette.neuralNetworkPerspective(message)

                result_data = {"response": response, "perspective": perspective}
            else:
                result_data = {
                    "response": "Codette backend not available",
                    "perspective": perspective,
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

        elif request.type == "mastering":
            result_data = {
                "recommendations": [],
                "target_loudness": "-14 LUFS",
                "status": "analyzing",
            }

        elif request.type == "optimization":
            result_data = {"optimizations": [], "message": "Optimization suggestions"}

        else:
            result_data = {"message": f"Unknown request type: {request.type}"}

        processing_time = time.time() - start_time

        return ProcessResponse(
            id=request.id,
            status="success",
            data=result_data,
            processingTime=processing_time,
        )

    except Exception as e:
        processing_time = time.time() - start_time
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}",
        )

@app.get("/codette/status")
async def get_status():
    """Get current status of Codette AI server"""
    return {
        "status": "running",
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
            "mastering",
            "optimization",
        ],
    }

# ============================================================================
# AI ANALYSIS ENDPOINTS (for React AIPanel)
# ============================================================================

class AnalysisResponse(BaseModel):
    """Standard response format for AI analysis endpoints"""
    prediction: str
    confidence: float
    actionItems: Optional[List[Dict[str, Any]]] = None

@app.get("/api/health")
@app.post("/api/health")
async def api_health():
    """Health check endpoint"""
    return {"success": True, "data": {"status": "ok", "service": "codette"}, "duration": 0}

@app.post("/api/analyze/gain-staging")
async def analyze_gain_staging(request: Dict[str, Any]) -> AnalysisResponse:
    """Analyze gain staging across tracks"""
    try:
        tracks = request.get("tracks", [])
        
        # Find clipping tracks
        clipping_tracks = []
        low_headroom = []
        
        for track in tracks:
            peak = track.get("peak", -60)
            if peak > -1:
                clipping_tracks.append(track["id"])
            elif peak > -6:
                low_headroom.append(track["id"])
        
        # Generate prediction
        if clipping_tracks:
            prediction = f"⚠️ CLIPPING DETECTED on {len(clipping_tracks)} track(s). Reduce gain immediately to prevent digital distortion. Target: -6dB headroom minimum."
            confidence = 0.95
            action_items = [
                {"action": "Reduce", "parameter": f"Track {tid} Gain", "value": -3, "priority": "high"}
                for tid in clipping_tracks[:3]
            ]
        elif low_headroom:
            prediction = f"⚡ Low headroom on {len(low_headroom)} track(s). Recommended target: -6dB peak level for safe mixing margin."
            confidence = 0.85
            action_items = [
                {"action": "Reduce", "parameter": f"Track {tid} Gain", "value": -2, "priority": "medium"}
                for tid in low_headroom[:3]
            ]
        else:
            prediction = "✅ Excellent gain staging! Levels are well-optimized with good headroom across all tracks."
            confidence = 0.90
            action_items = []
        
        return AnalysisResponse(
            prediction=prediction,
            confidence=confidence,
            actionItems=action_items
        )
    except Exception as e:
        return AnalysisResponse(
            prediction=f"Error analyzing gain staging: {str(e)}",
            confidence=0,
            actionItems=[]
        )

@app.post("/api/analyze/mixing")
async def analyze_mixing(request: Dict[str, Any]) -> AnalysisResponse:
    """Suggest mixing chain for selected track"""
    try:
        track_type = request.get("trackType", "audio")
        metrics = request.get("metrics", {})
        level = metrics.get("level", -60)
        
        # Track-type specific recommendations
        recommendations = {
            "audio": {
                "chain": "EQ → Compressor → Reverb",
                "suggestion": "General audio track: Use EQ to clean up, add compression for control (4:1 ratio, 5ms attack), and reverb for space.",
                "action_items": [
                    {"action": "Add", "parameter": "EQ", "value": "Parametric", "priority": "high"},
                    {"action": "Add", "parameter": "Compressor", "value": "4:1", "priority": "high"},
                    {"action": "Add", "parameter": "Reverb", "value": "Room", "priority": "medium"},
                ]
            },
            "vocal": {
                "chain": "EQ → Compressor → Reverb → Delay",
                "suggestion": "Start with subtle EQ to remove mud (100-200Hz), then add compression (4:1 ratio, 4ms attack) for control. Add plate reverb and slapback delay for depth.",
                "action_items": [
                    {"action": "Add", "parameter": "EQ", "value": "Parametric", "priority": "high"},
                    {"action": "Add", "parameter": "Compressor", "value": "4:1", "priority": "high"},
                    {"action": "Add", "parameter": "Reverb", "value": "Plate", "priority": "medium"},
                ]
            },
            "drum": {
                "chain": "EQ → Compressor → Saturation",
                "suggestion": "Enhance drum attack with subtle saturation, use compressor to glue the kit together (3:1 ratio, 2ms attack). Boost presence around 5kHz.",
                "action_items": [
                    {"action": "Add", "parameter": "Saturation", "value": "Light", "priority": "medium"},
                    {"action": "Add", "parameter": "Compressor", "value": "3:1", "priority": "high"},
                ]
            },
            "bass": {
                "chain": "EQ → Compressor → Saturator",
                "suggestion": "Control low frequencies with high-pass filter above 30Hz. Use compressor (2:1 ratio) to lock in with drums. Add subtle saturation for warmth.",
                "action_items": [
                    {"action": "Add", "parameter": "EQ", "value": "High-Pass", "priority": "high"},
                    {"action": "Add", "parameter": "Compressor", "value": "2:1", "priority": "high"},
                ]
            },
            "guitar": {
                "chain": "EQ → Compressor → Delay → Reverb",
                "suggestion": "Use compression to even out pick dynamics (5:1 ratio). Add EQ to reduce muddiness. Combine delay and reverb for spacious, cohesive tone.",
                "action_items": [
                    {"action": "Add", "parameter": "Compressor", "value": "5:1", "priority": "high"},
                    {"action": "Add", "parameter": "Delay", "value": "Tape", "priority": "medium"},
                ]
            },
            "synth": {
                "chain": "EQ → Compressor → Reverb",
                "suggestion": "Use EQ to carve space in the mix. Compress lightly (1.5:1) to add glue. Add reverb for depth without losing definition.",
                "action_items": [
                    {"action": "Add", "parameter": "Compressor", "value": "1.5:1", "priority": "medium"},
                    {"action": "Add", "parameter": "Reverb", "value": "Room", "priority": "medium"},
                ]
            },
        }
        
        rec = recommendations.get(track_type, recommendations["audio"])
        
        return AnalysisResponse(
            prediction=rec["suggestion"],
            confidence=0.88,
            actionItems=rec.get("action_items", [])
        )
    except Exception as e:
        return AnalysisResponse(
            prediction=f"Error analyzing mixing chain: {str(e)}",
            confidence=0,
            actionItems=[]
        )

@app.post("/api/analyze/routing")
async def analyze_routing(request: Dict[str, Any]) -> AnalysisResponse:
    """Suggest routing configuration"""
    try:
        track_count = request.get("trackCount", 0)
        track_types = request.get("trackTypes", [])
        
        # Count track types
        type_counts = Counter(track_types)
        
        # Generate routing suggestion
        if track_count < 4:
            prediction = "✨ For your mix size, route all tracks to Master for simple, clean mixing."
            action_items = []
        elif track_count < 10:
            prediction = "📊 Recommended: Create 2-3 buses (Drums, Vocals, Instruments) for better control and gain staging."
            action_items = [
                {"action": "Create", "parameter": "Bus", "value": "Drums", "priority": "high"},
                {"action": "Create", "parameter": "Bus", "value": "Vocals", "priority": "high"},
                {"action": "Create", "parameter": "Bus", "value": "Instruments", "priority": "medium"},
            ]
        else:
            prediction = f"🎚️ Recommended: Create 4-5 buses by instrument group. Current mix ({track_count} tracks) will benefit from hierarchical routing."
            action_items = [
                {"action": "Create", "parameter": "Bus", "value": "Drums", "priority": "high"},
                {"action": "Create", "parameter": "Bus", "value": "Percussion", "priority": "high"},
                {"action": "Create", "parameter": "Bus", "value": "Vocals", "priority": "high"},
                {"action": "Create", "parameter": "Bus", "value": "Instruments", "priority": "medium"},
                {"action": "Create", "parameter": "Bus", "value": "FX", "priority": "medium"},
            ]
        
        return AnalysisResponse(
            prediction=prediction,
            confidence=0.92,
            actionItems=action_items
        )
    except Exception as e:
        return AnalysisResponse(
            prediction=f"Error analyzing routing: {str(e)}",
            confidence=0,
            actionItems=[]
        )

@app.post("/api/analyze/session")
async def analyze_session(request: Dict[str, Any]) -> AnalysisResponse:
    """Comprehensive session analysis"""
    try:
        track_count = request.get("trackCount", 0)
        track_metrics = request.get("trackMetrics", [])
        master_level = request.get("masterLevel", -60)
        has_clipping = request.get("hasClipping", False)
        
        insights = []
        action_items = []
        
        # Analyze clipping
        if has_clipping:
            insights.append("⚠️ Clipping detected - reduce track levels")
            action_items.append(
                {"action": "Reduce", "parameter": "Master Gain", "value": -2, "priority": "high"}
            )
        elif master_level > -6:
            insights.append("⚡ Master level high - ensure -6dB headroom for limiting/mastering")
            action_items.append(
                {"action": "Reduce", "parameter": "Master Gain", "value": -1, "priority": "medium"}
            )
        else:
            insights.append("✅ Master level healthy")
        
        # Analyze track count
        if track_count < 4:
            insights.append(f"📍 Small mix ({track_count} tracks) - focus on balance and tone")
        elif track_count < 16:
            insights.append(f"📍 Medium mix ({track_count} tracks) - organize with buses for better control")
            action_items.append(
                {"action": "Create", "parameter": "Submix Buses", "value": 3, "priority": "medium"}
            )
        else:
            insights.append(f"📍 Large mix ({track_count} tracks) - establish clear routing hierarchy")
            action_items.append(
                {"action": "Create", "parameter": "Submix Buses", "value": 5, "priority": "high"}
            )
        
        prediction = "\n".join(insights) + "\n\n📋 Recommended actions: See action items below."
        
        return AnalysisResponse(
            prediction=prediction,
            confidence=0.85,
            actionItems=action_items
        )
    except Exception as e:
        return AnalysisResponse(
            prediction=f"Error analyzing session: {str(e)}",
            confidence=0,
            actionItems=[]
        )

# ============================================================================
# TRANSPORT CLOCK ENDPOINTS (WebSocket + REST API)
# ============================================================================

@app.websocket("/ws/transport/clock")
async def websocket_transport_clock(websocket: WebSocket):
    """WebSocket endpoint for DAW transport clock synchronization"""
    try:
        await websocket.accept()
    except Exception as e:
        print(f"Failed to accept WebSocket: {e}")
        return
    
    transport_manager.connected_clients.add(websocket)
    print(f"WebSocket client connected. Total clients: {len(transport_manager.connected_clients)}")
    
    try:
        import asyncio
        import time as time_module
        
        last_send = time_module.time()
        send_interval = 1.0 / 60.0  # 60 FPS update rate
        
        # Send initial state
        try:
            state = transport_manager.get_state()
            await websocket.send_json({
                "type": "state",
                "data": state.dict()
            })
        except Exception as e:
            print(f"Failed to send initial state: {e}")
            return
        
        while True:
            try:
                # Non-blocking receive with very short timeout
                try:
                    data = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=0.001
                    )
                    try:
                        message = json.loads(data)
                        
                        # Handle incoming commands
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
                        pass  # Ignore invalid JSON
                    
                except asyncio.TimeoutError:
                    pass  # No message received, continue to send updates
                
                # Send state at regular interval
                current_time = time_module.time()
                if current_time - last_send >= send_interval:
                    try:
                        state = transport_manager.get_state()
                        await websocket.send_json({
                            "type": "state",
                            "data": state.dict()
                        })
                        last_send = current_time
                    except RuntimeError as e:
                        # Connection closed
                        print(f"Connection closed: {e}")
                        break
                    except Exception as e:
                        print(f"Send error: {e}")
                        break
                
                # Very minimal sleep
                await asyncio.sleep(0.0001)
            
            except asyncio.CancelledError:
                print("WebSocket task cancelled")
                break
            except Exception as e:
                print(f"Unexpected error in loop: {type(e).__name__}: {e}")
                break
    
    except WebSocketDisconnect:
        print("WebSocket client disconnected (clean disconnect)")
    except Exception as e:
        print(f"WebSocket handler error: {type(e).__name__}: {e}")
    finally:
        transport_manager.connected_clients.discard(websocket)
        print(f"WebSocket cleanup. Remaining clients: {len(transport_manager.connected_clients)}")

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
    """Stop playback and reset to beginning"""
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
    """Pause playback (time remains at current position)"""
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
    """Resume playback from pause"""
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
    """Seek to time position (in seconds)"""
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
    """Set playback tempo in BPM (1-300)"""
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
    """Get transport metrics for analytics"""
    state = transport_manager.get_state()
    return {
        "state": state.dict(),
        "connected_clients": len(transport_manager.connected_clients),
        "timestamp": time.time(),
        "beat_fraction": state.beat_pos,
        "sample_rate": transport_manager.sample_rate
    }

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("CODETTE_PORT", "8000"))
    host = os.getenv("CODETTE_HOST", "127.0.0.1")

    print("\n" + "="*70)
    print("Codette AI FastAPI Server Starting")
    print("="*70)
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Codette Available: {codette is not None}")
    
    if codette:
        print(f"Perspectives: neuralnets, newtonian, davinci, quantum")
    else:
        print("WARNING: Codette not initialized - check Codette/ folder")
    
    print(f"\nServer will be available at:")
    print(f"   http://localhost:{port}")
    print(f"   http://localhost:{port}/health (health check)")
    print(f"   http://localhost:{port}/docs (API documentation)")
    print("\nFrontend Configuration:")
    print(f"   Add to .env.local: VITE_CODETTE_API_URL=http://localhost:{port}")
    print(f"\nPress Ctrl+C to stop the server")
    print("="*70 + "\n")

    # Run uvicorn directly - use absolute host binding
    uvicorn.run(app, host=host, port=port, log_level="info")

