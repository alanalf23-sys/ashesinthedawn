# ?? Effect Type Naming - Quick Reference Card

**Last Updated**: January 2025  
**Status**: Production Ready

---

## ? TL;DR

**Use any naming style you want - it just works!**

```typescript
// All these are equivalent and work perfectly:
await processEffect('high-pass', audio, params);
await processEffect('highpass', audio, params);
await processEffect('HighPass', audio, params);
await processEffect('HIGH_PASS', audio, params);
await processEffect('high_pass', audio, params);
```

---

## ?? Effect Name Quick Lookup

### EQ Effects

| Frontend Name | Backend Type | Also Works |
|---------------|-------------|------------|
| `high-pass` | `highpass` | `highpass`, `HighPass`, `HIGH_PASS`, `high_pass` |
| `low-pass` | `lowpass` | `lowpass`, `LowPass`, `LOW_PASS`, `low_pass` |
| `eq-3-band` | `3band` | `3band`, `eq3band`, `parametric`, `EQ_3_BAND` |

### Dynamics

| Frontend Name | Backend Type | Also Works |
|---------------|-------------|------------|
| `compressor` | `compressor` | `Compressor`, `COMPRESSOR` |
| `limiter` | `limiter` | `Limiter`, `LIMITER` |
| `expander` | `expander` | `Expander`, `EXPANDER` |
| `gate` | `gate` | `noisegate`, `noise-gate`, `Gate`, `NoiseGate` |

### Saturation

| Frontend Name | Backend Type | Also Works |
|---------------|-------------|------------|
| `saturation` | `saturation` | `Saturation`, `SATURATION` |
| `distortion` | `distortion` | `Distortion`, `DISTORTION` |
| `waveshaper` | `waveshaper` | `wave-shaper`, `WaveShaper`, `WAVE_SHAPER` |
| `hardclip` | `hardclip` | `hard-clip`, `HardClip`, `HARD_CLIP` |

### Delays

| Frontend Name | Backend Type | Also Works |
|---------------|-------------|------------|
| `delay` | `delay` | `simple-delay`, `Delay`, `DELAY` |
| `pingpong` | `pingpong` | `ping-pong`, `pingpong-delay`, `PingPong` |
| `multitap` | `multitap` | `multi-tap`, `multitap-delay`, `MultiTap` |
| `stereo-delay` | `stereo_delay` | `stereo_delay`, `StereoDelay`, `STEREO_DELAY` |

### Reverb

| Frontend Name | Backend Type | Also Works |
|---------------|-------------|------------|
| `reverb` | `reverb` | `freeverb`, `Reverb`, `FreeVerb` |
| `hall` | `hall` | `hall-reverb`, `Hall`, `HallReverb` |
| `plate` | `plate` | `plate-reverb`, `Plate`, `PlateReverb` |
| `room` | `room` | `room-reverb`, `Room`, `RoomReverb` |

---

## ?? Common Usage Patterns

### Pattern 1: Single Effect Processing

```typescript
import { processEffect } from '@/lib/dspBridge';

const audio = new Float32Array(44100); // 1 second at 44.1kHz

// Use any naming style
const compressed = await processEffect(
  'compressor',  // or 'Compressor', 'COMPRESSOR', etc.
  audio,
  {
    threshold: -20,
    ratio: 4,
    attack: 0.005,
    release: 0.1
  }
);
```

### Pattern 2: Effect Chain

```typescript
import { processEffectChain } from '@/lib/dspBridge';

const chain = [
  { type: 'high-pass', parameters: { frequency: 80 } },
  { type: 'compressor', parameters: { threshold: -20, ratio: 4 } },
  { type: 'reverb', parameters: { roomSize: 0.7 } },
];

const processed = await processEffectChain(audio, chain);
```

### Pattern 3: Validation Before Processing

```typescript
import { isValidEffectType, normalizeEffectType } from '@/lib/dspBridge';

function addEffect(effectType: string) {
  if (!isValidEffectType(effectType)) {
    console.error(`Unknown effect: ${effectType}`);
    return;
  }
  
  // Safe to process
  const normalized = normalizeEffectType(effectType);
  console.log(`Processing ${effectType} as ${normalized}`);
}
```

---

## ?? Common Mistakes (Now Fixed!)

### ? Before Priority 3

```typescript
// ? These used to fail
await processEffect('high-pass', audio, params);     // Failed: Unknown type
await processEffect('HighPass', audio, params);      // Failed: Case sensitive
await processEffect('eq-3-band', audio, params);     // Failed: Wrong name
```

### ? After Priority 3

```typescript
// ? All work now!
await processEffect('high-pass', audio, params);     // Works!
await processEffect('HighPass', audio, params);      // Works!
await processEffect('eq-3-band', audio, params);     // Works!
```

---

## ?? Advanced Usage

### Get List of Supported Effects

```typescript
import { getSupportedEffectTypes } from '@/lib/dspBridge';

const allEffects = getSupportedEffectTypes();
console.log('Supported effects:', allEffects);
// ['3band', 'compressor', 'delay', 'distortion', ...]
```

### Normalize Effect Type Manually

```typescript
import { normalizeEffectType } from '@/lib/dspBridge';

const normalized = normalizeEffectType('high-pass');
console.log(normalized);  // 'highpass'

// Try all variations
console.log(normalizeEffectType('HIGH-PASS'));   // 'highpass'
console.log(normalizeEffectType('high_pass'));   // 'highpass'
console.log(normalizeEffectType('HighPass'));    // 'highpass'
```

### Build Effect Menu from Catalog

```typescript
import { getSupportedEffectTypes } from '@/lib/dspBridge';

const effects = getSupportedEffectTypes();
const menu = effects.map(effectType => ({
  id: effectType,
  label: effectType
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, c => c.toUpperCase()),
}));

// menu = [
//   { id: '3band', label: '3band' },
//   { id: 'compressor', label: 'Compressor' },
//   { id: 'delay', label: 'Delay' },
//   ...
// ]
```

---

## ?? Troubleshooting

### Problem: "Unknown effect type" error

**Solution**: Check spelling or use validation

```typescript
import { isValidEffectType, getSupportedEffectTypes } from '@/lib/dspBridge';

if (!isValidEffectType(myEffectType)) {
  const supported = getSupportedEffectTypes();
  console.error('Supported effects:', supported.join(', '));
}
```

### Problem: Effect not working as expected

**Solution**: Verify parameters match effect spec

```typescript
// Get effect parameters from backend
const response = await fetch('http://localhost:8000/api/effects/list');
const catalog = await response.json();

// Check what parameters are expected
console.log(catalog.categories.dynamics.effects);
```

### Problem: Want to add custom effect name

**Solution**: Add to mapping in `dspBridge.ts`

```typescript
export const FRONTEND_TO_BACKEND_EFFECT_MAP = {
  // ...existing mappings...
  
  // Add your custom name
  'my-custom-name': 'compressor',  // Maps to existing effect
};
```

---

## ?? Complete Documentation

- **Full Guide**: `docs/PRIORITY_3_COMPLETE.md`
- **Implementation**: `src/lib/dspBridge.ts`
- **UI Integration**: `src/components/EffectControlsPanel.tsx`
- **Audit Report**: `docs/COMPREHENSIVE_AUDIT_FINDINGS.md`

---

## ? Remember

1. **Use any naming style** - system normalizes automatically
2. **Case doesn't matter** - HighPass, highpass, HIGHPASS all work
3. **Separators don't matter** - high-pass, high_pass, highpass all work
4. **40+ variations** supported out of the box
5. **Clear errors** if you make a typo

---

**?? Effect naming is now foolproof - use whatever feels natural!**
