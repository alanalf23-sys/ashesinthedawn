# Tooltip Integration Quick Reference

## Quick Start: Adding Tooltips to Components

### 1. Import Tooltip and Library

```typescript
import { Tooltip, TOOLTIP_LIBRARY } from './TooltipProvider';
```

### 2. Wrap Your Button or Control

```typescript
// Simple button
<Tooltip content={TOOLTIP_LIBRARY['play']}>
  <button onClick={togglePlay}>
    <Play className="w-4 h-4" />
  </button>
</Tooltip>

// With conditional className
<Tooltip content={TOOLTIP_LIBRARY['mute']}>
  <button 
    onClick={handleMute}
    className={`p-1.5 rounded ${isMuted ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
  >
    <Mute className="w-4 h-4" />
  </button>
</Tooltip>
```

### 3. Customize Tooltip Position (Optional)

```typescript
// Default is 'bottom', options: 'top', 'left', 'right'
<Tooltip content={TOOLTIP_LIBRARY['volume']} position="left">
  <input 
    type="range" 
    value={volume} 
    onChange={handleVolumeChange}
  />
</Tooltip>
```

## Current Status

| Component | Status | Controls | Date |
|-----------|--------|----------|------|
| TopBar | ✅ DONE | Play, Stop, Record, Loop, Undo, Redo, Metronome, Add Marker | 12/19 |
| Mixer | ⏳ TODO | Volume, Pan, Mute, Solo, Input Gain, Add Plugin | Next |
| WaveformAdjuster | ⏳ TODO | Zoom, Scale, Color, Grid, Resolution, Smoothing | Next |
| PluginRack | ⏳ TODO | Add Effect, Remove, Enable, Bypass, Parameters | Next |
| AutomationLane | ⏳ TODO | Record, Clear, Curve Mode, Envelope, LFO | Next |

## Available Tooltips

### Transport
- `play` - Start playback
- `stop` - Stop playback
- `record` - Start recording
- `loop` - Enable looping
- `undo` - Vert last action
- `redo` - Repeat last undo
- `metronome` - Click track
- `addMarker` - Create cue point

### Mixer
- `volume` - Volume fader
- `pan` - Pan control
- `mute` - Mute button
- `solo` - Solo button

### Effects
- `eq` - Parametric EQ
- `compression` - Compressor
- `reverb` - Reverb effect
- `delay` - Delay effect

### Tools
- `waveform-zoom` - Timeline zoom
- `waveform-scale` - Amplitude scale
- `seek` - Click to seek

### Settings
- `settings` - Preferences

## Adding New Tooltips

Add to `TOOLTIP_LIBRARY` in `src/components/TooltipProvider.tsx`:

```typescript
export const TOOLTIP_LIBRARY: Record<string, TooltipContent> = {
  // ... existing tooltips ...
  
  'my-new-control': {
    title: 'My Control',
    description: 'What this does',
    hotkey: 'Shortcut here',
    category: 'transport', // or 'mixer', 'effects', 'tools', 'settings'
    relatedFunctions: ['Related Function 1', 'Related Function 2'],
    performanceTip: 'CPU/performance info',
    examples: [
      'Code example 1',
      'Code example 2',
    ],
    documentation: 'https://link-to-docs',
  },
};
```

Then use it:

```typescript
<Tooltip content={TOOLTIP_LIBRARY['my-new-control']}>
  <button onClick={handleClick}>Control</button>
</Tooltip>
```

## Teaching Mode Integration

Tooltips automatically show teaching extras when teaching mode is enabled:

```typescript
import { useTeachingMode } from '../hooks/useTeachingMode';

function MyComponent() {
  const { teachingModeEnabled, toggleTeachingMode } = useTeachingMode();
  
  return (
    <button onClick={toggleTeachingMode}>
      Teaching: {teachingModeEnabled ? 'ON' : 'OFF'}
    </button>
  );
}
```

When teaching mode is ON:
- Tooltips show "Show Codette Teaching" button
- User can click to open Codette chat panel
- Learning progress is tracked automatically

## Tooltip Props Reference

```typescript
interface TooltipProps {
  content: TooltipContent; // Content object from TOOLTIP_LIBRARY
  children: React.ReactNode; // Button/control to wrap
  delay?: number; // ms before showing (default: 500)
  position?: 'top' | 'bottom' | 'left' | 'right'; // (default: 'bottom')
  maxWidth?: number; // pixels (default: 300)
  showCodetteTip?: boolean; // Show Codette button (default: true)
  onCodetteLinkClick?: (content: TooltipContent) => void; // Click handler
}
```

## TooltipContent Structure

```typescript
interface TooltipContent {
  title: string; // Control name
  description: string; // What it does
  hotkey: string; // Keyboard shortcut
  category: 'transport' | 'mixer' | 'effects' | 'automation' | 'tools' | 'settings';
  relatedFunctions: string[]; // What to learn next
  performanceTip: string; // CPU/optimization info
  examples: string[]; // Usage examples
  documentation?: string; // Link to full docs
}
```

## Common Integration Patterns

### Slider with Tooltip

```typescript
<Tooltip content={TOOLTIP_LIBRARY['volume']} position="left">
  <div className="flex items-center gap-2">
    <label className="text-xs">Volume</label>
    <input
      type="range"
      min="-60"
      max="12"
      value={volume}
      onChange={(e) => setVolume(parseFloat(e.target.value))}
    />
    <span className="text-xs text-gray-400">{volume}dB</span>
  </div>
</Tooltip>
```

### Toggle Button Group

```typescript
<div className="flex gap-1">
  <Tooltip content={TOOLTIP_LIBRARY['mute']}>
    <button 
      onClick={() => updateTrack(id, {muted: !track.muted})}
      className={track.muted ? 'bg-blue-600' : ''}
    >
      M
    </button>
  </Tooltip>
  
  <Tooltip content={TOOLTIP_LIBRARY['solo']}>
    <button 
      onClick={() => updateTrack(id, {soloed: !track.soloed})}
      className={track.soloed ? 'bg-yellow-600' : ''}
    >
      S
    </button>
  </Tooltip>
</div>
```

### Menu Item with Tooltip

```typescript
<Tooltip content={TOOLTIP_LIBRARY['eq']} position="right">
  <button
    onClick={() => addPluginToTrack(trackId, 'eq')}
    className="w-full px-3 py-2 hover:bg-gray-700"
  >
    <EQ className="w-4 h-4 inline mr-2" />
    Parametric EQ
  </button>
</Tooltip>
```

## Debugging Tooltips

### Tooltip not showing?

1. Check TOOLTIP_LIBRARY has the key:
   ```bash
   grep "'my-key':" src/components/TooltipProvider.tsx
   ```

2. Verify content object structure:
   - Has `title`, `description`, `hotkey`, `category`
   - `category` is valid: `'transport' | 'mixer' | 'effects' | 'tools' | 'settings'`

3. Check if TooltipContext provider is wrapped around component:
   ```typescript
   <TooltipProviderWrapper>
     {/* Your component here */}
   </TooltipProviderWrapper>
   ```

### Tooltip appears in wrong position?

- Use `position` prop to override (default is 'bottom')
- Check for CSS overflow; adjust max-width if needed
- Ensure button container has correct z-index

### Teaching features not showing?

1. Click teaching mode toggle button in TopBar
2. Check `teachingModeEnabled` state is true
3. Verify useTeachingMode hook is working:
   ```typescript
   const { teachingModeEnabled } = useTeachingMode();
   console.log('Teaching mode:', teachingModeEnabled);
   ```

## TypeScript Checking

```bash
# Verify your component has no TS errors
npm run typecheck

# Build to catch any issues
npm run build
```

## Performance Tips

- ✅ Use TOOLTIP_LIBRARY for all tooltips (static, no re-computation)
- ✅ Tooltips are lazy-loaded (only render when hovering)
- ✅ Teaching mode is global context (single state update affects all)
- ⚠️ Avoid creating new TooltipContent objects in render (extract to constants)
- ⚠️ Don't wrap frequently-updated elements (can cause performance issues)

## Next Component: Mixer

Expected time: 2-3 hours

Controls to update:
- [ ] Mute button
- [ ] Solo button  
- [ ] Arm button
- [ ] Volume slider
- [ ] Pan slider
- [ ] Input Gain slider
- [ ] Add Plugin button
- [ ] Remove Plugin button
- [ ] Meter display

File: `src/components/Mixer.tsx`

Key pattern:
```typescript
import { Tooltip, TOOLTIP_LIBRARY } from './TooltipProvider';

export default function Mixer() {
  // ... existing code ...
  
  return (
    <div className="mixer-panel">
      {/* Mute Button */}
      <Tooltip content={TOOLTIP_LIBRARY['mute']}>
        <button onClick={() => updateTrack(selectedTrack.id, {muted: !selectedTrack.muted})}>
          {selectedTrack?.muted ? 'MUTED' : 'ACTIVE'}
        </button>
      </Tooltip>
      
      {/* Volume Slider */}
      <Tooltip content={TOOLTIP_LIBRARY['volume']} position="left">
        <input 
          type="range" 
          value={selectedTrack?.volume || 0}
          onChange={(e) => updateTrack(selectedTrack.id, {volume: parseFloat(e.target.value)})}
        />
      </Tooltip>
      
      {/* ... other controls ... */}
    </div>
  );
}
```

Happy coding! 🎵
