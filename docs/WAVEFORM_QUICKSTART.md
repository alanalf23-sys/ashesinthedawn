# Waveform System - Quick Start Implementation Guide

## 🚀 5-Minute Setup

### Step 1: Verify Files Exist
```bash
# Check that both components exist
ls src/components/WaveformAdjuster.tsx
ls src/components/EnhancedTimeline.tsx
```

### Step 2: Update App.tsx

Replace your current Timeline import with EnhancedTimeline:

```typescript
// BEFORE
import Timeline from './components/Timeline';

// AFTER
import EnhancedTimeline from './components/EnhancedTimeline';

export default function App() {
  return (
    <div className="flex flex-col h-screen">
      {/* TopBar, TrackList, etc. */}
      
      {/* Replace old Timeline */}
      <div className="flex-1 overflow-hidden p-4">
        <EnhancedTimeline />
      </div>
      
      {/* Mixer and other components */}
    </div>
  );
}
```

### Step 3: Check Dependencies

Ensure you have Lucide React (for icons):

```bash
npm list lucide-react
# If not installed:
npm install lucide-react
```

### Step 4: Test the Build

```bash
npm run typecheck    # Should show 0 errors
npm run dev          # Start dev server
```

## 📋 Feature Checklist

- [ ] Waveform displays in timeline
- [ ] Click on waveform to seek
- [ ] Zoom buttons work (0.5x to 4.0x)
- [ ] Scale buttons work (0.5x to 3.0x)
- [ ] Color picker updates waveform color
- [ ] Peak meter shows current level
- [ ] Advanced controls expand/collapse
- [ ] Grid toggle works
- [ ] Playhead animates during playback
- [ ] Time display shows milliseconds

## 🔍 Testing Scenarios

### Test 1: Basic Waveform Display
```
1. Load an audio track
2. Select the track
3. Timeline should show waveform
4. Blue waveform should be visible
```

### Test 2: Real-Time Playback
```
1. Click play button
2. Waveform playhead should move
3. Time display should update
4. Playhead should be green line
```

### Test 3: Seek Functionality
```
1. Click at 50% position on waveform
2. Playhead should move to that position
3. Time display should update
4. Audio should resume from that point
```

### Test 4: Zoom & Scale
```
1. Click zoom + button
2. Waveform should expand horizontally
3. Click scale + button
4. Waveform should expand vertically
5. Verify peaks are visible
```

### Test 5: Color Customization
```
1. Click color input box
2. Select different color
3. Waveform should change color immediately
4. Gradient should update
```

### Test 6: Advanced Options
```
1. Click chevron icon to expand
2. Grid toggle - should show/hide grid
3. Resolution dropdown - should update accuracy
4. Smoothing slider - should change waveform shape
5. Info section shows duration and samples
```

## 🐛 Common Issues & Fixes

### Issue: "selectedTrack is undefined"
**Fix**: Make sure a track is selected before rendering timeline
```typescript
// In App.tsx, show only if track selected
{selectedTrack && <EnhancedTimeline />}
```

### Issue: Waveform appears blank
**Fix**: Verify audio file loaded successfully
```typescript
// In DAWContext, check:
const waveformData = getWaveformData(trackId);
console.log('Waveform length:', waveformData.length); // Should be > 0
```

### Issue: Colors not appearing
**Fix**: Ensure Tailwind CSS is properly configured
```bash
npm run build    # Check for CSS errors
```

### Issue: Playhead not updating
**Fix**: Verify isPlaying state is working
```typescript
// Console log in component
console.log('Playing:', isPlaying, 'Time:', currentTime);
```

## 📊 Component Data Flow

```
DAWContext
    ↓
useDAW() hook
    ↓
EnhancedTimeline
    ├── Uses: selectedTrack, currentTime, isPlaying
    ├── Calls: seek(), getAudioDuration()
    └── Renders: WaveformAdjuster
        ├── Uses: trackId, getWaveformData()
        ├── Renders: Canvas (waveform)
        └── Renders: Controls (zoom, scale, color, etc.)
```

## 🎨 UI Customization

### Change Default Colors
In `WaveformAdjuster.tsx`, update line with color:
```typescript
const [waveformColor, setWaveformColor] = useState("#3b82f6");  // Change here
```

Available colors (Tailwind):
- `#3b82f6` - Blue (default)
- `#10b981` - Green
- `#f59e0b` - Amber
- `#ef4444` - Red
- `#8b5cf6` - Purple

### Change Canvas Height
```typescript
<EnhancedTimeline />  {/* Default 150px waveform */}

// Or customize:
<WaveformAdjuster trackId="track_1" height={200} />
```

### Hide Controls
```typescript
<WaveformAdjuster trackId="track_1" showControls={false} />
```

## ⚡ Performance Tips

### For Large Audio Files (>10 minutes)
```
1. Set resolution to 2048 (not 8192)
2. Keep zoom at 1.0 or below
3. Use smoothing 0.5 or higher
4. Disable grid overlay
```

### For Real-Time Metering
```
1. Set resolution to 4096 (balance)
2. Enable peak meter
3. Keep all controls visible
4. Update smoothing to 0.3
```

### For Fast Scrubbing
```
1. Use zoom 1.0-1.5 (not too zoomed)
2. Set smoothing to 0.5
3. Resolution 4096 is fine
4. Keep grid hidden
```

## 📚 Component Props Reference

### WaveformAdjuster

```typescript
interface WaveformAdjusterProps {
  trackId: string;           // Required: Which track to display
  height?: number;           // Optional: Canvas height in pixels (default: 120)
  showControls?: boolean;    // Optional: Show UI controls (default: true)
}

// Usage:
<WaveformAdjuster trackId="audio_1" height={150} showControls={true} />
```

### EnhancedTimeline

```typescript
interface TimelineProps {
  onSeek?: (timeSeconds: number) => void;  // Optional: Callback when user seeks
}

// Usage:
<EnhancedTimeline onSeek={(time) => console.log('Seeked to', time)} />
```

## 🔧 Advanced Configuration

### Via State Management

Create a configuration context if you need global waveform settings:

```typescript
// In DAWContext or new WaveformContext
const defaultWaveformConfig = {
  zoom: 1.0,
  scale: 1.0,
  color: '#3b82f6',
  showGrid: true,
  resolution: 4096,
  smoothing: 0.5,
};
```

### Via Props

Pass configuration down component tree:

```typescript
export function WaveformPanel({ config }) {
  return (
    <WaveformAdjuster
      trackId="track_1"
      height={config.height}
      showControls={config.showControls}
    />
  );
}
```

## 🧪 Unit Testing Examples

```typescript
// __tests__/WaveformAdjuster.test.tsx
import { render, screen } from '@testing-library/react';
import WaveformAdjuster from '../WaveformAdjuster';

describe('WaveformAdjuster', () => {
  it('renders canvas element', () => {
    render(<WaveformAdjuster trackId="test_track" />);
    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toBeInTheDocument();
  });

  it('shows controls by default', () => {
    render(<WaveformAdjuster trackId="test_track" showControls={true} />);
    expect(screen.getByText(/Zoom:/i)).toBeInTheDocument();
  });

  it('hides controls when showControls is false', () => {
    render(<WaveformAdjuster trackId="test_track" showControls={false} />);
    expect(screen.queryByText(/Zoom:/i)).not.toBeInTheDocument();
  });
});
```

## 📱 Responsive Design

The waveform system is responsive:

```
Desktop (>1024px):  Full controls visible
Tablet (768-1024px): Compact controls, smaller icons
Mobile (<768px):    Stacked layout, touch-friendly
```

No additional CSS needed - Tailwind handles it.

## 🚨 Error Recovery

If something breaks:

```bash
# 1. Clear browser cache
npm run dev -- --force

# 2. Rebuild TypeScript
npm run typecheck

# 3. Check for console errors
# Open DevTools → Console tab

# 4. Verify track is selected
# Check DAWContext selectedTrack is not null

# 5. Reset to defaults
# Refresh browser page
```

## 🎯 Next Steps

1. ✅ Integration in App.tsx (5 min)
2. ✅ Test basic playback (2 min)
3. ✅ Verify all controls work (3 min)
4. ✅ Customize colors if needed (2 min)
5. ✅ Performance tuning if large files (5 min)

**Total Setup Time**: ~20 minutes

## 📞 Support Resources

- **Documentation**: `WAVEFORM_SYSTEM_DOCUMENTATION.md`
- **Component Code**: `src/components/WaveformAdjuster.tsx`
- **Component Code**: `src/components/EnhancedTimeline.tsx`
- **DAW Context**: `src/contexts/DAWContext.tsx`
- **Type Definitions**: `src/types/index.ts`

---

**Status**: Ready for production use ✅
**Last Updated**: November 24, 2025
**Version**: 1.0.0
