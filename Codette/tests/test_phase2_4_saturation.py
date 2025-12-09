"""
Phase 2.4 - Saturation & Distortion Effects Tests

Tests for Saturation, HardClip, Distortion, and WaveShaper effects.
Validates all effects with realistic audio signals and parameter ranges.
"""

import pytest
import numpy as np
from daw_core.fx.saturation import (
    Saturation,
    HardClip,
    Distortion,
    WaveShaper,
)


class TestSaturation:
    """Test Saturation soft-clipping effect."""

    def test_saturation_initialization(self):
        """Verify Saturation initializes with correct defaults."""
        sat = Saturation("Test Sat")
        assert sat.name == "Test Sat"
        assert sat.enabled is True
        assert sat.drive == 0.0
        assert sat.tone == 0.5
        assert sat.makeup_gain == 0.0
        assert sat.mix == 1.0

    def test_saturation_soft_clipping(self):
        """Verify Saturation applies soft clipping."""
        sat = Saturation()
        sat.set_drive(12)  # Add drive
        
        # Create test signal with peaks above 1.0
        signal = np.array([0.5, 1.5, -1.5, 2.0, -2.0], dtype=np.float32)
        output = sat.process(signal)
        
        # Verify clipping: output should be bounded
        assert np.max(np.abs(output)) <= 1.5  # Tanh doesn't hard clip
        assert output.shape == signal.shape
        assert output[0] > 0  # Positive values preserved

    def test_saturation_drive_parameter(self):
        """Verify Drive parameter works."""
        sat = Saturation()
        signal = np.full(1024, 0.5, dtype=np.float32)
        
        # Test drive range
        sat.set_drive(0)
        output_no_drive = sat.process(signal.copy())
        
        sat.set_drive(12)
        output_with_drive = sat.process(signal.copy())
        
        # More drive = more saturation = more compression of peaks
        # Saturation compresses signals above linear region
        assert output_no_drive.shape == output_with_drive.shape
        assert np.all(np.isfinite(output_with_drive))

    def test_saturation_makeup_gain(self):
        """Verify Makeup Gain compensation."""
        sat = Saturation()
        sat.set_drive(12)
        sat.set_makeup_gain(6)  # +6 dB makeup
        
        signal = np.full(1024, 0.1, dtype=np.float32)
        output = sat.process(signal)
        
        # Makeup gain should increase output level
        assert np.mean(np.abs(output)) > np.mean(np.abs(signal))

    def test_saturation_tone_control(self):
        """Verify Tone coloration."""
        sat = Saturation()
        signal = np.random.randn(1024).astype(np.float32) * 0.1
        
        # Test tone sweep
        sat.set_tone(0)
        output_bright = sat.process(signal.copy())
        
        sat.set_tone(1.0)
        output_warm = sat.process(signal.copy())
        
        # Both should be valid outputs
        assert output_bright.shape == output_warm.shape
        assert np.all(np.isfinite(output_bright))
        assert np.all(np.isfinite(output_warm))

    def test_saturation_mix_control(self):
        """Verify Wet/Dry mixing."""
        sat = Saturation()
        sat.set_drive(12)
        signal = np.full(1024, 0.5, dtype=np.float32)
        
        # Dry only
        sat.set_mix(0)
        output_dry = sat.process(signal.copy())
        assert np.allclose(output_dry, signal, atol=1e-6)
        
        # Wet only
        sat.set_mix(1.0)
        output_wet = sat.process(signal.copy())
        assert not np.allclose(output_wet, signal)

    def test_saturation_output_level_metering(self):
        """Verify output level metering."""
        sat = Saturation()
        signal = np.array([0.1, 0.5, -0.3, 0.8], dtype=np.float32)
        
        sat.process(signal)
        level = sat.get_output_level()
        
        assert level >= 0
        assert level <= 1.0  # Should be bounded

    def test_saturation_serialization(self):
        """Verify save/load functionality."""
        sat = Saturation()
        sat.set_drive(9)
        sat.set_tone(0.7)
        sat.set_makeup_gain(3)
        sat.set_mix(0.8)
        
        data = sat.to_dict()
        assert data["drive"] == 9
        assert data["tone"] == 0.7
        assert data["makeup_gain"] == 3
        assert data["mix"] == 0.8
        
        sat2 = Saturation()
        sat2.from_dict(data)
        assert sat2.drive == 9
        assert sat2.tone == 0.7
        assert sat2.makeup_gain == 3
        assert sat2.mix == 0.8


class TestHardClip:
    """Test HardClip digital clipping effect."""

    def test_hardclip_initialization(self):
        """Verify HardClip initializes correctly."""
        clip = HardClip("Test Clip")
        assert clip.name == "Test Clip"
        assert clip.enabled is True
        assert clip.threshold == -1.0
        assert clip.mix == 1.0

    def test_hardclip_clipping_behavior(self):
        """Verify hard clipping at threshold."""
        clip = HardClip()
        clip.set_threshold(-3)  # -3 dB threshold
        
        # Create signal with peaks
        signal = np.array([-0.8, -0.4, 0.4, 0.8], dtype=np.float32)
        output = clip.process(signal)
        
        # Should be clipped at threshold
        threshold_linear = 10 ** (-3 / 20.0)
        assert np.max(np.abs(output)) <= threshold_linear * 1.1

    def test_hardclip_threshold_parameter(self):
        """Verify Threshold parameter."""
        clip = HardClip()
        signal = np.full(1024, 0.9, dtype=np.float32)
        
        # Test different thresholds
        clip.set_threshold(0)
        output_0db = clip.process(signal.copy())
        
        clip.set_threshold(-12)
        output_12db = clip.process(signal.copy())
        
        # Lower threshold = more clipping
        assert np.mean(np.abs(output_12db)) < np.mean(np.abs(output_0db))

    def test_hardclip_clip_metering(self):
        """Verify clip percentage calculation."""
        clip = HardClip()
        clip.set_threshold(-3)
        
        # Signal with clipping
        signal = np.array([0.9, 1.5, -1.5, 0.1], dtype=np.float32)
        clip.process(signal)
        
        percent = clip.get_clip_percentage(signal.shape[0])
        assert 0 <= percent <= 100

    def test_hardclip_mix_control(self):
        """Verify Wet/Dry mixing."""
        clip = HardClip()
        clip.set_threshold(-12)
        signal = np.full(1024, 0.5, dtype=np.float32)
        
        clip.set_mix(0)
        output_dry = clip.process(signal.copy())
        assert np.allclose(output_dry, signal)

    def test_hardclip_serialization(self):
        """Verify save/load functionality."""
        clip = HardClip()
        clip.set_threshold(-6)
        clip.set_mix(0.9)
        
        data = clip.to_dict()
        assert data["threshold"] == -6
        assert data["mix"] == 0.9
        
        clip2 = HardClip()
        clip2.from_dict(data)
        assert clip2.threshold == -6
        assert clip2.mix == 0.9


class TestDistortion:
    """Test Distortion nonlinear effect."""

    def test_distortion_initialization(self):
        """Verify Distortion initializes."""
        dist = Distortion()
        assert dist.enabled is True
        assert dist.distortion_type == "soft"
        assert dist.drive == 12.0
        assert dist.tone == 0.5
        assert dist.mix == 1.0

    def test_distortion_soft_mode(self):
        """Verify soft distortion mode."""
        dist = Distortion()
        dist.set_type("soft")
        
        signal = np.array([0.5, 1.0, -0.8], dtype=np.float32)
        output = dist.process(signal)
        
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))

    def test_distortion_hard_mode(self):
        """Verify hard distortion mode."""
        dist = Distortion()
        dist.set_type("hard")
        
        signal = np.array([0.5, 2.0, -2.0], dtype=np.float32)
        output = dist.process(signal)
        
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))

    def test_distortion_fuzz_mode(self):
        """Verify fuzz distortion mode."""
        dist = Distortion()
        dist.set_type("fuzz")
        
        signal = np.array([0.3, 0.7, -0.5], dtype=np.float32)
        output = dist.process(signal)
        
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))

    def test_distortion_drive_intensity(self):
        """Verify Drive parameter."""
        dist = Distortion()
        signal = np.full(1024, 0.2, dtype=np.float32)
        
        dist.set_drive(0)
        output_low = dist.process(signal.copy())
        
        dist.set_drive(24)
        output_high = dist.process(signal.copy())
        
        # More drive = more distortion/coloration
        assert output_high.shape == output_low.shape

    def test_distortion_tone_control(self):
        """Verify Tone coloration."""
        dist = Distortion()
        signal = np.random.randn(1024).astype(np.float32) * 0.1
        
        dist.set_tone(0)
        output_0 = dist.process(signal.copy())
        
        dist.set_tone(1.0)
        output_1 = dist.process(signal.copy())
        
        assert output_0.shape == output_1.shape
        assert np.all(np.isfinite(output_0))
        assert np.all(np.isfinite(output_1))

    def test_distortion_mix_control(self):
        """Verify Wet/Dry mixing."""
        dist = Distortion()
        dist.set_drive(20)
        signal = np.full(1024, 0.5, dtype=np.float32)
        
        dist.set_mix(0)
        output_dry = dist.process(signal.copy())
        assert np.allclose(output_dry, signal, atol=1e-6)

    def test_distortion_serialization(self):
        """Verify save/load functionality."""
        dist = Distortion()
        dist.set_type("hard")
        dist.set_drive(18)
        dist.set_tone(0.8)
        dist.set_mix(0.95)
        
        data = dist.to_dict()
        assert data["distortion_type"] == "hard"
        assert data["drive"] == 18
        assert data["tone"] == 0.8
        assert data["mix"] == 0.95
        
        dist2 = Distortion()
        dist2.from_dict(data)
        assert dist2.distortion_type == "hard"
        assert dist2.drive == 18


class TestWaveShaper:
    """Test WaveShaper custom transfer curve effect."""

    def test_waveshaper_initialization(self):
        """Verify WaveShaper initializes."""
        ws = WaveShaper()
        assert ws.enabled is True
        assert ws.curve == "tanh"
        assert ws.drive == 1.0
        assert ws.mix == 1.0

    def test_waveshaper_sine_curve(self):
        """Verify sine waveshaping."""
        ws = WaveShaper()
        ws.set_curve("sine")
        
        signal = np.array([0.2, 0.5, -0.3], dtype=np.float32)
        output = ws.process(signal)
        
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))

    def test_waveshaper_square_curve(self):
        """Verify square waveshaping."""
        ws = WaveShaper()
        ws.set_curve("square")
        
        signal = np.array([0.2, 0.7, -0.5], dtype=np.float32)
        output = ws.process(signal)
        
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))

    def test_waveshaper_cubic_curve(self):
        """Verify cubic waveshaping."""
        ws = WaveShaper()
        ws.set_curve("cubic")
        
        signal = np.array([0.1, 0.5, -0.4], dtype=np.float32)
        output = ws.process(signal)
        
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))

    def test_waveshaper_tanh_curve(self):
        """Verify tanh waveshaping."""
        ws = WaveShaper()
        ws.set_curve("tanh")
        
        signal = np.array([0.3, 0.8, -0.6], dtype=np.float32)
        output = ws.process(signal)
        
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))

    def test_waveshaper_drive_parameter(self):
        """Verify Drive parameter."""
        ws = WaveShaper()
        signal = np.full(1024, 0.1, dtype=np.float32)
        
        ws.set_drive(1.0)
        output_1 = ws.process(signal.copy())
        
        ws.set_drive(5.0)
        output_5 = ws.process(signal.copy())
        
        # Higher drive = more waveshaping effect
        assert output_1.shape == output_5.shape

    def test_waveshaper_mix_control(self):
        """Verify Wet/Dry mixing."""
        ws = WaveShaper()
        ws.set_drive(2.0)
        signal = np.full(1024, 0.3, dtype=np.float32)
        
        ws.set_mix(0)
        output_dry = ws.process(signal.copy())
        assert np.allclose(output_dry, signal, atol=1e-6)

    def test_waveshaper_serialization(self):
        """Verify save/load functionality."""
        ws = WaveShaper()
        ws.set_curve("cubic")
        ws.set_drive(3.0)
        ws.set_mix(0.85)
        
        data = ws.to_dict()
        assert data["curve"] == "cubic"
        assert data["drive"] == 3.0
        assert data["mix"] == 0.85
        
        ws2 = WaveShaper()
        ws2.from_dict(data)
        assert ws2.curve == "cubic"
        assert ws2.drive == 3.0


class TestSaturationIntegration:
    """Integration tests for saturation effects."""

    def test_saturation_chain(self):
        """Test chaining multiple saturation effects."""
        sat = Saturation()
        clip = HardClip()
        dist = Distortion()
        
        signal = np.random.randn(4096).astype(np.float32) * 0.3
        
        # Process through chain
        sat.set_drive(6)
        signal = sat.process(signal)
        
        clip.set_threshold(-6)
        signal = clip.process(signal)
        
        dist.set_type("soft")
        dist.set_drive(12)
        signal = dist.process(signal)
        
        # Verify output
        assert signal.shape[0] == 4096
        assert np.all(np.isfinite(signal))
        assert np.max(np.abs(signal)) <= 2.0

    def test_saturation_realistic_audio(self):
        """Test with realistic audio signal."""
        # Simulate audio: sine wave
        sample_rate = 44100
        duration = 1.0
        freq = 440  # A4
        t = np.linspace(0, duration, int(sample_rate * duration), dtype=np.float32)
        signal = 0.5 * np.sin(2 * np.pi * freq * t)
        
        sat = Saturation()
        sat.set_drive(12)
        sat.set_makeup_gain(-3)
        
        output = sat.process(signal)
        
        assert output.shape == signal.shape
        assert np.all(np.isfinite(output))
        assert np.max(np.abs(output)) < 2.0

    def test_all_effects_parameter_bounds(self):
        """Verify all parameter boundaries are enforced."""
        sat = Saturation()
        clip = HardClip()
        dist = Distortion()
        ws = WaveShaper()
        
        signal = np.random.randn(1024).astype(np.float32) * 0.1
        
        # Saturation bounds
        sat.set_drive(100)  # Should clamp to 24
        assert sat.drive == 24
        
        # HardClip bounds
        clip.set_threshold(10)  # Should clamp to 0
        assert clip.threshold == 0
        
        clip.set_threshold(-100)  # Should clamp to -60
        assert clip.threshold == -60
        
        # Distortion bounds
        dist.set_drive(-10)  # Should clamp to 0
        assert dist.drive == 0
        
        # WaveShaper bounds
        ws.set_drive(0.05)  # Should clamp to 0.1
        assert ws.drive == 0.1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
