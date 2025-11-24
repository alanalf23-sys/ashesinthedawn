# Quick Start: Detachable Mixer Tiles

## What Changed?

The mixer channel strips (each track) are now **detachable into floating windows**. This allows you to:
- Monitor specific tracks separately from the main mixer
- Arrange tracks across your screen for better ergonomics
- Maintain full control (mute, solo, level metering) while detached

## How to Use

### Detach a Track
1. **Hover** over any channel strip in the mixer
2. A **maximize button** (⤢) appears in the top-right corner
3. **Click** it to detach the strip into a floating window
4. The header now shows: `"Mixer (Live) • 1 floating"` to indicate detached tiles

### Use a Detached Tile
- **Drag:** Click and hold the title bar to move it anywhere on screen
- **Resize:** Drag the blue corner handle (bottom-right) to resize
- **Select:** Click the tile to select it in the main mixer
- **Control:** Mute (M), Solo (S), Delete (Del) buttons work the same
- **Meter:** Live level display updates in real-time with green/amber/red coloring

### Dock a Tile Back
1. **Click** the minimize button (⤣) in the title bar of the floating window
2. The tile returns to the main mixer strip

### Delete a Track
- Click **"Del"** on any tile (docked or floating)
- The track is removed from the project

## Key Features

✅ **Fully Functional** - All mixer controls work in both docked and floating modes
✅ **Real-Time Metering** - Level displays update continuously
✅ **Smooth Dragging** - Responds immediately to mouse movements
✅ **Free Resizing** - Adjust tile size to your needs (min 60×200px)
✅ **Visual Feedback** - Hover effects and cursor changes indicate interactivity
✅ **Selection Tracking** - Floating tiles respect the selected track state

## Tips & Tricks

- Resize the mixer width/height using the sliders in the header to adjust all docked tiles proportionally
- Floating tiles maintain their own independent size (not affected by sliders)
- The **Master strip** stays in the mixer and cannot be detached
- Detach multiple tiles to create your custom monitoring setup
- Use floating tiles to keep critical tracks (bass, kick, vocals) visible at all times

## Example Workflow

1. **Add several tracks** to your project
2. **Detach the vocal track** - keep it large and prominent on one side
3. **Detach the drums** - arrange on the other side
4. **Keep the bass docked** - alongside the master in the main mixer
5. **Monitor all in real-time** - level meters update as you work

---

For technical details, see `DETACHABLE_MIXER_IMPLEMENTATION.md`
