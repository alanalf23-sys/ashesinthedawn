"""
DSP Effects API Endpoints for CoreLogic Studio
Provides REST API interface to Python DSP effects for React frontend consumption
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Try to import DSP effects
try:
    from daw_core.fx.eq_and_dynamics import EQ3Band, HighLowPass, Compressor, Limiter, Expander, Gate
    from daw_core.fx.saturation_distortion import Saturation, HardClip, Distortion, WaveShaper
    from daw_core.fx.delay_effects import SimpleDelay, PingPongDelay, MultiTap, StereoDelay
    from daw_core.fx.reverb_algorithms import Freeverb, HallReverb, PlateReverb, RoomReverb
    from daw_core.fx.modulation_and_utility import Chorus, Flanger, Tremolo, Gain, WidthControl, DynamicEQ
    from daw_core.automation import AutomationCurve, LFO, Envelope, AutomatedParameter
    DSP_AVAILABLE = True
    logger.info("✅ DAW Core DSP effects imported successfully")
except ImportError as e:
    DSP_AVAILABLE = False
    logger.warning(f"⚠️ DSP effects not available: {e}")

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class EffectParameter(BaseModel):
    """Parameter definition for an effect"""
    name: str
    min: float
    max: float
    default: float
    unit: Optional[str] = None

class EffectInfo(BaseModel):
    """Information about an available effect"""
    id: str
    name: str
    category: str
    description: Optional[str] = None
    parameters: Dict[str, EffectParameter]

class AudioProcessRequest(BaseModel):
    """Request to process audio through an effect"""
    audioData: List[float]
    sampleRate: int
    effectType: str
    parameters: Dict[str, float]
    stereoChannels: int = 2

class AudioProcessResponse(BaseModel):
    """Response after processing audio"""
    audioData: List[float]
    success: bool
    processingTime: float
    error: Optional[str] = None

# ============================================================================
# EFFECT REGISTRY
# ============================================================================

EFFECTS_REGISTRY = {
    # EQ Effects
    "eq_3band": {
        "class": EQ3Band,
        "name": "3-Band EQ",
        "category": "eq",
        "parameters": {
            "low_gain": EffectParameter(name="Low Gain", min=-24, max=24, default=0, unit="dB"),
            "low_freq": EffectParameter(name="Low Frequency", min=20, max=500, default=100, unit="Hz"),
            "low_q": EffectParameter(name="Low Q", min=0.1, max=2, default=0.7),
            "mid_gain": EffectParameter(name="Mid Gain", min=-24, max=24, default=0, unit="dB"),
            "mid_freq": EffectParameter(name="Mid Frequency", min=200, max=4000, default=1000, unit="Hz"),
            "mid_q": EffectParameter(name="Mid Q", min=0.1, max=2, default=0.7),
            "high_gain": EffectParameter(name="High Gain", min=-24, max=24, default=0, unit="dB"),
            "high_freq": EffectParameter(name="High Frequency", min=2000, max=20000, default=8000, unit="Hz"),
            "high_q": EffectParameter(name="High Q", min=0.1, max=2, default=0.7),
        }
    },
    "compressor": {
        "class": Compressor,
        "name": "Compressor",
        "category": "dynamics",
        "parameters": {
            "threshold": EffectParameter(name="Threshold", min=-60, max=0, default=-20, unit="dB"),
            "ratio": EffectParameter(name="Ratio", min=1, max=16, default=4),
            "attack": EffectParameter(name="Attack", min=0, max=100, default=5, unit="ms"),
            "release": EffectParameter(name="Release", min=0, max=1000, default=50, unit="ms"),
            "makeup_gain": EffectParameter(name="Makeup Gain", min=0, max=60, default=0, unit="dB"),
        }
    },
    "reverb_plate": {
        "class": PlateReverb,
        "name": "Plate Reverb",
        "category": "reverb",
        "parameters": {
            "decay": EffectParameter(name="Decay", min=0.1, max=2, default=1),
            "damping": EffectParameter(name="Damping", min=0, max=1, default=0.5),
            "width": EffectParameter(name="Width", min=0, max=1, default=1),
            "wet": EffectParameter(name="Wet", min=0, max=1, default=0.5),
        }
    },
    "chorus": {
        "class": Chorus,
        "name": "Chorus",
        "category": "modulation",
        "parameters": {
            "rate": EffectParameter(name="Rate", min=0.1, max=10, default=1.5, unit="Hz"),
            "depth": EffectParameter(name="Depth", min=0, max=1, default=0.5),
            "wet": EffectParameter(name="Wet", min=0, max=1, default=0.5),
        }
    },
    "delay": {
        "class": SimpleDelay,
        "name": "Simple Delay",
        "category": "delay",
        "parameters": {
            "delay_time": EffectParameter(name="Delay Time", min=0, max=2, default=0.5, unit="s"),
            "feedback": EffectParameter(name="Feedback", min=0, max=0.9, default=0.5),
            "wet": EffectParameter(name="Wet", min=0, max=1, default=0.5),
        }
    },
    "gain": {
        "class": Gain,
        "name": "Gain",
        "category": "utility",
        "parameters": {
            "gain_db": EffectParameter(name="Gain", min=-60, max=60, default=0, unit="dB"),
        }
    },
}

# ============================================================================
# ROUTER
# ============================================================================

router = APIRouter(prefix="/daw/effects", tags=["DSP Effects"])

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/list")
async def list_effects():
    """
    Get list of all available DSP effects
    Returns effect info including parameters and ranges
    """
    try:
        if not DSP_AVAILABLE:
            return {
                "effects": [],
                "status": "dsp_unavailable",
                "message": "DSP effects not available"
            }

        effects_list = []
        for effect_id, effect_config in EFFECTS_REGISTRY.items():
            effect_info = {
                "id": effect_id,
                "name": effect_config["name"],
                "category": effect_config["category"],
                "parameters": {
                    param_id: {
                        "name": param.name,
                        "min": param.min,
                        "max": param.max,
                        "default": param.default,
                        "unit": param.unit
                    }
                    for param_id, param in effect_config["parameters"].items()
                }
            }
            effects_list.append(effect_info)

        return {
            "effects": effects_list,
            "count": len(effects_list),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error listing effects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{effect_id}")
async def get_effect_info(effect_id: str):
    """
    Get detailed information about a specific effect
    """
    try:
        if effect_id not in EFFECTS_REGISTRY:
            raise HTTPException(status_code=404, detail=f"Effect '{effect_id}' not found")

        effect_config = EFFECTS_REGISTRY[effect_id]
        return {
            "id": effect_id,
            "name": effect_config["name"],
            "category": effect_config["category"],
            "parameters": {
                param_id: {
                    "name": param.name,
                    "min": param.min,
                    "max": param.max,
                    "default": param.default,
                    "unit": param.unit
                }
                for param_id, param in effect_config["parameters"].items()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting effect info: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process")
async def process_audio(request: AudioProcessRequest):
    """
    Process audio through a specific effect
    
    Request body:
    - audioData: array of audio samples (flat array, interleaved if stereo)
    - sampleRate: sample rate in Hz
    - effectType: effect ID (e.g., 'eq_3band', 'compressor')
    - parameters: dict of parameter values
    - stereoChannels: 1 for mono, 2 for stereo (default: 2)
    """
    try:
        if not DSP_AVAILABLE:
            raise HTTPException(status_code=503, detail="DSP effects not available")

        if request.effectType not in EFFECTS_REGISTRY:
            raise HTTPException(status_code=404, detail=f"Effect '{request.effectType}' not found")

        effect_config = EFFECTS_REGISTRY[request.effectType]

        # Convert audio data to numpy array
        audio_array = np.array(request.audioData, dtype=np.float32)

        # Reshape for stereo if needed
        if request.stereoChannels == 2:
            # Interleaved stereo -> (samples, 2)
            audio_array = audio_array.reshape(-1, 2)
        elif request.stereoChannels != 1:
            raise ValueError(f"Unsupported channel count: {request.stereoChannels}")

        # Create effect instance
        effect_class = effect_config["class"]
        effect = effect_class(request.effectType)

        # Apply parameters
        for param_id, param_value in request.parameters.items():
            # Convert parameter ID to effect method name (e.g., 'low_gain' -> 'set_low_gain')
            method_name = f"set_{param_id}"
            if hasattr(effect, method_name):
                getattr(effect, method_name)(param_value)
            else:
                logger.warning(f"Effect {request.effectType} has no method {method_name}")

        # Process audio
        import time
        start_time = time.time()
        processed_audio = effect.process(audio_array)
        processing_time = (time.time() - start_time) * 1000  # ms

        # Convert back to flat array
        if request.stereoChannels == 2:
            processed_audio = processed_audio.flatten().tolist()
        else:
            processed_audio = processed_audio.tolist()

        logger.info(
            f"Processed {len(request.audioData)} samples through {request.effectType} "
            f"in {processing_time:.2f}ms"
        )

        return AudioProcessResponse(
            audioData=processed_audio,
            success=True,
            processingTime=processing_time
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing audio: {e}", exc_info=True)
        return AudioProcessResponse(
            audioData=request.audioData,  # Return original on error
            success=False,
            processingTime=0,
            error=str(e)
        )


# Export router to be included in main app
__all__ = ["router"]
