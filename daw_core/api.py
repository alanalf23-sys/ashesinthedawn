"""
FastAPI wrapper for DAW Core DSP backend
Exposes audio effects, automation, and metering via REST API
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
import io
from scipy.io import wavfile

from .fx.eq_and_dynamics import EQ3Band, HighLowPass, Compressor
from .fx.dynamics_part2 import Limiter
from .fx.saturation import Saturation, Distortion
from .fx.delays import SimpleDelay
from .fx.reverb import Reverb
from .automation import AutomationCurve, LFO, Envelope
from .metering import LevelMeter, SpectrumAnalyzer, VUMeter, Correlometer
from .engine import AudioEngine

# Create FastAPI app
app = FastAPI(
    title="CoreLogic Studio DAW Backend",
    description="Professional audio DSP engine with effects, automation, and metering",
    version="0.3.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global audio engine
audio_engine = AudioEngine(sample_rate=44100, buffer_size=1024)

# ============================================================================
# DATA MODELS
# ============================================================================

class EffectParameter(BaseModel):
    """Effect parameter definition"""
    name: str
    value: float
    min_val: float
    max_val: float
    unit: str = ""

class ProcessAudioRequest(BaseModel):
    """Request to process audio with effect"""
    effect_type: str
    parameters: Dict[str, float]
    audio_data: List[float]  # Audio samples

class AutomationRequest(BaseModel):
    """Request to apply automation"""
    automation_type: str  # 'curve', 'lfo', 'envelope'
    parameters: Dict[str, Any]
    duration: float
    sample_rate: int = 44100

class MeteringRequest(BaseModel):
    """Request to analyze audio"""
    meter_type: str  # 'level', 'spectrum', 'vu', 'correlation'
    audio_data: List[float]
    sample_rate: int = 44100

# ============================================================================
# HEALTH & INFO ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    """Root endpoint - API status"""
    return {
        "name": "CoreLogic Studio DAW Backend",
        "version": "0.3.0",
        "status": "running",
        "sample_rate": audio_engine.sample_rate,
        "buffer_size": audio_engine.buffer_size
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "engine_running": audio_engine.is_running}

@app.get("/effects")
def list_effects():
    """List all available effects"""
    return {
        "eq": ["HighPass", "LowPass", "Parametric", "Graphic"],
        "dynamics": ["Compressor", "Limiter", "Expander", "Gate"],
        "saturation": ["Saturation", "Distortion", "WaveShaper"],
        "delays": ["SimpleDelay", "PingPong", "MultiTap", "StereoDelay"],
        "reverb": ["Freeverb", "HallReverb", "PlateReverb", "RoomReverb"],
        "total": 19
    }

@app.get("/automation-types")
def list_automation_types():
    """List available automation types"""
    return {
        "types": ["curve", "lfo", "envelope"],
        "description": "Automation shapes for parameter modulation"
    }

@app.get("/metering-types")
def list_metering_types():
    """List available metering tools"""
    return {
        "types": ["level", "spectrum", "vu", "correlation"],
        "description": "Audio analysis and visualization tools"
    }

# ============================================================================
# EFFECT PROCESSING ENDPOINTS
# ============================================================================

@app.post("/process/eq/highpass")
def process_highpass(request: ProcessAudioRequest):
    """Apply highpass filter"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)
        cutoff = request.parameters.get("cutoff", 100)

        fx = HighLowPass(filter_type="highpass", cutoff=cutoff, sample_rate=audio_engine.sample_rate)
        output = fx.process(audio)

        return {
            "status": "success",
            "effect": "HighPass",
            "parameters": {"cutoff": cutoff},
            "output": output.tolist(),
            "length": len(output)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/process/eq/lowpass")
def process_lowpass(request: ProcessAudioRequest):
    """Apply lowpass filter"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)
        cutoff = request.parameters.get("cutoff", 5000)

        fx = HighLowPass(filter_type="lowpass", cutoff=cutoff, sample_rate=audio_engine.sample_rate)
        output = fx.process(audio)

        return {
            "status": "success",
            "effect": "LowPass",
            "parameters": {"cutoff": cutoff},
            "output": output.tolist(),
            "length": len(output)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/process/eq/3band")
def process_3band_eq(request: ProcessAudioRequest):
    """Apply 3-band EQ"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)

        fx = EQ3Band()
        fx.sample_rate = audio_engine.sample_rate
        fx.low_gain = request.parameters.get("low_gain", 0)
        fx.mid_gain = request.parameters.get("mid_gain", 0)
        fx.high_gain = request.parameters.get("high_gain", 0)

        output = fx.process(audio)

        return {
            "status": "success",
            "effect": "EQ3Band",
            "parameters": {
                "low_gain": fx.low_gain,
                "mid_gain": fx.mid_gain,
                "high_gain": fx.high_gain
            },
            "output": output.tolist(),
            "length": len(output)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/process/dynamics/compressor")
def process_compressor(request: ProcessAudioRequest):
    """Apply compressor"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)
        threshold = request.parameters.get("threshold", -20)
        ratio = request.parameters.get("ratio", 4)
        attack = request.parameters.get("attack", 0.005)
        release = request.parameters.get("release", 0.1)

        fx = Compressor(
            threshold=threshold,
            ratio=ratio,
            attack_time=attack,
            release_time=release,
            sample_rate=audio_engine.sample_rate
        )
        output = fx.process(audio)

        return {
            "status": "success",
            "effect": "Compressor",
            "parameters": {
                "threshold": threshold,
                "ratio": ratio,
                "attack": attack,
                "release": release
            },
            "output": output.tolist(),
            "length": len(output)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/process/dynamics/limiter")
def process_limiter(request: ProcessAudioRequest):
    """Apply limiter"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)
        threshold = request.parameters.get("threshold", -3)
        attack = request.parameters.get("attack", 0.001)
        release = request.parameters.get("release", 0.05)

        fx = Limiter(
            threshold=threshold,
            attack_time=attack,
            release_time=release,
            sample_rate=audio_engine.sample_rate
        )
        output = fx.process(audio)

        return {
            "status": "success",
            "effect": "Limiter",
            "parameters": {
                "threshold": threshold,
                "attack": attack,
                "release": release
            },
            "output": output.tolist(),
            "length": len(output)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/process/saturation/saturation")
def process_saturation(request: ProcessAudioRequest):
    """Apply saturation"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)
        drive = request.parameters.get("drive", 1.0)
        tone = request.parameters.get("tone", 0.5)

        fx = Saturation(drive=drive, tone=tone)
        output = fx.process(audio)

        return {
            "status": "success",
            "effect": "Saturation",
            "parameters": {"drive": drive, "tone": tone},
            "output": output.tolist(),
            "length": len(output)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/process/saturation/distortion")
def process_distortion(request: ProcessAudioRequest):
    """Apply distortion"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)
        amount = request.parameters.get("amount", 0.5)

        fx = Distortion(amount=amount)
        output = fx.process(audio)

        return {
            "status": "success",
            "effect": "Distortion",
            "parameters": {"amount": amount},
            "output": output.tolist(),
            "length": len(output)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/process/delay/simple")
def process_simple_delay(request: ProcessAudioRequest):
    """Apply simple delay"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)
        delay_time = request.parameters.get("delay_time", 0.5)
        feedback = request.parameters.get("feedback", 0.5)
        mix = request.parameters.get("mix", 0.5)

        fx = SimpleDelay(
            delay_time=delay_time,
            feedback=feedback,
            mix=mix,
            sample_rate=audio_engine.sample_rate
        )
        output = fx.process(audio)

        return {
            "status": "success",
            "effect": "SimpleDelay",
            "parameters": {
                "delay_time": delay_time,
                "feedback": feedback,
                "mix": mix
            },
            "output": output.tolist(),
            "length": len(output)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/process/reverb/freeverb")
def process_freeverb(request: ProcessAudioRequest):
    """Apply Reverb"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)
        room = request.parameters.get("room", 0.5)
        damp = request.parameters.get("damp", 0.5)
        wet = request.parameters.get("wet", 0.33)

        fx = Reverb(room_size=room, damping=damp, wet=wet, dry=1-wet)
        output = fx.process(audio)

        return {
            "status": "success",
            "effect": "Reverb",
            "parameters": {
                "room": room,
                "damp": damp,
                "wet": wet
            },
            "output": output.tolist(),
            "length": len(output)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# AUTOMATION ENDPOINTS
# ============================================================================

@app.post("/automation/curve")
def create_automation_curve(request: AutomationRequest):
    """Create automation curve"""
    try:
        curve_type = request.parameters.get("curve_type", "linear")
        start_value = request.parameters.get("start_value", 0)
        end_value = request.parameters.get("end_value", 1)

        curve = AutomationCurve(
            curve_type=curve_type,
            start_value=start_value,
            end_value=end_value,
            duration=request.duration
        )

        values = curve.get_values(
            num_samples=int(request.duration * request.sample_rate)
        )

        return {
            "status": "success",
            "automation_type": "curve",
            "curve_type": curve_type,
            "duration": request.duration,
            "values": values.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/automation/lfo")
def create_lfo(request: AutomationRequest):
    """Create LFO modulation"""
    try:
        waveform = request.parameters.get("waveform", "sine")
        rate = request.parameters.get("rate", 1.0)
        amount = request.parameters.get("amount", 1.0)

        lfo = LFO(waveform=waveform, rate=rate, amount=amount)

        values = lfo.get_values(
            num_samples=int(request.duration * request.sample_rate)
        )

        return {
            "status": "success",
            "automation_type": "lfo",
            "waveform": waveform,
            "rate": rate,
            "amount": amount,
            "duration": request.duration,
            "values": values.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/automation/envelope")
def create_envelope(request: AutomationRequest):
    """Create ADSR envelope"""
    try:
        attack = request.parameters.get("attack", 0.1)
        decay = request.parameters.get("decay", 0.2)
        sustain = request.parameters.get("sustain", 0.7)
        release = request.parameters.get("release", 0.3)

        envelope = Envelope(
            attack_time=attack,
            decay_time=decay,
            sustain_level=sustain,
            release_time=release
        )

        values = envelope.get_values(
            num_samples=int(request.duration * request.sample_rate)
        )

        return {
            "status": "success",
            "automation_type": "envelope",
            "attack": attack,
            "decay": decay,
            "sustain": sustain,
            "release": release,
            "duration": request.duration,
            "values": values.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# METERING ENDPOINTS
# ============================================================================

@app.post("/metering/level")
def analyze_level(request: MeteringRequest):
    """Analyze audio levels"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)

        meter = LevelMeter(sample_rate=request.sample_rate)
        results = meter.analyze(audio)

        return {
            "status": "success",
            "meter_type": "level",
            "peak": float(results.get("peak", 0)),
            "rms": float(results.get("rms", 0)),
            "loudness_lufs": float(results.get("loudness", 0)),
            "headroom": float(results.get("headroom", 0))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/metering/spectrum")
def analyze_spectrum(request: MeteringRequest):
    """Analyze frequency spectrum"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)

        analyzer = SpectrumAnalyzer(sample_rate=request.sample_rate)
        freqs, magnitudes = analyzer.analyze(audio)

        return {
            "status": "success",
            "meter_type": "spectrum",
            "frequencies": freqs.tolist(),
            "magnitudes": magnitudes.tolist(),
            "num_bins": len(freqs)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/metering/vu")
def analyze_vu(request: MeteringRequest):
    """Analyze VU meter values"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)

        meter = VUMeter(sample_rate=request.sample_rate)
        vu_value = meter.analyze(audio)

        return {
            "status": "success",
            "meter_type": "vu",
            "vu_db": float(vu_value),
            "scaled": float((vu_value + 12) / 24)  # Normalized to 0-1
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/metering/correlation")
def analyze_correlation(request: MeteringRequest):
    """Analyze stereo correlation"""
    try:
        audio = np.array(request.audio_data, dtype=np.float32)

        correlometer = Correlometer()
        correlation = correlometer.analyze(audio)

        return {
            "status": "success",
            "meter_type": "correlation",
            "correlation": float(correlation),
            "mono": correlation > 0.9,
            "stereo": correlation < 0.5
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# AUDIO FILE ENDPOINTS
# ============================================================================

@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    """Upload and process audio file"""
    try:
        contents = await file.read()
        audio_data, sample_rate = wavfile.read(io.BytesIO(contents))

        # Convert to mono if stereo
        if len(audio_data.shape) > 1:
            audio_data = np.mean(audio_data, axis=1)

        # Normalize
        max_val = np.max(np.abs(audio_data))
        if max_val > 0:
            audio_data = audio_data / max_val

        return {
            "status": "success",
            "filename": file.filename,
            "sample_rate": int(sample_rate),
            "duration": float(len(audio_data) / sample_rate),
            "num_samples": len(audio_data),
            "audio_data": audio_data.tolist()[:44100]  # Return first second
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# ENGINE CONTROL ENDPOINTS
# ============================================================================

@app.post("/engine/start")
def start_engine():
    """Start audio engine"""
    try:
        audio_engine.is_running = True
        return {"status": "success", "engine_state": "running"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/engine/stop")
def stop_engine():
    """Stop audio engine"""
    try:
        audio_engine.is_running = False
        return {"status": "success", "engine_state": "stopped"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/engine/config")
def get_engine_config():
    """Get engine configuration"""
    return {
        "sample_rate": audio_engine.sample_rate,
        "buffer_size": audio_engine.buffer_size,
        "is_running": audio_engine.is_running,
        "num_nodes": len(audio_engine.nodes)
    }

@app.post("/engine/config")
def set_engine_config(sample_rate: int = 44100, buffer_size: int = 1024):
    """Configure audio engine"""
    try:
        audio_engine.sample_rate = sample_rate
        audio_engine.buffer_size = buffer_size
        return {
            "status": "success",
            "sample_rate": audio_engine.sample_rate,
            "buffer_size": audio_engine.buffer_size
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
