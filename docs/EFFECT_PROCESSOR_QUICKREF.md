# ??? Unified Effect Processor - Quick Reference

**Last Updated**: January 2025  
**Status**: ? Production Ready

---

## ?? Quick Start

### Frontend Usage

```typescript
import { processEffect, processEffectChain } from '@/lib/dspBridge';

// Single effect
const compressed = await processEffect(
  'compressor',
  audioBuffer,
  { threshold: -20, ratio: 4, attack: 0.005, release: 0.1 }
);

// Effect chain
const processed = await processEffectChain(
  audioBuffer,
  [
    { type: 'highpass', parameters: { cutoff: 80 } },
    { type: 'compressor', parameters: { threshold: -20, ratio: 4 } },
    { type: 'reverb', parameters: { room: 0.7, wet: 0.3 } }
  ],
  44100
);
```

### Backend Testing

```bash
# Test compressor
curl -X POST http://localhost:8000/api/effects/process \
  -H "Content-Type: application/json" \
  -d '{"effect_type":"compressor","parameters":{"threshold":-20,"ratio":4},"audio_data":[0.1,0.2,-0.1]}'

# List all effects
curl http://localhost:8000/api/effects/list
```

---

## ?? Effect Reference

### EQ & Filtering

| Effect | Parameters | Description |
|--------|------------|-------------|
| `highpass` | `cutoff` (Hz) | Remove frequencies below cutoff |
| `lowpass` | `cutoff` (Hz) | Remove frequencies above cutoff |
| `3band` | `low_gain`, `mid_gain`, `high_gain` (dB) | 3-band parametric EQ |

### Dynamics

| Effect | Parameters | Description |
|--------|------------|-------------|
| `compressor` | `threshold` (dB), `ratio`, `attack` (s), `release` (s) | Reduce dynamic range |
| `limiter` | `threshold` (dB), `attack` (s), `release` (s) | Peak limiting |
| `expander` | `threshold` (dB), `ratio`, `attack` (s), `release` (s) | Expand dynamic range |
| `gate` | `threshold` (dB), `ratio`, `attack` (s), `release` (s) | Noise gate |

### Saturation

| Effect | Parameters | Description |
|--------|------------|-------------|
| `saturation` | `drive`, `tone` | Harmonic saturation |
| `distortion` | `amount` | Distortion/overdrive |
| `waveshaper` | `shape` | Wave shaping |
| `hardclip` | `threshold` | Hard clipping |

### Delays

| Effect | Parameters | Description |
|--------|------------|-------------|
| `delay` | `delay_time` (s), `feedback`, `mix` | Simple delay |
| `pingpong` | `delay_time` (s), `feedback`, `mix` | Ping-pong stereo delay |
| `multitap` | `delay_times` (array), `feedback`, `mix` | Multi-tap delay |
| `stereo_delay` | `left_time`, `right_time`, `feedback`, `mix` | Stereo delay |

### Reverb

| Effect | Parameters | Description |
|--------|------------|-------------|
| `reverb` | `room`, `damp`, `wet` | Freeverb algorithm |
| `hall` | `size`, `decay`, `wet` | Hall reverb |
| `plate` | `predelay`, `decay`, `wet` | Plate reverb |
| `room` | `size`, `damping`, `wet` | Room reverb |

---

## ?? API Endpoints

### Process Single Effect
```
POST /api/effects/process
```

**Request**:
```json
{
  "effect_type": "compressor",
  "parameters": {
    "threshold": -20,
    "ratio": 4,
    "attack": 0.005,
    "release": 0.1
  },
  "audio_data": [0.1, 0.2, -0.1, ...],
  "sample_rate": 44100
}
```

**Response**:
```json
{
  "status": "success",
  "effect": "compressor",
  "output": [0.09, 0.18, ...],
  "length": 1024,
  "sample_rate": 44100
}
```

### Process Effect Chain
```
POST /api/effects/chain
```

**Request**:
```json
{
  "audio_data": [0.1, 0.2, ...],
  "effect_chain": [
    {"type": "highpass", "parameters": {"cutoff": 80}},
    {"type": "compressor", "parameters": {"threshold": -20, "ratio": 4}}
  ],
  "sample_rate": 44100
}
```

### List Available Effects
```
GET /api/effects/list
```

**Response**:
```json
{
  "categories": {
    "eq": ["highpass", "lowpass", "3band"],
    "dynamics": ["compressor", "limiter", "expander", "gate"],
    ...
  },
  "total_effects": 19
}
```

---

## ?? Common Parameters

### Typical Ranges

| Parameter | Unit | Range | Default | Notes |
|-----------|------|-------|---------|-------|
| `threshold` | dB | -60 to 0 | -20 | Level threshold |
| `ratio` | ratio | 1 to 20 | 4 | Compression ratio |
| `attack` | seconds | 0.001 to 1 | 0.005 | Attack time |
| `release` | seconds | 0.01 to 2 | 0.1 | Release time |
| `cutoff` | Hz | 20 to 20000 | 1000 | Filter cutoff frequency |
| `gain` | dB | -24 to +24 | 0 | Gain adjustment |
| `mix` | 0-1 | 0 to 1 | 0.5 | Dry/wet mix |
| `wet` | 0-1 | 0 to 1 | 0.3 | Wet signal level |
| `feedback` | 0-1 | 0 to 0.95 | 0.5 | Feedback amount |
| `room` | 0-1 | 0 to 1 | 0.5 | Room size |
| `damp` | 0-1 | 0 to 1 | 0.5 | Damping |

---

## ?? Troubleshooting

### Effect Not Working?

1. **Check effect name**:
   ```bash
   curl http://localhost:8000/api/effects/list
   ```

2. **Verify parameters**:
   - Parameters must be numbers
   - Check valid ranges
   - Required parameters must be present

3. **Check audio data**:
   - Must be array of floats
   - Values should be -1.0 to 1.0
   - Sample rate must match audio

4. **Check backend logs**:
   ```bash
   # Look for [Unified Processor] or [API] logs
   # Errors will show routing and processing failures
   ```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Unknown effect type" | Effect name not recognized | Check `/api/effects/list` for valid names |
| "DSP engine not available" | DAW Core not loaded | Check server startup logs |
| "Failed to connect" | httpx connection error | Install httpx: `pip install httpx` |
| Empty output | Audio data or parameters invalid | Check input format and ranges |

---

## ?? Learn More

- **Full Documentation**: `docs/PRIORITY_2_IMPLEMENTATION.md`
- **Architecture**: `.github/copilot-instructions.md`
- **Audit Report**: `docs/COMPREHENSIVE_AUDIT_FINDINGS.md`
- **DSP Core**: `daw_core/api.py`
- **Frontend Bridge**: `src/lib/dspBridge.ts`

---

**Quick Tips**:
- Effect names are case-insensitive
- Use `/api/effects/list` to discover available effects
- Chain effects for complex processing
- Check logs for detailed error information
- Audio data must be normalized (-1.0 to 1.0)
