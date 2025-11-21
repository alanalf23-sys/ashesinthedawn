"""
Saturation & Distortion Effects - Phase 2.4

Professional-grade nonlinear processing for tone shaping and aggression.
Includes smooth saturation, hard clipping, and distortion algorithms.
"""

import numpy as np
from typing import Dict, Any


class Saturation:
    """
    Smooth analog-style soft clipping saturation.
    
    Simulates tape saturation and tube compression characteristics:
    - Smooth soft knee approach to clipping
    - Asymmetrical waveshaping for warmth
    - Soft saturation prevents harsh artifacts
    - Musical harmonic coloration
    
    Parameters:
    - Drive: Input gain before saturation (0 to 24 dB)
    - Tone: Filter warmth (0 to 1, higher = more low-end coloration)
    - Makeup Gain: Output compensation (-12 to +12 dB)
    - Mix: Wet/dry balance (0 to 1, 0 = dry only)
    """

    def __init__(self, name: str = "Saturation"):
        self.name = name
        self.sample_rate = 44100
        self.enabled = True
        
        # Parameters
        self.drive = 0.0  # dB
        self.tone = 0.5  # 0-1
        self.makeup_gain = 0.0  # dB
        self.mix = 1.0  # 0-1 (dry to wet)
        
        # State
        self.output_level = 0.0
        self.last_output = 0.0

    def _db_to_linear(self, db: float) -> float:
        """Convert dB to linear."""
        return 10.0 ** (db / 20.0)

    def _linear_to_db(self, linear: float) -> float:
        """Convert linear to dB."""
        return 20.0 * np.log10(max(linear, 1e-6))

    def _soft_clip(self, x: float) -> float:
        """
        Smooth saturation using tanh waveshaper.
        
        tanh provides:
        - Smooth approach to ±1 limits
        - Natural compression of peaks
        - Harmonic distortion from 2nd-8th overtones
        """
        return np.tanh(x)

    def _asymmetric_clip(self, x: float) -> float:
        """
        Asymmetrical soft clipping for tape-like character.
        Asymmetry adds even-order harmonics (warmth).
        """
        if x > 0:
            # Positive half: softer saturation
            return np.tanh(x * 0.8)
        else:
            # Negative half: slightly harder saturation
            return np.tanh(x * 1.2)

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply saturation with tone coloration."""
        if not self.enabled or signal.size == 0:
            return signal
        
        # Apply input drive
        drive_linear = self._db_to_linear(self.drive)
        saturated = signal * drive_linear
        
        # Apply soft saturation
        saturated = np.tanh(saturated)
        
        # Apply tone coloration (simple low-pass for warmth)
        if self.tone > 0.01:
            # Simple one-pole low-pass filter for coloration
            tone_coef = 0.1 * self.tone  # Smooth coefficient
            saturated_filtered = np.zeros_like(saturated)
            saturated_filtered[0] = saturated[0]
            
            for i in range(1, saturated.shape[-1]):
                saturated_filtered[i] = (
                    saturated_filtered[i-1] * (1 - tone_coef) + 
                    saturated[i] * tone_coef
                )
            saturated = saturated_filtered
        
        # Apply makeup gain
        makeup_linear = self._db_to_linear(self.makeup_gain)
        saturated = saturated * makeup_linear
        
        # Mix wet and dry
        output = signal * (1 - self.mix) + saturated * self.mix
        
        self.output_level = np.max(np.abs(output))
        
        return output

    def set_drive(self, db: float):
        """Set input drive."""
        self.drive = np.clip(db, 0, 24)

    def set_tone(self, amount: float):
        """Set tone coloration (0 = bright, 1 = warm)."""
        self.tone = np.clip(amount, 0, 1)

    def set_makeup_gain(self, db: float):
        """Set output makeup gain."""
        self.makeup_gain = np.clip(db, -12, 12)

    def set_mix(self, amount: float):
        """Set wet/dry mix (0 = dry only, 1 = wet only)."""
        self.mix = np.clip(amount, 0, 1)

    def get_output_level(self) -> float:
        """Get current output level."""
        return self.output_level

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "saturation",
            "enabled": self.enabled,
            "drive": self.drive,
            "tone": self.tone,
            "makeup_gain": self.makeup_gain,
            "mix": self.mix,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_drive(data.get("drive", 0))
        self.set_tone(data.get("tone", 0.5))
        self.set_makeup_gain(data.get("makeup_gain", 0))
        self.set_mix(data.get("mix", 1.0))


class HardClip:
    """
    Digital hard clipping at specified ceiling.
    
    Characteristics:
    - Sharp clipping at threshold
    - Creates high-order harmonics
    - Aggressive, modern sound
    - No soft knee (immediate ceiling)
    
    Parameters:
    - Threshold: Clipping level (-60 to 0 dB)
    - Mix: Wet/dry balance (0 to 1)
    """

    def __init__(self, name: str = "HardClip"):
        self.name = name
        self.sample_rate = 44100
        self.enabled = True
        
        # Parameters
        self.threshold = -1.0  # dB (just below 0)
        self.mix = 1.0  # 0-1
        
        # State
        self.clip_samples = 0

    def _db_to_linear(self, db: float) -> float:
        """Convert dB to linear."""
        return 10.0 ** (db / 20.0)

    def _linear_to_db(self, linear: float) -> float:
        """Convert linear to dB."""
        return 20.0 * np.log10(max(linear, 1e-6))

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply hard clipping."""
        if not self.enabled or signal.size == 0:
            return signal
        
        # Convert threshold to linear
        threshold_linear = self._db_to_linear(self.threshold)
        
        # Hard clip
        clipped = np.clip(signal, -threshold_linear, threshold_linear)
        
        # Count clipped samples for metering
        self.clip_samples = np.sum(np.abs(signal) > threshold_linear)
        
        # Mix wet and dry
        output = signal * (1 - self.mix) + clipped * self.mix
        
        return output

    def set_threshold(self, db: float):
        """Set clipping threshold."""
        self.threshold = np.clip(db, -60, 0)

    def set_mix(self, amount: float):
        """Set wet/dry mix."""
        self.mix = np.clip(amount, 0, 1)

    def get_clip_percentage(self, total_samples: int) -> float:
        """Get percentage of samples that are clipping."""
        if total_samples == 0:
            return 0.0
        return (self.clip_samples / total_samples) * 100

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "hardclip",
            "enabled": self.enabled,
            "threshold": self.threshold,
            "mix": self.mix,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_threshold(data.get("threshold", -1))
        self.set_mix(data.get("mix", 1.0))


class Distortion:
    """
    Aggressive distortion with multiple waveshaping algorithms.
    
    Characteristics:
    - Multiple distortion types (soft, hard, fuzz)
    - Drive control for intensity
    - Tone shaping for character
    - Intentional harmonic coloration
    
    Parameters:
    - Type: Distortion algorithm (soft, hard, fuzz)
    - Drive: Input intensity (0-24 dB)
    - Tone: Output filter (0-1, bright to warm)
    - Mix: Wet/dry balance (0-1)
    """

    def __init__(self, name: str = "Distortion"):
        self.name = name
        self.sample_rate = 44100
        self.enabled = True
        
        # Parameters
        self.distortion_type = "soft"  # soft, hard, fuzz
        self.drive = 12.0  # dB
        self.tone = 0.5  # 0-1
        self.mix = 1.0  # 0-1
        
        # State
        self.last_output = 0.0

    def _db_to_linear(self, db: float) -> float:
        """Convert dB to linear."""
        return 10.0 ** (db / 20.0)

    def _soft_distortion(self, x: float) -> float:
        """Soft distortion: smooth saturation."""
        return np.tanh(x)

    def _hard_distortion(self, x: float) -> float:
        """Hard distortion: aggressive clipping with slopes."""
        if abs(x) > 1.0:
            return np.sign(x) * (1.0 + 0.1 * np.log(abs(x)))
        else:
            return np.tanh(x * 1.5)

    def _fuzz_distortion(self, x: float) -> float:
        """Fuzz distortion: vintage fuzz-box character."""
        # Hard clip then smooth
        clipped = np.clip(x, -1, 1)
        # Add fuzz octaver effect (subtract octave)
        return clipped - 0.5 * np.sin(2 * np.pi * clipped)

    def _apply_tone(self, signal: np.ndarray, tone: float) -> np.ndarray:
        """Apply low-pass filter for tone control."""
        if tone < 0.01:
            return signal
        
        # Simple one-pole low-pass
        tone_coef = 0.1 * tone
        filtered = np.zeros_like(signal)
        filtered[0] = signal[0]
        
        for i in range(1, signal.shape[-1]):
            filtered[i] = filtered[i-1] * (1 - tone_coef) + signal[i] * tone_coef
        
        return filtered

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply distortion."""
        if not self.enabled or signal.size == 0:
            return signal
        
        # Apply drive
        drive_linear = self._db_to_linear(self.drive)
        distorted = signal * drive_linear
        
        # Apply distortion type
        if self.distortion_type == "soft":
            distorted = np.tanh(distorted)
        elif self.distortion_type == "hard":
            distorted = np.array([self._hard_distortion(x) for x in distorted])
        elif self.distortion_type == "fuzz":
            distorted = np.array([self._fuzz_distortion(x) for x in distorted])
        
        # Apply tone
        if self.tone > 0.01:
            distorted = self._apply_tone(distorted, self.tone)
        
        # Mix wet and dry
        output = signal * (1 - self.mix) + distorted * self.mix
        
        self.last_output = output
        
        return output

    def set_type(self, dtype: str):
        """Set distortion type (soft, hard, fuzz)."""
        if dtype in ["soft", "hard", "fuzz"]:
            self.distortion_type = dtype

    def set_drive(self, db: float):
        """Set drive intensity."""
        self.drive = np.clip(db, 0, 24)

    def set_tone(self, amount: float):
        """Set tone coloration."""
        self.tone = np.clip(amount, 0, 1)

    def set_mix(self, amount: float):
        """Set wet/dry mix."""
        self.mix = np.clip(amount, 0, 1)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "distortion",
            "enabled": self.enabled,
            "distortion_type": self.distortion_type,
            "drive": self.drive,
            "tone": self.tone,
            "mix": self.mix,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_type(data.get("distortion_type", "soft"))
        self.set_drive(data.get("drive", 12))
        self.set_tone(data.get("tone", 0.5))
        self.set_mix(data.get("mix", 1.0))


class WaveShaper:
    """
    Generic waveshaper for custom transfer curves.
    
    Enables professional distortion shaping with:
    - Multiple curve types (sine, square, cubic)
    - Adjustable saturation point
    - Harmonic content control
    
    Parameters:
    - Curve: Waveshape algorithm (sine, square, cubic, tanh)
    - Drive: Input intensity
    - Mix: Wet/dry balance
    """

    def __init__(self, name: str = "WaveShaper"):
        self.name = name
        self.sample_rate = 44100
        self.enabled = True
        
        # Parameters
        self.curve = "tanh"  # sine, square, cubic, tanh
        self.drive = 1.0
        self.mix = 1.0

    def _sine_curve(self, x: float) -> float:
        """Sine waveshaper: smooth, musical."""
        return np.sin(x * np.pi / 2) * np.sign(x)

    def _square_curve(self, x: float) -> float:
        """Square waveshaper: aggressive, bit-crusher."""
        return np.sign(x) * (1.0 if abs(x) > 0.5 else abs(x) * 2)

    def _cubic_curve(self, x: float) -> float:
        """Cubic waveshaper: soft distortion."""
        return x - (x ** 3) / 3

    def _tanh_curve(self, x: float) -> float:
        """Tanh waveshaper: smooth saturation."""
        return np.tanh(x)

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply waveshaping."""
        if not self.enabled or signal.size == 0:
            return signal
        
        # Apply drive
        driven = signal * self.drive
        
        # Select curve
        if self.curve == "sine":
            shaped = np.array([self._sine_curve(x) for x in driven])
        elif self.curve == "square":
            shaped = np.array([self._square_curve(x) for x in driven])
        elif self.curve == "cubic":
            shaped = np.array([self._cubic_curve(x) for x in driven])
        else:  # tanh
            shaped = np.tanh(driven)
        
        # Mix wet and dry
        output = signal * (1 - self.mix) + shaped * self.mix
        
        return output

    def set_curve(self, curve: str):
        """Set waveshape curve."""
        if curve in ["sine", "square", "cubic", "tanh"]:
            self.curve = curve

    def set_drive(self, amount: float):
        """Set drive intensity."""
        self.drive = np.clip(amount, 0.1, 10.0)

    def set_mix(self, amount: float):
        """Set wet/dry mix."""
        self.mix = np.clip(amount, 0, 1)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "waveshaper",
            "enabled": self.enabled,
            "curve": self.curve,
            "drive": self.drive,
            "mix": self.mix,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_curve(data.get("curve", "tanh"))
        self.set_drive(data.get("drive", 1.0))
        self.set_mix(data.get("mix", 1.0))
