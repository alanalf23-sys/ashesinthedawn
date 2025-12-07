# Stereo/Mono Audio Track Analysis Report

**Generated**: November 24, 2025  
**Project**: CoreLogic Studio (ashesinthedawn)  
**Scope**: Complete track audio format analysis for all media types

---

## Executive Summary

CoreLogic Studio currently supports **stereo playback** through Web Audio API with **limited mono detection**. The system processes all audio files decoded by the browser's Web Audio API, which automatically handles both stereo and mono files. However, **explicit mono/stereo tracking and channel-specific processing is not fully implemented**.

### Current State: ⚠️ PARTIAL SUPPORT
- ✅ **Web Audio API**: Automatically decodes mono/stereo files
- ✅ **Stereo Pan/Width**: Implemented via StereoPannerNode
- ✅ **Multi-track**: 6 track types with full mixing
- ⚠️ **Channel Detection**: Not explicitly tracked
- ❌ **Mono-to-Stereo Expansion**: Not implemented
- ❌ **Channel-Specific Processing**: Not available
- ❌ **Mid/Side Processing**: Not implemented

---

## 1. Track Type Architecture

### 1.1 Supported Track Types
```typescript
// src/types/index.ts
export type TrackType = 
  | "audio"        // Standard audio tracks (imported files)
  | "instrument"   // Virtual instruments (MIDI-driven)
  | "midi"         // MIDI event tracks
  | "aux"          // Auxiliary/return tracks for sends/returns
  | "vca"          // Control tracks for grouping
  | "master";      // Master output bus
```

### 1.2 Track Audio Properties
```typescript
interface Track {
  id: string;
  name: string;
  type: TrackType;
  volume: number;           // Post-fader level (dB)
  pan: number;              // -1 (L) to +1 (R) - assumes stereo
  stereoWidth: number;      // 0-200% stereo expansion (default: 100)
  phaseFlip: boolean;       // L/R phase invert
  inputGain: number;        // Pre-fader gain (dB)
  inserts: Plugin[];        // Effect chain
  sends: Send[];            // Parallel routing
  routing: string;          // Bus destination
  // NO FIELDS: channel count, mono/stereo flag
}
```

**Issue #1**: Track interface lacks explicit **mono/stereo designation** or **channel count field**

---

## 2. Frontend Audio Engine (Web Audio API)

### 2.1 Audio File Loading

**File**: `src/lib/audioEngine.ts` (lines 84-106)

```typescript
async loadAudioFile(trackId: string, file: File): Promise<boolean> {
  if (!this.audioContext) await this.initialize();
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    this.audioBuffers.set(trackId, audioBuffer);
    
    // Pre-generate and cache waveform data
    const waveformData = this.getWaveformData(trackId, 1024);
    this.waveformCache.set(trackId, waveformData);
    
    console.log(`Loaded audio file for track ${trackId}...`);
    return true;
  } catch (error) {
    console.error(`Failed to load audio file...`, error);
    return false;
  }
}
```

**Current Capability**: 
- Decodes any format Web Audio API supports (MP3, WAV, FLAC, etc.)
- Returns `AudioBuffer` with automatic channel detection
- `AudioBuffer.numberOfChannels` property available BUT NOT CAPTURED

**Missing**: No channel count storage or retrieval after decoding

### 2.2 Audio Buffer Properties (Web Audio API Standard)

```typescript
// AudioBuffer API (automatic on decode)
audioBuffer.numberOfChannels  // 1 = mono, 2 = stereo, 4+ = multichannel
audioBuffer.length             // Total sample frames
audioBuffer.sampleRate         // Original sample rate
audioBuffer.duration           // Duration in seconds

// getChannelData method
audioBuffer.getChannelData(0)  // Left channel (mono: the only channel)
audioBuffer.getChannelData(1)  // Right channel (stereo only)
```

### 2.3 Playback Chain

**File**: `src/lib/audioEngine.ts` (lines 108-170)

```
AudioBufferSourceNode
    ↓
Input Gain (pre-fader)
    ↓
StereoPannerNode (assumes stereo!)  ⚠️ ISSUE
    ↓
Gain Node (fader level)
    ↓
AnalyserNode
    ↓
Master Gain
    ↓
AudioContext.destination (speakers)
```

**Code**:
```typescript
// Line 145-146: Pan assumes stereo
const panNode = this.audioContext.createStereoPanner();
panNode.pan.value = Math.max(-1, Math.min(1, pan));

// Issue: StereoPannerNode ineffective on mono audio
// - Mono files have 1 channel
// - Pan node still processes but has no R channel to modulate
// - Should detect and handle differently
```

**Problem**: StereoPannerNode applied to mono audio without detection

### 2.4 Realtime Buffer Manager

**File**: `src/lib/realtimeBufferManager.ts`

```typescript
constructor(bufferSizeInSamples: number = 8192, 
            channelCount: number = 2,          // Hardcoded stereo!
            sampleRate: number = 48000) {
  this.channels = channelCount;
  
  // Initialize buffers for each channel
  for (let ch = 0; ch < channelCount; ch++) {
    this.buffers.set(ch, new Float32Array(bufferSizeInSamples));
    this.writePointers.set(ch, 0);
    this.readPointers.set(ch, 0);
  }
}
```

**Issue**: Hardcoded 2-channel assumption; no mono support

---

## 3. Backend DSP Processing (Python)

### 3.1 Audio Engine Architecture

**File**: `daw_core/engine.py` (lines 1-50)

```python
class AudioEngine:
    def __init__(self, sample_rate: int = 44100, buffer_size: int = 1024):
        self.sample_rate = sample_rate
        self.buffer_size = buffer_size
        self.nodes: List[Node] = []
        self.graph: Dict[Node, List[Node]] = {}
        self.is_running = False
        self.block_count = 0
    
    def process(self):
        """Process blocks of audio through graph"""
        pass  # Topological sort and block processing
```

**Capability**: Node-based graph processing (inspired by REAPER)  
**Current**: Generic node interface without stereo/mono awareness

### 3.2 Metering Tools (Stereo Aware)

**File**: `daw_core/metering/__init__.py`

```python
class LevelMeter:
    def process(self, signal: np.ndarray) -> None:
        """
        Process audio signal and update meters.
        
        Args:
            signal: Audio signal (mono or stereo)
                   Shape: (frames,) for mono
                   Shape: (frames, 2) for stereo
        """
        # Handle stereo by using max of L/R
        if signal.ndim > 1:
            signal = np.max(np.abs(signal), axis=1)
```

**Status**: ✅ Metering handles stereo/mono  
**Pattern**: Checks `signal.ndim` to detect channels

```python
class SpectrumAnalyzer:
    def process(self, signal: np.ndarray) -> bool:
        """
        Process audio signal and compute FFT.
        
        Args:
            signal: Audio signal (mono)
                   (mono assumption in docs)
        """
        # Handle stereo by using first channel
        if signal.ndim > 1:
            signal = signal[:, 0]  # Takes left only
```

**Status**: ⚠️ Takes only left channel for stereo

### 3.3 Effects Processing

**File**: `daw_core/fx/*.py` (19 effects)

**Base Pattern** (all effects):
```python
def process(self, audio: np.ndarray) -> np.ndarray:
    """
    Args:
        audio: Input audio (any shape)
    Returns:
        Processed audio (same shape as input)
    """
```

**Status**: Effects are channel-agnostic - process whatever shape is given

---

## 4. Current Implementation Issues

### Issue #1: No Channel Count Field in Track Model
```typescript
// Missing from Track interface
channelCount?: number;     // Should track 1=mono, 2=stereo, 4+=multichannel
channelFormat?: 'mono' | 'stereo' | 'multichannel';
```

**Impact**: 
- Can't distinguish mono from stereo tracks
- Can't apply mono-specific processing
- Can't warn users about format mismatches

### Issue #2: Mono Audio Panned Through Stereo Panner
```typescript
// Current (lines 145-147)
const panNode = this.audioContext.createStereoPanner();
panNode.pan.value = pan;  // Works on stereo audio

// But for mono audio: no effect because only 1 channel
// Should detect: if (audioBuffer.numberOfChannels === 1)
//   apply different panning strategy
```

**Impact**: Panning ineffective on mono files

### Issue #3: Hardcoded Stereo in Buffer Manager
```typescript
// realtimeBufferManager.ts - always assumes 2 channels
constructor(..., channelCount: number = 2)
```

**Impact**: Can't handle mono or multichannel audio in real-time context

### Issue #4: No Stereo Width for Mono Files
```typescript
// Current: stereoWidth always applied
setStereoWidth(trackId: string, width: number) {
  // Expands stereo field but has no effect on mono
}

// For mono: should upmix to stereo first
// Options:
// 1. Duplicate channel (mono → stereo duplicate)
// 2. Apply haas effect (time delay between channels)
// 3. Apply slight frequency shift between channels
```

**Impact**: Mono tracks can't be expanded to stereo

### Issue #5: Phase Flip Assumes Stereo
```typescript
// phaseFlip only useful for stereo (L/R mismatch)
// For mono: useless (flipping single channel does nothing)
phaseFlip: boolean;

// Should be:
phaseFlipLeft?: boolean;
phaseFlipRight?: boolean;
```

---

## 5. Detailed Format Support Matrix

| Feature | Mono (1ch) | Stereo (2ch) | Multichannel (4+) | Status |
|---------|-----------|-------------|------------------|--------|
| **File Loading** | ✅ Auto-decoded | ✅ Auto-decoded | ✅ Auto-decoded | ✅ Works |
| **Playback** | ⚠️ Works but LR duplicated | ✅ Full support | ❌ Not tested | Mixed |
| **Pan Control** | ⚠️ No effect (1 channel) | ✅ Full L-R pan | ❌ Not supported | Limited |
| **Stereo Width** | ⚠️ No effect | ✅ Expands L-R | ❌ N/A | Limited |
| **Phase Flip** | ❌ Useless (1 channel) | ✅ Flips R channel | ❌ N/A | Limited |
| **Metering** | ✅ Level tracking | ✅ Max of L/R | ⚠️ Partial | Good |
| **EQ Processing** | ✅ Works | ✅ Works | ⚠️ Tests missing | Good |
| **Compression** | ✅ Works | ✅ Works | ⚠️ Tests missing | Good |
| **Channel Detection** | ❌ Not tracked | ❌ Not tracked | ❌ Not tracked | Missing |

---

## 6. Technical Gaps & Recommendations

### Gap 1: No Channel Detection on File Load
**Current**:
```typescript
async loadAudioFile(trackId: string, file: File) {
  const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
  this.audioBuffers.set(trackId, audioBuffer);
  // audioBuffer.numberOfChannels is lost!
}
```

**Recommended**:
```typescript
interface AudioFileMetadata {
  trackId: string;
  filename: string;
  duration: number;
  sampleRate: number;
  channelCount: 1 | 2 | number;  // ✅ Track this
  format: 'mono' | 'stereo' | 'multichannel';
}

async loadAudioFile(trackId: string, file: File) {
  const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
  this.audioBuffers.set(trackId, audioBuffer);
  
  // NEW: Store metadata
  this.audioMetadata.set(trackId, {
    trackId,
    filename: file.name,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channelCount: audioBuffer.numberOfChannels,  // ✅ CAPTURE THIS
    format: audioBuffer.numberOfChannels === 1 
      ? 'mono' 
      : audioBuffer.numberOfChannels === 2 
        ? 'stereo' 
        : 'multichannel'
  });
}
```

### Gap 2: Pan/Width Should Respect Channel Count
**Current**:
```typescript
setTrackPan(trackId: string, panValue: number): void {
  const panNode = this.panNodes.get(trackId);
  panNode.pan.value = Math.max(-1, Math.min(1, panValue));
}
```

**Recommended**:
```typescript
setTrackPan(trackId: string, panValue: number): void {
  const metadata = this.audioMetadata.get(trackId);
  const panNode = this.panNodes.get(trackId);
  
  if (metadata?.channelCount === 1) {
    // Mono: Apply width/stereo-ization before panning
    this.stereoizeMonoTrack(trackId);  // Expand mono to stereo
  }
  
  panNode.pan.value = Math.max(-1, Math.min(1, panValue));
}

private stereoizeMonoTrack(trackId: string): void {
  // Option 1: Duplicate mono to stereo
  // Option 2: Apply haas effect (small L-R delay)
  // Option 3: Apply polarity shift
}
```

### Gap 3: Track Model Should Include Channel Metadata
**Current**:
```typescript
interface Track {
  volume: number;
  pan: number;
  stereoWidth: number;
  // Missing channel info
}
```

**Recommended**:
```typescript
interface Track {
  volume: number;
  pan: number;
  stereoWidth: number;
  
  // NEW:
  channelCount?: number;              // 1, 2, or >2
  format?: 'mono' | 'stereo';
  mono?: { toStereo?: 'duplicate' | 'haas' | 'shift' };  // Mono upmix strategy
}
```

### Gap 4: Effects Should Declare Channel Support
**Current**:
```python
def process(self, audio: np.ndarray) -> np.ndarray:
    """Process audio (any shape accepted)"""
    pass
```

**Recommended**:
```python
class AudioEffect:
    SUPPORTS_MONO = True
    SUPPORTS_STEREO = True
    SUPPORTS_MULTICHANNEL = False
    
    def process(self, audio: np.ndarray) -> np.ndarray:
        channels = audio.shape[1] if audio.ndim > 1 else 1
        
        if channels == 1 and not self.SUPPORTS_MONO:
            raise UnsupportedChannelFormat(f"{self.name} needs stereo audio")
        if channels == 2 and not self.SUPPORTS_STEREO:
            raise UnsupportedChannelFormat(f"{self.name} only supports mono")
        
        return self._process_internal(audio)
```

### Gap 5: Buffer Manager Should Support Variable Channels
**Current** (hardcoded):
```typescript
constructor(..., channelCount: number = 2)
```

**Recommended**:
```typescript
constructor(
  bufferSizeInSamples: number = 8192,
  channelCount: number = 2,           // Default but configurable
  sampleRate: number = 48000,
  autoDetectFromFile?: boolean        // NEW: detect from file
) {
  this.channels = channelCount;
  // ...
}

// Allow runtime channel adjustment
reconfigureChannels(newChannelCount: number): void {
  // Reallocate buffers for new channel count
}
```

---

## 7. Recommended Implementation Roadmap

### Phase 1: Channel Detection (Priority: HIGH)
1. **Add metadata tracking to AudioEngine**
   - Capture `numberOfChannels` on file load
   - Store in `audioMetadata` Map
   - Expose via `getAudioMetadata(trackId)` method

2. **Update Track interface**
   - Add optional `channelCount` and `format` fields
   - Update all track creation functions

3. **Display channel info in UI**
   - Show [Mono], [Stereo], or [5.1] in TrackList
   - Show in Mixer tile next to track name

### Phase 2: Mono-to-Stereo Expansion (Priority: MEDIUM)
1. **Implement mono upmix strategies**
   - Option A: Duplicate (simple, no phase issues)
   - Option B: Haas effect (sounds wider, slight delay)
   - Option C: Frequency shift (widest sound, most CPU)

2. **Add to Track model**
   - `monoUpmixMode: 'off' | 'duplicate' | 'haas' | 'shift'`
   - Apply in audioEngine before panning

3. **Test with real mono files**

### Phase 3: Channel-Specific Processing (Priority: MEDIUM-LOW)
1. **Mid/Side processing**
   - Decode stereo to Mid/Side domain
   - Process independently
   - Encode back to L/R

2. **Per-channel control**
   - Separate L/R gain, EQ, compression
   - Useful for problematic stereo files

3. **Polarity detection**
   - Identify phase-correlated channels
   - Warn user about potential issues

### Phase 4: Backend Effects Updates (Priority: LOW)
1. **Mark effect channel support**
   - Stereo-only: `reverb`, `stereo-delay`
   - Mono-compatible: `eq`, `compression`, `saturation`
   - All: generic `gain`, `fade`

2. **Add channel format conversion**
   - Auto-upmix mono before stereo-only effects
   - Add option to process per-channel independently

---

## 8. Code Examples for Implementation

### Example 1: Enhanced loadAudioFile

```typescript
// src/lib/audioEngine.ts

private audioMetadata: Map<string, AudioFileMetadata> = new Map();

interface AudioFileMetadata {
  trackId: string;
  filename: string;
  duration: number;
  sampleRate: number;
  channelCount: 1 | 2 | 3 | 4 | 5 | 6;
  format: 'mono' | 'stereo' | 'multichannel';
  bitDepth?: number;
}

async loadAudioFile(trackId: string, file: File): Promise<boolean> {
  if (!this.audioContext) await this.initialize();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    
    this.audioBuffers.set(trackId, audioBuffer);

    // NEW: Capture channel metadata
    const channelCount = audioBuffer.numberOfChannels;
    const format = channelCount === 1 
      ? 'mono' 
      : channelCount === 2 
        ? 'stereo' 
        : 'multichannel';

    this.audioMetadata.set(trackId, {
      trackId,
      filename: file.name,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channelCount: channelCount as any,
      format,
    });

    const waveformData = this.getWaveformData(trackId, 1024);
    this.waveformCache.set(trackId, waveformData);

    console.log(
      `Loaded ${format} audio for track ${trackId} ` +
      `(${channelCount}ch, ${audioBuffer.sampleRate}Hz, ${audioBuffer.duration.toFixed(2)}s)`
    );
    return true;
  } catch (error) {
    console.error(`Failed to load audio file for track ${trackId}:`, error);
    return false;
  }
}

// NEW: Expose metadata
getAudioMetadata(trackId: string): AudioFileMetadata | undefined {
  return this.audioMetadata.get(trackId);
}
```

### Example 2: Smart Pan with Mono Detection

```typescript
// src/lib/audioEngine.ts

setTrackPan(trackId: string, panValue: number): void {
  const metadata = this.audioMetadata.get(trackId);
  const panNode = this.panNodes.get(trackId);
  
  if (!panNode) return;

  // If mono audio and panning requested, stereoize first
  if (metadata?.format === 'mono' && panValue !== 0) {
    this.stereoizeMonoTrack(trackId, 'duplicate');
  }

  panNode.pan.value = Math.max(-1, Math.min(1, panValue));
  console.log(`Set pan for ${trackId}: ${panValue}`);
}

private stereoizeMonoTrack(
  trackId: string, 
  strategy: 'duplicate' | 'haas' | 'shift' = 'duplicate'
): void {
  // For now, use stereoWidth to fake stereo expansion
  // Eventually: apply actual DSP to expand mono to stereo
  const metadata = this.audioMetadata.get(trackId);
  if (!metadata) return;

  console.log(`Stereoizing mono track ${trackId} using "${strategy}" strategy`);
  
  // TODO: Implement actual stereoization
  switch (strategy) {
    case 'duplicate':
      // Duplicate mono to both L/R channels
      // (done at decode time ideally)
      break;
    case 'haas':
      // Apply 15-20ms delay to one channel
      break;
    case 'shift':
      // Apply slight frequency shift between channels
      break;
  }
}
```

### Example 3: Python Effects Base Class

```python
# daw_core/fx/base.py

from abc import ABC, abstractmethod
import numpy as np

class AudioEffect(ABC):
    """Base class for all audio effects with channel support metadata."""
    
    # Channel support declaration
    SUPPORTS_MONO: bool = True
    SUPPORTS_STEREO: bool = True
    SUPPORTS_MULTICHANNEL: bool = False
    
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
    
    def process(self, audio: np.ndarray) -> np.ndarray:
        """
        Process audio with automatic channel format validation.
        
        Args:
            audio: Input audio
                  Shape: (frames,) for mono
                  Shape: (frames, channels) for multi-channel
        
        Returns:
            Processed audio (same shape as input)
        """
        # Detect channel count
        channels = 1 if audio.ndim == 1 else audio.shape[1]
        
        # Validate support
        if channels == 1 and not self.SUPPORTS_MONO:
            raise ValueError(
                f"{self.__class__.__name__} does not support mono audio"
            )
        if channels == 2 and not self.SUPPORTS_STEREO:
            raise ValueError(
                f"{self.__class__.__name__} does not support stereo audio"
            )
        if channels > 2 and not self.SUPPORTS_MULTICHANNEL:
            raise ValueError(
                f"{self.__class__.__name__} does not support " +
                f"{channels}-channel audio"
            )
        
        # Process
        return self._process_internal(audio)
    
    @abstractmethod
    def _process_internal(self, audio: np.ndarray) -> np.ndarray:
        """Subclasses implement actual processing here."""
        pass
```

---

## 9. Files Affected by These Changes

### Frontend
- `src/lib/audioEngine.ts` - Main: Add metadata tracking
- `src/types/index.ts` - Add Track fields for channels
- `src/contexts/DAWContext.tsx` - Pass channel info through context
- `src/components/TrackList.tsx` - Display channel format
- `src/components/Mixer.tsx` - Show channel icon
- `src/components/Timeline.tsx` - Consider in waveform display

### Backend
- `daw_core/fx/base.py` - Add channel support metadata
- `daw_core/engine.py` - Update node processing
- All effect files in `daw_core/fx/` - Update process signatures
- `daw_core/metering/__init__.py` - Already handles channels well

---

## 10. Testing Checklist

### Before Implementation
- [ ] Test current mono file playback (vs stereo)
- [ ] Verify pan effectiveness on mono vs stereo
- [ ] Check buffer manager with mono input
- [ ] Test stereo width on mono audio

### After Phase 1
- [ ] Mono files display "[Mono]" in UI
- [ ] Stereo files display "[Stereo]" in UI
- [ ] Metadata persists through playback
- [ ] API exposes channel count correctly

### After Phase 2
- [ ] Mono file pan works smoothly
- [ ] Stereo width expands mono files
- [ ] Three upmix modes selectable
- [ ] No audio artifacts during expansion

### After Phase 3
- [ ] Mid/Side processing available
- [ ] Per-channel EQ/compression works
- [ ] Polarity detection operational

### After Phase 4
- [ ] Effects declare channel support
- [ ] Auto-upmix before stereo-only effects
- [ ] Proper error messages for incompatible formats

---

## 11. Backwards Compatibility

**Current Behavior**: 
- All audio treated as stereo
- Mono files work (duplicated to stereo by Web Audio)
- Pan/Width work on stereo, ineffective on mono

**After Changes**:
- Explicit channel detection
- Intelligent pan/width handling
- Better metering accuracy

**Compatibility**: ✅ Changes are additive, no breaking changes expected

---

## 12. Performance Considerations

### Current (No Channel Detection)
- Overhead: None (Web Audio handles automatically)
- Memory: Standard (one AudioBuffer per file)
- CPU: Standard

### After Implementation
- **Metadata Tracking** (Phase 1)
  - Overhead: Negligible (small Map entries)
  - Memory: ~200 bytes per track
  - CPU: None (one-time on load)

- **Mono Stereoization** (Phase 2)
  - Overhead: Only when pan/width applied to mono
  - Memory: ~0 (uses existing nodes)
  - CPU: Low (duplicate/haas), Medium (shift)

- **Channel-Specific Processing** (Phase 3)
  - Overhead: Only when enabled
  - Memory: ~0 (existing infrastructure)
  - CPU: 1-2% per channel split

**Conclusion**: Negligible performance impact for significant UX improvement

---

## Summary Table

| Aspect | Current | Recommended | Benefit |
|--------|---------|-------------|---------|
| **Mono Detection** | Auto (not tracked) | Explicit (stored) | Know file format |
| **Pan on Mono** | No effect | Works (stereoize first) | Better UX |
| **Width on Mono** | No effect | Works (upmix) | Full stereo control |
| **Metering** | Max of L/R | Per-channel accurate | Better monitoring |
| **Plugins** | Any format accepted | Declare support | Prevent errors |
| **UI Feedback** | None | Show format | Transparency |

---

## Conclusion

CoreLogic Studio has solid **Web Audio API foundations** for stereo/mono support, but lacks **explicit channel tracking and intelligent mono handling**. Implementing the recommended roadmap will provide professional DAW-level stereo/mono processing capabilities.

**Quick Win (Phase 1)**: 30 minutes to add metadata tracking - significant UX improvement with minimal code changes.

**Full Implementation**: 2-3 weeks for complete professional mono/stereo support across all layers.
