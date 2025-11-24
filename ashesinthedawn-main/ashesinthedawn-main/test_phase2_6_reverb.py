"""
Test Suite for Phase 2.6 - Reverb Engine

Comprehensive tests for:
- CombFilter: Impulse response, feedback, damping
- AllpassFilter: Phase preservation, diffusion
- Reverb: Freeverb algorithm, presets, serialization
- Preset variants: HallReverb, PlateReverb, RoomReverb
"""

import numpy as np
import pytest
from daw_core.fx.reverb import (
    CombFilter,
    AllpassFilter,
    Reverb,
    HallReverb,
    PlateReverb,
    RoomReverb,
    REVERB_PRESETS,
)


class TestCombFilter:
    """Test suite for CombFilter implementation."""
    
    def test_comb_initialization(self):
        """Test basic comb filter initialization."""
        comb = CombFilter(delay_samples=1000)
        assert comb.delay_samples == 1000
        assert len(comb.buffer) == 1000
        assert comb.feedback == 0.5
        assert comb.damping == 0.5
    
    def test_comb_impulse_response(self):
        """Test impulse response (should show reflections)."""
        comb = CombFilter(delay_samples=100)
        comb.set_feedback(0.7)
        comb.set_damping(0.0)  # No damping for clear reflections
        
        # Create impulse
        impulse = np.zeros(500)
        impulse[0] = 1.0
        
        output = comb.process(impulse)
        
        # Check for impulse at delay time
        assert np.abs(output[100]) > 0.5  # First reflection
        # Later reflections should be present
        assert np.abs(output[200]) > 0.3  # Second reflection
    
    def test_comb_feedback_limiting(self):
        """Test that feedback is limited to prevent instability."""
        comb = CombFilter(delay_samples=100)
        
        # Try to set feedback > 0.95
        comb.set_feedback(1.5)
        assert comb.feedback == 0.95
        
        # Negative feedback should clamp to 0
        comb.set_feedback(-0.5)
        assert comb.feedback == 0.0
    
    def test_comb_damping_effect(self):
        """Test that damping reduces high frequencies."""
        # Create two combs: one with damping, one without
        comb_undamped = CombFilter(delay_samples=100)
        comb_undamped.set_feedback(0.8)
        comb_undamped.set_damping(0.0)
        
        comb_damped = CombFilter(delay_samples=100)
        comb_damped.set_feedback(0.8)
        comb_damped.set_damping(0.9)
        
        # Create high-frequency signal
        time = np.arange(1000) / 44100.0
        high_freq_signal = np.sin(2 * np.pi * 8000 * time).astype(np.float32)
        
        out_undamped = comb_undamped.process(high_freq_signal)
        out_damped = comb_damped.process(high_freq_signal)
        
        # Damped should have lower energy (especially later in signal)
        energy_undamped = np.sum(out_undamped[500:] ** 2)
        energy_damped = np.sum(out_damped[500:] ** 2)
        
        assert energy_damped < energy_undamped
    
    def test_comb_mono_processing(self):
        """Test mono signal processing."""
        comb = CombFilter(delay_samples=100)
        signal = np.random.randn(1000).astype(np.float32)
        
        output = comb.process(signal)
        
        assert output.shape == signal.shape
        assert not np.all(output == 0)
    
    def test_comb_stereo_processing(self):
        """Test stereo signal processing."""
        comb = CombFilter(delay_samples=100)
        signal = np.random.randn(2, 1000).astype(np.float32)
        
        output = comb.process(signal)
        
        assert output.shape == signal.shape
        # Left and right should be different (independent processing)
        assert not np.allclose(output[0], output[1])
    
    def test_comb_clear(self):
        """Test buffer clearing."""
        comb = CombFilter(delay_samples=100)
        
        # Process signal
        signal = np.ones(200, dtype=np.float32)
        _ = comb.process(signal)
        
        # Check buffer has values
        assert np.any(comb.buffer != 0)
        
        # Clear
        comb.clear()
        
        # Buffer should be zeroed
        assert np.all(comb.buffer == 0)
        assert comb.filter_store == 0.0
        assert comb.write_pos == 0
    
    def test_comb_no_clipping(self):
        """Test that output stays within [-1, 1]."""
        comb = CombFilter(delay_samples=50)
        comb.set_feedback(0.95)  # High feedback
        
        # Loud signal
        signal = np.ones(500, dtype=np.float32) * 0.9
        output = comb.process(signal)
        
        # All values should be clipped to [-1, 1]
        assert np.all(output >= -1.0)
        assert np.all(output <= 1.0)
    
    def test_comb_serialization(self):
        """Test comb filter save/load."""
        comb1 = CombFilter(delay_samples=100)
        comb1.set_feedback(0.75)
        comb1.set_damping(0.6)
        
        # Process some signal to populate buffer
        signal = np.random.randn(500)
        _ = comb1.process(signal)
        
        # Serialize and deserialize
        data = comb1.to_dict()
        comb2 = CombFilter.from_dict(data)
        
        # Check state restored
        assert comb2.feedback == comb1.feedback
        assert comb2.damping == comb1.damping
        assert np.allclose(comb2.buffer, comb1.buffer)
        assert comb2.write_pos == comb1.write_pos


class TestAllpassFilter:
    """Test suite for AllpassFilter implementation."""
    
    def test_allpass_initialization(self):
        """Test basic allpass filter initialization."""
        allpass = AllpassFilter(delay_samples=500)
        assert allpass.delay_samples == 500
        assert len(allpass.buffer) == 500
        assert allpass.feedback == 0.5
    
    def test_allpass_phase_shift(self):
        """Test that allpass filter shifts phase but preserves magnitude."""
        allpass = AllpassFilter(delay_samples=100)
        
        # Create sine wave
        time = np.arange(1000) / 44100.0
        signal = np.sin(2 * np.pi * 1000 * time).astype(np.float32)
        
        output = allpass.process(signal)
        
        # Energy should be similar (magnitude preserved)
        energy_in = np.sum(signal ** 2)
        energy_out = np.sum(output ** 2)
        
        # Allow 20% tolerance (due to boundary effects)
        assert energy_out > energy_in * 0.8
        assert energy_out < energy_in * 1.2
    
    def test_allpass_feedback_range(self):
        """Test feedback coefficient limiting."""
        allpass = AllpassFilter(delay_samples=100)
        
        # Set to > 1
        allpass.set_feedback(1.5)
        assert allpass.feedback == 0.99
        
        # Set to < -1
        allpass.set_feedback(-1.5)
        assert allpass.feedback == -0.99
    
    def test_allpass_mono_processing(self):
        """Test mono signal processing."""
        allpass = AllpassFilter(delay_samples=100)
        signal = np.random.randn(1000).astype(np.float32)
        
        output = allpass.process(signal)
        
        assert output.shape == signal.shape
    
    def test_allpass_stereo_processing(self):
        """Test stereo signal processing."""
        allpass = AllpassFilter(delay_samples=100)
        signal = np.random.randn(2, 1000).astype(np.float32)
        
        output = allpass.process(signal)
        
        assert output.shape == signal.shape
    
    def test_allpass_clear(self):
        """Test buffer clearing."""
        allpass = AllpassFilter(delay_samples=100)
        
        # Process signal
        signal = np.ones(200)
        _ = allpass.process(signal)
        
        # Clear
        allpass.clear()
        
        assert np.all(allpass.buffer == 0)
        assert allpass.write_pos == 0
    
    def test_allpass_no_clipping(self):
        """Test output stays within [-1, 1]."""
        allpass = AllpassFilter(delay_samples=50)
        allpass.set_feedback(0.95)
        
        signal = np.ones(500) * 0.9
        output = allpass.process(signal)
        
        assert np.all(output >= -1.0)
        assert np.all(output <= 1.0)
    
    def test_allpass_serialization(self):
        """Test allpass filter serialization."""
        allpass1 = AllpassFilter(delay_samples=200)
        allpass1.set_feedback(0.7)
        
        # Process signal
        signal = np.random.randn(500)
        _ = allpass1.process(signal)
        
        # Serialize and deserialize
        data = allpass1.to_dict()
        allpass2 = AllpassFilter.from_dict(data)
        
        assert allpass2.feedback == allpass1.feedback
        assert np.allclose(allpass2.buffer, allpass1.buffer)
        assert allpass2.write_pos == allpass1.write_pos


class TestReverb:
    """Test suite for main Reverb engine."""
    
    def test_reverb_initialization(self):
        """Test basic reverb initialization."""
        reverb = Reverb(sample_rate=44100)
        assert reverb.sample_rate == 44100
        assert reverb.room_size == 0.5
        assert reverb.damping == 0.5
        assert reverb.wet_level == 0.3
        assert reverb.dry_level == 0.4
        assert len(reverb.combs_left) == 8
        assert len(reverb.combs_right) == 8
        assert len(reverb.allpass_left) == 4
        assert len(reverb.allpass_right) == 4
    
    def test_reverb_parameter_bounds(self):
        """Test parameter clipping."""
        reverb = Reverb()
        
        # Room size
        reverb.set_room_size(1.5)
        assert reverb.room_size == 1.0
        reverb.set_room_size(-0.5)
        assert reverb.room_size == 0.0
        
        # Damping
        reverb.set_damping(2.0)
        assert reverb.damping == 1.0
        
        # Wet/Dry levels
        reverb.set_wet_level(1.5)
        assert reverb.wet_level == 1.0
        
        # Width
        reverb.set_width(3.0)
        assert reverb.width == 2.0
    
    def test_reverb_mono_processing(self):
        """Test mono signal processing."""
        reverb = Reverb()
        signal = np.random.randn(8000).astype(np.float32) * 0.1
        
        output = reverb.process(signal)
        
        assert output.shape == signal.shape
        assert output.dtype == signal.dtype
    
    def test_reverb_stereo_processing(self):
        """Test stereo signal processing."""
        reverb = Reverb()
        signal = np.random.randn(2, 8000).astype(np.float32) * 0.1
        
        output = reverb.process(signal)
        
        assert output.shape == signal.shape
        assert output[0].shape == (8000,)
        assert output[1].shape == (8000,)
    
    def test_reverb_wet_dry_balance(self):
        """Test wet/dry mixing."""
        # Dry only
        reverb_dry = Reverb()
        reverb_dry.set_wet_level(0.0)
        reverb_dry.set_dry_level(1.0)
        
        # Wet only
        reverb_wet = Reverb()
        reverb_wet.set_wet_level(1.0)
        reverb_wet.set_dry_level(0.0)
        
        signal = np.random.randn(4000).astype(np.float32) * 0.1
        
        out_dry = reverb_dry.process(signal)
        out_wet = reverb_wet.process(signal)
        
        # Dry output should be close to input (no processing)
        assert np.allclose(out_dry, signal, atol=0.01)
        
        # Wet should be different
        assert not np.allclose(out_wet, signal)
    
    def test_reverb_room_size_effect(self):
        """Test that room size affects decay time."""
        # Small room
        small_room = Reverb()
        small_room.set_room_size(0.2)
        small_room.set_wet_level(1.0)
        small_room.set_dry_level(0.0)
        
        # Large room
        large_room = Reverb()
        large_room.set_room_size(0.95)
        large_room.set_wet_level(1.0)
        large_room.set_dry_level(0.0)
        
        # Create impulse
        signal = np.zeros(44100).astype(np.float32)  # 1 second @ 44.1kHz
        signal[0] = 0.3
        
        out_small = small_room.process(signal)
        out_large = large_room.process(signal)
        
        # Energy should decay more slowly with larger room
        energy_small = np.sum(np.abs(out_small[22050:]))
        energy_large = np.sum(np.abs(out_large[22050:]))
        
        # Large room should preserve more energy (longer decay)
        assert energy_large > energy_small
    
    def test_reverb_damping_effect(self):
        """Test that damping affects high-frequency content."""
        # Create high-frequency signal
        time = np.arange(8000) / 44100.0
        signal = np.sin(2 * np.pi * 8000 * time).astype(np.float32) * 0.1
        
        # Undamped
        reverb_bright = Reverb()
        reverb_bright.set_damping(0.0)
        reverb_bright.set_room_size(0.8)
        
        # Damped
        reverb_dark = Reverb()
        reverb_dark.set_damping(0.9)
        reverb_dark.set_room_size(0.8)
        
        out_bright = reverb_bright.process(signal)
        out_dark = reverb_dark.process(signal)
        
        # Damped version should have lower high-frequency energy
        # (check tail of signal where reverb is prominent)
        energy_bright = np.sum(out_bright[4000:] ** 2)
        energy_dark = np.sum(out_dark[4000:] ** 2)
        
        assert energy_dark < energy_bright
    
    def test_reverb_width_effect(self):
        """Test stereo width control."""
        reverb_mono = Reverb()
        reverb_mono.set_width(0.0)
        
        reverb_stereo = Reverb()
        reverb_stereo.set_width(1.0)
        
        # Stereo input
        left = np.random.randn(4000).astype(np.float32) * 0.1
        right = np.random.randn(4000).astype(np.float32) * 0.1
        signal = np.array([left, right])
        
        out_mono = reverb_mono.process(signal)
        out_stereo = reverb_stereo.process(signal)
        
        # Mono width should collapse to mono
        mono_diff = np.abs(out_mono[0] - out_mono[1]).mean()
        stereo_diff = np.abs(out_stereo[0] - out_stereo[1]).mean()
        
        # Mono should have smaller difference
        assert mono_diff < stereo_diff
    
    def test_reverb_no_clipping(self):
        """Test that output doesn't clip."""
        reverb = Reverb()
        reverb.set_wet_level(1.0)
        reverb.set_dry_level(1.0)  # Both at max
        
        signal = np.ones(4000) * 0.5
        output = reverb.process(signal)
        
        # Should stay within [-1, 1]
        assert np.all(output >= -1.0)
        assert np.all(output <= 1.0)
    
    def test_reverb_clear(self):
        """Test buffer clearing."""
        reverb = Reverb()
        
        # Process signal
        signal = np.random.randn(2000)
        _ = reverb.process(signal)
        
        # Buffers should have data
        assert np.any(reverb.combs_left[0].buffer != 0)
        
        # Clear
        reverb.clear()
        
        # All buffers should be cleared
        for comb in reverb.combs_left + reverb.combs_right:
            assert np.all(comb.buffer == 0)
    
    def test_reverb_preset_application(self):
        """Test preset application."""
        reverb = Reverb()
        reverb.apply_preset('large_hall')
        
        assert reverb.room_size == REVERB_PRESETS['large_hall'].room_size
        assert reverb.damping == REVERB_PRESETS['large_hall'].damping
        assert reverb.wet_level == REVERB_PRESETS['large_hall'].wet_level
        assert reverb.dry_level == REVERB_PRESETS['large_hall'].dry_level
    
    def test_reverb_invalid_preset(self):
        """Test that invalid preset raises error."""
        reverb = Reverb()
        
        with pytest.raises(ValueError):
            reverb.apply_preset('invalid_preset')
    
    def test_reverb_serialization(self):
        """Test reverb serialization."""
        reverb1 = Reverb()
        reverb1.set_room_size(0.7)
        reverb1.set_damping(0.6)
        reverb1.set_wet_level(0.8)
        
        # Process signal to populate buffers
        signal = np.random.randn(2000)
        _ = reverb1.process(signal)
        
        # Serialize and deserialize
        data = reverb1.to_dict()
        reverb2 = Reverb.from_dict(data)
        
        # Check parameters
        assert reverb2.room_size == reverb1.room_size
        assert reverb2.damping == reverb1.damping
        assert reverb2.wet_level == reverb1.wet_level
        assert reverb2.dry_level == reverb1.dry_level


class TestReverbVariants:
    """Test suite for reverb preset variants."""
    
    def test_hall_reverb_initialization(self):
        """Test HallReverb preset."""
        hall = HallReverb()
        
        assert hall.room_size == REVERB_PRESETS['large_hall'].room_size
        assert hall.damping == REVERB_PRESETS['large_hall'].damping
    
    def test_plate_reverb_initialization(self):
        """Test PlateReverb preset."""
        plate = PlateReverb()
        
        assert plate.room_size == REVERB_PRESETS['plate'].room_size
        assert plate.damping == REVERB_PRESETS['plate'].damping
    
    def test_room_reverb_initialization(self):
        """Test RoomReverb preset."""
        room = RoomReverb()
        
        assert room.room_size == REVERB_PRESETS['small_room'].room_size
        assert room.damping == REVERB_PRESETS['small_room'].damping
    
    def test_variants_process(self):
        """Test that all variants process audio."""
        signal = np.random.randn(4000).astype(np.float32) * 0.1
        
        hall = HallReverb()
        plate = PlateReverb()
        room = RoomReverb()
        
        out_hall = hall.process(signal)
        out_plate = plate.process(signal)
        out_room = room.process(signal)
        
        assert out_hall.shape == signal.shape
        assert out_plate.shape == signal.shape
        assert out_room.shape == signal.shape


class TestReverbIntegration:
    """Integration tests for reverb effects."""
    
    def test_reverb_chain(self):
        """Test chaining multiple reverbs."""
        reverb1 = Reverb()
        reverb1.set_room_size(0.5)
        reverb1.set_wet_level(0.5)
        reverb1.set_dry_level(0.5)
        
        reverb2 = Reverb()
        reverb2.set_room_size(0.3)
        reverb2.set_wet_level(0.3)
        reverb2.set_dry_level(0.7)
        
        signal = np.random.randn(4000).astype(np.float32) * 0.1
        
        # Process through chain
        output = reverb1.process(signal)
        output = reverb2.process(output)
        
        assert output.shape == signal.shape
        assert np.all(output >= -1.0)
        assert np.all(output <= 1.0)
    
    def test_reverb_with_realistic_audio(self):
        """Test reverb with realistic audio signal."""
        # Simulate guitar signal (multiple harmonics)
        time = np.arange(44100) / 44100.0
        fundamental = np.sin(2 * np.pi * 220 * time)
        harmonic2 = 0.5 * np.sin(2 * np.pi * 440 * time)
        harmonic3 = 0.25 * np.sin(2 * np.pi * 660 * time)
        
        guitar = (fundamental + harmonic2 + harmonic3) / 2.75 * 0.2
        guitar = guitar.astype(np.float32)
        
        # Apply reverb
        reverb = HallReverb()
        output = reverb.process(guitar)
        
        assert output.shape == guitar.shape
        assert not np.allclose(output, guitar)  # Should be different
        assert np.all(output >= -1.0)
        assert np.all(output <= 1.0)
    
    def test_reverb_maintains_duration(self):
        """Test that reverb maintains signal duration."""
        reverb = Reverb()
        
        durations = [1000, 4410, 44100]  # Various durations
        
        for duration in durations:
            signal = np.random.randn(duration).astype(np.float32) * 0.1
            output = reverb.process(signal)
            
            assert len(output) == duration
            
            reverb.clear()
    
    def test_reverb_stereo_symmetry(self):
        """Test that identical L/R input produces similar L/R output."""
        reverb = Reverb()
        
        # Create identical stereo signal
        mono = np.random.randn(8000).astype(np.float32) * 0.1
        stereo_identical = np.array([mono, mono])
        
        output = reverb.process(stereo_identical)
        
        # L/R should be similar (not identical due to detuned right channel delays)
        # but should have strong correlation
        correlation = np.corrcoef(output[0], output[1])[0, 1]
        assert correlation > 0.8  # Strong correlation
    
    def test_reverb_parameter_continuity(self):
        """Test that parameter changes are continuous (no clicks)."""
        reverb = Reverb()
        reverb.set_room_size(0.3)
        reverb.set_wet_level(0.5)
        
        # Create two chunks with different parameters
        signal1 = np.random.randn(4000).astype(np.float32) * 0.1
        output1 = reverb.process(signal1)
        
        # Change parameters mid-stream
        reverb.set_room_size(0.9)
        signal2 = np.random.randn(4000).astype(np.float32) * 0.1
        output2 = reverb.process(signal2)
        
        # Should transition smoothly (no click at boundary)
        combined = np.concatenate([output1, output2])
        assert np.all(combined >= -1.0)
        assert np.all(combined <= 1.0)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
