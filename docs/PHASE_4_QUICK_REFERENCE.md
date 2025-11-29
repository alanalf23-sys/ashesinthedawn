# 🎯 Phase 4 Quick Reference Guide

**Status**: ✅ Complete & Ready to Use  
**Build**: 470.06 KB, 0 errors, 1,585 modules  
**Last Updated**: November 22, 2025

---

## Quick Start: Using Phase 4 Features

### 1. Loading VST Plugins

#### In Your Component
```typescript
import { useDAW } from '../contexts/DAWContext';

export default function MyComponent() {
  const { loadPlugin, selectedTrack } = useDAW();
  
  const handleLoadPlugin = async () => {
    if (!selectedTrack) {
      alert('Select a track first');
      return;
    }
    
    // Load a plugin from the plugin browser
    const success = await loadPlugin('eq-plugin', selectedTrack.id);
    if (success) {
      console.log('Plugin loaded successfully');
    }
  };
  
  return <button onClick={handleLoadPlugin}>Load EQ</button>;
}
```

#### Plugin Browser UI
```tsx
<PluginBrowser />
```

---

### 2. Setting Plugin Parameters

```typescript
const { setPluginParameter, selectedTrack } = useDAW();

// Set a plugin parameter to a value
if (selectedTrack) {
  setPluginParameter(
    selectedTrack.id,
    'eq-plugin-id',
    'frequency',
    1000 // Hz
  );
}
```

---

### 3. MIDI Integration

#### Adding MIDI Device to Track

```typescript
import { useDAW } from '../contexts/DAWContext';

export default function MIDISetup() {
  const { createMIDIRoute, selectedTrack } = useDAW();
  
  const handleAddMIDIDevice = () => {
    if (!selectedTrack) return;
    
    const midiDevice = {
      deviceId: 'keyboard-1',
      name: 'USB Keyboard',
      kind: 'input' as const,
      manufacturer: 'Manufacturer',
      state: 'connected' as const,
      channel: 1,
    };
    
    createMIDIRoute(selectedTrack.id, midiDevice, 1);
  };
  
  return <button onClick={handleAddMIDIDevice}>Connect MIDI</button>;
}
```

#### Handling MIDI Notes

```typescript
const { handleMIDINote } = useDAW();

// When a MIDI note is received
handleMIDINote(
  trackId,
  60,      // Note number (C4)
  100,     // Velocity (0-127)
  true     // Note on
);
```

---

### 4. Audio Routing & Buses

#### Creating a Bus

```typescript
const { createBus, addTrackToBus } = useDAW();

// Create a new bus for drums
const drumBus = createBus('Drums', '#FF6B6B');

// Route tracks to the bus
addTrackToBus('track-1', drumBus.id);
addTrackToBus('track-2', drumBus.id);
```

#### Setting Up Sidechain Compression

```typescript
const { createSidechain, selectedTrack } = useDAW();

// Make compressor on Track 1 listen to Track 2's signal
if (selectedTrack) {
  createSidechain(
    'compressor-1-plugin-id', // Plugin ID of compressor on Track 1
    'track-2-id'              // Sidechain from Track 2
  );
}
```

---

### 5. Real-Time Spectrum Analysis

#### Display Spectrum Data

```typescript
import { useDAW } from '../contexts/DAWContext';

export default function SpectrumDisplay() {
  const { spectrumData, selectedTrack } = useDAW();
  
  if (!selectedTrack) return null;
  
  const spectrum = spectrumData.get(selectedTrack.id) || [];
  
  return (
    <div className="flex gap-1">
      {spectrum.map((level, idx) => (
        <div
          key={idx}
          className="w-2 bg-gradient-to-t from-blue-600 to-red-600"
          style={{ height: `${Math.min(level * 100, 100)}%` }}
        />
      ))}
    </div>
  );
}
```

#### Use Built-in Component

```tsx
<SpectrumVisualizerPanel />
```

---

### 6. Automation Recording

#### Start Recording Automation

```typescript
const { createAutomationCurve, addAutomationPoint, selectedTrack } = useDAW();

// Start recording volume automation for selected track
if (selectedTrack) {
  const curve = createAutomationCurve(selectedTrack.id, 'volume');
  
  // Add automation points as user moves fader
  addAutomationPoint(curve.id, 0.5, 0.7); // time 0.5s, value 0.7
  addAutomationPoint(curve.id, 1.0, 0.3); // time 1.0s, value 0.3
}
```

---

## Phase 4 Components Reference

### UI Components

#### PluginBrowser
```tsx
<PluginBrowser />
```
- Displays available VST/AU plugins
- Searchable plugin library
- Drag-and-drop to load
- Parameter editing

#### MIDISettings
```tsx
<MIDISettings />
```
- Shows available MIDI devices
- Manage MIDI routes
- Channel assignment
- Device status

#### EffectChainPanel
```tsx
<EffectChainPanel />
```
- Visual effect chain display
- Drag to reorder effects
- Parameter controls
- Bypass toggles

#### RoutingMatrix
```tsx
<RoutingMatrix />
```
- Shows track-to-bus routing
- Visual matrix layout
- Create buses
- Assign routes

#### SpectrumVisualizerPanel
```tsx
<SpectrumVisualizerPanel />
```
- Real-time FFT display
- Frequency bar chart
- Peak detection
- Logging scale

---

## DAWContext Methods

### Plugin Management

```typescript
// Load plugin on track
loadPlugin(pluginPath: string, trackId: string): Promise<boolean>

// Remove plugin from track
unloadPlugin(trackId: string, pluginId: string): void

// Get plugin parameters
getPluginParameters(trackId: string, pluginId: string): PluginParameter[]

// Set plugin parameter value
setPluginParameter(
  trackId: string,
  pluginId: string,
  param: string,
  value: number
): void
```

### MIDI Management

```typescript
// Add MIDI device to track
createMIDIRoute(
  trackId: string,
  midiDevice: MIDIDevice,
  channel: number
): void

// Remove MIDI device from track
deleteMIDIRoute(trackId: string, routeId: string): void

// Get all MIDI routes for track
getMIDIRoutesForTrack(trackId: string): MIDIRoute[]

// Handle incoming MIDI note
handleMIDINote(
  trackId: string,
  note: number,
  velocity: number,
  on: boolean
): void
```

### Audio Routing

```typescript
// Create new bus
createBus(name: string, color?: string): BusNode

// Remove bus
deleteBus(busId: string): void

// Route track to bus
addTrackToBus(trackId: string, busId: string): void

// Unroute track from bus
removeTrackFromBus(trackId: string, busId: string): void

// Set up sidechain compression
createSidechain(
  compressorId: string,
  sourceTrackId: string
): void
```

### Automation

```typescript
// Create automation curve
createAutomationCurve(
  trackId: string,
  parameter: string
): AutomationCurve

// Add point to automation curve
addAutomationPoint(
  curveId: string,
  time: number,
  value: number
): void

// Update automation curve
updateAutomationCurve(curveId: string, updates: Partial<AutomationCurve>): void

// Delete automation curve
deleteAutomationCurve(curveId: string): void
```

---

## State Properties Available

```typescript
// Plugin state
loadedPlugins: Map<string, PluginInstance[]>        // Track → Plugins
effectChains: Map<string, EffectChain>              // Track → Chain

// MIDI state
midiRouting: Map<string, MIDIRoute[]>               // Track → Routes
midiDevices: MIDIDevice[]                           // Available devices

// Routing state
buses: BusNode[]                                     // All buses
routingMatrix: RoutingDestination[][]               // Matrix layout
sidechainConfigs: Map<string, SidechainConfig>      // Sidechains

// Analysis state
spectrumData: Map<string, number[]>                 // Track → FFT
automationCurves: Map<string, AutomationCurve[]>    // Track → Curves
```

---

## Common Workflows

### Workflow 1: Set Up Drums with EQ & Compression

```typescript
// 1. Add plugins to drum track
await loadPlugin('eq-plugin', drumTrackId);
await loadPlugin('compressor-plugin', drumTrackId);

// 2. Set EQ to boost low end
setPluginParameter(drumTrackId, 'eq-plugin', 'low-gain', 3); // +3dB

// 3. Set compressor ratio
setPluginParameter(drumTrackId, 'comp-plugin', 'ratio', 4); // 4:1

// Result: Punchy drums with enhanced bass
```

### Workflow 2: Sidechain Drums to Vocals Compressor

```typescript
// 1. Load compressor on vocal track
await loadPlugin('compressor-plugin', vocalTrackId);

// 2. Create sidechain from drum track
createSidechain(
  'compressor-plugin-on-vocal',
  drumTrackId
);

// Result: Vocals duck when drums hit
```

### Workflow 3: Group Tracks with Bus

```typescript
// 1. Create bus for all guitars
const guitarBus = createBus('Guitars', '#FFB366');

// 2. Route guitar tracks to bus
addTrackToBus('guitar-1-id', guitarBus.id);
addTrackToBus('guitar-2-id', guitarBus.id);
addTrackToBus('guitar-3-id', guitarBus.id);

// 3. Now adjust guitar bus volume to control all guitars
setTrackVolume(guitarBus.id, -3); // -3dB on all guitars

// Result: Easy group control of multiple instruments
```

### Workflow 4: Monitor Input with Spectrum

```typescript
// 1. Open spectrum analyzer
<SpectrumVisualizerPanel />

// 2. Play audio
togglePlay();

// 3. Watch spectrum bars to identify frequencies
// Tap on bars to see Hz values

// Result: Visual feedback on frequency content
```

---

## Troubleshooting

### Plugin Won't Load

**Problem**: `loadPlugin()` returns false

**Solutions**:
1. Check track is selected: `if (!selectedTrack) return`
2. Verify plugin path is correct
3. Check browser console for errors
4. Ensure track type supports plugins

```typescript
const success = await loadPlugin(pluginPath, selectedTrack.id);
if (!success) {
  console.log('Plugin failed to load - check path and permissions');
}
```

### MIDI Notes Not Playing

**Problem**: Pressed keys on MIDI keyboard but no sound

**Solutions**:
1. Verify MIDI device is selected in MIDISettings
2. Check track is instrument type (not audio)
3. Verify track is not muted
4. Check browser allows Web MIDI (HTTPS required)

```typescript
// Check MIDI route exists
const routes = getMIDIRoutesForTrack(trackId);
console.log('MIDI routes:', routes);
```

### Sidechain Not Triggering

**Problem**: Compression not responding to sidechain signal

**Solutions**:
1. Verify compressor plugin is on target track
2. Check source track has audio signal
3. Verify sidechain was created: `createSidechain()`
4. Check sidechain track is not muted

### Spectrum Not Updating

**Problem**: Spectrum analyzer shows static display

**Solutions**:
1. Check audio is playing: `togglePlay()`
2. Verify selected track has audio
3. Check browser supports Web Audio API
4. Refresh browser cache if stuck

---

## Performance Tips

### Optimize CPU Usage

1. **Limit Effect Chain Length**
   - 10+ effects can impact CPU
   - Disable unused effects
   - Use internal effects when possible

2. **Efficient Sidechain**
   - Filter sidechain signal
   - Use high-pass filter to reduce data
   - Avoid sidechaining to reverb returns

3. **Spectrum Analysis**
   - 60 FPS is plenty for visual display
   - Reduce FFT size if needed
   - Use average smoothing

### Memory Management

1. **Plugin Unloading**
   - Remove unused plugins: `unloadPlugin()`
   - Dispose properly on unmount
   - Clear automation curves when done

2. **Bus Management**
   - Delete unused buses: `deleteBus()`
   - Avoid deeply nested routing (3+ levels)
   - Keep bus count under 50

---

## API Quick Reference

| Task | Method | Example |
|------|--------|---------|
| Load plugin | `loadPlugin()` | `await loadPlugin('eq', trackId)` |
| Set parameter | `setPluginParameter()` | `setPluginParameter(trackId, pluginId, 'gain', 5)` |
| Add MIDI device | `createMIDIRoute()` | `createMIDIRoute(trackId, device, 1)` |
| Handle MIDI note | `handleMIDINote()` | `handleMIDINote(trackId, 60, 100, true)` |
| Create bus | `createBus()` | `createBus('Drums', '#FF0000')` |
| Route to bus | `addTrackToBus()` | `addTrackToBus(trackId, busId)` |
| Setup sidechain | `createSidechain()` | `createSidechain(compId, sourceId)` |
| Record automation | `createAutomationCurve()` | `createAutomationCurve(trackId, 'volume')` |
| Add automation point | `addAutomationPoint()` | `addAutomationPoint(curveId, 0.5, 0.8)` |

---

## Real-World Examples

### Example 1: Professional Mix Setup

```typescript
// Create bus structure
const drumBus = createBus('Drums', '#FF6B6B');
const vocalBus = createBus('Vocals', '#4ECDC4');
const musicBus = createBus('Music', '#95E1D3');
const masterBus = createBus('Master', '#FFD93D');

// Route tracks
addTrackToBus('drum-1', drumBus.id);
addTrackToBus('drum-2', drumBus.id);
addTrackToBus('vocal-main', vocalBus.id);
addTrackToBus('guitar-1', musicBus.id);

// Add processing
await loadPlugin('eq-plugin', drumBus.id);
await loadPlugin('compressor-plugin', vocalBus.id);

// Setup sidechain
createSidechain('vocal-compressor', drumBus.id);

// Result: Professional mixing topology ready for automation
```

### Example 2: Frequency Analysis During Recording

```typescript
// Start recording
toggleRecord();

// Open spectrum analyzer
<SpectrumVisualizerPanel />

// Monitor in real-time
const spectrum = spectrumData.get(selectedTrack.id);
console.log('Peak frequency:', findPeakFrequency(spectrum), 'Hz');

// Use data to inform EQ decisions
if (hasPeakAt(spectrum, 2000)) {
  setPluginParameter(trackId, 'eq-id', 'mid-freq', 2000);
  setPluginParameter(trackId, 'eq-id', 'mid-gain', -2); // -2dB notch
}
```

---

## Next Steps

1. **Try Loading a Plugin**: Use PluginBrowser to load first effect
2. **Connect MIDI**: Use MIDISettings to add keyboard
3. **Set Up Routing**: Create buses and route tracks
4. **Record Automation**: Use automation curves on parameters
5. **Monitor Spectrum**: Open analyzer to see frequency content

---

## Support & Documentation

- **Full Docs**: `PHASE_4_IMPLEMENTATION_REPORT.md`
- **Roadmap**: `PHASE_4_ROADMAP.md`
- **TypeScript Types**: `src/types/index.ts`
- **Component Code**: `src/components/`
- **Context Methods**: `src/contexts/DAWContext.tsx`

---

**Phase 4 is complete and production-ready. Start building professional mixes!** 🎵

