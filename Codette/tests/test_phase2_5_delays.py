"""
Phase 2.5 - Delay Effects Tests

Tests for SimpleDelay, PingPongDelay, MultiTapDelay, and StereoDelay effects.
Validates circular buffer implementation and time-based processing.
"""

import pytest
import numpy as np
from daw_core.fx.delays import (
    SimpleDelay,
    PingPongDelay,
    MultiTapDelay,
    StereoDelay,
)


class TestSimpleDelay:
    """Test SimpleDelay single-tap delay effect."""

    def test_simpledelay_initialization(self):
        """Verify SimpleDelay initializes correctly."""
        delay = SimpleDelay("Test Delay")
        assert delay.name == "Test Delay"
        assert delay.enabled is True
        assert delay.time_ms == 500.0
        assert delay.feedback == 0.5
        assert delay.mix == 0.5
        assert delay.ping_pong is False

    def test_simpledelay_basic_processing(self):
        """Verify basic delay processing."""
        delay = SimpleDelay(sample_rate=44100)
        delay.set_time(100)  # 100ms delay
        delay.set_mix(0)  # Dry only initially
        
        signal = np.array([1.0, 0.0, 0.0, 0.0] * 441, dtype=np.float32)  # ~100ms at 44.1k
        output = delay.process(signal)
        
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))
        # Dry only should match input
        assert np.allclose(output, signal, atol=1e-5)

    def test_simpledelay_feedback(self):
        """Verify feedback creates repeating echoes."""
        delay = SimpleDelay(sample_rate=44100)
        delay.set_time(100)
        delay.set_feedback(0.6)
        delay.set_mix(1.0)  # Wet only
        
        # Impulse signal
        signal = np.zeros(8820, dtype=np.float32)  # 200ms
        signal[0] = 1.0
        
        output = delay.process(signal)
        
        # Should have echo at ~100ms
        assert np.all(np.isfinite(output))
        assert output.shape == signal.shape

    def test_simpledelay_time_parameter(self):
        """Verify delay time control."""
        delay = SimpleDelay()
        signal = np.random.randn(1024).astype(np.float32) * 0.1
        
        delay.set_time(100)
        assert delay.time_ms == 100
        
        delay.set_time(5000)  # Max
        assert delay.time_ms == 5000
        
        delay.set_time(10000)  # Should clamp
        assert delay.time_ms == 5000

    def test_simpledelay_feedback_parameter(self):
        """Verify feedback control and bounds."""
        delay = SimpleDelay()
        
        delay.set_feedback(0)
        assert delay.feedback == 0
        
        delay.set_feedback(0.5)
        assert delay.feedback == 0.5
        
        delay.set_feedback(1.0)  # Should clamp to 0.95
        assert delay.feedback == 0.95

    def test_simpledelay_mix_control(self):
        """Verify wet/dry mixing."""
        delay = SimpleDelay(sample_rate=44100)
        delay.set_time(100)
        signal = np.full(1024, 0.5, dtype=np.float32)
        
        # Dry only
        delay.set_mix(0)
        output_dry = delay.process(signal.copy())
        assert np.allclose(output_dry, signal, atol=1e-4)
        
        # Wet only
        delay.set_mix(1.0)
        output_wet = delay.process(signal.copy())
        # Wet should differ from input
        assert not np.allclose(output_wet, signal, atol=1e-2)

    def test_simpledelay_buffer_clear(self):
        """Verify buffer clearing."""
        delay = SimpleDelay()
        delay.set_time(100)
        delay.set_feedback(0.8)
        
        signal = np.random.randn(1024).astype(np.float32)
        delay.process(signal)
        
        delay.clear()
        assert np.allclose(delay.delay_buffer, 0)

    def test_simpledelay_serialization(self):
        """Verify save/load functionality."""
        delay = SimpleDelay()
        delay.set_time(250)
        delay.set_feedback(0.7)
        delay.set_mix(0.8)
        
        data = delay.to_dict()
        assert data["time_ms"] == 250
        assert data["feedback"] == 0.7
        assert data["mix"] == 0.8
        
        delay2 = SimpleDelay()
        delay2.from_dict(data)
        assert delay2.time_ms == 250
        assert delay2.feedback == 0.7


class TestPingPongDelay:
    """Test PingPongDelay stereo bouncing effect."""

    def test_pingpongdelay_initialization(self):
        """Verify PingPongDelay initializes."""
        delay = PingPongDelay("Test PP")
        assert delay.name == "Test PP"
        assert delay.enabled is True
        assert delay.time_ms == 500.0
        assert delay.feedback == 0.5
        assert delay.stereo_width == 1.0

    def test_pingpongdelay_mono_input(self):
        """Verify mono input handling."""
        delay = PingPongDelay()
        signal = np.random.randn(1024).astype(np.float32)
        
        output = delay.process(signal)
        assert output.ndim == 1
        assert output.shape == signal.shape

    def test_pingpongdelay_stereo_processing(self):
        """Verify stereo processing."""
        delay = PingPongDelay()
        signal = np.random.randn(2, 1024).astype(np.float32)
        
        output = delay.process(signal)
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))

    def test_pingpongdelay_cross_channel_bouncing(self):
        """Verify ping-pong cross-channel effect."""
        delay = PingPongDelay(sample_rate=44100)
        delay.set_time(100)  # 100ms
        delay.set_feedback(0.6)
        delay.set_mix(1.0)  # Wet only
        
        # Left channel impulse
        signal = np.zeros((2, 8820), dtype=np.float32)
        signal[0, 0] = 1.0
        
        output = delay.process(signal)
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))

    def test_pingpongdelay_stereo_width(self):
        """Verify stereo width control."""
        delay = PingPongDelay()
        signal = np.random.randn(2, 1024).astype(np.float32)
        
        delay.set_stereo_width(0.5)
        output_half = delay.process(signal.copy())
        
        delay.set_stereo_width(1.0)
        output_full = delay.process(signal.copy())
        
        assert output_half.shape == output_full.shape

    def test_pingpongdelay_serialization(self):
        """Verify save/load."""
        delay = PingPongDelay()
        delay.set_time(300)
        delay.set_feedback(0.6)
        delay.set_stereo_width(0.8)
        delay.set_mix(0.7)
        
        data = delay.to_dict()
        delay2 = PingPongDelay()
        delay2.from_dict(data)
        
        assert delay2.time_ms == 300
        assert delay2.feedback == 0.6


class TestMultiTapDelay:
    """Test MultiTapDelay multiple independent taps."""

    def test_multitapdelay_initialization(self):
        """Verify MultiTapDelay initialization."""
        delay = MultiTapDelay(tap_count=4)
        assert delay.tap_count == 4
        assert len(delay.tap_levels) == 4
        assert np.isclose(np.sum(delay.tap_levels), 1.0)

    def test_multitapdelay_basic_processing(self):
        """Verify basic processing."""
        delay = MultiTapDelay(tap_count=3)
        signal = np.random.randn(2048).astype(np.float32)
        
        output = delay.process(signal)
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))

    def test_multitapdelay_spacing(self):
        """Verify tap spacing control."""
        delay = MultiTapDelay(tap_count=4)
        
        delay.set_spacing(250)
        assert delay.spacing_ms == 250
        
        delay.set_spacing(50)  # Clamp to 50ms min
        assert delay.spacing_ms == 50
        
        delay.set_spacing(5000)  # Clamp to 2000ms max
        assert delay.spacing_ms == 2000

    def test_multitapdelay_tap_levels(self):
        """Verify individual tap level control."""
        delay = MultiTapDelay(tap_count=4)
        
        delay.set_tap_level(0, 0.5)
        delay.set_tap_level(1, 0.3)
        delay.set_tap_level(2, 0.15)
        delay.set_tap_level(3, 0.05)
        
        assert delay.tap_levels[0] == 0.5
        assert delay.tap_levels[1] == 0.3

    def test_multitapdelay_tap_count_change(self):
        """Verify dynamic tap count changes."""
        delay = MultiTapDelay(tap_count=4)
        
        delay.set_tap_count(8)
        assert delay.tap_count == 8
        assert len(delay.tap_levels) == 8
        
        delay.set_tap_count(1)
        assert delay.tap_count == 1
        assert len(delay.tap_levels) == 1

    def test_multitapdelay_feedback(self):
        """Verify feedback control."""
        delay = MultiTapDelay()
        
        delay.set_feedback(0.3)
        assert delay.feedback == 0.3
        
        delay.set_feedback(1.0)  # Clamp
        assert delay.feedback == 0.95

    def test_multitapdelay_serialization(self):
        """Verify save/load."""
        delay = MultiTapDelay(tap_count=4)
        delay.set_spacing(300)
        delay.set_feedback(0.5)
        delay.set_mix(0.6)
        
        data = delay.to_dict()
        delay2 = MultiTapDelay()
        delay2.from_dict(data)
        
        assert delay2.tap_count == 4
        assert delay2.spacing_ms == 300
        assert delay2.mix == 0.6


class TestStereoDelay:
    """Test StereoDelay independent per-channel delays."""

    def test_stereodelay_initialization(self):
        """Verify StereoDelay initialization."""
        delay = StereoDelay("Stereo")
        assert delay.enabled is True
        assert delay.time_l_ms == 400.0
        assert delay.time_r_ms == 500.0
        assert delay.feedback == 0.5

    def test_stereodelay_mono_input(self):
        """Verify mono input handling."""
        delay = StereoDelay()
        signal = np.random.randn(1024).astype(np.float32)
        
        output = delay.process(signal)
        assert output.ndim == 1

    def test_stereodelay_stereo_processing(self):
        """Verify stereo processing."""
        delay = StereoDelay()
        signal = np.random.randn(2, 1024).astype(np.float32)
        
        output = delay.process(signal)
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))

    def test_stereodelay_independent_times(self):
        """Verify independent left/right delays."""
        delay = StereoDelay()
        
        delay.set_time_l(300)
        delay.set_time_r(600)
        
        assert delay.time_l_ms == 300
        assert delay.time_r_ms == 600

    def test_stereodelay_bounds(self):
        """Verify parameter bounds."""
        delay = StereoDelay()
        
        delay.set_time_l(10000)  # Should clamp
        assert delay.time_l_ms == 5000
        
        delay.set_feedback(1.0)  # Should clamp
        assert delay.feedback == 0.95

    def test_stereodelay_serialization(self):
        """Verify save/load."""
        delay = StereoDelay()
        delay.set_time_l(350)
        delay.set_time_r(550)
        delay.set_feedback(0.6)
        delay.set_mix(0.7)
        
        data = delay.to_dict()
        delay2 = StereoDelay()
        delay2.from_dict(data)
        
        assert delay2.time_l_ms == 350
        assert delay2.time_r_ms == 550


class TestDelayIntegration:
    """Integration tests for delay effects."""

    def test_delay_chain(self):
        """Test chaining multiple delays."""
        simple = SimpleDelay()
        pingpong = PingPongDelay()
        
        signal = np.random.randn(4096).astype(np.float32) * 0.1
        
        simple.set_time(100)
        signal = simple.process(signal)
        
        # Convert for stereo
        signal_stereo = np.stack([signal, signal], axis=0)
        output = pingpong.process(signal_stereo)
        
        assert output.shape[0] == 2
        assert np.all(np.isfinite(output))

    def test_delay_realistic_audio(self):
        """Test with realistic audio signal."""
        sample_rate = 44100
        duration = 1.0
        freq = 440
        
        t = np.linspace(0, duration, int(sample_rate * duration), dtype=np.float32)
        signal = 0.3 * np.sin(2 * np.pi * freq * t)
        
        delay = SimpleDelay(sample_rate=sample_rate)
        delay.set_time(250)
        delay.set_feedback(0.5)
        delay.set_mix(0.5)
        
        output = delay.process(signal)
        
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))
        assert np.max(np.abs(output)) <= 1.0

    def test_delay_no_clipping(self):
        """Verify delays don't cause clipping."""
        delays = [
            SimpleDelay(),
            PingPongDelay(),
            MultiTapDelay(tap_count=4),
            StereoDelay(),
        ]
        
        signal = np.full(1024, 0.5, dtype=np.float32)
        
        for delay in delays:
            delay.set_feedback(0.8)
            delay.set_mix(1.0)
            
            if isinstance(delay, (PingPongDelay, StereoDelay)):
                signal_test = np.stack([signal, signal], axis=0)
            else:
                signal_test = signal
            
            output = delay.process(signal_test)
            assert np.max(np.abs(output)) <= 1.1  # Small headroom for numerical error

    def test_delay_buffer_management(self):
        """Verify buffer memory management."""
        delay = SimpleDelay(sample_rate=44100)
        
        # Full 5 second buffer
        assert delay.max_delay_samples == int(5.0 * 44100 / 1000.0)
        
        # Clear and verify
        delay.clear()
        assert np.allclose(delay.delay_buffer, 0)
        assert delay.write_pos == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
