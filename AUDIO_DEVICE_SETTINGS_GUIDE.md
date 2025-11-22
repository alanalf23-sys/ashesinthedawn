# Audio Device Settings & DSP Performance Guide

## Overview

The enhanced `audio_io.py` module now includes interactive audio device settings menu and DSP performance timing tools for professional audio configuration and optimization.

## Features

### 1. Adjustable Audio Settings (Sample Rate & Bit Depth)

#### **Supported Sample Rates**

- **CD Quality**: 44,100 Hz
- **Professional**: 48,000 Hz _(default)_
- **Hi-Res**: 96,000 Hz
- **Ultra Hi-Res**: 192,000 Hz

#### **Supported Bit Depths**

- **16-bit**: CD Quality (lower CPU, smaller file size)
- **24-bit**: Professional Standard _(default)_
- **32-bit**: Highest Quality (more CPU, maximum headroom)

#### **Buffer Sizes (Latency vs. Stability)**

| Buffer Size  | Latency         | Use Case               |
| ------------ | --------------- | ---------------------- |
| 64 samples   | ~1.3ms @ 48kHz  | Real-time monitoring   |
| 128 samples  | ~2.7ms @ 48kHz  | Low-latency recording  |
| 256 samples  | ~5.3ms @ 48kHz  | **Balanced (default)** |
| 512 samples  | ~10.7ms @ 48kHz | CPU stability          |
| 1024 samples | ~21.3ms @ 48kHz | Maximum stability      |

### 2. Interactive Settings Menu

#### Usage

```python
from daw_core.audio_io import AudioDeviceManager, AudioDeviceSettingsMenu

manager = AudioDeviceManager()
settings_menu = AudioDeviceSettingsMenu(manager)
settings_menu.show_menu()  # Launch interactive menu
```

#### Menu Options

```
AUDIO DEVICE SETTINGS MENU
========================================
  1. Display current settings
  2. Adjust sample rate
  3. Adjust bit depth
  4. Adjust buffer size
  5. Exit settings
```

#### Current Settings Display

Shows:

- Active audio device
- Host API (Core Audio, WASAPI, ASIO, ALSA, PulseAudio)
- Sample rate (Hz)
- Bit depth (16, 24, or 32-bit)
- Buffer size (samples)
- Channel configuration (input/output)

### 3. Programmatic Settings Adjustment

```python
# Directly modify configuration
manager.current_config.sample_rate = 48000
manager.current_config.bit_depth = 24
manager.current_config.block_size = 256

# Apply to sounddevice
sd.default.samplerate = 48000
sd.default.blocksize = 256
```

### 4. DSP Performance Timing

#### Context Manager Usage

Measure audio processing time with automatic CPU load calculation:

```python
from daw_core.audio_io import DSPPerformanceTimer

with DSPPerformanceTimer("EQ Processing", sample_rate=48000,
                        block_size=256, channels=2) as timer:
    # Your DSP code here
    process_audio(buffer)

timer.report(verbose=True)
```

#### Output Example

```
============================================================
DSP PERFORMANCE: EQ Processing
============================================================
Processing time: 0.523 ms per buffer
Buffer size: 256 samples (5.33ms)
Sample rate: 48000 Hz
Channels: 2
CPU load: 9.8%
============================================================
```

#### Key Metrics

- **Elapsed Time**: Time to process one audio buffer (milliseconds)
- **Buffer Duration**: Time represented by audio buffer at current SR
- **CPU Load %**: Percentage of real-time CPU budget consumed
- **Warning**: If CPU load > 50%, indicates potential audio dropouts

### 5. Multi-Effect DSP Chain Analysis

```python
# Measure multiple effects in sequence
effects = ["Compressor", "EQ", "Reverb", "Limiter"]
effects_times = {}

for effect_name in effects:
    with DSPPerformanceTimer(effect_name, sample_rate=48000,
                           block_size=256, channels=2) as timer:
        process_effect(effect_name, audio_buffer)

    effects_times[effect_name] = timer.elapsed_ms
    cpu_load = timer.get_cpu_load()
    print(f"{effect_name:15} {timer.elapsed_ms:.3f} ms ({cpu_load:.1f}% CPU)")

total = sum(effects_times.values())
print(f"Total DSP load: {total:.3f} ms ({(total/5.33)*100:.1f}% CPU)")
```

## Configuration Management

### Safe Host APIs (Recommended)

✓ **Core Audio** (macOS)
✓ **WASAPI** (Windows Standard)
✓ **ASIO** (Windows Professional)
✓ **ALSA** (Linux)
✓ **PulseAudio** (Linux Desktop)

### AudioConfiguration Class

```python
from daw_core.audio_io import AudioConfiguration

# Create configuration with defaults
config = AudioConfiguration()

# Create configuration with custom settings
config = AudioConfiguration(
    sample_rate=48000,    # Hz
    block_size=256,       # samples
    bit_depth=24,         # bits
    channels_in=2,        # stereo input
    channels_out=2        # stereo output
)

# Export for persistence
config_dict = config.to_dict()
# {'sample_rate': 48000, 'block_size': 256, 'bit_depth': 24, ...}
```

## Performance Tuning Guidelines

### For Low Latency (Recording with Monitoring)

```python
config = AudioConfiguration(
    sample_rate=48000,
    block_size=64,          # ~1.3ms latency
    bit_depth=24
)
```

### For Professional Audio Production

```python
config = AudioConfiguration(
    sample_rate=48000,      # Industry standard
    block_size=256,         # ~5.3ms (good balance)
    bit_depth=24            # Professional quality
)
```

### For Hi-Res Mastering

```python
config = AudioConfiguration(
    sample_rate=96000,      # Hi-res standard
    block_size=512,         # More processing headroom
    bit_depth=32            # Maximum precision
)
```

### For Maximum Stability (CPU Load)

```python
config = AudioConfiguration(
    sample_rate=48000,
    block_size=1024,        # ~21.3ms (very stable)
    bit_depth=16            # Lower CPU demand
)
```

## DSP Performance Best Practices

### 1. Monitor CPU Load During Development

```python
# Always check performance metrics
with DSPPerformanceTimer("MyEffect", 48000, 256, 2) as timer:
    result = my_dsp_function(audio)

report = timer.report()
if report['cpu_load_percent'] > 50:
    print("⚠️  CPU load too high - optimize DSP code")
```

### 2. Budget Your Processing Power

For real-time audio, allocate:

- **50-60%**: DSP effects processing
- **20-30%**: OS/system overhead
- **10-20%**: Headroom for safety

```python
# At 48kHz, 256 samples = 5.33ms per buffer
# Recommended DSP budget: 2.5-3.0ms per buffer
BUFFER_DURATION_MS = 5.33
DSP_BUDGET_MS = BUFFER_DURATION_MS * 0.55  # 2.93ms for DSP
```

### 3. Profile Full Effects Chain

```python
total_dsp_time = 0
for effect in chain:
    with DSPPerformanceTimer(effect.name, 48000, 256, 2) as timer:
        audio = effect.process(audio)
    total_dsp_time += timer.elapsed_ms

headroom_ms = 5.33 - total_dsp_time
print(f"Headroom: {headroom_ms:.2f}ms")
if headroom_ms < 1.0:
    print("⚠️  Insufficient headroom - may cause dropouts")
```

## Examples

### Complete Settings Flow

```python
from daw_core.audio_io import (
    AudioDeviceManager,
    AudioDeviceSettingsMenu,
    AudioConfiguration,
    DSPPerformanceTimer
)

# Initialize manager
manager = AudioDeviceManager(safe_only=True)

# List available devices
devices = manager.query_devices()
for device in devices:
    print(f"• {device.name} ({device.hostapi})")

# Configure specific device
config = AudioConfiguration(
    sample_rate=48000,
    block_size=256,
    bit_depth=24
)
manager.configure_device('Scarlett 2i4 USB', config)

# Show current settings menu (interactive)
menu = AudioDeviceSettingsMenu(manager)
menu.display_current_settings()

# Measure processing performance
with DSPPerformanceTimer("Full Chain", 48000, 256, 2) as timer:
    # Process audio
    pass

timer.report(verbose=True)
```

### Testing Audio Setup

```python
# test_audio_setup.py
from daw_core.audio_io import (
    AudioDeviceManager,
    AudioConfiguration,
    DSPPerformanceTimer
)

manager = AudioDeviceManager()

# Test different configurations
configs = [
    ("Low Latency", AudioConfiguration(48000, 64, 24)),
    ("Balanced", AudioConfiguration(48000, 256, 24)),
    ("Stable", AudioConfiguration(48000, 512, 24)),
]

for name, config in configs:
    print(f"\n{name}: {config}")

    # Measure with this config
    with DSPPerformanceTimer(name, config.sample_rate,
                           config.block_size, config.channels_out) as timer:
        # Simulate DSP work
        time.sleep(0.002)

    print(f"  CPU Load: {timer.get_cpu_load():.1f}%")
```

## Troubleshooting

### High CPU Load

✗ **Symptom**: CPU load > 50%
✓ **Solutions**:

1. Increase buffer size (reduces CPU per sample)
2. Lower sample rate (fewer samples to process)
3. Disable unused effects
4. Optimize DSP algorithms (vectorize, cache, SIMD)

### Audio Crackling/Dropouts

✗ **Symptom**: Audio breaks up under load
✓ **Solutions**:

1. Increase buffer size from 256 to 512
2. Reduce number of active effects
3. Close background applications
4. Check CPU load with `DSPPerformanceTimer`

### Configuration Won't Persist

✗ **Symptom**: Settings reset after restart
✓ **Solutions**:

1. Save config to file: `config_dict = manager.current_config.to_dict()`
2. Implement settings persistence in application
3. Store in JSON/YAML config file

## API Reference

### AudioDeviceSettingsMenu

```python
menu = AudioDeviceSettingsMenu(manager)

# Display current configuration
menu.display_current_settings()

# Show interactive menu
menu.show_menu()

# Individual adjustments
menu.adjust_sample_rate()
menu.adjust_bit_depth()
menu.adjust_buffer_size()
```

### DSPPerformanceTimer

```python
timer = DSPPerformanceTimer(name, sample_rate, block_size, channels)

# Use as context manager
with timer:
    # DSP code

# Get metrics
elapsed_ms = timer.elapsed_ms
buffer_duration = timer.get_buffer_duration()
cpu_load = timer.get_cpu_load()

# Generate report
report = timer.report(verbose=True)
```

## Related Documentation

- `daw_core/audio_io.py` - Full module source
- `DEVELOPMENT.md` - Development setup
- `AUDIO_IMPLEMENTATION.md` - Audio engine details
