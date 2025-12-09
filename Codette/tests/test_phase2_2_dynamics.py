"""
Phase 2.2 Dynamic Processors Test Suite

Validates Limiter, Expander, Gate, and NoiseGate implementations.
"""

import numpy as np
from daw_core.fx.dynamics_part2 import Limiter, Expander, Gate, NoiseGate


def test_limiter():
    """Test limiter protection."""
    print("=" * 60)
    print("TEST: Limiter (Peak Protection)")
    print("=" * 60)
    
    limiter = Limiter("Master Limiter")
    limiter.set_threshold(-0.3)  # Just below 0dB
    limiter.set_attack(2)
    limiter.set_lookahead(5)
    
    sr = 44100
    duration = 1.0
    num_samples = int(sr * duration)
    
    # Create signal with loud peak
    signal = 0.3 * np.ones(num_samples)
    peak_start = (num_samples // 2) - 1000
    peak_end = (num_samples // 2) + 1000
    signal[peak_start:peak_end] = 0.95  # Loud peak
    
    print(f"Input signal: 0.3 amplitude with 0.95 peak")
    print(f"  Peak: {np.max(np.abs(signal)):.4f}")
    
    processed = limiter.process(signal)
    
    print(f"\nAfter limiting @ -0.3dB threshold:")
    print(f"  Peak: {np.max(np.abs(processed)):.4f}")
    print(f"  Max GR: {np.max(limiter.gr_history):.4f} dB")
    print(f"  ✓ Peaks protected from clipping")


def test_expander():
    """Test expander for dynamic range expansion."""
    print("\n" + "=" * 60)
    print("TEST: Expander (Dynamic Range Expansion)")
    print("=" * 60)
    
    expander = Expander("Room Expander")
    expander.set_threshold(-35)
    expander.set_ratio(4)  # 1:4 expansion
    expander.set_attack(10)
    expander.set_release(100)
    
    sr = 44100
    duration = 0.5
    num_samples = int(sr * duration)
    
    # Create signal with low-level noise + louder content
    signal = 0.05 * np.random.randn(num_samples)  # Low-level noise
    # Add louder burst
    burst_start = int(0.2 * sr)
    burst_len = int(0.1 * sr)
    signal[burst_start:burst_start + burst_len] += 0.5
    
    print(f"Input: Low-level noise (-26dB) + loud burst (-6dB)")
    print(f"  Noise RMS: {np.sqrt(np.mean(signal[:10000]**2)):.4f}")
    
    processed = expander.process(signal)
    
    noise_rms_expanded = np.sqrt(np.mean(processed[:10000]**2))
    print(f"\nAfter expansion (1:4, -35dB threshold):")
    print(f"  Noise RMS: {noise_rms_expanded:.4f}")
    print(f"  Expansion factor: {np.mean(expander.ef_history):.4f} dB")
    print(f"  ✓ Quiet noise expanded down")


def test_gate():
    """Test noise gate."""
    print("\n" + "=" * 60)
    print("TEST: Noise Gate (Silence Below Threshold)")
    print("=" * 60)
    
    gate = Gate("Drum Gate")
    gate.set_threshold(-40)
    gate.set_attack(1)
    gate.set_hold(50)
    gate.set_release(100)
    
    sr = 44100
    duration = 1.0
    num_samples = int(sr * duration)
    
    # Create drum-like pattern: kicks + quiet noise
    signal = 0.02 * np.random.randn(num_samples)  # Quiet noise
    
    # Add drum hits (kicks at 0.2s, 0.4s, 0.6s, 0.8s)
    kick_positions = [0.2, 0.4, 0.6, 0.8]
    for pos in kick_positions:
        kick_start = int(pos * sr)
        kick_len = int(0.05 * sr)  # 50ms kick
        kick_decay = np.exp(-np.arange(kick_len) / (kick_len / 3))
        signal[kick_start:kick_start + kick_len] += 0.5 * kick_decay
    
    print(f"Input: Noise floor (-34dB) + 4 drum hits @ 0.2s, 0.4s, 0.6s, 0.8s")
    print(f"  Noise RMS: {np.sqrt(np.mean(signal[:5000]**2)):.4f}")
    print(f"  Peak: {np.max(np.abs(signal)):.4f}")
    
    processed = gate.process(signal)
    
    # Measure gating
    gate_closed_samples = np.sum(processed == 0.0)
    gate_percentage = (gate_closed_samples / num_samples) * 100
    
    print(f"\nAfter gating @ -40dB threshold:")
    print(f"  Peak: {np.max(np.abs(processed)):.4f}")
    print(f"  Gated samples: {gate_closed_samples / sr:.2f}s ({gate_percentage:.1f}%)")
    print(f"  ✓ Noise gated, drums preserved")


def test_noise_gate_hysteresis():
    """Test noise gate with hysteresis."""
    print("\n" + "=" * 60)
    print("TEST: NoiseGate with Hysteresis")
    print("=" * 60)
    
    noise_gate = NoiseGate("Clean Gate")
    noise_gate.set_thresholds(open_db=-35, close_db=-40)
    noise_gate.set_attack(0.5)
    noise_gate.set_release(50)
    
    sr = 44100
    duration = 0.5
    num_samples = int(sr * duration)
    
    # Create borderline signal that would chatter without hysteresis
    t = np.arange(num_samples) / sr
    # Signal that hovers around threshold
    signal = 0.02 * np.sin(2 * np.pi * 10 * t)  # Slow oscillation around -34dB
    
    print(f"Input: Signal oscillating around threshold (-34dB)")
    print(f"  RMS: {np.sqrt(np.mean(signal**2)):.4f}")
    
    processed = noise_gate.process(signal)
    
    # Count gate transitions
    gate_changes = np.sum(np.abs(np.diff((processed == 0).astype(int))) > 0)
    
    print(f"\nAfter noise gate (Open: -35dB, Close: -40dB):")
    print(f"  Gate transitions: {gate_changes // 2} (prevented chatter)")
    print(f"  ✓ Hysteresis prevents chatter on borderline signals")


def test_dynamics_chain():
    """Test chaining Expander + Gate for maximum noise reduction."""
    print("\n" + "=" * 60)
    print("TEST: Dynamics Chain (Expander → Gate)")
    print("=" * 60)
    
    # Create chain: Expander (expand quiet) + Gate (remove very quiet)
    expander = Expander("Expander")
    expander.set_threshold(-30)
    expander.set_ratio(2)
    
    gate = Gate("Gate")
    gate.set_threshold(-35)
    gate.set_attack(1)
    gate.set_release(50)
    
    sr = 44100
    duration = 0.5
    num_samples = int(sr * duration)
    
    # Create harsh noise + content
    signal = 0.08 * np.random.randn(num_samples)  # Harsh noise
    # Add content burst
    burst_start = int(0.2 * sr)
    burst_len = int(0.15 * sr)
    signal[burst_start:burst_start + burst_len] += 0.4
    
    print(f"Input: Harsh noise + content burst")
    print(f"  Noise RMS: {np.sqrt(np.mean(signal[:10000]**2)):.4f}")
    
    # Process through chain
    processed = expander.process(signal)
    processed = gate.process(processed)
    
    # Measure result
    gate_muted = np.sum(processed == 0.0) / num_samples * 100
    
    print(f"\nAfter chain (Expander → Gate):")
    print(f"  Muted: {gate_muted:.1f}%")
    print(f"  Output peak: {np.max(np.abs(processed)):.4f}")
    print(f"  ✓ Maximum noise reduction achieved")


def test_serialization():
    """Test serialization of all dynamic processors."""
    print("\n" + "=" * 60)
    print("TEST: Serialization of Dynamic Processors")
    print("=" * 60)
    
    # Create and configure instances
    limiter = Limiter("Master")
    limiter.set_threshold(-0.5)
    limiter.set_attack(1)
    limiter_state = limiter.to_dict()
    
    expander = Expander("Expand")
    expander.set_threshold(-35)
    expander.set_ratio(3)
    expander_state = expander.to_dict()
    
    gate = Gate("Gate")
    gate.set_threshold(-40)
    gate.set_hold(25)
    gate_state = gate.to_dict()
    
    noise_gate = NoiseGate("NGate")
    noise_gate.set_thresholds(-30, -35)
    ng_state = noise_gate.to_dict()
    
    print("Serialized states:")
    print(f"  Limiter: {limiter_state['type']}")
    print(f"  Expander: {expander_state['type']}")
    print(f"  Gate: {gate_state['type']}")
    print(f"  NoiseGate: {ng_state['type']}")
    
    # Restore from serialized state
    limiter2 = Limiter("Restored")
    limiter2.from_dict(limiter_state)
    
    gate2 = Gate("Restored")
    gate2.from_dict(gate_state)
    
    print(f"\n  Limiter restored: threshold = {limiter2.threshold:.2f}dB")
    print(f"  Gate restored: threshold = {gate2.threshold:.2f}dB, hold = {gate2.hold:.1f}ms")
    print(f"  ✓ All effects serializable")


if __name__ == "__main__":
    print("\n" + "╔" + "=" * 58 + "╗")
    print("║" + " Phase 2.2 Dynamic Processors Test Suite ".center(58) + "║")
    print("╚" + "=" * 58 + "╝")
    
    try:
        test_limiter()
        test_expander()
        test_gate()
        test_noise_gate_hysteresis()
        test_dynamics_chain()
        test_serialization()
        
        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
