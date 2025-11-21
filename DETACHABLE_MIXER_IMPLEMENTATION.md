# Detachable Mixer Tiles - Implementation Guide

## Overview
The mixer now supports **detachable, dockable channel strips**. Users can:
- ✅ Hover over docked tiles to reveal a maximize button
- ✅ Detach tiles into floating windows with full dragging/resizing
- ✅ Dock floating tiles back to the mixer
- ✅ Maintain full functionality in both docked and floating states
- ✅ Live level metering in both modes

## Architecture

### Components

#### 1. **MixerTile.tsx** (New)
Reusable component that renders a single channel strip with dual behavior:

**Props:**
```typescript
interface MixerTileProps {
  track: Track;
  isSelected: boolean;
  onSelect: (trackId: string) => void;
  onDelete: (trackId: string) => void;
  onUpdate: (trackId: string, updates: Partial<Track>) => void;
  levels: Record<string, number>;
  stripWidth?: number;
  stripHeight?: number;
  isDetached?: boolean;           // true = floating window mode
  onDetach?: () => void;          // callback when user clicks maximize
  onDock?: () => void;            // callback when user clicks minimize
}
```

**Behaviors:**

**Docked Mode** (`isDetached={false}`):
- Renders inline in the mixer horizontal strip
- Shows hover overlay with maximize button (⤢)
- Resizable via parent Mixer component
- Click to select, mute/solo/delete controls active
- Meter polling updates in real-time

**Detached Mode** (`isDetached={true}`):
- Renders as floating absolute-positioned window
- Draggable by title bar
- Resizable from bottom-right corner with cursor feedback
- Shows minimize button (⤣) to dock back
- Independent position/size state
- Full meter metering continues

#### 2. **Mixer.tsx** (Updated)
Main mixer component now manages:

**New State:**
```typescript
const [detachedTiles, setDetachedTiles] = useState<DetachedTileState[]>([]);

interface DetachedTileState {
  trackId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}
```

**Render Layout:**
```
<Mixer>
  ├── Header (controls, width/height sliders)
  ├── Main Container
  │   ├── Master Strip (always docked, non-detachable)
  │   └── Track Tiles (docked, detachable on hover)
  └── Floating Layer (fixed positioning)
      └── Detached Tiles (draggable, resizable)
```

**Handlers:**
- `handleDetachTile(trackId)` - Creates floating tile, adds to detachedTiles array
- `handleDockTile(trackId)` - Removes from detachedTiles, returns to docked strip

## User Interactions

### Detaching a Tile
1. Hover over a docked channel strip → maximize button (⤢) appears
2. Click maximize → tile detaches into floating window
3. Title bar shows track name and minimize button
4. Display updates: "Mixer (Live) • 2 floating" in header

### Using Detached Tile
- **Drag:** Click/hold title bar, drag anywhere
- **Resize:** Click/drag bottom-right corner handle
- **Select:** Click anywhere on tile to select in main UI
- **Control:** Mute, Solo, Delete buttons work normally
- **Meter:** Live RMS levels update in real-time

### Docking a Tile
1. Click minimize button (⤣) in title bar
2. Tile disappears from screen, returns to docked position
3. Header count updates

### Deleting a Detached Tile
1. Click "Del" button on any tile (docked or detached)
2. Track deleted from project
3. If detached, tile auto-docks first
4. All windows update state

## Technical Details

### Dragging Logic (Detached Mode)
- OnMouseDown: Records title bar click offset
- OnMouseMove: Updates position relative to mouse delta
- OnMouseUp: Stops dragging
- Z-index = 1000 while dragging for visibility

### Resizing Logic (Detached Mode)
- OnMouseDown (corner handle): Records initial size and mouse position
- OnMouseMove: Calculates delta, updates size (min 60px wide, 200px tall)
- OnMouseUp: Stops resizing
- Visual feedback: Cursor changes to `nwse-resize`

### Level Metering
- Shared `levels` state object in Mixer component
- Updated every frame via `requestAnimationFrame`
- Passed to all tiles (docked and detached)
- Color coding: Red (-3dB), Amber (-8dB), Green (-20dB), Dark Green (<-20dB)

### Fixed Positioning
```tsx
// Detached tiles rendered in fixed container
<div className="fixed inset-0 pointer-events-none">
  {detachedTiles.map(tile => (
    <div className="pointer-events-auto" style={{ position: 'fixed', ... }}>
      <MixerTile isDetached={true} ... />
    </div>
  ))}
</div>
```

This allows floating tiles to overlay the entire application.

## Styling Notes

**Docked Tiles:**
- Border: Thin gray (non-selected) or bright blue (selected)
- Background: Dark gray (rgb(17, 24, 39))
- Hover effect: Maximize button reveals with opacity transition

**Floating Tiles:**
- Border: 2px solid (respects selection state)
- Background: Dark gray with shadow (box-shadow for depth)
- Title bar: Gradient from gray, draggable cursor
- Corner handle: Blue gradient glow on hover

**Master Strip:**
- Always docked, non-detachable
- Border: Gold (rgb(202, 138, 4))
- Background: Dark brown (rgb(30, 24, 15))
- Displays aggregated RMS of all audible tracks

## Performance Considerations

1. **DOM Optimization:**
   - Detached tiles only render when added to `detachedTiles` array
   - Removing from array immediately unmounts component

2. **Level Polling:**
   - Single `requestAnimationFrame` loop in Mixer
   - Levels distributed to all tiles (docked and detached)
   - No duplicate polling

3. **Event Handling:**
   - Dragging/resizing events scoped to active tile only
   - Document-level listeners added/removed on demand

## Future Enhancements

- [ ] Save/restore floating tile positions between sessions
- [ ] Multi-touch support for touch devices
- [ ] Snap-to-grid alignment for detached tiles
- [ ] Tile grouping/windowing (multiple tiles per window)
- [ ] Tile presets (standard widths/heights)
- [ ] Keyboard shortcuts for dock/detach

## Files Modified

1. **src/components/MixerTile.tsx** - NEW
   - 300+ lines
   - Dual-mode tile component (docked/floating)

2. **src/components/Mixer.tsx** - UPDATED
   - Refactored from 350 lines to 270 lines
   - Delegated tile rendering to MixerTile component
   - Added detaching/docking state management
   - Simplified master strip rendering

3. **src/components/AudioMeter.tsx** - NO CHANGES
   - Existing spectrum meter unaffected
   - Can be used alongside detached tiles

## Integration Notes

All existing functionality preserved:
- ✅ Track creation/deletion
- ✅ Mute/solo/arm controls
- ✅ Real-time level metering
- ✅ Track selection and properties
- ✅ Master output monitoring
- ✅ Width/height slider controls
- ✅ Audio playback integration

**Status:** Ready for production use
