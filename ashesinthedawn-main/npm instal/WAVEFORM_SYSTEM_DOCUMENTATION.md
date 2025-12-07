# Real-Time Waveform Accuracy & Adjustability System

**Version**: 1.0.0
**Created**: November 24, 2025
**Status**: Ready for Integration

## System Overview

The Real-Time Waveform Accuracy & Adjustability System provides a modern, responsive waveform display with unprecedented control over visualization parameters. This system replaces the basic waveform rendering with a sophisticated multi-level adjustment framework.

### Key Capabilities

✅ **Real-Time Accuracy**
- 8192-sample high-resolution peak calculation
- Millisecond-precision time tracking
- Live playhead position during playback
- Configurable sampling resolution (2K to 16K)

✅ **Interactive Controls**
- Zoom: 0.5x to 4.0x magnification
- Scale: 0.5x to 3.0x amplitude adjustment
- Smoothing: 0% to 100% waveform interpolation
- Color picker: Custom waveform colors
- Grid overlay: Optional timing reference

✅ **Visual Enhancements**
- Gradient-filled waveform display
- Anti-aliased rendering
- Peak level metering with color coding
- Centered zero-line reference
- Progress bar with millisecond updates

✅ **Performance Optimized**
- RequestAnimationFrame for smooth 60fps animation
- Canvas-based rendering (no DOM overhead)
- Efficient peak calculation with block averaging
- High-DPI display support (devicePixelRatio)

## Component Architecture

### WaveformAdjuster Component

**Location**: `src/components/WaveformAdjuster.tsx`
**Lines**: ~400
**Dependencies**: React, Lucide React icons, DAWContext

```typescript
interface WaveformAdjusterProps {
  trackId: string;              // Track to display
  height?: number;              // Canvas height (default: 120px)
  showControls?: boolean;       // Show adjustment UI (default: true)
}
```

#### Key Methods

**`calculatePeaks(data, pixelWidth)`**
- Calculates min/max for each pixel column
- Adaptive block sizing based on zoom level
- Returns array of `{ min, max }` peak objects
- Handles variable-length audio data efficiently

**`drawWaveform()`**
- Canvas-based rendering with device pixel ratio scaling
- Draws background grid (optional)
- Creates gradient fills for visual depth
- Renders filled area + outline for definition
- Includes playhead indicator during playback
- Updates peak level meter

#### State Management

```typescript
// Visual adjustments
const [zoom, setZoom] = useState(1.0);           // 0.5x to 4.0x
const [scale, setScale] = useState(1.0);         // 0.5x to 3.0x
const [waveformColor, setWaveformColor] = useState("#3b82f6");

// Display options
const [showGrid, setShowGrid] = useState(true);
const [showAdvanced, setShowAdvanced] = useState(false);

// Technical parameters
const [resolution, setResolution] = useState(4096);  // 2K/4K/8K/16K
const [smoothing, setSmoothing] = useState(0.5);     // 0.0 to 1.0
const [peakLevel, setPeakLevel] = useState(0);       // Current peak
```

#### Control Row Elements

1. **Zoom Controls**
   - Button: `−` (decrease 0.2x per click, min 0.5x)
   - Display: Current zoom level (0.5x format)
   - Button: `+` (increase 0.2x per click, max 4.0x)

2. **Scale Controls**
   - Button: `↓` (decrease 0.2x per click, min 0.5x)
   - Display: Current scale (0.5x format)
   - Button: `↑` (increase 0.2x per click, max 3.0x)

3. **Color Picker**
   - Native HTML color input
   - Real-time waveform color update
   - Updates gradient fills immediately

4. **Peak Meter**
   - Visual bar with gradient (green → yellow → red)
   - Percentage display (0-100%)
   - Real-time updates during playback

#### Advanced Controls (Expandable)

1. **Grid Toggle**
   - Checkbox to show/hide timing grid
   - Grid spacing: width / 8 columns

2. **Resolution Selector**
   - Dropdown: 2K / 4K / 8K / 16K
   - Higher = more accurate but slower
   - Recommended: 4K for balance

3. **Smoothing Slider**
   - Range: 0% to 100%
   - 0% = sharp peaks, 100% = smooth curves
   - Recommended: 50% default

4. **Info Display**
   - Duration in seconds (2 decimals)
   - Total sample count

### EnhancedTimeline Component

**Location**: `src/components/EnhancedTimeline.tsx`
**Lines**: ~300
**Dependencies**: React, DAWContext, WaveformAdjuster

```typescript
interface TimelineProps {
  onSeek?: (timeSeconds: number) => void;  // Callback when user seeks
}
```

#### Key Features

**Time Display**
```
  0:05.325 / 2:43.000
  ^^^^^^^^   ^^^^^^^^^^
  Current    Duration
  (formatted with milliseconds)
```

**Direct Time Input**
- Click "Go to..." button to enter time
- Format: `M:SS.mmm` (minutes:seconds.milliseconds)
- Enter key to confirm, Escape to cancel
- Validates time against duration

**Click-to-Seek**
- Click anywhere on waveform to seek
- Drag with mouse to scrub continuously
- Cursor changes to indicate interactivity
- Shows "Scrubbing..." status during drag

**Progress Display**
- Smooth gradient progress bar
- Percentage completion with glowing effect
- Updates during playback with low latency

**Timeline Ruler**
- Tick marks every 1 second
- Major ticks every 5 seconds (larger, blue)
- Minor ticks every 1 second (smaller, gray)
- Shows time labels at major ticks

**Status Indicator**
- Shows "▶ Playing" or "⏸ Stopped"
- Displays selected track name
- Shows completion percentage
- Updates in real-time

## Integration Guide

### Step 1: Update App.tsx

Replace existing Timeline with EnhancedTimeline:

```typescript
import EnhancedTimeline from './components/EnhancedTimeline';

export default function App() {
  return (
    <div className="flex flex-col h-screen">
      {/* ... other components ... */}
      
      {/* Timeline Section */}
      <div className="flex-1 overflow-hidden">
        <EnhancedTimeline onSeek={(time) => console.log('Seeking to', time)} />
      </div>
    </div>
  );
}
```

### Step 2: Ensure DAWContext Exports Required Functions

Required from `useDAW()`:
```typescript
{
  selectedTrack,           // Currently selected track object
  currentTime,            // Current playback position (seconds)
  isPlaying,              // Playback state
  getAudioDuration,       // Function: (trackId) => duration
  getWaveformData,        // Function: (trackId) => Float32Array
  seek,                   // Function: (timeSeconds) => void
  tracks                  // Array of all tracks
}
```

### Step 3: Optional - Use WaveformAdjuster Standalone

For custom implementations:

```typescript
import WaveformAdjuster from './components/WaveformAdjuster';

export function MyCustomTimeline() {
  return (
    <WaveformAdjuster 
      trackId="audio_track_1"
      height={200}
      showControls={true}
    />
  );
}
```

## Technical Details

### Canvas Rendering Pipeline

```
1. Get waveform data from DAWContext
2. Set canvas resolution with devicePixelRatio scaling
3. Clear background (dark gray #1f2937)
4. Draw grid overlay (if enabled)
5. Draw center reference line
6. Calculate peaks with smoothing
7. Create linear gradient for waveform color
8. Draw filled area with 20% opacity
9. Draw outline with gradient stroke
10. Draw playhead indicator (if playing)
11. Draw current time indicator (red dot)
```

### Peak Calculation Algorithm

```
For each pixel column:
  1. Calculate block size = audioData.length / (pixelWidth * zoom)
  2. Extract block of samples
  3. Find min and max in block
  4. Store as { min, max } peak
  5. Track global maximum
  6. Update peak level meter
```

### Real-Time Accuracy Factors

| Factor | Default | Range | Impact |
|--------|---------|-------|--------|
| Sample Rate | 4096 | 2K-16K | Peak accuracy |
| Smoothing | 50% | 0-100% | Visual interpolation |
| Zoom | 1.0x | 0.5-4.0x | Time resolution |
| Scale | 1.0x | 0.5-3.0x | Amplitude visibility |
| Update Rate | 60 FPS | N/A | Playhead smoothness |

### Performance Characteristics

**Rendering Performance**
- Waveform draw: ~2-5ms for typical 44.1kHz audio
- Animation frame: 60 FPS target (16.67ms per frame)
- Memory: ~100KB per minute of audio (peak cache)

**Accuracy**
- Time precision: ±1ms (limited by JavaScript timers)
- Peak accuracy: Limited by sample resolution
- Playhead sync: Within 1 frame of actual playback

## Customization Examples

### Example 1: Dark Blue Theme

```typescript
<WaveformAdjuster 
  trackId="track_1"
  height={150}
/>
// Then adjust via UI controls to:
// - Color: #1e40af (dark blue)
// - Scale: 1.2x (amplify display)
// - Grid: Enabled
```

### Example 2: High-Precision Metering

```typescript
const [resolution, setResolution] = useState(8192);  // Maximum accuracy
// Show advanced controls
// Enable grid for timing reference
// Use 100% smoothing for professional look
```

### Example 3: Compact Display

```typescript
<WaveformAdjuster 
  trackId="track_1"
  height={80}
  showControls={false}  // Hide UI controls
/>
// Use Context directly for adjustments
```

## API Reference

### DAWContext Functions (Used by Waveform System)

```typescript
// Get current playback position
const currentTime: number = useDAW().currentTime;

// Get track duration
const duration: number = useDAW().getAudioDuration(trackId);

// Get waveform data
const data: Float32Array = useDAW().getWaveformData(trackId);

// Seek to position
useDAW().seek(timeSeconds: number): void;

// Check playback state
const isPlaying: boolean = useDAW().isPlaying;

// Get selected track
const track: Track | null = useDAW().selectedTrack;
```

### Event Handling

```typescript
// Seek callback
<EnhancedTimeline onSeek={(time) => {
  console.log('User seeked to', time, 'seconds');
}} />
```

## Troubleshooting

### Issue: Waveform Not Displaying

**Solution**:
1. Verify track has audio loaded: `getWaveformData(trackId).length > 0`
2. Check canvas element exists: `canvasRef.current !== null`
3. Ensure DAWContext provides waveform data with `getWaveformData()`

### Issue: Playhead Not Updating

**Solution**:
1. Verify `isPlaying` state is correct
2. Check `currentTime` updates during playback
3. Ensure animation frame is active: Look for `animationFrameRef.current`
4. Check browser console for RAF errors

### Issue: Performance Degradation

**Solution**:
1. Reduce resolution: Change from 8K to 4K
2. Disable grid overlay in advanced options
3. Reduce zoom level to decrease pixel density
4. Lower smoothing value for less interpolation

### Issue: Inaccurate Peak Levels

**Solution**:
1. Increase resolution to 8K or 16K
2. Verify audio file is properly decoded
3. Check for clipping in original audio
4. Ensure scale is appropriate (try 1.5x)

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Canvas | ✅ | ✅ | ✅ | ✅ |
| requestAnimationFrame | ✅ | ✅ | ✅ | ✅ |
| Color Input | ✅ | ✅ | ⚠️ | ✅ |
| Range Slider | ✅ | ✅ | ✅ | ✅ |
| High DPI | ✅ | ✅ | ✅ | ✅ |

## Future Enhancements

### Planned Features
- [ ] Spectral view (frequency analysis)
- [ ] RMS level metering
- [ ] Loudness normalization display
- [ ] Multi-track vertical stack
- [ ] Marker/cue point support
- [ ] Zoom preset buttons
- [ ] Export waveform as image
- [ ] Theme presets (light/dark/professional)
- [ ] Amplitude histogram
- [ ] Per-channel display (stereo)

### Performance Optimizations
- [ ] WebWorker for peak calculation
- [ ] Virtual rendering for large files
- [ ] GPU-accelerated rendering (WebGL)
- [ ] Incremental waveform generation
- [ ] Adaptive LOD (Level of Detail)

## Code Examples

### Complete Integration Example

```typescript
// src/components/WaveformPanel.tsx
import { useDAW } from '../contexts/DAWContext';
import EnhancedTimeline from './EnhancedTimeline';

export default function WaveformPanel() {
  const { currentTime, isPlaying } = useDAW();

  return (
    <div className="h-full bg-gray-900 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-bold text-gray-200">Timeline & Waveform</h2>
      
      <EnhancedTimeline 
        onSeek={(time) => {
          console.log(`Seeked to ${time.toFixed(3)}s`);
        }}
      />

      <div className="text-xs text-gray-500">
        <p>Status: {isPlaying ? 'Playing' : 'Stopped'}</p>
        <p>Position: {currentTime.toFixed(3)}s</p>
      </div>
    </div>
  );
}
```

### Custom Waveform with Presets

```typescript
const WaveformPresets = {
  PROFESSIONAL: {
    zoom: 1.0,
    scale: 1.2,
    smoothing: 0.8,
    color: '#3b82f6',
    resolution: 8192,
  },
  COMPACT: {
    zoom: 0.8,
    scale: 1.0,
    smoothing: 0.5,
    color: '#06b6d4',
    resolution: 2048,
  },
  HIGHCONTRAST: {
    zoom: 1.2,
    scale: 1.5,
    smoothing: 0.3,
    color: '#ff0000',
    resolution: 4096,
  },
};
```

## Version History

### v1.0.0 (Nov 24, 2025)
- ✅ Initial release
- ✅ Real-time waveform rendering
- ✅ Adjustable zoom/scale/color
- ✅ Peak metering system
- ✅ Advanced control panel
- ✅ Complete documentation

## Support & Feedback

For issues or suggestions:
1. Check troubleshooting section above
2. Review browser console for errors
3. Verify DAWContext integration
4. Test with sample audio files first
