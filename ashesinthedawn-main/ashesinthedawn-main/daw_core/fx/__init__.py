"""
DAW Core Effects Library - Phase 2

Professional audio processing effects built on the node-based signal graph.

Each effect is a self-contained class with:
- Real-time processing (process method)
- Parameter control (set_* methods)
- Serialization (to_dict/from_dict)
- State management

Effect Categories:

1. EQ Effects
   - EQ3Band: 3-band parametric with shelving and peaking
   - HighLowPass: Simple high/low pass filters

2. Dynamic Processors (In Progress)
   - Compressor: VCA-style with lookahead and soft knee
   - Limiter: Hard compressor variant
   - Expander: Inverse compressor
   - Gate: Silence noise below threshold

3. Saturation & Distortion (Planned)
   - Saturation: Smooth analog-style soft clipping
   - HardClip: Digital hard clipping
   - Distortion: Aggressive nonlinear processing

4. Delay Effects (Planned)
   - SimpleDelay: Single delay tap
   - PingPongDelay: Stereo bouncing delay
   - MultiTap: Multiple taps with feedback

5. Reverb Algorithms (Planned)
   - PlateReverb: Plate reverb algorithm
   - RoomReverb: Small/medium room simulation
   - HallReverb: Concert hall simulation

6. Analysis & Metering (Planned)
   - LevelMeter: RMS + Peak metering
   - SpectrumAnalyzer: FFT-based frequency analysis
   - Correlometer: Stereo correlation measurement

Usage Example:

    from daw_core.fx.eq_and_dynamics import EQ3Band, Compressor
    import numpy as np
    
    # Create EQ
    eq = EQ3Band("Kick EQ")
    eq.set_low_band(gain_db=6, freq_hz=100, q=0.7)
    eq.set_high_band(gain_db=3, freq_hz=8000, q=0.7)
    
    # Create compressor
    comp = Compressor("Kick Compressor")
    comp.set_threshold(-20)
    comp.set_ratio(4)
    comp.set_attack(5)
    comp.set_release(50)
    
    # Process audio
    audio = np.random.randn(44100)  # 1 second @ 44.1kHz
    audio = eq.process(audio)
    audio = comp.process(audio)

Integration with DAW:

    Effects are added to tracks via the Track.add_insert() method:
    
    track.add_insert("eq", eq_settings)  # Inserts into FX chain
    track.add_insert("compressor", comp_settings)
    
    The audio engine processes track audio through all inserts in order.
"""

from .eq_and_dynamics import (
    EQ3Band,
    HighLowPass,
    Compressor,
)
from .dynamics_part2 import (
    Limiter,
    Expander,
    Gate,
    NoiseGate,
)
from .saturation import (
    Saturation,
    HardClip,
    Distortion,
    WaveShaper,
)
from .delays import (
    SimpleDelay,
    PingPongDelay,
    MultiTapDelay,
    StereoDelay,
)
from .reverb import (
    Reverb,
    HallReverb,
    PlateReverb,
    RoomReverb,
)

__all__ = [
    # EQ
    "EQ3Band",
    "HighLowPass",
    # Dynamics
    "Compressor",
    "Limiter",
    "Expander",
    "Gate",
    "NoiseGate",
    # Saturation & Distortion
    "Saturation",
    "HardClip",
    "Distortion",
    "WaveShaper",
    # Delay Effects
    "SimpleDelay",
    "PingPongDelay",
    "MultiTapDelay",
    "StereoDelay",
    # Reverb Effects
    "Reverb",
    "PlateReverb",
    "RoomReverb",
    "HallReverb",
    # "LevelMeter",
    # "SpectrumAnalyzer",
    # "Correlometer",
]

__version__ = "0.2.0"
__description__ = "Professional audio effects library for DAW core"
