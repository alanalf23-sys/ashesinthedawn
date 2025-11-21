"""
Dynamic Processors - Phase 2.2 Continuation

Implements Limiter, Expander, and Gate effects building on Compressor.
These extend the dynamic processing toolset for professional mixing.
"""

import numpy as np
from typing import Dict, Any


class Limiter:
    """
    Hard limiter with fast attack to prevent clipping.
    
    Specialized compressor with:
    - Ratio: Fixed at very high value (20:1)
    - Attack: Very fast (1-3 ms)
    - Lookahead: Anticipates peaks to catch them
    - Output ceiling: Prevents any peak above threshold
    
    Use cases:
    - Master bus protection
    - Preventing digital clipping
    - Catching unexpected peaks
    - Aggressive transient control
    """

    def __init__(self, name: str = "Limiter"):
        self.name = name
        self.sample_rate = 44100
        self.enabled = True
        
        # Parameters
        self.threshold = -0.3  # dB (just below 0)
        self.attack = 2.0  # ms (very fast)
        self.release = 100.0  # ms
        self.lookahead = 5.0  # ms for peak detection
        self.makeup_gain = 0.0  # dB
        
        # State
        self.envelope = 0.0
        self.gain_reduction = 0.0
        self.gr_history = []

    def _db_to_linear(self, db: float) -> float:
        """Convert dB to linear."""
        return 10.0 ** (db / 20.0)

    def _linear_to_db(self, linear: float) -> float:
        """Convert linear to dB."""
        return 20.0 * np.log10(max(linear, 1e-6))

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply limiting."""
        if not self.enabled or signal.size == 0:
            return signal
        
        output = signal.copy()
        
        # Lookahead buffer (find peaks ahead)
        lookahead_samples = int((self.lookahead / 1000.0) * self.sample_rate)
        
        attack_coef = 1.0 - np.exp(-1.0 / (self.attack / 1000.0 * self.sample_rate))
        release_coef = 1.0 - np.exp(-1.0 / (self.release / 1000.0 * self.sample_rate))
        
        for i in range(output.shape[-1]):
            # Look ahead for peaks
            lookahead_end = min(i + lookahead_samples, output.shape[-1])
            lookahead_level = np.max(np.abs(output[..., i:lookahead_end]))
            input_db = self._linear_to_db(lookahead_level)
            
            # Fast attack envelope
            if input_db > self.envelope:
                self.envelope += attack_coef * (input_db - self.envelope)
            else:
                self.envelope += release_coef * (input_db - self.envelope)
            
            # Hard limiting (ratio = ∞)
            if self.envelope > self.threshold:
                gr_db = self.envelope - self.threshold
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
        
        # Hard clipping (no soft clipping like Compressor)
        output = np.clip(output, -1.0, 1.0)
        
        return output

    def set_threshold(self, db: float):
        """Set limiter ceiling."""
        self.threshold = np.clip(db, -60, 0)

    def set_attack(self, ms: float):
        """Set attack time (should be fast)."""
        self.attack = np.clip(ms, 0.1, 10.0)

    def set_release(self, ms: float):
        """Set release time."""
        self.release = np.clip(ms, 10.0, 1000.0)

    def set_lookahead(self, ms: float):
        """Set lookahead buffer."""
        self.lookahead = np.clip(ms, 0.1, 50.0)

    def set_makeup_gain(self, db: float):
        """Set makeup gain."""
        self.makeup_gain = np.clip(db, -12, 12)

    def get_gain_reduction(self) -> float:
        """Get current gain reduction."""
        return self.gain_reduction

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "limiter",
            "enabled": self.enabled,
            "threshold": self.threshold,
            "attack": self.attack,
            "release": self.release,
            "lookahead": self.lookahead,
            "makeup_gain": self.makeup_gain,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_threshold(data.get("threshold", -0.3))
        self.set_attack(data.get("attack", 2))
        self.set_release(data.get("release", 100))
        self.set_lookahead(data.get("lookahead", 5))
        self.set_makeup_gain(data.get("makeup_gain", 0))


class Expander:
    """
    Inverse compressor that expands the dynamic range.
    
    Reduces level below threshold instead of above it:
    - Ratio: 1:4 expansion (opposite of compression)
    - Threshold: Level below which expansion starts
    - Use cases: Noise gate alternative, reduce low-level noise
    - Musical for parallel processing
    
    Parameters:
    - Threshold: Level below which expansion starts (-60 to 0 dB)
    - Ratio: Expansion ratio (1:1 = no effect, 1:8 = strong)
    - Attack: Time to start expanding
    - Release: Time to stop expanding
    """

    def __init__(self, name: str = "Expander"):
        self.name = name
        self.sample_rate = 44100
        self.enabled = True
        
        # Parameters
        self.threshold = -40.0  # dB
        self.ratio = 4.0  # 1:4 expansion
        self.attack = 10.0  # ms
        self.release = 100.0  # ms
        
        # State
        self.envelope = 0.0
        self.expansion_factor = 0.0
        self.ef_history = []

    def _db_to_linear(self, db: float) -> float:
        """Convert dB to linear."""
        return 10.0 ** (db / 20.0)

    def _linear_to_db(self, linear: float) -> float:
        """Convert linear to dB."""
        return 20.0 * np.log10(max(linear, 1e-6))

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply expansion."""
        if not self.enabled or signal.size == 0:
            return signal
        
        output = signal.copy()
        
        attack_coef = 1.0 - np.exp(-1.0 / (self.attack / 1000.0 * self.sample_rate))
        release_coef = 1.0 - np.exp(-1.0 / (self.release / 1000.0 * self.sample_rate))
        
        for i in range(output.shape[-1]):
            input_level = np.abs(output[..., i]).max()
            input_db = self._linear_to_db(input_level)
            
            # Smooth envelope
            if input_db > self.envelope:
                self.envelope += attack_coef * (input_db - self.envelope)
            else:
                self.envelope += release_coef * (input_db - self.envelope)
            
            # Calculate expansion below threshold
            if self.envelope < self.threshold:
                # Below threshold: reduce level by expansion ratio
                expansion_db = (self.envelope - self.threshold) * (1.0 - 1.0 / self.ratio)
                self.expansion_factor = expansion_db
            else:
                self.expansion_factor = 0.0
            
            self.ef_history.append(self.expansion_factor)
            if len(self.ef_history) > 10000:
                self.ef_history.pop(0)
            
            # Apply expansion
            expansion_linear = self._db_to_linear(self.expansion_factor)
            output[..., i] *= expansion_linear
        
        return output

    def set_threshold(self, db: float):
        """Set expansion threshold."""
        self.threshold = np.clip(db, -60, 0)

    def set_ratio(self, ratio: float):
        """Set expansion ratio."""
        self.ratio = np.clip(ratio, 1.0, 8.0)

    def set_attack(self, ms: float):
        """Set attack time."""
        self.attack = np.clip(ms, 0.1, 100.0)

    def set_release(self, ms: float):
        """Set release time."""
        self.release = np.clip(ms, 10.0, 1000.0)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "expander",
            "enabled": self.enabled,
            "threshold": self.threshold,
            "ratio": self.ratio,
            "attack": self.attack,
            "release": self.release,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_threshold(data.get("threshold", -40))
        self.set_ratio(data.get("ratio", 4))
        self.set_attack(data.get("attack", 10))
        self.set_release(data.get("release", 100))


class Gate:
    """
    Noise gate - extreme expander that silences audio below threshold.
    
    Characteristics:
    - Very fast attack (~1ms) to catch gates
    - Ratio: Very high (1:∞) - complete muting below threshold
    - Hold time: Keeps gate open even after signal drops
    - Use cases: Remove room noise, click removal, drum isolation
    
    Parameters:
    - Threshold: Level below which gate closes (-60 to 0 dB)
    - Attack: Time to open gate (0.1-5 ms)
    - Hold: Time to keep gate open after signal drops
    - Release: Time to close gate (10-500 ms)
    """

    def __init__(self, name: str = "Gate"):
        self.name = name
        self.sample_rate = 44100
        self.enabled = True
        
        # Parameters
        self.threshold = -40.0  # dB
        self.attack = 1.0  # ms (very fast)
        self.hold = 50.0  # ms
        self.release = 100.0  # ms
        
        # State
        self.envelope = 0.0
        self.hold_counter = 0
        self.gate_open = False
        self.gr_history = []

    def _db_to_linear(self, db: float) -> float:
        """Convert dB to linear."""
        return 10.0 ** (db / 20.0)

    def _linear_to_db(self, linear: float) -> float:
        """Convert linear to dB."""
        return 20.0 * np.log10(max(linear, 1e-6))

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply gating."""
        if not self.enabled or signal.size == 0:
            return signal
        
        output = signal.copy()
        
        attack_coef = 1.0 - np.exp(-1.0 / (self.attack / 1000.0 * self.sample_rate))
        release_coef = 1.0 - np.exp(-1.0 / (self.release / 1000.0 * self.sample_rate))
        hold_samples = int((self.hold / 1000.0) * self.sample_rate)
        
        for i in range(output.shape[-1]):
            input_level = np.abs(output[..., i]).max()
            input_db = self._linear_to_db(input_level)
            
            # Smooth envelope
            if input_db > self.envelope:
                self.envelope += attack_coef * (input_db - self.envelope)
            else:
                self.envelope += release_coef * (input_db - self.envelope)
            
            # Gate logic
            if self.envelope > self.threshold:
                self.gate_open = True
                self.hold_counter = hold_samples
                gr_db = 0.0
            else:
                if self.hold_counter > 0:
                    self.hold_counter -= 1
                    gr_db = 0.0
                else:
                    self.gate_open = False
                    gr_db = 100.0  # Mute (very large reduction)
            
            self.gr_history.append(gr_db)
            if len(self.gr_history) > 10000:
                self.gr_history.pop(0)
            
            # Apply gate
            if not self.gate_open and self.hold_counter <= 0:
                output[..., i] = 0.0  # Mute
            
        return output

    def set_threshold(self, db: float):
        """Set gate threshold."""
        self.threshold = np.clip(db, -60, 0)

    def set_attack(self, ms: float):
        """Set gate attack."""
        self.attack = np.clip(ms, 0.1, 5.0)

    def set_hold(self, ms: float):
        """Set gate hold time."""
        self.hold = np.clip(ms, 0.0, 200.0)

    def set_release(self, ms: float):
        """Set gate release."""
        self.release = np.clip(ms, 10.0, 500.0)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "gate",
            "enabled": self.enabled,
            "threshold": self.threshold,
            "attack": self.attack,
            "hold": self.hold,
            "release": self.release,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_threshold(data.get("threshold", -40))
        self.set_attack(data.get("attack", 1))
        self.set_hold(data.get("hold", 50))
        self.set_release(data.get("release", 100))


class NoiseGate:
    """
    Specialized noise gate optimized for removing low-level noise/hum.
    
    More aggressive than Gate with:
    - Faster operation
    - Hysteresis (different open/close thresholds)
    - Better for continuous noise reduction
    
    Parameters:
    - Open threshold: Level above which gate opens
    - Close threshold: Level below which gate closes (≤ open threshold)
    - Hysteresis helps prevent chatter on borderline signals
    """

    def __init__(self, name: str = "NoiseGate"):
        self.name = name
        self.sample_rate = 44100
        self.enabled = True
        
        # Parameters
        self.open_threshold = -35.0  # dB
        self.close_threshold = -40.0  # dB (lower = more hysteresis)
        self.attack = 0.5  # ms (very fast)
        self.release = 50.0  # ms
        
        # State
        self.gate_open = False
        self.envelope = 0.0

    def _linear_to_db(self, linear: float) -> float:
        """Convert linear to dB."""
        return 20.0 * np.log10(max(linear, 1e-6))

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply noise gating with hysteresis."""
        if not self.enabled or signal.size == 0:
            return signal
        
        output = signal.copy()
        
        attack_coef = 1.0 - np.exp(-1.0 / (self.attack / 1000.0 * self.sample_rate))
        release_coef = 1.0 - np.exp(-1.0 / (self.release / 1000.0 * self.sample_rate))
        
        for i in range(output.shape[-1]):
            input_level = np.abs(output[..., i]).max()
            input_db = self._linear_to_db(input_level)
            
            # Smooth envelope
            if input_db > self.envelope:
                self.envelope += attack_coef * (input_db - self.envelope)
            else:
                self.envelope += release_coef * (input_db - self.envelope)
            
            # Hysteresis logic
            if self.gate_open:
                # Gate is open, check if we should close
                if self.envelope < self.close_threshold:
                    self.gate_open = False
            else:
                # Gate is closed, check if we should open
                if self.envelope > self.open_threshold:
                    self.gate_open = True
            
            # Apply gate
            if not self.gate_open:
                output[..., i] = 0.0
        
        return output

    def set_thresholds(self, open_db: float, close_db: float):
        """Set gate thresholds with hysteresis."""
        self.open_threshold = np.clip(open_db, -60, 0)
        # Close threshold should be lower (more hysteresis)
        self.close_threshold = np.clip(close_db, -60, self.open_threshold)

    def set_attack(self, ms: float):
        """Set attack time."""
        self.attack = np.clip(ms, 0.1, 5.0)

    def set_release(self, ms: float):
        """Set release time."""
        self.release = np.clip(ms, 10.0, 500.0)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "noise_gate",
            "enabled": self.enabled,
            "open_threshold": self.open_threshold,
            "close_threshold": self.close_threshold,
            "attack": self.attack,
            "release": self.release,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        open_th = data.get("open_threshold", -35)
        close_th = data.get("close_threshold", -40)
        self.set_thresholds(open_th, close_th)
        self.set_attack(data.get("attack", 0.5))
        self.set_release(data.get("release", 50))
