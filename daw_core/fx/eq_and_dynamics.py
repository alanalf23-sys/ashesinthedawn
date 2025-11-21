"""
DSP Effects Library - Phase 2

Professional-grade audio processing effects built on top of the DAW core.
All effects inherit from FXNode and follow the standardized interface.

Each effect module handles:
- Parameter management
- DSP algorithm implementation
- Real-time processing
- Parameter smoothing
"""

import numpy as np
from typing import Optional, Dict, Any
from scipy.signal import butter, lfilter, sosfilt
import math


# ============================================================================
# EQ EFFECTS
# ============================================================================


class EQ3Band:
    """
    3-Band Parametric EQ with Low, Mid, High shelving filters.
    
    Provides professional-grade tone shaping with:
    - Low band: Shelving filter (80-200 Hz)
    - Mid band: Peaking filter (400-4k Hz)
    - High band: Shelving filter (4k-16k Hz)
    
    Each band has:
    - Gain (-24 to +24 dB)
    - Frequency (center frequency)
    - Q (bandwidth, 0.1 to 10)
    """

    def __init__(self, name: str = "EQ3Band"):
        self.name = name
        self.sample_rate = 44100
        self.enabled = True
        
        # Band parameters
        self.low_gain = 0.0  # dB
        self.low_freq = 100.0  # Hz
        self.low_q = 0.707
        
        self.mid_gain = 0.0
        self.mid_freq = 1000.0
        self.mid_q = 0.707
        
        self.high_gain = 0.0
        self.high_freq = 10000.0
        self.high_q = 0.707
        
        # Filter coefficients (will be calculated)
        self.low_sos = None
        self.mid_sos = None
        self.high_sos = None
        
        # State for each channel
        self.low_zi = None
        self.mid_zi = None
        self.high_zi = None
        
        self._update_filters()

    def _update_filters(self):
        """Recalculate filter coefficients."""
        nyquist = self.sample_rate / 2
        
        # Low band (shelving)
        low_norm_freq = self.low_freq / nyquist
        self.low_sos = self._design_shelf_filter(
            low_norm_freq, self.low_q, self.low_gain, "low"
        )
        
        # Mid band (peaking)
        mid_norm_freq = self.mid_freq / nyquist
        self.mid_sos = self._design_peaking_filter(
            mid_norm_freq, self.mid_q, self.mid_gain
        )
        
        # High band (shelving)
        high_norm_freq = self.high_freq / nyquist
        self.high_sos = self._design_shelf_filter(
            high_norm_freq, self.high_q, self.high_gain, "high"
        )

    @staticmethod
    def _design_peaking_filter(norm_freq: float, q: float, gain_db: float) -> np.ndarray:
        """Design a peaking (bell) filter."""
        A = 10.0 ** (gain_db / 40.0)
        w0 = 2 * np.pi * norm_freq
        alpha = np.sin(w0) / (2 * q)
        
        b0 = 1 + alpha * A
        b1 = -2 * np.cos(w0)
        b2 = 1 - alpha * A
        a0 = 1 + alpha / A
        a1 = -2 * np.cos(w0)
        a2 = 1 - alpha / A
        
        return np.array([[b0/a0, b1/a0, b2/a0, 1, a1/a0, a2/a0]])

    @staticmethod
    def _design_shelf_filter(norm_freq: float, q: float, gain_db: float, 
                           shelf_type: str) -> np.ndarray:
        """Design a shelving filter (low or high)."""
        A = 10.0 ** (gain_db / 40.0)
        w0 = 2 * np.pi * norm_freq
        S = 1.0  # Shelf slope (1 = moderate)
        alpha = np.sin(w0) / (2 * q)
        
        if shelf_type == "low":
            b0 = A * ((A + 1) - (A - 1) * np.cos(w0) + 2 * np.sqrt(A) * alpha)
            b1 = 2 * A * ((A - 1) - (A + 1) * np.cos(w0))
            b2 = A * ((A + 1) - (A - 1) * np.cos(w0) - 2 * np.sqrt(A) * alpha)
            a0 = (A + 1) + (A - 1) * np.cos(w0) + 2 * np.sqrt(A) * alpha
            a1 = -2 * ((A - 1) + (A + 1) * np.cos(w0))
            a2 = (A + 1) + (A - 1) * np.cos(w0) - 2 * np.sqrt(A) * alpha
        else:  # high
            b0 = A * ((A + 1) + (A - 1) * np.cos(w0) + 2 * np.sqrt(A) * alpha)
            b1 = -2 * A * ((A - 1) + (A + 1) * np.cos(w0))
            b2 = A * ((A + 1) + (A - 1) * np.cos(w0) - 2 * np.sqrt(A) * alpha)
            a0 = (A + 1) - (A - 1) * np.cos(w0) + 2 * np.sqrt(A) * alpha
            a1 = 2 * ((A - 1) - (A + 1) * np.cos(w0))
            a2 = (A + 1) - (A - 1) * np.cos(w0) - 2 * np.sqrt(A) * alpha
        
        return np.array([[b0/a0, b1/a0, b2/a0, 1, a1/a0, a2/a0]])

    def set_low_band(self, gain_db: float, freq_hz: float, q: float):
        """Update low band parameters."""
        self.low_gain = np.clip(gain_db, -24, 24)
        self.low_freq = np.clip(freq_hz, 20, 500)
        self.low_q = np.clip(q, 0.1, 10.0)
        self._update_filters()

    def set_mid_band(self, gain_db: float, freq_hz: float, q: float):
        """Update mid band parameters."""
        self.mid_gain = np.clip(gain_db, -24, 24)
        self.mid_freq = np.clip(freq_hz, 200, 5000)
        self.mid_q = np.clip(q, 0.1, 10.0)
        self._update_filters()

    def set_high_band(self, gain_db: float, freq_hz: float, q: float):
        """Update high band parameters."""
        self.high_gain = np.clip(gain_db, -24, 24)
        self.high_freq = np.clip(freq_hz, 4000, 20000)
        self.high_q = np.clip(q, 0.1, 10.0)
        self._update_filters()

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply all three EQ bands."""
        if not self.enabled or signal.size == 0:
            return signal
        
        output = signal.copy()
        
        # Apply each band
        if self.low_sos is not None:
            output = sosfilt(self.low_sos, output, axis=-1)
        if self.mid_sos is not None:
            output = sosfilt(self.mid_sos, output, axis=-1)
        if self.high_sos is not None:
            output = sosfilt(self.high_sos, output, axis=-1)
        
        return output

    def to_dict(self) -> Dict[str, Any]:
        """Serialize EQ state."""
        return {
            "name": self.name,
            "type": "eq3band",
            "enabled": self.enabled,
            "low_band": {
                "gain": self.low_gain,
                "freq": self.low_freq,
                "q": self.low_q,
            },
            "mid_band": {
                "gain": self.mid_gain,
                "freq": self.mid_freq,
                "q": self.mid_q,
            },
            "high_band": {
                "gain": self.high_gain,
                "freq": self.high_freq,
                "q": self.high_q,
            },
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load EQ state."""
        self.enabled = data.get("enabled", True)
        low = data.get("low_band", {})
        self.set_low_band(low.get("gain", 0), low.get("freq", 100), low.get("q", 0.707))
        mid = data.get("mid_band", {})
        self.set_mid_band(mid.get("gain", 0), mid.get("freq", 1000), mid.get("q", 0.707))
        high = data.get("high_band", {})
        self.set_high_band(high.get("gain", 0), high.get("freq", 10000), high.get("q", 0.707))


class HighLowPass:
    """
    Simple high-pass and low-pass filter.
    
    Useful for:
    - Removing rumble (high-pass)
    - Cutting harshness (low-pass)
    - Basic tone shaping
    
    Parameters:
    - Filter type (highpass or lowpass)
    - Cutoff frequency
    - Order (1-6, higher = steeper)
    """

    def __init__(self, name: str = "HighLowPass"):
        self.name = name
        self.sample_rate = 44100
        self.enabled = True
        
        self.filter_type = "highpass"  # or "lowpass"
        self.cutoff_freq = 1000.0  # Hz
        self.order = 2  # Filter order
        
        self.sos = None
        self._update_filter()

    def _update_filter(self):
        """Recalculate filter coefficients."""
        nyquist = self.sample_rate / 2
        norm_freq = np.clip(self.cutoff_freq / nyquist, 0.01, 0.99)
        
        self.sos = butter(self.order, norm_freq, btype=self.filter_type, output='sos')

    def set_cutoff(self, freq_hz: float):
        """Set cutoff frequency."""
        self.cutoff_freq = np.clip(freq_hz, 20, 20000)
        self._update_filter()

    def set_type(self, filter_type: str):
        """Set filter type (highpass or lowpass)."""
        self.filter_type = filter_type
        self._update_filter()

    def set_order(self, order: int):
        """Set filter order (steepness)."""
        self.order = np.clip(order, 1, 6)
        self._update_filter()

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply filter."""
        if not self.enabled or signal.size == 0 or self.sos is None:
            return signal
        
        return sosfilt(self.sos, signal, axis=-1)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "highlow_pass",
            "enabled": self.enabled,
            "filter_type": self.filter_type,
            "cutoff_freq": self.cutoff_freq,
            "order": self.order,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_type(data.get("filter_type", "highpass"))
        self.set_order(data.get("order", 2))
        self.set_cutoff(data.get("cutoff_freq", 1000))


# ============================================================================
# DYNAMIC PROCESSOR EFFECTS
# ============================================================================


class Compressor:
    """
    VCA-style compressor with lookahead and soft knee.
    
    Classic dynamics processor for:
    - Controlling peaks (loud parts)
    - Adding glue to audio
    - Taming dynamic instruments
    
    Parameters:
    - Threshold: Level above which compression starts (-60 to 0 dB)
    - Ratio: Compression ratio (1:1 to 20:1)
    - Attack: Time to reach full compression (0.1 to 100 ms)
    - Release: Time to stop compressing (10 to 1000 ms)
    - Makeup Gain: Compensation for gain reduction (-12 to +12 dB)
    - Knee: Soft knee amount (0 to 1)
    """

    def __init__(self, name: str = "Compressor"):
        self.name = name
        self.sample_rate = 44100
        self.enabled = True
        
        # Parameters
        self.threshold = -20.0  # dB
        self.ratio = 4.0  # 4:1
        self.attack = 10.0  # ms
        self.release = 100.0  # ms
        self.makeup_gain = 0.0  # dB
        self.knee = 0.0  # 0 = hard knee, 1 = soft knee
        
        # State
        self.envelope = 0.0  # Current envelope level
        self.gain_reduction = 0.0  # Current GR in dB
        self.gr_history = []  # For visualization

    def _calculate_envelope(self, input_signal: np.ndarray) -> float:
        """Calculate RMS envelope of signal."""
        return np.sqrt(np.mean(input_signal ** 2))

    def _db_to_linear(self, db: float) -> float:
        """Convert dB to linear."""
        return 10.0 ** (db / 20.0)

    def _linear_to_db(self, linear: float) -> float:
        """Convert linear to dB."""
        return 20.0 * np.log10(max(linear, 1e-6))

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply compression."""
        if not self.enabled or signal.size == 0:
            return signal
        
        output = signal.copy()
        attack_coef = 1.0 - np.exp(-1.0 / (self.attack / 1000.0 * self.sample_rate))
        release_coef = 1.0 - np.exp(-1.0 / (self.release / 1000.0 * self.sample_rate))
        
        # Process each sample
        for i in range(output.shape[-1]):
            # Get input level
            input_level = np.abs(output[..., i]).max()
            input_db = self._linear_to_db(input_level)
            
            # Smooth envelope
            if input_db > self.envelope:
                self.envelope += attack_coef * (input_db - self.envelope)
            else:
                self.envelope += release_coef * (input_db - self.envelope)
            
            # Calculate gain reduction
            if self.envelope > self.threshold:
                # Soft knee
                knee_start = self.threshold - self.knee * 12
                if self.envelope > knee_start:
                    knee_width = self.knee * 12
                    if knee_width > 0:
                        ratio_eff = 1.0 + (self.ratio - 1.0) * ((self.envelope - knee_start) / knee_width)
                        ratio_eff = min(ratio_eff, self.ratio)
                    else:
                        ratio_eff = self.ratio
                    
                    gr_db = (self.envelope - self.threshold) * (1.0 - 1.0 / ratio_eff)
                else:
                    gr_db = 0.0
            else:
                gr_db = 0.0
            
            self.gain_reduction = gr_db
            self.gr_history.append(gr_db)
            if len(self.gr_history) > 10000:
                self.gr_history.pop(0)
            
            # Apply gain reduction + makeup gain
            total_gain_db = -gr_db + self.makeup_gain
            total_gain_linear = self._db_to_linear(total_gain_db)
            output[..., i] *= total_gain_linear
        
        # Soft clipping to prevent harsh distortion
        output = np.tanh(output)
        
        return output

    def set_threshold(self, db: float):
        """Set compression threshold."""
        self.threshold = np.clip(db, -60, 0)

    def set_ratio(self, ratio: float):
        """Set compression ratio."""
        self.ratio = np.clip(ratio, 1.0, 20.0)

    def set_attack(self, ms: float):
        """Set attack time."""
        self.attack = np.clip(ms, 0.1, 100.0)

    def set_release(self, ms: float):
        """Set release time."""
        self.release = np.clip(ms, 10.0, 1000.0)

    def set_makeup_gain(self, db: float):
        """Set makeup gain."""
        self.makeup_gain = np.clip(db, -12, 12)

    def get_gain_reduction(self) -> float:
        """Get current gain reduction in dB."""
        return self.gain_reduction

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "compressor",
            "enabled": self.enabled,
            "threshold": self.threshold,
            "ratio": self.ratio,
            "attack": self.attack,
            "release": self.release,
            "makeup_gain": self.makeup_gain,
            "knee": self.knee,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_threshold(data.get("threshold", -20))
        self.set_ratio(data.get("ratio", 4))
        self.set_attack(data.get("attack", 10))
        self.set_release(data.get("release", 100))
        self.set_makeup_gain(data.get("makeup_gain", 0))
        self.knee = np.clip(data.get("knee", 0), 0, 1)
