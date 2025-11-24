"""
Parameter Automation System - Phase 2.7

Real-time parameter automation framework:
- AutomationCurve: Interpolation between automation points (linear/exponential/step)
- AutomatedParameter: Wrapper for automatable parameters with read/write/touch modes
- LFO: Low-frequency oscillator for modulation
- Envelope: Attack/decay/sustain/release envelope generation
- ParameterTrack: Time-series parameter automation data structure

Supports all 19 effects with real-time parameter modulation.
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Literal
from dataclasses import dataclass
from enum import Enum


class InterpolationType(Enum):
    """Interpolation modes for automation curves."""
    LINEAR = "linear"
    EXPONENTIAL = "exponential"
    STEP = "step"
    SMOOTH = "smooth"  # Cubic spline interpolation


class AutomationMode(Enum):
    """Automation modes (read/write/touch)."""
    OFF = "off"
    READ = "read"      # Playback existing automation
    WRITE = "write"    # Record automation from input
    TOUCH = "touch"    # Record only when touched


class WaveformType(Enum):
    """LFO waveform types."""
    SINE = "sine"
    TRIANGLE = "triangle"
    SQUARE = "square"
    SAWTOOTH = "sawtooth"
    RANDOM = "random"


@dataclass
class AutomationPoint:
    """Single automation point in time."""
    time_samples: int      # Time in samples from project start
    value: float           # Parameter value (0-1 normalized)
    interpolation: InterpolationType = InterpolationType.LINEAR
    
    def __lt__(self, other: 'AutomationPoint') -> bool:
        """Support sorting by time."""
        return self.time_samples < other.time_samples


class AutomationCurve:
    """
    Automation curve with interpolation between points.
    
    Stores a series of (time, value) points and interpolates between them
    using specified interpolation mode. Supports adding/removing/editing points.
    """
    
    def __init__(self, sample_rate: float = 44100):
        """
        Initialize automation curve.
        
        Args:
            sample_rate: Sample rate for time calculations
        """
        self.sample_rate = sample_rate
        self.points: List[AutomationPoint] = []
        self.default_value = 0.5
        
    def add_point(self, time_samples: int, value: float, 
                  interpolation: InterpolationType = InterpolationType.LINEAR):
        """Add automation point."""
        value = np.clip(value, 0.0, 1.0)
        point = AutomationPoint(time_samples, value, interpolation)
        self.points.append(point)
        self.points.sort()
    
    def remove_point(self, index: int):
        """Remove automation point by index."""
        if 0 <= index < len(self.points):
            self.points.pop(index)
    
    def edit_point(self, index: int, time_samples: int, value: float):
        """Edit existing automation point."""
        if 0 <= index < len(self.points):
            self.points[index].time_samples = time_samples
            self.points[index].value = np.clip(value, 0.0, 1.0)
            self.points.sort()
    
    def get_value(self, time_samples: int) -> float:
        """
        Get interpolated automation value at specific time.
        
        Args:
            time_samples: Time in samples
            
        Returns:
            Interpolated value (0-1)
        """
        if len(self.points) == 0:
            return self.default_value
        
        if len(self.points) == 1:
            return self.points[0].value
        
        # Find surrounding points
        if time_samples <= self.points[0].time_samples:
            return self.points[0].value
        
        if time_samples >= self.points[-1].time_samples:
            return self.points[-1].value
        
        # Binary search for surrounding points
        left_idx = 0
        right_idx = len(self.points) - 1
        
        while left_idx < right_idx - 1:
            mid_idx = (left_idx + right_idx) // 2
            if self.points[mid_idx].time_samples <= time_samples:
                left_idx = mid_idx
            else:
                right_idx = mid_idx
        
        # Interpolate between left_idx and right_idx
        p0 = self.points[left_idx]
        p1 = self.points[right_idx]
        
        # Normalized position between points (0-1)
        t = (time_samples - p0.time_samples) / (p1.time_samples - p0.time_samples)
        t = np.clip(t, 0.0, 1.0)
        
        interpolation = p0.interpolation
        
        if interpolation == InterpolationType.LINEAR:
            # Linear: y = y0 + t * (y1 - y0)
            return p0.value + t * (p1.value - p0.value)
        
        elif interpolation == InterpolationType.EXPONENTIAL:
            # Exponential: creates curve acceleration
            t_exp = t ** 2
            return p0.value + t_exp * (p1.value - p0.value)
        
        elif interpolation == InterpolationType.STEP:
            # Step: jump at midpoint
            return p0.value if t < 0.5 else p1.value
        
        elif interpolation == InterpolationType.SMOOTH:
            # Cubic spline smoothing (3t^2 - 2t^3)
            t_smooth = 3 * t ** 2 - 2 * t ** 3
            return p0.value + t_smooth * (p1.value - p0.value)
        
        else:
            return p0.value
    
    def get_values(self, time_array: np.ndarray) -> np.ndarray:
        """
        Get interpolated values for array of times.
        
        Args:
            time_array: Array of time samples
            
        Returns:
            Array of interpolated values
        """
        return np.array([self.get_value(int(t)) for t in time_array])
    
    def clear(self):
        """Clear all automation points."""
        self.points.clear()
    
    def to_dict(self) -> Dict:
        """Serialize automation curve."""
        return {
            'type': 'AutomationCurve',
            'default_value': float(self.default_value),
            'points': [
                {
                    'time_samples': int(p.time_samples),
                    'value': float(p.value),
                    'interpolation': p.interpolation.value
                }
                for p in self.points
            ]
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'AutomationCurve':
        """Deserialize automation curve."""
        obj = cls()
        obj.default_value = data['default_value']
        
        for point_data in data['points']:
            obj.add_point(
                point_data['time_samples'],
                point_data['value'],
                InterpolationType(point_data['interpolation'])
            )
        
        return obj


class LFO:
    """
    Low-Frequency Oscillator for modulation.
    
    Generates periodic modulation signals at sub-audio rates.
    Supports multiple waveforms and depth/rate control.
    """
    
    def __init__(self, sample_rate: float = 44100):
        """
        Initialize LFO.
        
        Args:
            sample_rate: Sample rate
        """
        self.sample_rate = sample_rate
        self.rate_hz = 1.0  # 1 Hz default
        self.depth = 0.5    # 0-1
        self.waveform = WaveformType.SINE
        self.phase = 0.0    # 0-1
        
        # Random state for random waveform
        self._random_value = 0.0
        self._random_sample_counter = 0
    
    def set_rate(self, rate_hz: float):
        """Set LFO rate in Hz (0.01-20 Hz typical)."""
        self.rate_hz = np.clip(rate_hz, 0.01, 100.0)
    
    def set_depth(self, depth: float):
        """Set LFO depth (0-1, affects modulation amount)."""
        self.depth = np.clip(depth, 0.0, 1.0)
    
    def set_waveform(self, waveform: WaveformType):
        """Set LFO waveform."""
        self.waveform = waveform
    
    def process(self, num_samples: int) -> np.ndarray:
        """
        Generate LFO values for block.
        
        Args:
            num_samples: Number of samples to generate
            
        Returns:
            Array of LFO values (-1 to +1, centered at 0)
        """
        output = np.zeros(num_samples)
        phase_increment = self.rate_hz / self.sample_rate
        
        for i in range(num_samples):
            # Calculate phase-based output
            phase_cycle = self.phase % 1.0  # Normalize to 0-1
            
            if self.waveform == WaveformType.SINE:
                # Sine wave
                lfo_value = np.sin(2 * np.pi * phase_cycle)
            
            elif self.waveform == WaveformType.TRIANGLE:
                # Triangle wave (0-1 = rise, 0.5-1 = fall)
                if phase_cycle < 0.5:
                    lfo_value = 4 * phase_cycle - 1  # Rise from -1 to 1
                else:
                    lfo_value = 3 - 4 * phase_cycle  # Fall from 1 to -1
            
            elif self.waveform == WaveformType.SQUARE:
                # Square wave
                lfo_value = 1.0 if phase_cycle < 0.5 else -1.0
            
            elif self.waveform == WaveformType.SAWTOOTH:
                # Sawtooth wave
                lfo_value = 2 * phase_cycle - 1
            
            elif self.waveform == WaveformType.RANDOM:
                # Random (stepped) - new value every ~22ms @ 1Hz
                samples_per_step = int(self.sample_rate / self.rate_hz / 10)
                if self._random_sample_counter % samples_per_step == 0:
                    self._random_value = np.random.uniform(-1.0, 1.0)
                self._random_sample_counter += 1
                lfo_value = self._random_value
            
            else:
                lfo_value = 0.0
            
            # Apply depth scaling
            output[i] = lfo_value * self.depth
            
            # Advance phase
            self.phase += phase_increment
        
        return output
    
    def to_dict(self) -> Dict:
        """Serialize LFO state."""
        return {
            'type': 'LFO',
            'rate_hz': float(self.rate_hz),
            'depth': float(self.depth),
            'waveform': self.waveform.value,
            'phase': float(self.phase)
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'LFO':
        """Deserialize LFO state."""
        obj = cls()
        obj.rate_hz = data['rate_hz']
        obj.depth = data['depth']
        obj.waveform = WaveformType(data['waveform'])
        obj.phase = data['phase']
        return obj


class Envelope:
    """
    ADSR Envelope Generator.
    
    Generates attack/decay/sustain/release envelope for parameter modulation.
    """
    
    def __init__(self, sample_rate: float = 44100):
        """
        Initialize envelope.
        
        Args:
            sample_rate: Sample rate
        """
        self.sample_rate = sample_rate
        
        # Times in seconds
        self.attack_time = 0.01   # 10ms
        self.decay_time = 0.1     # 100ms
        self.sustain_level = 0.7  # 70%
        self.release_time = 0.5   # 500ms
        
        # State
        self.stage = "idle"  # idle, attack, decay, sustain, release
        self.current_value = 0.0
        self.stage_progress = 0.0  # 0-1 progress through stage
        self.trigger_pos = 0  # Sample position of trigger
        self.release_pos = 0  # Sample position of release
    
    def trigger(self, current_sample: int):
        """Trigger envelope start."""
        self.stage = "attack"
        self.stage_progress = 0.0
        self.trigger_pos = current_sample
        self.current_value = 0.0
    
    def release(self, current_sample: int):
        """Trigger envelope release."""
        self.stage = "release"
        self.stage_progress = 0.0
        self.release_pos = current_sample
    
    def process(self, num_samples: int, current_sample: int) -> np.ndarray:
        """
        Generate envelope values for block.
        
        Args:
            num_samples: Number of samples to generate
            current_sample: Current sample position in project
            
        Returns:
            Array of envelope values (0-1)
        """
        output = np.zeros(num_samples)
        
        for i in range(num_samples):
            sample_pos = current_sample + i
            
            # Determine stage
            if self.stage == "attack":
                elapsed = (sample_pos - self.trigger_pos) / self.sample_rate
                duration = self.attack_time
                if elapsed >= duration:
                    self.stage = "decay"
                    self.stage_progress = 0.0
                    self.current_value = 1.0
                else:
                    self.stage_progress = elapsed / duration
                    self.current_value = self.stage_progress  # Linear rise
            
            if self.stage == "decay":
                elapsed = (sample_pos - self.trigger_pos - self.attack_time) / self.sample_rate
                duration = self.decay_time
                if elapsed >= duration:
                    self.stage = "sustain"
                    self.stage_progress = 0.0
                    self.current_value = self.sustain_level
                else:
                    self.stage_progress = elapsed / duration
                    # Exponential decay from 1 to sustain_level
                    self.current_value = 1.0 + (self.sustain_level - 1.0) * self.stage_progress
            
            if self.stage == "sustain":
                self.current_value = self.sustain_level
            
            if self.stage == "release":
                elapsed = (sample_pos - self.release_pos) / self.sample_rate
                duration = self.release_time
                if elapsed >= duration:
                    self.stage = "idle"
                    self.current_value = 0.0
                else:
                    self.stage_progress = elapsed / duration
                    # Linear fall from current to 0
                    start_value = self.sustain_level if self.sustain_level > 0 else self.current_value
                    self.current_value = start_value * (1.0 - self.stage_progress)
            
            if self.stage == "idle":
                self.current_value = 0.0
            
            output[i] = np.clip(self.current_value, 0.0, 1.0)
        
        return output
    
    def to_dict(self) -> Dict:
        """Serialize envelope state."""
        return {
            'type': 'Envelope',
            'attack_time': float(self.attack_time),
            'decay_time': float(self.decay_time),
            'sustain_level': float(self.sustain_level),
            'release_time': float(self.release_time),
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Envelope':
        """Deserialize envelope state."""
        obj = cls()
        obj.attack_time = data['attack_time']
        obj.decay_time = data['decay_time']
        obj.sustain_level = data['sustain_level']
        obj.release_time = data['release_time']
        return obj


class AutomatedParameter:
    """
    Wrapper for automatable parameter.
    
    Combines parameter value with automation curve, LFO, and envelope.
    Supports read/write/touch automation modes.
    """
    
    def __init__(self, name: str, default_value: float = 0.5):
        """
        Initialize automated parameter.
        
        Args:
            name: Parameter name
            default_value: Default value (0-1)
        """
        self.name = name
        self.default_value = np.clip(default_value, 0.0, 1.0)
        self.current_value = self.default_value
        
        # Automation components
        self.automation_curve = AutomationCurve()
        self.lfo: Optional[LFO] = None
        self.envelope: Optional[Envelope] = None
        
        # Mode and settings
        self.mode = AutomationMode.OFF
        self.lfo_intensity = 0.0  # 0-1 (how much LFO affects parameter)
        self.envelope_intensity = 0.0  # 0-1 (how much envelope affects parameter)
        
        # Recording
        self.recording = False
        self.recorded_values: List[Tuple[int, float]] = []
    
    def set_automation_mode(self, mode: AutomationMode):
        """Set automation mode."""
        self.mode = mode
        if mode == AutomationMode.WRITE:
            self.recorded_values.clear()
    
    def set_value(self, value: float):
        """Set parameter value directly."""
        self.current_value = np.clip(value, 0.0, 1.0)
        
        if self.mode == AutomationMode.WRITE:
            # Record this value change
            # (timestamp would be added by caller)
            pass
    
    def get_value(self, time_samples: int) -> float:
        """
        Get final parameter value (after automation, LFO, envelope).
        
        Args:
            time_samples: Current time in samples
            
        Returns:
            Final value (0-1)
        """
        if self.mode == AutomationMode.OFF:
            return self.current_value
        
        if self.mode == AutomationMode.READ:
            # Read from automation curve
            base = self.automation_curve.get_value(time_samples)
        else:
            # Use current value for write/touch modes
            base = self.current_value
        
        # Apply LFO modulation
        if self.lfo and self.lfo_intensity > 0:
            # LFO output is -1 to 1, convert to 0-1 modulation
            lfo_val = self.lfo.process(1)[0]
            lfo_modulation = 0.5 + lfo_val * 0.5  # Convert -1..1 to 0..1
            base = base + (lfo_modulation - 0.5) * self.lfo_intensity
        
        # Apply envelope modulation
        if self.envelope and self.envelope_intensity > 0:
            env_val = self.envelope.process(1, time_samples)[0]
            base = base + (env_val - 0.5) * self.envelope_intensity
        
        return np.clip(base, 0.0, 1.0)
    
    def get_values(self, time_array: np.ndarray) -> np.ndarray:
        """Get values for array of times."""
        return np.array([self.get_value(int(t)) for t in time_array])
    
    def to_dict(self) -> Dict:
        """Serialize automated parameter."""
        return {
            'type': 'AutomatedParameter',
            'name': self.name,
            'current_value': float(self.current_value),
            'default_value': float(self.default_value),
            'mode': self.mode.value,
            'lfo_intensity': float(self.lfo_intensity),
            'envelope_intensity': float(self.envelope_intensity),
            'automation_curve': self.automation_curve.to_dict(),
            'lfo': self.lfo.to_dict() if self.lfo else None,
            'envelope': self.envelope.to_dict() if self.envelope else None,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'AutomatedParameter':
        """Deserialize automated parameter."""
        obj = cls(data['name'], data['default_value'])
        obj.current_value = data['current_value']
        obj.mode = AutomationMode(data['mode'])
        obj.lfo_intensity = data['lfo_intensity']
        obj.envelope_intensity = data['envelope_intensity']
        obj.automation_curve = AutomationCurve.from_dict(data['automation_curve'])
        
        if data['lfo']:
            obj.lfo = LFO.from_dict(data['lfo'])
        if data['envelope']:
            obj.envelope = Envelope.from_dict(data['envelope'])
        
        return obj


class ParameterTrack:
    """
    Container for all automated parameters in a track or effect.
    
    Manages multiple AutomatedParameters with shared time/mode.
    """
    
    def __init__(self, name: str):
        """
        Initialize parameter track.
        
        Args:
            name: Track or effect name
        """
        self.name = name
        self.parameters: Dict[str, AutomatedParameter] = {}
        self.automation_mode = AutomationMode.OFF
    
    def add_parameter(self, param_name: str, default_value: float = 0.5) -> AutomatedParameter:
        """Add new automatable parameter."""
        param = AutomatedParameter(param_name, default_value)
        self.parameters[param_name] = param
        return param
    
    def get_parameter(self, param_name: str) -> Optional[AutomatedParameter]:
        """Get parameter by name."""
        return self.parameters.get(param_name)
    
    def set_automation_mode(self, mode: AutomationMode):
        """Set automation mode for all parameters."""
        self.automation_mode = mode
        for param in self.parameters.values():
            param.set_automation_mode(mode)
    
    def get_values(self, time_samples: int) -> Dict[str, float]:
        """Get all parameter values at specific time."""
        return {
            name: param.get_value(time_samples)
            for name, param in self.parameters.items()
        }
    
    def to_dict(self) -> Dict:
        """Serialize parameter track."""
        return {
            'type': 'ParameterTrack',
            'name': self.name,
            'automation_mode': self.automation_mode.value,
            'parameters': {
                name: param.to_dict()
                for name, param in self.parameters.items()
            }
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'ParameterTrack':
        """Deserialize parameter track."""
        obj = cls(data['name'])
        obj.automation_mode = AutomationMode(data['automation_mode'])
        
        for param_name, param_data in data['parameters'].items():
            obj.parameters[param_name] = AutomatedParameter.from_dict(param_data)
        
        return obj
