# CoreLogic Studio - Advanced Features API Reference

## Quick Integration Guide

### 1. MIDIKeyboard Component
```typescript
import { MIDIKeyboard } from '@/components/MIDIKeyboard';

const handleNoteOn = (pitch: number, velocity: number) => {
  // pitch: 0-127 (MIDI range)
  // velocity: 0-127 (typically 100 for full velocity)
  console.log(`Note on: ${pitch}, velocity: ${velocity}`);
};

const handleNoteOff = (pitch: number) => {
  console.log(`Note off: ${pitch}`);
};

// In your component:
<MIDIKeyboard 
  onNoteOn={handleNoteOn}
  onNoteOff={handleNoteOff}
  octaveStart={3}
  octaveCount={3}
  isVisible={true}
/>
```

**Props**:
- `onNoteOn`: (pitch: number, velocity: number) => void
- `onNoteOff`: (pitch: number) => void
- `octaveStart`: number (default: 3)
- `octaveCount`: number (default: 3)
- `isVisible`: boolean (default: true)

**Keyboard Mappings**:
- `Z-M`: C-B (octave 1)
- `Q-U`: C-B (octave 2)

---

### 2. ClipEditor Component
```typescript
import { ClipEditor } from '@/components/ClipEditor';
import { AudioClipProcessor } from '@/lib/audioClipProcessor';

const handleApplyProcessing = (state: ClipProcessingState) => {
  // state contains: playbackRate, pitchShift, fadeInMs, fadeOutMs, processedDuration
  // Use AudioClipProcessor to apply transformations
  const processed = AudioClipProcessor.processClip(
    audioBuffer,
    state.playbackRate,
    state.pitchShift,
    state.fadeInMs,
    state.fadeOutMs
  );
};

<ClipEditor 
  onApplyProcessing={handleApplyProcessing}
  clipDuration={5000} // ms
/>
```

**AudioClipProcessor Methods**:
```typescript
// Time-stretch
AudioClipProcessor.createStretchedBuffer(audioBuffer, playbackRate: number): AudioBuffer

// Pitch-shift rate calculation
AudioClipProcessor.calculatePitchShiftRate(semitones: number): number
// Returns: 2^(semitones/12)

// Fade envelopes
AudioClipProcessor.applyFadeIn(audioBuffer, fadeInMs: number): AudioBuffer
AudioClipProcessor.applyFadeOut(audioBuffer, fadeOutMs: number): AudioBuffer

// Combined processing
AudioClipProcessor.processClip(
  audioBuffer: AudioBuffer,
  playbackRate: number,
  pitchShift: number,
  fadeInMs: number,
  fadeOutMs: number
): AudioBuffer

// Duration preview
AudioClipProcessor.getProcessedDuration(
  originalDuration: number,
  playbackRate: number,
  pitchShift: number
): number
```

---

### 3. AdvancedMeter Component
```typescript
import { AdvancedMeter } from '@/components/AdvancedMeter';

// Get analyser node from your audio context
const analyserNode = audioContext.createAnalyser();
analyserNode.fftSize = 256;

<AdvancedMeter 
  analyserNode={analyserNode}
  updateInterval={50} // ms
/>
```

**Metrics Provided**:
- **RMS**: Current RMS level (0-1)
- **Peak**: Peak hold value with 2-second decay
- **LUFS**: Loudness in LUFS (simplified: 20*log10(rms) - 96)
- **Headroom**: dB below clipping (max 0 dB, with 3dB safety margin)
- **Spectrum**: 32-band frequency analysis with hue gradient

---

### 4. AutomationPresetManager
```typescript
import { AutomationPresetManager, AutomationCurveData, AutomationPreset } from '@/lib/automationPresetManager';

// Export curves to preset
const preset = AutomationPresetManager.exportPreset(
  curves,
  'My Preset',
  'Optional description',
  { projectName: 'My Project', tempo: 120 }
);

// Download preset file
AutomationPresetManager.downloadPreset(preset);

// Import from file
const file = event.target.files[0];
const imported = await AutomationPresetManager.importPreset(file);

// Utility methods
const filtered = AutomationPresetManager.filterCurvesByParameter(preset, 'Volume');
const scaled = AutomationPresetManager.scaleCurve(curve, 0, 1, -96, 0);
const shifted = AutomationPresetManager.shiftCurveTime(curve, 1000); // +1s
const compressed = AutomationPresetManager.compressTime(curve, 2); // 2x faster
const stats = AutomationPresetManager.getCurveStats(curve);
```

**Preset JSON Structure**:
```json
{
  "name": "Volume Sweep",
  "description": "Gradual volume reduction",
  "version": "1.0.0",
  "createdAt": "2024-11-14T21:36:00.000Z",
  "curves": [
    {
      "trackId": "track-1",
      "trackName": "Vocal",
      "parameterName": "Volume",
      "curveType": "exponential",
      "points": [
        { "time": 0, "value": 0 },
        { "time": 5000, "value": -12 }
      ],
      "minValue": -96,
      "maxValue": 0
    }
  ],
  "metadata": {
    "projectName": "My Song",
    "tempo": 120,
    "timeSignature": "4/4"
  }
}
```

---

### 5. AutomationPresetManagerUI Component
```typescript
import { AutomationPresetManagerUI } from '@/components/AutomationPresetManager';

<AutomationPresetManagerUI 
  curves={automationCurves}
  onExport={(preset) => console.log('Exported:', preset)}
  onImport={(preset) => console.log('Imported:', preset)}
/>
```

**Features**:
- Preset library with save/load
- Export to JSON file (browser download)
- Import from JSON file
- Duplicate, delete, view statistics
- Error handling and validation

---

### 6. AutomationEngine
```typescript
import { AutomationEngine } from '@/lib/automationEngine';

const engine = new AutomationEngine();

// Add control points
engine.addPoint(0, 0);      // Time 0s, value 0
engine.addPoint(2, -12);    // Time 2s, value -12dB
engine.addPoint(5, -6);     // Time 5s, value -6dB

// Get value at specific time
const valueAt2_5s = engine.getValueAtTime(2.5); // Interpolated

// Update interpolation mode
engine.curveType = 'exponential'; // 'linear' | 'exponential' | 'logarithmic'

// Generate curve data for visualization
const curveData = engine.generateCurveData(100); // 100 points
// Returns: Array<{ time: number, value: number }>

// Manipulate curves
engine.shiftPoints(1000); // Shift all by +1s
engine.scaleValues(0, 1, -96, 0); // Scale from [0,1] to [-96,0]
```

---

### 7. ParameterMapperEngine
```typescript
import { ParameterMapperEngine } from '@/lib/parameterMapperEngine';

const mapper = new ParameterMapperEngine();

// Learn MIDI CC
mapper.startLearning();
// User moves MIDI controller...
// After 5 seconds or movement detected:
mapper.stopLearning(); // Returns controller number (e.g., 7 for volume)

// Add mapping
mapper.addMapping({
  cc: 7,
  channel: 0,
  targetParameter: 'volume',
  minValue: -96,
  maxValue: 0,
  curve: 'linear' // 'linear' | 'logarithmic' | 'exponential'
});

// Process MIDI CC value
const paramValue = mapper.processMidiCC(7, 64, 0); // cc, midiValue (0-127), channel
// Returns: paramValue scaled to parameter range

// Import/export presets
const json = mapper.exportToJSON();
mapper.importFromJSON(json);
```

---

### 8. Integration with DAWContext

**Recommended DAWContext Additions**:
```typescript
// Add to DAWContext state
const [clips, setClips] = useState<Map<string, Clip[]>>(new Map());

// Add to DAWContext methods
const createClip = (trackId: string, clipData: Clip) => {
  // Create new clip with audio buffer reference
};

const updateClip = (trackId: string, clipId: string, updates: Partial<Clip>) => {
  // Update clip properties
};

const processClip = (trackId: string, clipId: string, processingState: ClipProcessingState) => {
  // Apply AudioClipProcessor and update clip
};

const deleteClip = (trackId: string, clipId: string) => {
  // Remove clip from track
};
```

---

## Performance Tips

### For Clip Processing
- Use `getProcessedDuration()` before actual processing to show preview
- Process large clips asynchronously with progress callback
- Cache processed buffers to avoid re-processing

### For Metering
- Use `updateInterval` prop to control canvas update frequency (50-100ms typical)
- Connect analyser node to track output, not input
- Use fftSize 256 or 512 for performance balance

### For Automation
- Use `exponential` curves for volume changes (sounds more natural)
- Use `linear` curves for precise parameter sweeps
- Cache curve interpolation results for playback

### For MIDI Keyboard
- Keep keyboard focused for optimal keyboard control
- Use velocity from slider input or mouse position
- Send MIDI notes to instrument track, not audio track

---

## Troubleshooting

### MIDIKeyboard not responding to keyboard
- Ensure keyboard component is focused (`tabIndex={0}` required)
- Check browser console for key event logging
- Verify `enableMouseControl` toggle is on

### ClipEditor duration not updating
- Verify `clipDuration` prop is passed in milliseconds
- Check that `AudioClipProcessor.getProcessedDuration()` is working
- Ensure playbackRate and pitchShift values are within range

### AdvancedMeter not showing levels
- Verify analyser node is connected to audio output
- Check `updateInterval` is not too high (< 100ms recommended)
- Ensure audio is actually playing through analyser node

### Automation preset import failing
- Verify JSON structure matches specification
- Check file size (< 100MB recommended)
- Ensure all required fields present (name, curves array)

### Pitch shifting sounds wrong
- Check if playbackRate is also being modified (2x scaling)
- Verify pitch shift range is -12 to +12 semitones
- Test with known pitch before debugging further

---

## Code Examples

### Complete MIDI to Synth Integration
```typescript
const handleMIDINote = (pitch: number, velocity: number) => {
  const instrument = selectedTrack as InstrumentTrack;
  const frequency = 440 * Math.pow(2, (pitch - 69) / 12); // A4 = 440Hz
  
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(velocity / 127, audioContext.currentTime);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  // Store reference for note-off
  activeOscillators.set(pitch, osc);
};

const handleMIDINoteOff = (pitch: number) => {
  const osc = activeOscillators.get(pitch);
  if (osc) {
    osc.stop();
    activeOscillators.delete(pitch);
  }
};
```

### Clip Library Sidebar Integration
```typescript
const handleSelectClip = (clip: Clip) => {
  setSelectedClip(clip);
  // Show ClipEditor for this clip
};

<div className="space-y-2">
  {selectedTrackClips?.map(clip => (
    <button
      key={clip.id}
      onClick={() => handleSelectClip(clip)}
      className="w-full text-left p-2 bg-gray-800 hover:bg-gray-700 rounded"
    >
      {clip.name}
    </button>
  ))}
</div>

{selectedClip && (
  <ClipEditor 
    clip={selectedClip}
    onApplyProcessing={(state) => processClip(selectedClip.id, state)}
  />
)}
```

---

## File Structure Reference

```
src/
├── lib/
│   ├── audioClipProcessor.ts (220 lines)
│   │   └── AudioClipProcessor class
│   ├── automationEngine.ts (148 lines)
│   │   └── AutomationEngine class
│   ├── automationPresetManager.ts (340 lines)
│   │   └── AutomationPresetManager class + interfaces
│   └── parameterMapperEngine.ts (168 lines)
│       └── ParameterMapperEngine class
└── components/
    ├── MIDIKeyboard.tsx (194 lines)
    │   └── export MIDIKeyboard
    ├── ClipEditor.tsx (210 lines)
    │   └── export ClipEditor
    ├── AdvancedMeter.tsx (195 lines)
    │   └── export AdvancedMeter
    ├── AutomationTrack.tsx (351 lines)
    │   └── export AutomationTrack
    ├── PluginParameterMapper.tsx (264 lines)
    │   └── export PluginParameterMapper
    └── AutomationPresetManager.tsx (290 lines)
        └── export AutomationPresetManagerUI
```

---

## Browser Compatibility

- **Chrome**: ✅ Full support (Web Audio API complete)
- **Firefox**: ✅ Full support
- **Safari**: ⚠️ Partial (some Web Audio features limited)
- **Edge**: ✅ Full support

---

**Last Updated**: 2024-11-14
**API Version**: 1.0.0
**Status**: Production Ready
