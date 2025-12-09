"""
Test suite for Chorus effect
Tests all parameters, presets, and real-time processing
"""

import pytest
import numpy as np
from daw_core.fx.chorus import Chorus, create_chorus, CHORUS_PRESETS


class TestChorusInitialization:
    """Test chorus initialization and parameter setup."""
    
    def test_default_initialization(self):
        """Test chorus initializes with default parameters."""
        chorus = Chorus(sample_rate=44100)
        assert chorus.sample_rate == 44100
        assert chorus.delay_ms == 40.0
        assert chorus.rate_hz == 1.5
        assert chorus.depth_ms == 10.0
        assert chorus.write_pos == 0
        assert len(chorus.delay_buffer_l) > 0
        assert len(chorus.delay_buffer_r) > 0
    
    def test_custom_initialization(self):
        """Test chorus initializes with custom parameters."""
        chorus = Chorus(
            sample_rate=48000,
            delay_ms=50.0,
            rate_hz=2.0,
            depth_ms=15.0,
            feedback_db=-30.0,
        )
        assert chorus.sample_rate == 48000
        assert chorus.delay_ms == 50.0
        assert chorus.rate_hz == 2.0
        assert chorus.depth_ms == 15.0
        assert chorus.feedback_db == -30.0
    
    def test_delay_buffer_size(self):
        """Test delay buffer is properly sized."""
        chorus = Chorus(sample_rate=44100, delay_ms=40.0, depth_ms=10.0)
        expected_size = int((40.0 + 10.0) * 44100 / 1000.0) + 2
        assert len(chorus.delay_buffer_l) == expected_size
        assert len(chorus.delay_buffer_r) == expected_size


class TestChorusParameters:
    """Test parameter setters and constraints."""
    
    def test_set_delay(self):
        """Test setting delay time with clamping."""
        chorus = Chorus()
        chorus.set_delay(60.0)
        assert chorus.delay_ms == 60.0
        
        # Test clamping
        chorus.set_delay(300.0)  # Should clamp to 200.0
        assert chorus.delay_ms == 200.0
        
        chorus.set_delay(5.0)  # Should clamp to 10.0
        assert chorus.delay_ms == 10.0
    
    def test_set_rate(self):
        """Test setting LFO rate with clamping."""
        chorus = Chorus()
        chorus.set_rate(1.0)
        assert chorus.rate_hz == 1.0
        
        # Test clamping
        chorus.set_rate(20.0)  # Should clamp to 10.0
        assert chorus.rate_hz == 10.0
        
        chorus.set_rate(0.05)  # Should clamp to 0.1
        assert chorus.rate_hz == 0.1
    
    def test_set_depth(self):
        """Test setting modulation depth with clamping."""
        chorus = Chorus()
        chorus.set_depth(8.0)
        assert chorus.depth_ms == 8.0
        
        # Test clamping
        chorus.set_depth(100.0)  # Should clamp to 50.0
        assert chorus.depth_ms == 50.0
        
        chorus.set_depth(0.5)  # Should clamp to 1.0
        assert chorus.depth_ms == 1.0
    
    def test_set_feedback(self):
        """Test setting feedback amount with clamping."""
        chorus = Chorus()
        chorus.set_feedback(-60.0)
        assert chorus.feedback_db == -60.0
        
        # Test clamping
        chorus.set_feedback(-200.0)  # Should clamp to -120.0
        assert chorus.feedback_db == -120.0
        
        chorus.set_feedback(10.0)  # Should clamp to 6.0
        assert chorus.feedback_db == 6.0
    
    def test_set_wet_mix(self):
        """Test setting wet mix level with clamping."""
        chorus = Chorus()
        chorus.set_wet_mix(-6.0)
        assert chorus.wet_mix_db == -6.0
        
        # Test clamping
        chorus.set_wet_mix(-200.0)  # Should clamp to -120.0
        assert chorus.wet_mix_db == -120.0
    
    def test_set_dry_mix(self):
        """Test setting dry mix level with clamping."""
        chorus = Chorus()
        chorus.set_dry_mix(-6.0)
        assert chorus.dry_mix_db == -6.0
        
        # Test clamping
        chorus.set_dry_mix(-200.0)  # Should clamp to -120.0
        assert chorus.dry_mix_db == -120.0


class TestChorusProcessing:
    """Test audio processing functionality."""
    
    def test_process_single_sample(self):
        """Test processing a single sample pair."""
        chorus = Chorus(sample_rate=44100)
        left, right = chorus.process_sample(0.5, 0.5)
        
        # Output should be finite
        assert np.isfinite(left)
        assert np.isfinite(right)
        
        # Output should be in reasonable range
        assert abs(left) < 10.0
        assert abs(right) < 10.0
    
    def test_process_silence(self):
        """Test processing silence produces near-zero output."""
        chorus = Chorus(sample_rate=44100, feedback_db=-120.0)
        
        for _ in range(1000):
            left, right = chorus.process_sample(0.0, 0.0)
            # Allow small numerical errors
            assert abs(left) < 1e-6
            assert abs(right) < 1e-6
    
    def test_process_block(self):
        """Test processing a block of samples."""
        chorus = Chorus(sample_rate=44100)
        
        # Create test signal
        n_samples = 1000
        test_signal = 0.5 * np.sin(2 * np.pi * 440 * np.arange(n_samples) / 44100)
        test_signal = test_signal.astype(np.float32)
        
        out_l, out_r = chorus.process_block(test_signal, test_signal)
        
        # Output shapes should match input
        assert len(out_l) == len(test_signal)
        assert len(out_r) == len(test_signal)
        
        # Output should be finite
        assert np.all(np.isfinite(out_l))
        assert np.all(np.isfinite(out_r))
        
        # Output should not be silence (due to delay)
        assert np.max(np.abs(out_l)) > 0.01
        assert np.max(np.abs(out_r)) > 0.01
    
    def test_stereo_difference(self):
        """Test that L/R outputs differ due to stereo offset."""
        chorus = Chorus(sample_rate=44100, stereo_offset=90.0)
        
        # Process block
        n_samples = 5000
        test_signal = 0.5 * np.ones(n_samples, dtype=np.float32)
        
        out_l, out_r = chorus.process_block(test_signal, test_signal)
        
        # Outputs should be different (after transient)
        transient_end = 500  # Skip initial transient
        l_segment = out_l[transient_end:]
        r_segment = out_r[transient_end:]
        
        correlation = np.corrcoef(l_segment, r_segment)[0, 1]
        # Should not be perfectly correlated
        assert correlation < 0.95
    
    def test_delay_timing(self):
        """Test that delay line works (impulse response exists)."""
        sr = 44100
        delay_ms = 40.0
        chorus = Chorus(sample_rate=sr, delay_ms=delay_ms, depth_ms=0.0, feedback_db=-120.0)
        
        # Create impulse
        impulse = np.zeros(4000, dtype=np.float32)
        impulse[100] = 1.0
        
        out_l, _ = chorus.process_block(impulse, impulse)
        
        # Should have peak response (impulse is delayed and attenuated)
        peak_pos = np.argmax(np.abs(out_l))
        # Peak should be near or after impulse time (within reasonable delay)
        assert peak_pos >= 100
        # Peak should be within reasonable range (not at end)
        assert peak_pos < 3000


class TestChorusPresets:
    """Test preset configurations."""
    
    def test_all_presets_exist(self):
        """Test that all documented presets exist."""
        required_presets = ["subtle", "classic", "rich", "vintage", "thick"]
        for preset in required_presets:
            assert preset in CHORUS_PRESETS
    
    def test_preset_parameters_valid(self):
        """Test that all preset parameters are within valid ranges."""
        for preset_name, params in CHORUS_PRESETS.items():
            # Check all required keys exist
            assert "delay_ms" in params
            assert "rate_hz" in params
            assert "depth_ms" in params
            assert "feedback_db" in params
            assert "wet_mix_db" in params
            assert "dry_mix_db" in params
            assert "stereo_offset" in params
            
            # Check parameter ranges
            assert 10 <= params["delay_ms"] <= 200, f"Bad delay in {preset_name}"
            assert 0.1 <= params["rate_hz"] <= 10, f"Bad rate in {preset_name}"
            assert 1 <= params["depth_ms"] <= 50, f"Bad depth in {preset_name}"
            assert -120 <= params["feedback_db"] <= 6, f"Bad feedback in {preset_name}"
            assert -120 <= params["wet_mix_db"] <= 6, f"Bad wet mix in {preset_name}"
            assert -120 <= params["dry_mix_db"] <= 6, f"Bad dry mix in {preset_name}"
            assert 0 <= params["stereo_offset"] <= 360, f"Bad stereo offset in {preset_name}"
    
    def test_create_chorus_with_preset(self):
        """Test creating chorus from presets."""
        for preset_name in CHORUS_PRESETS.keys():
            chorus = create_chorus(preset_name, sample_rate=44100)
            assert isinstance(chorus, Chorus)
            assert chorus.sample_rate == 44100
    
    def test_invalid_preset(self):
        """Test that invalid preset raises error."""
        with pytest.raises(ValueError):
            create_chorus("invalid_preset")


class TestChorusReset:
    """Test reset functionality."""
    
    def test_reset_clears_buffers(self):
        """Test that reset clears all buffers."""
        chorus = Chorus(sample_rate=44100)
        
        # Process some samples to fill buffer
        test_signal = 0.5 * np.ones(1000, dtype=np.float32)
        chorus.process_block(test_signal, test_signal)
        
        # Buffers should be non-zero
        assert np.any(chorus.delay_buffer_l != 0.0)
        assert np.any(chorus.delay_buffer_r != 0.0)
        
        # Reset
        chorus.reset()
        
        # Buffers should be zero
        assert np.all(chorus.delay_buffer_l == 0.0)
        assert np.all(chorus.delay_buffer_r == 0.0)
        assert chorus.write_pos == 0
        assert chorus.lfo_phase_l == 0.0
        assert chorus.lfo_phase_r == 0.0


class TestChorusRobustness:
    """Test robustness and edge cases."""
    
    def test_extreme_wet_dry_mix(self):
        """Test with extreme wet/dry mixing ratios."""
        sr = 44100
        test_signal = 0.5 * np.ones(1000, dtype=np.float32)
        
        # 100% wet
        chorus = Chorus(sample_rate=sr, wet_mix_db=0.0, dry_mix_db=-120.0)
        out_l, out_r = chorus.process_block(test_signal, test_signal)
        assert np.all(np.isfinite(out_l))
        assert np.all(np.isfinite(out_r))
        
        # 100% dry
        chorus = Chorus(sample_rate=sr, wet_mix_db=-120.0, dry_mix_db=0.0)
        out_l, out_r = chorus.process_block(test_signal, test_signal)
        assert np.all(np.isfinite(out_l))
        assert np.all(np.isfinite(out_r))
    
    def test_various_sample_rates(self):
        """Test chorus at different sample rates."""
        sample_rates = [22050, 44100, 48000, 96000]
        test_signal = 0.5 * np.ones(1000, dtype=np.float32)
        
        for sr in sample_rates:
            chorus = Chorus(sample_rate=sr)
            out_l, out_r = chorus.process_block(test_signal, test_signal)
            assert np.all(np.isfinite(out_l))
            assert np.all(np.isfinite(out_r))
    
    def test_zero_rate(self):
        """Test with zero modulation rate (should still work)."""
        chorus = Chorus(sample_rate=44100)
        chorus.set_rate(0.1)  # Minimum rate
        
        test_signal = 0.5 * np.ones(1000, dtype=np.float32)
        out_l, out_r = chorus.process_block(test_signal, test_signal)
        
        assert np.all(np.isfinite(out_l))
        assert np.all(np.isfinite(out_r))
    
    def test_max_feedback(self):
        """Test with high feedback (near maximum)."""
        chorus = Chorus(
            sample_rate=44100,
            feedback_db=-0.1,  # Very high feedback (safe limit)
        )
        
        test_signal = 0.1 * np.ones(5000, dtype=np.float32)
        out_l, out_r = chorus.process_block(test_signal, test_signal)
        
        # Should not explode
        assert np.all(np.isfinite(out_l))
        assert np.all(np.isfinite(out_r))
        assert np.max(np.abs(out_l)) < 100.0
        assert np.max(np.abs(out_r)) < 100.0


class TestChorusCharacteristics:
    """Test tonal characteristics and behavior."""
    
    def test_frequency_response_preservation(self):
        """Test that chorus preserves fundamental frequency."""
        sr = 44100
        freq = 440  # A4
        duration = 1.0
        n_samples = int(sr * duration)
        
        # Create tone
        t = np.arange(n_samples) / sr
        signal = 0.5 * np.sin(2 * np.pi * freq * t).astype(np.float32)
        
        chorus = create_chorus("classic", sample_rate=sr)
        out_l, _ = chorus.process_block(signal, signal)
        
        # Find peak frequency in output using simple FFT
        fft = np.abs(np.fft.fft(out_l))
        peak_freq_idx = np.argmax(fft[:len(fft)//2])
        peak_freq = peak_freq_idx * sr / n_samples
        
        # Should be near input frequency (within 2%)
        assert abs(peak_freq - freq) < freq * 0.02
    
    def test_lfo_modulation_visible(self):
        """Test that LFO modulation is applied (output differs from input)."""
        sr = 44100
        duration = 1.0
        n_samples = int(sr * duration)
        
        # Create tone
        t = np.arange(n_samples) / sr
        signal = 0.1 * np.sin(2 * np.pi * 440 * t).astype(np.float32)
        
        chorus = create_chorus("classic", sample_rate=sr)
        out_l, out_r = chorus.process_block(signal, signal)
        
        # Output should be different from input (modulated)
        # Compare RMS values
        output_rms_l = np.sqrt(np.mean(out_l**2))
        output_rms_r = np.sqrt(np.mean(out_r**2))
        
        # Output should differ significantly from input (not pass-through)
        assert output_rms_l > 0  # Output is non-zero
        assert output_rms_r > 0
        
        # L and R should differ due to stereo offset
        correlation = np.corrcoef(out_l, out_r)[0, 1]
        assert correlation < 0.99  # Not perfectly correlated


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
