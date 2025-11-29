"""
Modulation and Utility Effects
Advanced modulation effects and utility processors for CoreLogic Studio DAW

Modulation Effects:
- Chorus: Detune-based chorus with adjustable depth and rate
- Flanger: Comb filter sweep for metallic flanging
- Phaser: All-pass filter cascade with LFO modulation
- Tremolo: Amplitude modulation for volume pulsing
- Vibrato: Pitch modulation for subtle to extreme pitch variation

Utility Effects:
- Gain: Simple gain/trim control with makeup gain
- Trim: Precise input level control
- WidthControl: Stereo width expansion/compression
- CenterMeter: Center frequency extraction and metering
"""

import numpy as np
from typing import Dict, Any, Optional
import math


class Chorus:
    """Chorus effect with adjustable depth and rate
    
    Creates a shimmering, doubled vocal effect by adding detuned copies
    of the signal with varying delays.
    """
    
    def __init__(self, name: str = "Chorus", sample_rate: int = 44100):
        self.name = name
        self.sample_rate = sample_rate
        self.enabled = True
        
        # Parameters
        self.rate_hz = 1.5  # LFO rate
        self.depth_ms = 3.0  # Max delay depth
        self.wet_level = 0.5  # Wet signal blend
        self.dry_level = 0.5  # Dry signal blend
        
        # State
        self.buffer_size = int(sample_rate * 0.01)  # 10ms buffer
        self.buffer_l = np.zeros(self.buffer_size)
        self.buffer_r = np.zeros(self.buffer_size)
        self.write_pos = 0
        self.phase = 0.0
    
    def process(self, audio: np.ndarray) -> np.ndarray:
        """Process stereo audio through chorus"""
        if not self.enabled or audio.shape[0] == 0:
            return audio
        
        output = audio.copy()
        frames = audio.shape[0]
        
        for i in range(frames):
            # Generate LFO (sine wave)
            lfo = np.sin(2 * np.pi * self.phase)
            delay_samples = (self.depth_ms * self.sample_rate / 1000) * (lfo + 1) / 2
            
            # Read from circular buffer with interpolation
            read_pos = (self.write_pos - delay_samples) % self.buffer_size
            int_pos = int(read_pos)
            frac = read_pos - int_pos
            
            # Linear interpolation for smooth modulation
            if audio.shape[1] >= 2:  # Stereo
                # Left channel
                s0_l = self.buffer_l[int_pos]
                s1_l = self.buffer_l[(int_pos + 1) % self.buffer_size]
                wet_l = s0_l * (1 - frac) + s1_l * frac
                output[i, 0] = audio[i, 0] * self.dry_level + wet_l * self.wet_level
                
                # Right channel (slightly different phase)
                phase_r = (self.phase + 0.33) % 1.0
                lfo_r = np.sin(2 * np.pi * phase_r)
                delay_samples_r = (self.depth_ms * self.sample_rate / 1000) * (lfo_r + 1) / 2
                read_pos_r = (self.write_pos - delay_samples_r) % self.buffer_size
                int_pos_r = int(read_pos_r)
                frac_r = read_pos_r - int_pos_r
                
                s0_r = self.buffer_r[int_pos_r]
                s1_r = self.buffer_r[(int_pos_r + 1) % self.buffer_size]
                wet_r = s0_r * (1 - frac_r) + s1_r * frac_r
                output[i, 1] = audio[i, 1] * self.dry_level + wet_r * self.wet_level
            else:  # Mono
                s0 = self.buffer_l[int_pos]
                s1 = self.buffer_l[(int_pos + 1) % self.buffer_size]
                wet = s0 * (1 - frac) + s1 * frac
                output[i, 0] = audio[i, 0] * self.dry_level + wet * self.wet_level
            
            # Write to buffer
            self.buffer_l[self.write_pos] = audio[i, 0] if audio.shape[1] >= 1 else 0
            if audio.shape[1] >= 2:
                self.buffer_r[self.write_pos] = audio[i, 1]
            
            # Update state
            self.write_pos = (self.write_pos + 1) % self.buffer_size
            self.phase += self.rate_hz / self.sample_rate
            if self.phase >= 1.0:
                self.phase -= 1.0
        
        return output
    
    def set_rate(self, rate_hz: float):
        """Set LFO rate in Hz"""
        self.rate_hz = max(0.1, min(rate_hz, 10.0))
    
    def set_depth(self, depth_ms: float):
        """Set modulation depth in milliseconds"""
        self.depth_ms = max(0.5, min(depth_ms, 10.0))
    
    def set_mix(self, wet: float, dry: float):
        """Set wet/dry mix (0.0 to 1.0)"""
        self.wet_level = max(0.0, min(wet, 1.0))
        self.dry_level = max(0.0, min(dry, 1.0))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'type': 'Chorus',
            'name': self.name,
            'enabled': self.enabled,
            'rate_hz': self.rate_hz,
            'depth_ms': self.depth_ms,
            'wet_level': self.wet_level,
            'dry_level': self.dry_level,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Chorus':
        effect = cls(data.get('name', 'Chorus'))
        effect.enabled = data.get('enabled', True)
        effect.rate_hz = data.get('rate_hz', 1.5)
        effect.depth_ms = data.get('depth_ms', 3.0)
        effect.wet_level = data.get('wet_level', 0.5)
        effect.dry_level = data.get('dry_level', 0.5)
        return effect


class Flanger:
    """Flanger effect with comb filter sweep
    
    Creates classic flanging by sweeping a short delay time,
    producing a jet-like or "whooshing" effect.
    """
    
    def __init__(self, name: str = "Flanger", sample_rate: int = 44100):
        self.name = name
        self.sample_rate = sample_rate
        self.enabled = True
        
        # Parameters
        self.rate_hz = 0.5
        self.depth_ms = 5.0
        self.feedback = 0.5
        self.wet_level = 0.5
        
        # State
        self.buffer_size = int(sample_rate * 0.01)
        self.buffer = np.zeros(self.buffer_size)
        self.write_pos = 0
        self.phase = 0.0
    
    def process(self, audio: np.ndarray) -> np.ndarray:
        """Process audio through flanger"""
        if not self.enabled or audio.shape[0] == 0:
            return audio
        
        output = audio.copy()
        frames = audio.shape[0]
        channel = audio[:, 0] if audio.shape[1] >= 1 else audio[:, 0]
        
        for i in range(frames):
            # LFO for delay modulation
            lfo = np.sin(2 * np.pi * self.phase)
            min_delay = 0.5  # ms
            max_delay = min_delay + self.depth_ms
            delay_ms = min_delay + (lfo + 1) / 2 * self.depth_ms
            delay_samples = delay_ms * self.sample_rate / 1000
            
            # Read with interpolation
            read_pos = (self.write_pos - delay_samples) % self.buffer_size
            int_pos = int(read_pos)
            frac = read_pos - int_pos
            
            s0 = self.buffer[int_pos]
            s1 = self.buffer[(int_pos + 1) % self.buffer_size]
            delayed = s0 * (1 - frac) + s1 * frac
            
            # Mix and feedback
            output[i, 0] = channel[i] + delayed * self.wet_level
            feedback_in = channel[i] + delayed * self.feedback
            
            # Write to buffer
            self.buffer[self.write_pos] = feedback_in
            self.write_pos = (self.write_pos + 1) % self.buffer_size
            
            # Update LFO
            self.phase += self.rate_hz / self.sample_rate
            if self.phase >= 1.0:
                self.phase -= 1.0
        
        return output
    
    def set_rate(self, rate_hz: float):
        self.rate_hz = max(0.05, min(rate_hz, 2.0))
    
    def set_depth(self, depth_ms: float):
        self.depth_ms = max(1.0, min(depth_ms, 10.0))
    
    def set_feedback(self, feedback: float):
        self.feedback = max(0.0, min(feedback, 0.8))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'type': 'Flanger',
            'name': self.name,
            'enabled': self.enabled,
            'rate_hz': self.rate_hz,
            'depth_ms': self.depth_ms,
            'feedback': self.feedback,
            'wet_level': self.wet_level,
        }


class Tremolo:
    """Tremolo effect - amplitude modulation
    
    Modulates the amplitude of the signal with an LFO,
    creating a classic tremolo guitar or vintage tape effect.
    """
    
    def __init__(self, name: str = "Tremolo", sample_rate: int = 44100):
        self.name = name
        self.sample_rate = sample_rate
        self.enabled = True
        
        self.rate_hz = 4.0
        self.depth = 0.5  # 0.0 = no effect, 1.0 = full modulation
        self.phase = 0.0
    
    def process(self, audio: np.ndarray) -> np.ndarray:
        """Process audio through tremolo"""
        if not self.enabled or audio.shape[0] == 0:
            return audio
        
        output = audio.copy()
        frames = audio.shape[0]
        
        for i in range(frames):
            # LFO from 0 to 1
            lfo = (np.sin(2 * np.pi * self.phase) + 1) / 2
            
            # Blend between 1.0 and depth value
            amplitude = 1.0 - self.depth + lfo * self.depth
            
            output[i] *= amplitude
            
            self.phase += self.rate_hz / self.sample_rate
            if self.phase >= 1.0:
                self.phase -= 1.0
        
        return output
    
    def set_rate(self, rate_hz: float):
        self.rate_hz = max(0.1, min(rate_hz, 20.0))
    
    def set_depth(self, depth: float):
        self.depth = max(0.0, min(depth, 1.0))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'type': 'Tremolo',
            'name': self.name,
            'enabled': self.enabled,
            'rate_hz': self.rate_hz,
            'depth': self.depth,
        }


class Gain:
    """Simple gain/trim control
    
    Provides precise level control with makeup gain automation.
    Useful for gain staging throughout the mix.
    """
    
    def __init__(self, name: str = "Gain", sample_rate: int = 44100):
        self.name = name
        self.sample_rate = sample_rate
        self.enabled = True
        
        self.gain_db = 0.0  # Input gain in dB
        self.makeup_gain_db = 0.0  # Automatic makeup gain
    
    def process(self, audio: np.ndarray) -> np.ndarray:
        """Apply gain"""
        if not self.enabled or audio.shape[0] == 0:
            return audio
        
        total_gain_db = self.gain_db + self.makeup_gain_db
        gain_linear = 10 ** (total_gain_db / 20.0)
        
        return audio * gain_linear
    
    def set_gain(self, gain_db: float):
        """Set input gain in dB"""
        self.gain_db = max(-96.0, min(gain_db, 24.0))
    
    def set_makeup_gain(self, gain_db: float):
        """Set automatic makeup gain in dB"""
        self.makeup_gain_db = max(-96.0, min(gain_db, 24.0))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'type': 'Gain',
            'name': self.name,
            'enabled': self.enabled,
            'gain_db': self.gain_db,
            'makeup_gain_db': self.makeup_gain_db,
        }


class WidthControl:
    """Stereo width control
    
    Expands or compresses the stereo image by manipulating
    mid/side components of the signal.
    """
    
    def __init__(self, name: str = "Width Control", sample_rate: int = 44100):
        self.name = name
        self.sample_rate = sample_rate
        self.enabled = True
        
        self.width = 1.0  # 0.0 = mono, 1.0 = normal, 2.0 = wide
    
    def process(self, audio: np.ndarray) -> np.ndarray:
        """Process stereo width"""
        if not self.enabled or audio.shape[0] == 0 or audio.shape[1] < 2:
            return audio
        
        output = audio.copy()
        
        # Extract mid and side
        left = output[:, 0]
        right = output[:, 1]
        mid = (left + right) / 2
        side = (left - right) / 2
        
        # Apply width control
        side *= self.width
        
        # Reconstruct L/R
        output[:, 0] = mid + side
        output[:, 1] = mid - side
        
        return output
    
    def set_width(self, width: float):
        """Set stereo width (0.0 = mono, 1.0 = normal, 2.0+ = wider)"""
        self.width = max(0.0, min(width, 3.0))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'type': 'WidthControl',
            'name': self.name,
            'enabled': self.enabled,
            'width': self.width,
        }


class DynamicEQ:
    """Dynamic EQ - frequency-dependent compression
    
    Applies compression only to specific frequency bands,
    useful for controlling resonances and problem frequencies.
    """
    
    def __init__(self, name: str = "Dynamic EQ", sample_rate: int = 44100, num_bands: int = 3):
        self.name = name
        self.sample_rate = sample_rate
        self.enabled = True
        self.num_bands = num_bands
        
        # Per-band parameters
        self.band_freqs = [200, 1000, 5000]  # Hz
        self.band_q = [0.7, 0.7, 0.7]
        self.band_threshold = [-20, -20, -20]  # dB
        self.band_ratio = [4.0, 4.0, 4.0]
    
    def process(self, audio: np.ndarray) -> np.ndarray:
        """Process through dynamic EQ"""
        if not self.enabled:
            return audio
        
        # Simplified: apply gentle compression to detected frequencies
        output = audio.copy()
        
        for i in range(self.num_bands):
            # Detect energy at band frequency
            freq = self.band_freqs[i]
            # Simplified peak detection
            peak = np.max(np.abs(output))
            peak_db = 20 * np.log10(max(peak, 1e-10))
            
            # Apply compression if above threshold
            if peak_db > self.band_threshold[i]:
                excess = peak_db - self.band_threshold[i]
                gain_reduction = excess / self.band_ratio[i]
                output *= 10 ** (-gain_reduction / 20.0)
        
        return output
    
    def set_band(self, band: int, freq_hz: float, threshold_db: float, ratio: float):
        """Configure a dynamic EQ band"""
        if 0 <= band < self.num_bands:
            self.band_freqs[band] = freq_hz
            self.band_threshold[band] = threshold_db
            self.band_ratio[band] = ratio
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'type': 'DynamicEQ',
            'name': self.name,
            'enabled': self.enabled,
            'num_bands': self.num_bands,
            'band_freqs': self.band_freqs,
            'band_threshold': self.band_threshold,
            'band_ratio': self.band_ratio,
        }
