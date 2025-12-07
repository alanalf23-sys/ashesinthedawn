# CoreLogic Studio - Phase 3: Real-Time Audio I/O

## Overview
Phase 3 focuses on implementing professional real-time audio input/output capabilities using the Web Audio API's modern getUserMedia and audio device selection APIs. This phase enables CoreLogic Studio to work as a true real-time audio interface with low-latency monitoring, multi-device support, and robust buffer management.

**Status**: In Progress (Starting November 22, 2025)

---

## Objectives

### Primary Goals
1. **Multi-Device Audio I/O** - Support multiple input/output devices with hot-swapping
2. **Low-Latency Real-Time Processing** - Maintain sub-10ms latency for professional monitoring
3. **Buffer Management** - Implement circular/ring buffers for efficient real-time processing
4. **Audio Device Enumeration** - Detect and list available audio devices
5. **Professional Monitoring** - Real-time metering, latency display, and device status

### Secondary Goals
1. **Hardware Abstraction** - Abstraction layer for future hardware integration
2. **Device Routing** - Route inputs/outputs to specific tracks/buses
3. **Quality Monitoring** - Track buffer underruns, xruns, and performance metrics

---

## Architecture Overview

### Three-Layer I/O System

```
┌─────────────────────────────────────────────────────┐
│         React UI Components (Phase 3 UI)           │
│  - AudioMonitor (real-time levels & latency)       │
│  - AudioSettings (device selection & config)       │
│  - IOStatusPanel (connection status, xruns)        │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│         DAW Context Integration                    │
│  - Audio I/O state (devices, monitoring)           │
│  - I/O control methods (start/stop I/O)            │
│  - Device selection and routing                    │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│         Audio Engine Extensions                    │
│  - Real-time input/output handling                 │
│  - Device enumeration and selection                │
│  - Audio worklet integration (future)              │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│         Supporting Libraries                       │
│  - AudioDeviceManager (device enumeration)         │
│  - RealtimeBufferManager (ring buffers)            │
│  - AudioIOMetrics (latency, underruns)             │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│    Web Audio API (getUserMedia, AudioContext)     │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 3.1: Core Audio I/O Infrastructure

#### AudioDeviceManager (`src/lib/audioDeviceManager.ts`)
Handles enumeration, selection, and lifecycle of audio devices.

**Key Features:**
- `enumerateInputDevices()`: List all available input devices
- `enumerateOutputDevices()`: List all available output devices
- `selectInputDevice(deviceId)`: Switch to specific input device
- `selectOutputDevice(deviceId)`: Switch to specific output device
- `getDeviceInfo(deviceId)`: Get detailed device information
- `onDeviceConnected()`: Event handler for device hot-swap
- `onDeviceDisconnected()`: Event handler for device removal

**Interface:**
```typescript
interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId: string;
  state: 'connected' | 'disconnected';
}

interface AudioDeviceManager {
  enumerateInputDevices(): Promise<AudioDevice[]>;
  enumerateOutputDevices(): Promise<AudioDevice[]>;
  selectInputDevice(deviceId: string): Promise<boolean>;
  selectOutputDevice(deviceId: string): Promise<boolean>;
  getSelectedInputDevice(): AudioDevice | null;
  getSelectedOutputDevice(): AudioDevice | null;
  onDevicesChanged(callback: (devices: AudioDevice[]) => void): void;
}
```

#### RealtimeBufferManager (`src/lib/realtimeBufferManager.ts`)
Manages circular/ring buffers for real-time audio processing with zero-copy where possible.

**Key Features:**
- Ring buffer implementation (fixed-size circular buffer)
- Multi-channel support (mono, stereo, surround)
- Sample-accurate read/write pointers
- Underrun/overrun detection
- Buffer position tracking for latency calculation

**Interface:**
```typescript
interface RealtimeBufferManager {
  writeAudio(data: Float32Array, channel: number): boolean;
  readAudio(samples: number, channel: number): Float32Array;
  getBufferSize(): number;
  getAvailableSamples(): number;
  getLatencySamples(): number;
  onUnderrun(callback: () => void): void;
  onOverrun(callback: () => void): void;
}
```

#### AudioIOMetrics (`src/lib/audioIOMetrics.ts`)
Tracks performance metrics for real-time audio I/O.

**Key Features:**
- Latency measurement (hardware + software)
- Buffer underrun/overrun counting
- CPU usage monitoring
- Sample rate and buffer size tracking
- Performance alerts

**Interface:**
```typescript
interface AudioIOMetrics {
  getCurrentLatencyMs(): number;
  getAverageLatencyMs(): number;
  getUnderrunCount(): number;
  getOverrunCount(): number;
  getCpuUsage(): number;
  getSampleRate(): number;
  getBufferSize(): number;
}
```

### Phase 3.2: Audio Engine Extensions

#### Extend AudioEngine class
Add real-time I/O methods to existing `AudioEngine` class:

**New Methods:**
```typescript
// Real-time input
startAudioInput(deviceId?: string): Promise<boolean>;
stopAudioInput(): void;
getInputDevices(): Promise<AudioDevice[]>;
selectInputDevice(deviceId: string): Promise<boolean>;
getSelectedInputDevice(): AudioDevice | null;
getInputLevel(): number; // Current input level (0-1)

// Real-time output
startAudioOutput(deviceId?: string): Promise<boolean>;
stopAudioOutput(): void;
getOutputDevices(): Promise<AudioDevice[]>;
selectOutputDevice(deviceId: string): Promise<boolean>;
getSelectedOutputDevice(): AudioDevice | null;

// Metrics
getIOMetrics(): AudioIOMetrics;
getLatencyMs(): number;
getBufferUnderruns(): number;
```

**Implementation Approach:**
1. Use Web Audio API's `getUserMedia()` for microphone input
2. Create `MediaStreamAudioSourceNode` for input routing
3. Implement `ScriptProcessorNode` or `AudioWorklet` for real-time processing
4. Manage buffer queues for multi-track input recording
5. Handle device change events for hot-swap support

### Phase 3.3: UI Components

#### AudioMonitor Component (`src/components/AudioMonitor.tsx`)
Real-time audio level and latency display.

**Features:**
- Input level meter (peak + RMS)
- Output level meter
- Latency display (ms)
- CPU usage indicator
- Buffer status (xruns, underruns)
- Visual indicators for issues (red for problems)

#### AudioSettings Modal (`src/components/AudioSettings.tsx`)
Device selection and buffer configuration interface.

**Features:**
- Input device selector (dropdown)
- Output device selector (dropdown)
- Buffer size selector (512, 1024, 2048, 4096 samples)
- Sample rate display
- Latency display
- Test tone generator for setup
- Device refresh button

### Phase 3.4: DAW Context Integration

**New State Properties:**
```typescript
selectedInputDevice: AudioDevice | null;
selectedOutputDevice: AudioDevice | null;
inputLevel: number;
outputLevel: number;
latencyMs: number;
bufferUnderruns: number;
bufferOverruns: number;
isAudioIOActive: boolean;
audioIOError: string | null;
```

**New Methods:**
```typescript
getInputDevices(): Promise<AudioDevice[]>;
getOutputDevices(): Promise<AudioDevice[]>;
selectInputDevice(deviceId: string): Promise<void>;
selectOutputDevice(deviceId: string): Promise<void>;
startAudioIO(): Promise<void>;
stopAudioIO(): void;
getLatencyMs(): number;
refreshDeviceList(): Promise<void>;
```

---

## Implementation Timeline

### Week 1 (Starting Nov 22)
- [x] Create Phase 3 roadmap
- [ ] Implement `AudioDeviceManager`
- [ ] Implement `RealtimeBufferManager`
- [ ] Implement `AudioIOMetrics`

### Week 2
- [ ] Extend `AudioEngine` with I/O methods
- [ ] Implement input device enumeration
- [ ] Implement output device enumeration
- [ ] Add buffer management to engine

### Week 3
- [ ] Create `AudioMonitor` component
- [ ] Create `AudioSettings` modal
- [ ] Integrate I/O with `DAWContext`
- [ ] Add status display to TopBar

### Week 4
- [ ] Manual testing and debugging
- [ ] Performance optimization
- [ ] Error handling and recovery
- [ ] Documentation updates

---

## Technical Specifications

### Buffer Management Strategy

**Ring Buffer Design:**
```
┌──────────────────────────────────────────┐
│  Ring Buffer (8192 samples)              │
├──────────────────────────────────────────┤
│     Write Pointer ──→ [Write Zone]       │
│                                          │
│     [Valid Audio Data]                   │
│                                          │
│ ←── Read Pointer  [Read Zone]            │
└──────────────────────────────────────────┘
```

**Specifications:**
- Default size: 8192 samples (170ms @ 48kHz)
- Configurable: 512 - 16384 samples
- Multi-channel: Separate ring buffer per channel
- Underrun detection: Alert when read position catches write
- Overrun detection: Alert when write position catches read

### Latency Targets

**Target Latencies (at 48kHz):**
- Hardware I/O: ~2-4ms
- Web Audio buffering: ~20-50ms
- Software processing: <5ms
- **Total target: <10ms** (professional standard)

**Measurement Method:**
- Input-to-output loopback test
- Sample timestamps for phase measurement
- Circular buffer position tracking

### Device Support

**Input Devices:**
- System microphone
- USB audio interfaces
- Bluetooth audio (if supported)
- Virtual audio devices (for software routing)

**Output Devices:**
- System speaker/headphones
- USB audio interfaces
- Virtual audio devices

**Hot-Swap Support:**
- Listen to `devicechange` events
- Auto-fallback to default device if selected device disconnects
- Notify user of device changes

---

## API Examples

### Basic Usage

**Select Input Device:**
```typescript
const { selectInputDevice, getInputDevices } = useDAW();

const devices = await getInputDevices();
await selectInputDevice(devices[0].deviceId);
```

**Start Real-Time Monitoring:**
```typescript
const { startAudioIO, stopAudioIO } = useDAW();

await startAudioIO(); // Uses selected devices
// ... recording active ...
stopAudioIO();
```

**Monitor Metrics:**
```typescript
const { getLatencyMs, getIOMetrics } = useDAW();

console.log(`Current latency: ${getLatencyMs()}ms`);
const metrics = getIOMetrics();
console.log(`Underruns: ${metrics.underrunCount}`);
```

---

## Testing Strategy

### Manual Testing
1. **Device Enumeration**: Verify all devices listed correctly
2. **Device Selection**: Switch between devices and verify audio routes
3. **Real-Time Monitoring**: Check levels update smoothly
4. **Latency Measurement**: Verify latency display accuracy
5. **Buffer Management**: Trigger underruns and verify detection
6. **Hot-Swap**: Disconnect/connect devices and verify recovery
7. **Edge Cases**: Test with 0 devices, invalid device IDs, permission denial

### Performance Testing
1. **CPU Usage**: Monitor CPU under continuous I/O
2. **Memory Leaks**: Check memory growth during extended use
3. **Latency Consistency**: Verify latency stays within targets
4. **Buffer Stability**: Long-running sessions (1+ hour)

### Error Handling Testing
1. **Permission Denied**: User denies microphone access
2. **Device Unavailable**: Device disconnects during use
3. **Sample Rate Mismatch**: Device not matching project sample rate
4. **Buffer Overflow**: Rapid input data arrival
5. **Sample Rate Change**: System changes audio device sample rate

---

## Future Enhancements

### Phase 3.5: Advanced Features
- **Audio Worklet**: Migrate from ScriptProcessorNode for better performance
- **ASIO Support**: Direct ASIO driver access on Windows
- **CoreAudio/Alsa**: Native audio APIs for macOS/Linux
- **Sidechain Routing**: Route input to specific buses
- **Input Monitoring**: Direct input-to-output monitoring with effects

### Phase 3.6: Hardware Integration
- **MIDI Device Support**: Enumerate and select MIDI devices
- **Control Surface Mapping**: Map hardware controllers to parameters
- **Sync Protocols**: Word Clock, MIDI Clock, Dante
- **Remote I/O**: Network audio streaming (Dante, AES70)

---

## Dependencies

### Current
- Web Audio API (MediaDevices API, getUserMedia)
- No external dependencies required for Phase 3.1

### Future (Phase 3.5+)
- Audio Worklet polyfill (if supporting older browsers)
- ASIO SDK (Windows, optional)
- CoreAudio Framework (macOS, native)

---

## Browser Compatibility

| Browser | getUserMedia | AudioContext | Status |
|---------|------------|--------------|--------|
| Chrome/Edge 53+ | ✅ | ✅ | Fully Supported |
| Firefox 25+ | ✅ | ✅ | Fully Supported |
| Safari 14.1+ | ✅ | ✅ | Fully Supported |
| Opera 40+ | ✅ | ✅ | Fully Supported |

**Note**: HTTPS required for getUserMedia (except localhost)

---

## References

- [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Audio Worklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)

---

**Document Created**: November 22, 2025
**Phase 3 Start Date**: November 22, 2025
