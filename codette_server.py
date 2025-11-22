"""
Codette AI FastAPI Server
Bridges CoreLogic Studio frontend with Codette Python AI engine
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import sys
import os
from pathlib import Path

# Add Codette to path
codette_path = Path(__file__).parent / "Codette"
sys.path.insert(0, str(codette_path))

try:
    from codette import Codette
except ImportError:
    # Fallback if import fails
    Codette = None

app = FastAPI(title="Codette AI Server", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Initialize Codette
codette = None
if Codette:
    try:
        codette = Codette()
    except Exception as e:
        print(f"Warning: Failed to initialize Codette: {e}")

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Codette AI Server",
        "codette_available": codette is not None,
    }

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

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("CODETTE_PORT", "8000")),
    )
