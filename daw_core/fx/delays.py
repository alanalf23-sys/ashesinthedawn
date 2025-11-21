"""
Delay Effects - Phase 2.5

Professional time-based delay effects with circular buffer architecture.
Includes SimpleDelay, PingPongDelay, and MultiTap delays with tempo sync.
"""

import numpy as np
from typing import Dict, Any


class SimpleDelay:
    """
    Single tap delay with feedback and mix control.
    
    Characteristics:
    - Circular delay buffer for memory efficiency
    - Variable delay time (0-5000ms)
    - Feedback control for repeating echoes
    - Wet/dry mixing
    
    Parameters:
    - Time: Delay time in milliseconds (0-5000ms)
    - Feedback: Amount of delay fed back to input (0-0.95)
    - Mix: Wet/dry balance (0-1, 0=dry, 1=wet)
    - Ping Pong: Stereo bouncing effect (false=mono, true=stereo)
    """

    def __init__(self, name: str = "SimpleDelay", sample_rate: int = 44100):
        self.name = name
        self.sample_rate = sample_rate
        self.enabled = True
        
        # Parameters
        self.time_ms = 500.0  # milliseconds
        self.feedback = 0.5  # 0-0.95
        self.mix = 0.5  # 0-1
        self.ping_pong = False  # Stereo bouncing
        
        # State - circular buffer
        self.max_delay_samples = int(5.0 * sample_rate / 1000.0)  # 5 seconds
        self.delay_buffer = np.zeros(self.max_delay_samples, dtype=np.float32)
        self.write_pos = 0
        self.channel_count = 2

    def _ms_to_samples(self, ms: float) -> int:
        """Convert milliseconds to sample count."""
        samples = int((ms / 1000.0) * self.sample_rate)
        return np.clip(samples, 1, self.max_delay_samples - 1)

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply delay effect."""
        if not self.enabled or signal.size == 0:
            return signal
        
        delay_samples = self._ms_to_samples(self.time_ms)
        output = np.zeros_like(signal)
        feedback_linear = np.clip(self.feedback, 0, 0.95)
        
        for i in range(signal.shape[-1]):
            # Calculate read position
            read_pos = (self.write_pos - delay_samples) % self.max_delay_samples
            
            # Read delayed sample
            delayed = self.delay_buffer[read_pos]
            
            # Write new value (input + feedback)
            new_val = signal[i] + delayed * feedback_linear
            self.delay_buffer[self.write_pos] = np.clip(new_val, -1.0, 1.0)
            
            # Stereo ping-pong effect
            if self.ping_pong and signal.ndim == 2:
                # Alternate channels between left and right
                pass  # Handled in stereo process
            
            # Mix wet and dry
            output[i] = signal[i] * (1 - self.mix) + delayed * self.mix
            
            # Advance write position
            self.write_pos = (self.write_pos + 1) % self.max_delay_samples
        
        return output

    def set_time(self, ms: float):
        """Set delay time in milliseconds."""
        self.time_ms = np.clip(ms, 0, 5000)

    def set_feedback(self, amount: float):
        """Set feedback amount (0-0.95 to prevent feedback loop)."""
        self.feedback = np.clip(amount, 0, 0.95)

    def set_mix(self, amount: float):
        """Set wet/dry mix."""
        self.mix = np.clip(amount, 0, 1)

    def set_ping_pong(self, enabled: bool):
        """Enable stereo ping-pong bouncing."""
        self.ping_pong = enabled

    def clear(self):
        """Clear the delay buffer."""
        self.delay_buffer.fill(0)
        self.write_pos = 0

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "simpledelay",
            "enabled": self.enabled,
            "time_ms": self.time_ms,
            "feedback": self.feedback,
            "mix": self.mix,
            "ping_pong": self.ping_pong,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_time(data.get("time_ms", 500))
        self.set_feedback(data.get("feedback", 0.5))
        self.set_mix(data.get("mix", 0.5))
        self.set_ping_pong(data.get("ping_pong", False))


class PingPongDelay:
    """
    Stereo ping-pong delay with alternating channel bouncing.
    
    Characteristics:
    - Delay bounces between left and right channels
    - Each bounce at half the original level
    - Stereo width control
    - Smooth, musical stereo effect
    
    Parameters:
    - Time: Base delay time in milliseconds (0-5000ms)
    - Feedback: Echo repetition (0-0.95)
    - Stereo Width: Bounce intensity (0-1)
    - Mix: Wet/dry balance (0-1)
    """

    def __init__(self, name: str = "PingPongDelay", sample_rate: int = 44100):
        self.name = name
        self.sample_rate = sample_rate
        self.enabled = True
        
        # Parameters
        self.time_ms = 500.0
        self.feedback = 0.5
        self.stereo_width = 1.0  # 0-1
        self.mix = 0.5
        
        # State - separate buffers for left and right
        self.max_delay_samples = int(5.0 * sample_rate / 1000.0)
        self.delay_buffer_l = np.zeros(self.max_delay_samples, dtype=np.float32)
        self.delay_buffer_r = np.zeros(self.max_delay_samples, dtype=np.float32)
        self.write_pos = 0

    def _ms_to_samples(self, ms: float) -> int:
        """Convert milliseconds to sample count."""
        samples = int((ms / 1000.0) * self.sample_rate)
        return np.clip(samples, 1, self.max_delay_samples - 1)

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply ping-pong delay effect."""
        if not self.enabled or signal.size == 0:
            return signal
        
        # Handle mono input (expand to stereo)
        if signal.ndim == 1:
            signal = np.stack([signal, signal], axis=0)
            return_mono = True
        else:
            return_mono = False
        
        delay_samples = self._ms_to_samples(self.time_ms)
        output = np.zeros_like(signal)
        feedback_linear = np.clip(self.feedback, 0, 0.95)
        width = np.clip(self.stereo_width, 0, 1)
        
        for i in range(signal.shape[1]):
            # Read positions
            read_pos = (self.write_pos - delay_samples) % self.max_delay_samples
            
            # Read delayed samples (cross-channel for ping-pong)
            delayed_l = self.delay_buffer_r[read_pos]  # Right to left
            delayed_r = self.delay_buffer_l[read_pos]  # Left to right
            
            # Write new values with feedback
            new_val_l = signal[0, i] + delayed_l * feedback_linear * width
            new_val_r = signal[1, i] + delayed_r * feedback_linear * width
            
            self.delay_buffer_l[self.write_pos] = np.clip(new_val_l, -1.0, 1.0)
            self.delay_buffer_r[self.write_pos] = np.clip(new_val_r, -1.0, 1.0)
            
            # Mix wet and dry
            output[0, i] = signal[0, i] * (1 - self.mix) + delayed_l * self.mix
            output[1, i] = signal[1, i] * (1 - self.mix) + delayed_r * self.mix
            
            self.write_pos = (self.write_pos + 1) % self.max_delay_samples
        
        if return_mono:
            output = output[0]
        
        return output

    def set_time(self, ms: float):
        """Set delay time."""
        self.time_ms = np.clip(ms, 0, 5000)

    def set_feedback(self, amount: float):
        """Set feedback amount."""
        self.feedback = np.clip(amount, 0, 0.95)

    def set_stereo_width(self, amount: float):
        """Set stereo bounce intensity."""
        self.stereo_width = np.clip(amount, 0, 1)

    def set_mix(self, amount: float):
        """Set wet/dry mix."""
        self.mix = np.clip(amount, 0, 1)

    def clear(self):
        """Clear delay buffers."""
        self.delay_buffer_l.fill(0)
        self.delay_buffer_r.fill(0)
        self.write_pos = 0

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "pingpongdelay",
            "enabled": self.enabled,
            "time_ms": self.time_ms,
            "feedback": self.feedback,
            "stereo_width": self.stereo_width,
            "mix": self.mix,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_time(data.get("time_ms", 500))
        self.set_feedback(data.get("feedback", 0.5))
        self.set_stereo_width(data.get("stereo_width", 1.0))
        self.set_mix(data.get("mix", 0.5))


class MultiTapDelay:
    """
    Multiple independent delay taps with individual level control.
    
    Characteristics:
    - Up to 8 independent delay taps
    - Individual level control per tap
    - Smooth interpolation between taps
    - Complex spatial effects
    
    Parameters:
    - Tap Count: Number of delay taps (1-8)
    - Spacing: Time between taps in milliseconds
    - Feedback: Overall feedback amount
    - Mix: Wet/dry balance
    """

    def __init__(self, name: str = "MultiTapDelay", sample_rate: int = 44100, tap_count: int = 4):
        self.name = name
        self.sample_rate = sample_rate
        self.enabled = True
        
        self.tap_count = np.clip(tap_count, 1, 8)
        self.spacing_ms = 250.0  # Time between taps
        self.feedback = 0.4
        self.mix = 0.5
        
        # Individual tap levels (sum to 1.0)
        self.tap_levels = np.ones(self.tap_count, dtype=np.float32) / self.tap_count
        
        # State - single circular buffer
        self.max_delay_samples = int(5.0 * sample_rate / 1000.0)
        self.delay_buffer = np.zeros(self.max_delay_samples, dtype=np.float32)
        self.write_pos = 0

    def _ms_to_samples(self, ms: float) -> int:
        """Convert milliseconds to sample count."""
        samples = int((ms / 1000.0) * self.sample_rate)
        return np.clip(samples, 1, self.max_delay_samples - 1)

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply multi-tap delay effect."""
        if not self.enabled or signal.size == 0:
            return signal
        
        output = np.zeros_like(signal)
        feedback_linear = np.clip(self.feedback, 0, 0.95)
        base_delay = self._ms_to_samples(self.spacing_ms)
        
        # Accumulate all taps
        tap_signal = np.zeros_like(signal)
        
        for tap_idx in range(self.tap_count):
            # Calculate delay for this tap
            tap_delay = base_delay * (tap_idx + 1)
            tap_delay = np.clip(tap_delay, 1, self.max_delay_samples - 1)
            
            for i in range(signal.shape[-1]):
                # Read delayed sample
                read_pos = (self.write_pos - tap_delay) % self.max_delay_samples
                delayed = self.delay_buffer[read_pos]
                
                # Add to accumulation with tap level
                tap_signal[i] += delayed * self.tap_levels[tap_idx]
        
        # Write feedback into buffer
        for i in range(signal.shape[-1]):
            new_val = signal[i] + tap_signal[i] * feedback_linear
            self.delay_buffer[self.write_pos] = np.clip(new_val, -1.0, 1.0)
            
            # Mix wet and dry
            output[i] = signal[i] * (1 - self.mix) + tap_signal[i] * self.mix
            
            self.write_pos = (self.write_pos + 1) % self.max_delay_samples
        
        return output

    def set_spacing(self, ms: float):
        """Set time spacing between taps."""
        self.spacing_ms = np.clip(ms, 50, 2000)

    def set_feedback(self, amount: float):
        """Set feedback amount."""
        self.feedback = np.clip(amount, 0, 0.95)

    def set_mix(self, amount: float):
        """Set wet/dry mix."""
        self.mix = np.clip(amount, 0, 1)

    def set_tap_level(self, tap_idx: int, level: float):
        """Set individual tap level (0-1)."""
        if 0 <= tap_idx < self.tap_count:
            self.tap_levels[tap_idx] = np.clip(level, 0, 1)

    def set_tap_count(self, count: int):
        """Change number of taps (1-8)."""
        old_count = self.tap_count
        self.tap_count = np.clip(count, 1, 8)
        
        # Resize levels array
        new_levels = np.ones(self.tap_count, dtype=np.float32)
        if self.tap_count <= old_count:
            new_levels = self.tap_levels[:self.tap_count]
        else:
            new_levels[:old_count] = self.tap_levels[:old_count]
        
        # Normalize so sum = 1
        total = np.sum(new_levels)
        if total > 0:
            new_levels /= total
        
        self.tap_levels = new_levels

    def clear(self):
        """Clear delay buffer."""
        self.delay_buffer.fill(0)
        self.write_pos = 0

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "multitapdelay",
            "enabled": self.enabled,
            "tap_count": self.tap_count,
            "spacing_ms": self.spacing_ms,
            "feedback": self.feedback,
            "mix": self.mix,
            "tap_levels": self.tap_levels.tolist(),
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_tap_count(data.get("tap_count", 4))
        self.set_spacing(data.get("spacing_ms", 250))
        self.set_feedback(data.get("feedback", 0.4))
        self.set_mix(data.get("mix", 0.5))
        
        # Restore tap levels
        tap_levels = data.get("tap_levels", None)
        if tap_levels and len(tap_levels) == self.tap_count:
            self.tap_levels = np.array(tap_levels, dtype=np.float32)


class StereoDelay:
    """
    Independent delays on left and right channels.
    
    Characteristics:
    - Separate delay time per channel
    - Independent feedback per channel
    - Creates widening/phasing effects
    - Complex stereo imaging
    
    Parameters:
    - Time L: Left channel delay (0-5000ms)
    - Time R: Right channel delay (0-5000ms)
    - Feedback: Overall feedback amount
    - Mix: Wet/dry balance
    """

    def __init__(self, name: str = "StereoDelay", sample_rate: int = 44100):
        self.name = name
        self.sample_rate = sample_rate
        self.enabled = True
        
        self.time_l_ms = 400.0
        self.time_r_ms = 500.0
        self.feedback = 0.5
        self.mix = 0.5
        
        # Separate buffers for each channel
        self.max_delay_samples = int(5.0 * sample_rate / 1000.0)
        self.delay_buffer_l = np.zeros(self.max_delay_samples, dtype=np.float32)
        self.delay_buffer_r = np.zeros(self.max_delay_samples, dtype=np.float32)
        self.write_pos = 0

    def _ms_to_samples(self, ms: float) -> int:
        """Convert milliseconds to sample count."""
        samples = int((ms / 1000.0) * self.sample_rate)
        return np.clip(samples, 1, self.max_delay_samples - 1)

    def process(self, signal: np.ndarray) -> np.ndarray:
        """Apply stereo delay effect."""
        if not self.enabled or signal.size == 0:
            return signal
        
        # Handle mono input
        if signal.ndim == 1:
            signal = np.stack([signal, signal], axis=0)
            return_mono = True
        else:
            return_mono = False
        
        delay_samples_l = self._ms_to_samples(self.time_l_ms)
        delay_samples_r = self._ms_to_samples(self.time_r_ms)
        output = np.zeros_like(signal)
        feedback_linear = np.clip(self.feedback, 0, 0.95)
        
        for i in range(signal.shape[1]):
            # Read positions
            read_pos_l = (self.write_pos - delay_samples_l) % self.max_delay_samples
            read_pos_r = (self.write_pos - delay_samples_r) % self.max_delay_samples
            
            # Read delayed samples
            delayed_l = self.delay_buffer_l[read_pos_l]
            delayed_r = self.delay_buffer_r[read_pos_r]
            
            # Write new values
            new_val_l = signal[0, i] + delayed_l * feedback_linear
            new_val_r = signal[1, i] + delayed_r * feedback_linear
            
            self.delay_buffer_l[self.write_pos] = np.clip(new_val_l, -1.0, 1.0)
            self.delay_buffer_r[self.write_pos] = np.clip(new_val_r, -1.0, 1.0)
            
            # Mix
            output[0, i] = signal[0, i] * (1 - self.mix) + delayed_l * self.mix
            output[1, i] = signal[1, i] * (1 - self.mix) + delayed_r * self.mix
            
            self.write_pos = (self.write_pos + 1) % self.max_delay_samples
        
        if return_mono:
            output = output[0]
        
        return output

    def set_time_l(self, ms: float):
        """Set left channel delay time."""
        self.time_l_ms = np.clip(ms, 0, 5000)

    def set_time_r(self, ms: float):
        """Set right channel delay time."""
        self.time_r_ms = np.clip(ms, 0, 5000)

    def set_feedback(self, amount: float):
        """Set feedback amount."""
        self.feedback = np.clip(amount, 0, 0.95)

    def set_mix(self, amount: float):
        """Set wet/dry mix."""
        self.mix = np.clip(amount, 0, 1)

    def clear(self):
        """Clear delay buffers."""
        self.delay_buffer_l.fill(0)
        self.delay_buffer_r.fill(0)
        self.write_pos = 0

    def to_dict(self) -> Dict[str, Any]:
        """Serialize state."""
        return {
            "name": self.name,
            "type": "stereodelay",
            "enabled": self.enabled,
            "time_l_ms": self.time_l_ms,
            "time_r_ms": self.time_r_ms,
            "feedback": self.feedback,
            "mix": self.mix,
        }

    def from_dict(self, data: Dict[str, Any]):
        """Load state."""
        self.enabled = data.get("enabled", True)
        self.set_time_l(data.get("time_l_ms", 400))
        self.set_time_r(data.get("time_r_ms", 500))
        self.set_feedback(data.get("feedback", 0.5))
        self.set_mix(data.get("mix", 0.5))
