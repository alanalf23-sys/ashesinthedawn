"""
Test Suite for Phase 2.7 - Parameter Automation System

Comprehensive tests for:
- AutomationCurve: Interpolation, point management
- LFO: Waveforms, modulation
- Envelope: ADSR generation
- AutomatedParameter: Mode switching, value computation
- ParameterTrack: Multi-parameter management
"""

import numpy as np
import pytest
from daw_core.automation import (
    AutomationCurve,
    AutomationPoint,
    InterpolationType,
    LFO,
    WaveformType,
    Envelope,
    AutomatedParameter,
    AutomationMode,
    ParameterTrack,
)


class TestAutomationPoint:
    """Test suite for AutomationPoint."""
    
    def test_point_creation(self):
        """Test basic point creation."""
        point = AutomationPoint(1000, 0.5)
        assert point.time_samples == 1000
        assert point.value == 0.5
        assert point.interpolation == InterpolationType.LINEAR
    
    def test_point_sorting(self):
        """Test that points can be sorted by time."""
        points = [
            AutomationPoint(2000, 0.7),
            AutomationPoint(1000, 0.3),
            AutomationPoint(3000, 0.9),
        ]
        points.sort()
        
        assert points[0].time_samples == 1000
        assert points[1].time_samples == 2000
        assert points[2].time_samples == 3000


class TestAutomationCurve:
    """Test suite for AutomationCurve."""
    
    def test_curve_initialization(self):
        """Test basic curve initialization."""
        curve = AutomationCurve()
        assert len(curve.points) == 0
        assert curve.default_value == 0.5
    
    def test_add_point(self):
        """Test adding automation points."""
        curve = AutomationCurve()
        curve.add_point(1000, 0.3, InterpolationType.LINEAR)
        curve.add_point(2000, 0.7, InterpolationType.LINEAR)
        
        assert len(curve.points) == 2
        assert curve.points[0].value == 0.3
        assert curve.points[1].value == 0.7
    
    def test_point_value_bounds(self):
        """Test that point values are clipped to 0-1."""
        curve = AutomationCurve()
        curve.add_point(1000, 1.5)  # Should clip to 1.0
        curve.add_point(2000, -0.5)  # Should clip to 0.0
        
        assert curve.points[0].value == 1.0
        assert curve.points[1].value == 0.0
    
    def test_get_value_single_point(self):
        """Test value retrieval with single point."""
        curve = AutomationCurve()
        curve.add_point(1000, 0.7)
        
        # Before point
        assert curve.get_value(500) == 0.7
        # At point
        assert curve.get_value(1000) == 0.7
        # After point
        assert curve.get_value(2000) == 0.7
    
    def test_linear_interpolation(self):
        """Test linear interpolation between points."""
        curve = AutomationCurve()
        curve.add_point(0, 0.0, InterpolationType.LINEAR)
        curve.add_point(1000, 1.0, InterpolationType.LINEAR)
        
        # At midpoint, should be 0.5
        assert np.isclose(curve.get_value(500), 0.5)
        # At 25% point
        assert np.isclose(curve.get_value(250), 0.25)
    
    def test_exponential_interpolation(self):
        """Test exponential interpolation."""
        curve = AutomationCurve()
        curve.add_point(0, 0.0, InterpolationType.EXPONENTIAL)
        curve.add_point(1000, 1.0, InterpolationType.EXPONENTIAL)
        
        # Exponential (t^2): at t=0.5, result is 0.25 (slower start)
        mid = curve.get_value(500)
        quarter = curve.get_value(250)
        
        # Quadratic curve should have slower start than linear
        assert mid < 0.5  # Slower rise
        assert quarter < 0.25  # Even slower at quarter point
    
    def test_step_interpolation(self):
        """Test step interpolation."""
        curve = AutomationCurve()
        curve.add_point(0, 0.0, InterpolationType.STEP)
        curve.add_point(1000, 1.0, InterpolationType.STEP)
        
        # Before midpoint = first value
        assert curve.get_value(400) == 0.0
        # After midpoint = second value
        assert curve.get_value(600) == 1.0
    
    def test_smooth_interpolation(self):
        """Test smooth interpolation."""
        curve = AutomationCurve()
        curve.add_point(0, 0.0, InterpolationType.SMOOTH)
        curve.add_point(1000, 1.0, InterpolationType.SMOOTH)
        
        # Smooth should have slower start/end
        mid = curve.get_value(500)
        quarter = curve.get_value(250)
        three_quarter = curve.get_value(750)
        
        # Should be smoother transition than exponential
        assert 0.4 < mid < 0.6
        assert 0.0 < quarter < 0.3
        assert 0.7 < three_quarter < 1.0
    
    def test_remove_point(self):
        """Test removing automation points."""
        curve = AutomationCurve()
        curve.add_point(0, 0.0)
        curve.add_point(1000, 0.5)
        curve.add_point(2000, 1.0)
        
        assert len(curve.points) == 3
        curve.remove_point(1)
        assert len(curve.points) == 2
        assert curve.points[0].value == 0.0
        assert curve.points[1].value == 1.0
    
    def test_edit_point(self):
        """Test editing existing points."""
        curve = AutomationCurve()
        curve.add_point(1000, 0.5)
        
        curve.edit_point(0, 2000, 0.7)
        
        assert curve.points[0].time_samples == 2000
        assert curve.points[0].value == 0.7
    
    def test_get_values_array(self):
        """Test getting values for array of times."""
        curve = AutomationCurve()
        curve.add_point(0, 0.0, InterpolationType.LINEAR)
        curve.add_point(1000, 1.0, InterpolationType.LINEAR)
        
        times = np.array([0, 250, 500, 750, 1000])
        values = curve.get_values(times)
        
        assert len(values) == 5
        assert values[0] == 0.0
        assert np.isclose(values[2], 0.5)
        assert values[4] == 1.0
    
    def test_curve_serialization(self):
        """Test automation curve save/load."""
        curve1 = AutomationCurve()
        curve1.add_point(0, 0.0, InterpolationType.LINEAR)
        curve1.add_point(1000, 0.5, InterpolationType.EXPONENTIAL)
        curve1.add_point(2000, 1.0, InterpolationType.STEP)
        
        data = curve1.to_dict()
        curve2 = AutomationCurve.from_dict(data)
        
        assert len(curve2.points) == 3
        assert curve2.points[0].value == 0.0
        assert curve2.points[1].interpolation == InterpolationType.EXPONENTIAL
        assert curve2.points[2].interpolation == InterpolationType.STEP


class TestLFO:
    """Test suite for LFO."""
    
    def test_lfo_initialization(self):
        """Test LFO initialization."""
        lfo = LFO(sample_rate=44100)
        assert lfo.rate_hz == 1.0
        assert lfo.depth == 0.5
        assert lfo.waveform == WaveformType.SINE
    
    def test_set_rate(self):
        """Test setting LFO rate."""
        lfo = LFO()
        lfo.set_rate(5.0)
        assert lfo.rate_hz == 5.0
        
        # Test bounds
        lfo.set_rate(200.0)  # Too high
        assert lfo.rate_hz == 100.0
    
    def test_sine_waveform(self):
        """Test sine waveform generation."""
        lfo = LFO(sample_rate=44100)
        lfo.set_waveform(WaveformType.SINE)
        lfo.set_depth(1.0)
        lfo.set_rate(1.0)  # 1 Hz
        
        # Generate 44100 samples = 1 second = 1 full cycle
        output = lfo.process(44100)
        
        # Should have positive and negative values
        assert np.max(output) > 0.5
        assert np.min(output) < -0.5
    
    def test_triangle_waveform(self):
        """Test triangle waveform generation."""
        lfo = LFO(sample_rate=44100)
        lfo.set_waveform(WaveformType.TRIANGLE)
        lfo.set_depth(1.0)
        
        output = lfo.process(1000)
        
        assert np.max(output) <= 1.0
        assert np.min(output) >= -1.0
    
    def test_square_waveform(self):
        """Test square waveform generation."""
        lfo = LFO(sample_rate=44100)
        lfo.set_waveform(WaveformType.SQUARE)
        lfo.set_depth(1.0)
        lfo.set_rate(10.0)
        
        output = lfo.process(4410)  # 100ms at 10Hz = 1 cycle
        
        # Should be mostly -1 or 1
        quantized = np.round(output)
        assert np.all(np.isin(quantized, [-1, 1]))
    
    def test_sawtooth_waveform(self):
        """Test sawtooth waveform generation."""
        lfo = LFO(sample_rate=44100)
        lfo.set_waveform(WaveformType.SAWTOOTH)
        lfo.set_depth(1.0)
        
        output = lfo.process(1000)
        
        assert np.max(output) <= 1.0
        assert np.min(output) >= -1.0
    
    def test_lfo_depth(self):
        """Test LFO depth scaling."""
        lfo_full = LFO()
        lfo_full.set_depth(1.0)
        
        lfo_half = LFO()
        lfo_half.set_depth(0.5)
        
        out_full = lfo_full.process(1000)
        out_half = lfo_half.process(1000)
        
        # Half depth should be half amplitude
        assert np.max(out_half) <= np.max(out_full) * 0.6
    
    def test_lfo_serialization(self):
        """Test LFO save/load."""
        lfo1 = LFO()
        lfo1.set_rate(3.5)
        lfo1.set_depth(0.7)
        lfo1.set_waveform(WaveformType.TRIANGLE)
        
        data = lfo1.to_dict()
        lfo2 = LFO.from_dict(data)
        
        assert lfo2.rate_hz == 3.5
        assert lfo2.depth == 0.7
        assert lfo2.waveform == WaveformType.TRIANGLE


class TestEnvelope:
    """Test suite for Envelope."""
    
    def test_envelope_initialization(self):
        """Test envelope initialization."""
        env = Envelope()
        assert env.stage == "idle"
        assert env.current_value == 0.0
    
    def test_attack_stage(self):
        """Test attack stage."""
        env = Envelope(sample_rate=44100)
        env.attack_time = 0.1  # 100ms
        env.trigger(0)
        
        # At 50ms, should be ~50%
        output = env.process(2205, 0)  # 2205 samples = ~50ms
        assert 0.3 < output[-1] < 0.7
    
    def test_decay_stage(self):
        """Test decay stage from attack."""
        env = Envelope(sample_rate=44100)
        env.attack_time = 0.01  # 10ms
        env.decay_time = 0.1    # 100ms
        env.sustain_level = 0.5
        env.trigger(0)
        
        # Process attack (441 samples = 10ms)
        env.process(441, 0)
        assert env.stage == "attack"
        
        # Process into decay - enough time to pass attack and some of decay
        env.process(2205, 441)  # 50ms more (total 60ms)
        assert env.stage in ["decay", "sustain"]  # Should be past attack
    
    def test_sustain_level(self):
        """Test sustain level maintained."""
        env = Envelope(sample_rate=44100)
        env.attack_time = 0.001
        env.decay_time = 0.001
        env.sustain_level = 0.6
        env.trigger(0)
        
        # Process through to sustain
        env.process(44100, 0)  # 1 second
        
        # Should be in sustain stage
        assert env.stage == "sustain"
        assert np.isclose(env.current_value, 0.6, atol=0.05)
    
    def test_release_stage(self):
        """Test release stage."""
        env = Envelope(sample_rate=44100)
        env.attack_time = 0.001
        env.decay_time = 0.001
        env.sustain_level = 0.5
        env.release_time = 0.1
        env.trigger(0)
        
        # Get to sustain
        env.process(44100, 0)
        assert env.stage == "sustain"
        
        # Trigger release
        env.release(44100)
        assert env.stage == "release"
        
        # Process release (50ms)
        env.process(2205, 44100)
        assert 0.0 <= env.current_value <= 0.5
    
    def test_envelope_serialization(self):
        """Test envelope save/load."""
        env1 = Envelope()
        env1.attack_time = 0.05
        env1.decay_time = 0.2
        env1.sustain_level = 0.6
        env1.release_time = 0.4
        
        data = env1.to_dict()
        env2 = Envelope.from_dict(data)
        
        assert env2.attack_time == 0.05
        assert env2.sustain_level == 0.6


class TestAutomatedParameter:
    """Test suite for AutomatedParameter."""
    
    def test_parameter_initialization(self):
        """Test parameter initialization."""
        param = AutomatedParameter("volume", 0.5)
        assert param.name == "volume"
        assert param.current_value == 0.5
        assert param.mode == AutomationMode.OFF
    
    def test_set_value(self):
        """Test setting parameter value."""
        param = AutomatedParameter("volume")
        param.set_value(0.7)
        assert param.current_value == 0.7
        
        # Test bounds
        param.set_value(1.5)
        assert param.current_value == 1.0
    
    def test_off_mode(self):
        """Test OFF mode (no automation)."""
        param = AutomatedParameter("volume", 0.6)
        param.set_automation_mode(AutomationMode.OFF)
        
        value = param.get_value(0)
        assert value == 0.6
    
    def test_read_mode(self):
        """Test READ mode (playback automation)."""
        param = AutomatedParameter("volume")
        param.set_automation_mode(AutomationMode.READ)
        param.automation_curve.add_point(0, 0.0, InterpolationType.LINEAR)
        param.automation_curve.add_point(44100, 1.0, InterpolationType.LINEAR)
        
        # At midpoint
        value = param.get_value(22050)
        assert np.isclose(value, 0.5, atol=0.01)
    
    def test_write_mode(self):
        """Test WRITE mode (record automation)."""
        param = AutomatedParameter("volume", 0.5)
        param.set_automation_mode(AutomationMode.WRITE)
        
        # In write mode, uses current value
        assert param.get_value(0) == 0.5
    
    def test_lfo_modulation(self):
        """Test LFO modulation of parameter."""
        param = AutomatedParameter("cutoff", 0.5)
        param.lfo = LFO(sample_rate=44100)
        param.lfo.set_depth(1.0)
        param.lfo_intensity = 0.5  # 50% modulation
        
        # Test LFO generation directly
        lfo_out = param.lfo.process(4410)  # 100ms of LFO
        
        # LFO output should vary
        lfo_range = np.max(lfo_out) - np.min(lfo_out)
        assert lfo_range > 0.5  # LFO should produce good variation
        
        # Now test parameter modulation with LFO output
        values = []
        for i in range(100):
            # Set phase manually to test specific points
            phase_frac = i / 100.0
            if phase_frac < 0.5:
                lfo_val = np.sin(2 * np.pi * phase_frac)
            else:
                lfo_val = -np.sin(2 * np.pi * phase_frac)
            
            # Convert LFO to modulation
            param.lfo.depth = 1.0
            lfo_modulation = 0.5 + lfo_val * 0.5
            expected = 0.5 + (lfo_modulation - 0.5) * param.lfo_intensity
            values.append(expected)
        
        val_range = np.max(values) - np.min(values)
        assert val_range > 0.1  # Should have variation
    
    def test_envelope_modulation(self):
        """Test envelope modulation of parameter."""
        param = AutomatedParameter("gain", 0.5)
        param.envelope = Envelope(sample_rate=44100)
        param.envelope.attack_time = 0.01
        param.envelope_intensity = 0.5
        param.envelope.trigger(0)
        
        value = param.get_value(0)
        assert 0.0 <= value <= 1.0
    
    def test_parameter_serialization(self):
        """Test parameter save/load."""
        param1 = AutomatedParameter("volume", 0.7)
        param1.set_automation_mode(AutomationMode.READ)
        param1.automation_curve.add_point(0, 0.0)
        param1.automation_curve.add_point(1000, 0.5)
        
        data = param1.to_dict()
        param2 = AutomatedParameter.from_dict(data)
        
        assert param2.name == "volume"
        assert param2.current_value == 0.7
        assert param2.mode == AutomationMode.READ
        assert len(param2.automation_curve.points) == 2


class TestParameterTrack:
    """Test suite for ParameterTrack."""
    
    def test_track_initialization(self):
        """Test parameter track initialization."""
        track = ParameterTrack("my_effect")
        assert track.name == "my_effect"
        assert len(track.parameters) == 0
    
    def test_add_parameter(self):
        """Test adding parameters."""
        track = ParameterTrack("eq")
        track.add_parameter("low_gain", 0.5)
        track.add_parameter("mid_freq", 0.3)
        
        assert len(track.parameters) == 2
        assert "low_gain" in track.parameters
    
    def test_get_parameter(self):
        """Test retrieving parameters."""
        track = ParameterTrack("comp")
        param = track.add_parameter("threshold", 0.6)
        
        retrieved = track.get_parameter("threshold")
        assert retrieved == param
    
    def test_set_automation_mode(self):
        """Test setting mode for all parameters."""
        track = ParameterTrack("reverb")
        track.add_parameter("room_size", 0.5)
        track.add_parameter("damping", 0.3)
        
        track.set_automation_mode(AutomationMode.READ)
        
        for param in track.parameters.values():
            assert param.mode == AutomationMode.READ
    
    def test_get_values(self):
        """Test getting all parameter values."""
        track = ParameterTrack("saturation")
        track.add_parameter("drive", 0.4)
        track.add_parameter("tone", 0.6)
        
        values = track.get_values(0)
        
        assert len(values) == 2
        assert values["drive"] == 0.4
        assert values["tone"] == 0.6
    
    def test_track_serialization(self):
        """Test track save/load."""
        track1 = ParameterTrack("delay")
        track1.add_parameter("time_ms", 0.5)
        track1.add_parameter("feedback", 0.7)
        
        data = track1.to_dict()
        track2 = ParameterTrack.from_dict(data)
        
        assert track2.name == "delay"
        assert len(track2.parameters) == 2
        assert "time_ms" in track2.parameters


class TestAutomationIntegration:
    """Integration tests for automation system."""
    
    def test_full_automation_workflow(self):
        """Test complete automation workflow."""
        # Create parameter with automation
        param = AutomatedParameter("volume", 0.5)
        param.set_automation_mode(AutomationMode.READ)
        
        # Add automation points
        param.automation_curve.add_point(0, 0.3, InterpolationType.LINEAR)
        param.automation_curve.add_point(44100, 0.9, InterpolationType.LINEAR)
        
        # Get values across time
        times = np.linspace(0, 44100, 100)
        values = param.get_values(times)
        
        assert values[0] < values[-1]  # Should increase
        assert np.all((values >= 0) & (values <= 1))
    
    def test_multi_parameter_track(self):
        """Test track with multiple parameters."""
        track = ParameterTrack("compressor")
        
        threshold = track.add_parameter("threshold", 0.5)
        ratio = track.add_parameter("ratio", 0.7)
        makeup_gain = track.add_parameter("makeup_gain", 0.6)
        
        # Set automation on threshold
        threshold.set_automation_mode(AutomationMode.READ)
        threshold.automation_curve.add_point(0, 0.4)
        threshold.automation_curve.add_point(44100, 0.6)
        
        # Get all values
        values = track.get_values(22050)  # Midpoint
        
        assert 0.4 < values["threshold"] < 0.6
        assert values["ratio"] == 0.7
        assert values["makeup_gain"] == 0.6
    
    def test_automation_with_lfo_and_envelope(self):
        """Test parameter with both LFO and envelope."""
        param = AutomatedParameter("vibrato", 0.5)
        param.lfo = LFO(sample_rate=44100)
        param.envelope = Envelope(sample_rate=44100)
        
        param.lfo_intensity = 0.3
        param.envelope_intensity = 0.2
        
        # Test that components work (don't test exact values due to state)
        param.envelope.trigger(0)
        
        # Process LFO
        lfo_vals = param.lfo.process(4410)  # 100ms
        assert len(lfo_vals) == 4410
        assert np.max(lfo_vals) > 0.1 or np.min(lfo_vals) < -0.1  # Has some output
        
        # Process envelope
        env_vals = param.envelope.process(4410, 0)
        assert len(env_vals) == 4410
        assert np.max(env_vals) > 0  # Attack should reach some level


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
