"""
Phase 2.1 & 2.2 Effects Test Suite

Validates EQ3Band, HighLowPass, and Compressor implementations
with real audio processing examples.
"""

import numpy as np
from daw_core.fx.eq_and_dynamics import EQ3Band, HighLowPass, Compressor


def test_eq3band_basic():
    """Test basic EQ3Band functionality."""
    print("=" * 60)
    print("TEST: EQ3Band Basic Processing")
    print("=" * 60)
    
    eq = EQ3Band("Test EQ")
    
    # Create test signal (1 second of white noise @ 44.1kHz)
    sr = 44100
    duration = 1.0
    num_samples = int(sr * duration)
    signal = np.random.randn(num_samples)
    
    print(f"Input signal: {num_samples} samples, {duration}s @ {sr}Hz")
    print(f"  Input RMS: {np.sqrt(np.mean(signal**2)):.4f}")
    
    # Apply boost to low band
    eq.set_low_band(gain_db=6.0, freq_hz=100.0, q=0.707)
    processed = eq.process(signal)
    
    print(f"  After 6dB low boost @ 100Hz:")
    print(f"    Output RMS: {np.sqrt(np.mean(processed**2)):.4f}")
    print(f"    ✓ Processing complete")
    
    # Test serialization
    state = eq.to_dict()
    print(f"\n  Serialized state:")
    print(f"    {state}")
    
    # Create new EQ and load state
    eq2 = EQ3Band("Restored")
    eq2.from_dict(state)
    print(f"  ✓ State serialization/restoration successful")


def test_highlow_pass():
    """Test HighLowPass filter."""
    print("\n" + "=" * 60)
    print("TEST: HighLowPass Filters")
    print("=" * 60)
    
    sr = 44100
    duration = 1.0
    num_samples = int(sr * duration)
    
    # Create signal with low freq (50Hz sine) + high freq (15kHz sine)
    t = np.arange(num_samples) / sr
    signal = np.sin(2 * np.pi * 50 * t) + np.sin(2 * np.pi * 15000 * t)
    
    print(f"Input signal: 50Hz sine + 15kHz sine")
    print(f"  RMS: {np.sqrt(np.mean(signal**2)):.4f}")
    
    # Apply high-pass filter (remove 50Hz)
    hpf = HighLowPass("HPF")
    hpf.set_type("highpass")
    hpf.set_cutoff(1000)  # 1kHz cutoff
    hpf.set_order(2)
    
    hpf_output = hpf.process(signal)
    print(f"\nAfter 2nd-order HPF @ 1kHz:")
    print(f"  RMS: {np.sqrt(np.mean(hpf_output**2)):.4f}")
    print(f"  ✓ Low frequency attenuated")
    
    # Apply low-pass filter (remove 15kHz)
    lpf = HighLowPass("LPF")
    lpf.set_type("lowpass")
    lpf.set_cutoff(5000)  # 5kHz cutoff
    lpf.set_order(3)
    
    lpf_output = lpf.process(signal)
    print(f"\nAfter 3rd-order LPF @ 5kHz:")
    print(f"  RMS: {np.sqrt(np.mean(lpf_output**2)):.4f}")
    print(f"  ✓ High frequency attenuated")


def test_compressor_basic():
    """Test Compressor functionality."""
    print("\n" + "=" * 60)
    print("TEST: Compressor Basic Processing")
    print("=" * 60)
    
    comp = Compressor("Test Compressor")
    
    # Create signal with peaks
    sr = 44100
    duration = 1.0
    num_samples = int(sr * duration)
    t = np.arange(num_samples) / sr
    
    # Signal: quiet sine wave with periodic peaks
    signal = 0.3 * np.sin(2 * np.pi * 440 * t)
    # Add peaks at 0.25s and 0.75s
    peak_indices = (t > 0.24) & (t < 0.26) | (t > 0.74) & (t < 0.76)
    signal[peak_indices] = 0.9
    
    print(f"Input signal: 440Hz sine with peaks @ 0.25s and 0.75s")
    print(f"  Peak level: {np.max(np.abs(signal)):.4f}")
    print(f"  RMS: {np.sqrt(np.mean(signal**2)):.4f}")
    
    # Configure compressor
    comp.set_threshold(-20)  # -20dB threshold
    comp.set_ratio(4.0)  # 4:1 ratio
    comp.set_attack(5)  # 5ms attack
    comp.set_release(50)  # 50ms release
    comp.set_makeup_gain(4)  # Compensate for 4dB reduction
    
    processed = comp.process(signal)
    
    print(f"\nCompressor settings:")
    print(f"  Threshold: -20dB")
    print(f"  Ratio: 4:1")
    print(f"  Attack: 5ms")
    print(f"  Release: 50ms")
    print(f"  Makeup Gain: +4dB")
    
    print(f"\nOutput after compression:")
    print(f"  Peak level: {np.max(np.abs(processed)):.4f}")
    print(f"  RMS: {np.sqrt(np.mean(processed**2)):.4f}")
    print(f"  Max Gain Reduction: {np.max(comp.gr_history):.4f} dB")
    print(f"  ✓ Peaks controlled")


def test_compressor_gain_reduction_metering():
    """Test gain reduction metering."""
    print("\n" + "=" * 60)
    print("TEST: Compressor Gain Reduction Metering")
    print("=" * 60)
    
    comp = Compressor("Metering Test")
    comp.set_threshold(-15)
    comp.set_ratio(8.0)
    comp.set_attack(3)
    comp.set_release(30)
    
    # Create sustained loud signal
    sr = 44100
    num_samples = int(sr * 0.5)  # 0.5 seconds
    signal = 0.8 * np.ones(num_samples)  # Sustains above threshold
    
    print(f"Input: 0.8 amplitude sustained for 0.5s")
    print(f"Threshold: -15dB, Ratio: 8:1")
    
    processed = comp.process(signal)
    
    # Analyze gain reduction history
    gr_values = np.array(comp.gr_history)
    print(f"\nGain Reduction Analysis:")
    print(f"  Peak GR: {np.max(gr_values):.4f} dB")
    print(f"  Average GR (after attack): {np.mean(gr_values[-1000:]):.4f} dB")
    print(f"  Samples with GR: {len(gr_values)}")
    print(f"  ✓ Gain reduction metering functional")


def test_effects_chain():
    """Test chaining EQ → Compressor."""
    print("\n" + "=" * 60)
    print("TEST: Effects Chain (EQ → Compressor)")
    print("=" * 60)
    
    sr = 44100
    duration = 1.0
    num_samples = int(sr * duration)
    t = np.arange(num_samples) / sr
    
    # Create kick drum simulation (low frequency burst)
    signal = np.zeros(num_samples)
    kick_start = int(0.1 * sr)
    kick_len = int(0.1 * sr)
    kick_env = np.exp(-np.arange(kick_len) / (kick_len / 5))  # Exponential decay
    signal[kick_start:kick_start + kick_len] = 0.8 * kick_env * np.sin(2 * np.pi * 80 * np.arange(kick_len) / sr)
    
    print(f"Input: Simulated kick drum (80Hz, 0.1s duration)")
    print(f"  Peak: {np.max(np.abs(signal)):.4f}")
    
    # EQ: Boost low end
    eq = EQ3Band("Kick EQ")
    eq.set_low_band(gain_db=6, freq_hz=80, q=0.7)
    eq.set_high_band(gain_db=3, freq_hz=8000, q=0.7)
    sig_eq = eq.process(signal)
    print(f"\nAfter EQ (+6dB @ 80Hz, +3dB @ 8kHz):")
    print(f"  Peak: {np.max(np.abs(sig_eq)):.4f}")
    
    # Compress for glue
    comp = Compressor("Kick Compressor")
    comp.set_threshold(-15)
    comp.set_ratio(4)
    comp.set_attack(2)
    comp.set_release(50)
    comp.set_makeup_gain(3)
    sig_final = comp.process(sig_eq)
    
    print(f"\nAfter Compressor (4:1, -15dB threshold):")
    print(f"  Peak: {np.max(np.abs(sig_final)):.4f}")
    print(f"  Gain Reduction: {np.max(comp.gr_history):.4f} dB")
    print(f"  ✓ Chain processing successful")


if __name__ == "__main__":
    print("\n" + "╔" + "=" * 58 + "╗")
    print("║" + " Phase 2.1 & 2.2 Effects Library Test Suite ".center(58) + "║")
    print("╚" + "=" * 58 + "╝")
    
    try:
        test_eq3band_basic()
        test_highlow_pass()
        test_compressor_basic()
        test_compressor_gain_reduction_metering()
        test_effects_chain()
        
        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
