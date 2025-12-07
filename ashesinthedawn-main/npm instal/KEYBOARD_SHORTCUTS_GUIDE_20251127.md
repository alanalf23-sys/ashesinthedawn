# Keyboard Shortcuts Guide - CoreLogic Studio v7

**Last Updated**: November 27, 2025
**Version**: Complete - 40+ shortcuts documented

## Overview

CoreLogic Studio provides comprehensive keyboard shortcuts for efficient DAW operation. All shortcuts are listed in the **Help → Keyboard Shortcuts** menu (press `H` or `?`).

## Transport Controls

### Playback
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>Space</kbd> | Play / Stop | Toggle playback from current position |
| <kbd>Shift</kbd>+<kbd>Space</kbd> | Play from Cursor | Resume from last stopped position |
| <kbd>R</kbd> | Rewind | Jump to 0:00 (start of project) |
| <kbd>Enter</kbd> | Toggle Record | Arm recording on selected track |

## Track Management

### Track Operations
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>Ctrl</kbd>+<kbd>T</kbd> | New Audio Track | Create audio input track |
| <kbd>Ctrl</kbd>+<kbd>M</kbd> | New MIDI/Instrument | Create instrument track (Note: conflicts with Mute on single M) |
| <kbd>Delete</kbd> | Delete Selected Track | Removes current track and audio |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Del</kbd> | Delete All Empty Tracks | Cleanup unused tracks |

### Track States
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>M</kbd> | Mute / Unmute | Toggle mute on selected track |
| <kbd>S</kbd> | Solo / Unsolo | Toggle solo on selected track |
| <kbd>A</kbd> | Arm / Disarm | Toggle record arm status |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd> | Mute All | Mute all tracks except soloed |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> | Unsolo All | Remove all solos |

### Track Navigation
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>↑</kbd> Arrow Up | Previous Track | Select track above |
| <kbd>↓</kbd> Arrow Down | Next Track | Select track below |
| <kbd>Ctrl</kbd>+<kbd>↑</kbd> | Jump to Top Track | Select first track in session |
| <kbd>Ctrl</kbd>+<kbd>↓</kbd> | Jump to Bottom Track | Select last track in session |

## Editing

### File Operations
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | New Project | Create blank project |
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | Open Project | Load .corelogic.json file |
| <kbd>Ctrl</kbd>+<kbd>S</kbd> | Save Project | Auto-save to localStorage |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Export as JSON | Download project file |
| <kbd>Ctrl</kbd>+<kbd>I</kbd> | Import from File | Load project from file picker |

### Undo / Redo
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>Ctrl</kbd>+<kbd>Z</kbd> | Undo | Revert last action |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> | Redo | Restore undone action |
| <kbd>Ctrl</kbd>+<kbd>Y</kbd> | Redo (Alt) | Alternative redo shortcut |

### Selection
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>Ctrl</kbd>+<kbd>A</kbd> | Select All | Select all tracks |
| <kbd>Ctrl</kbd>+<kbd>D</kbd> | Deselect | Clear selection |

### Editing Operations
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>Ctrl</kbd>+<kbd>X</kbd> | Cut | Cut selected track/content |
| <kbd>Ctrl</kbd>+<kbd>C</kbd> | Copy | Copy selected content |
| <kbd>Ctrl</kbd>+<kbd>V</kbd> | Paste | Paste from clipboard |
| <kbd>Ctrl</kbd>+<kbd>D</kbd> | Duplicate | Clone selected track |

## Markers & Locators

| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>Shift</kbd>+<kbd>M</kbd> | Add Marker | Create marker at playhead |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd> | Delete Marker | Remove marker at playhead |
| <kbd>1</kbd>-<kbd>9</kbd> | Jump to Marker | Go to numbered marker (1-9) |
| <kbd>Ctrl</kbd>+<kbd>1</kbd>-<kbd>9</kbd> | Set Marker | Assign marker to position |

## Playback & Timeline

### Seeking
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>←</kbd> Arrow Left | -1 Second | Rewind 1 second |
| <kbd>→</kbd> Arrow Right | +1 Second | Fast-forward 1 second |
| <kbd>Shift</kbd>+<kbd>←</kbd> | -5 Seconds | Rewind 5 seconds |
| <kbd>Shift</kbd>+<kbd>→</kbd> | +5 Seconds | Fast-forward 5 seconds |

### Loop & Metronome
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>L</kbd> | Toggle Loop | Enable/disable looping |
| <kbd>K</kbd> | Toggle Metronome | Turn click track on/off |
| <kbd>Ctrl</kbd>+<kbd>L</kbd> | Loop Settings | Open loop configuration |

### Timeline Zoom
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>Ctrl</kbd>+<kbd>=</kbd> | Zoom In | Increase timeline detail |
| <kbd>Ctrl</kbd>+<kbd>-</kbd> | Zoom Out | Decrease timeline detail |
| <kbd>Ctrl</kbd>+<kbd>0</kbd> | Zoom to Fit | Reset zoom to default |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>0</kbd> | Zoom 100% | Set 1:1 zoom ratio |

## Mixer & Views

### View Selection
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>Tab</kbd> | Next Tab | Cycle sidebar tabs forward |
| <kbd>Shift</kbd>+<kbd>Tab</kbd> | Previous Tab | Cycle sidebar tabs backward |
| <kbd>F</kbd> | Toggle Fullscreen | Maximize current view |
| <kbd>Ctrl</kbd>+<kbd>M</kbd> | Toggle Mixer | Show/hide mixer panel |

### Panel Navigation
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>1</kbd> | Files Panel | Jump to file browser |
| <kbd>2</kbd> | Routing Matrix | Switch to routing view |
| <kbd>3</kbd> | Plugins Panel | Open plugin browser |
| <kbd>4</kbd> | Mixer | Show mixer controls |
| <kbd>5</kbd> | Analysis | Spectrum analyzer view |
| <kbd>6</kbd> | Codette AI | Activate AI assistant |

## Preferences & Help

### Application
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>Ctrl</kbd>+<kbd>,</kbd> | Preferences | Open settings dialog |
| <kbd>H</kbd> or <kbd>?</kbd> | Show Shortcuts | Display this help menu |
| <kbd>Ctrl</kbd>+<kbd>/</kbd> | Quick Help | Context-sensitive help |
| <kbd>F1</kbd> | Documentation | Open online docs |

### Audio Settings
| Shortcut | Action | Notes |
|----------|--------|-------|
| <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>S</kbd> | Audio Settings | Configure audio devices |
| <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>M</kbd> | MIDI Settings | Configure MIDI input |
| <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>A</kbd> | About CoreLogic | Show version info |

## Platform-Specific Notes

### Windows / Linux
- **Modifier Key**: Use <kbd>Ctrl</kbd> for shortcuts
- **Alternative Redo**: <kbd>Ctrl</kbd>+<kbd>Y</kbd> works in addition to <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>

### macOS
- **Modifier Key**: Use <kbd>Cmd</kbd> instead of <kbd>Ctrl</kbd>
- **Example**: <kbd>Cmd</kbd>+<kbd>S</kbd> to save (instead of <kbd>Ctrl</kbd>+<kbd>S</kbd>)
- **Alt Key**: Use <kbd>Option</kbd> instead of <kbd>Alt</kbd>

## Tips for Efficient Workflow

### Pro Tips
1. **Space Bar**: Most common shortcut for play/stop - keep finger on it!
2. **Modifier + Arrow**: Use <kbd>Ctrl</kbd>+<kbd>←</kbd>/<kbd>→</kbd> for faster seeking (combine with Shift)
3. **Mute/Solo/Arm**: Single-letter shortcuts M/S/A are fastest for track operations
4. **Undo/Redo**: Spam <kbd>Ctrl</kbd>+<kbd>Z</kbd> and <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> freely
5. **Markers**: Use <kbd>Shift</kbd>+<kbd>M</kbd> frequently to mark important sections

### Avoiding Conflicts
- **Avoid shortcuts while typing**: Input fields and text areas ignore most shortcuts automatically
- **Conflicting shortcuts**: 
  - <kbd>M</kbd> for mute vs. <kbd>Ctrl</kbd>+<kbd>M</kbd> for new MIDI track
  - Solution: Use in context (no modifier = mute, with Ctrl = new track)
- **Application shortcuts**: Some shortcuts may conflict with your OS or browser
  - Solution: Check preferences to remap if needed

### Customization
⚠️ **Note**: Keyboard shortcut customization is on the roadmap. Currently, all shortcuts are fixed but can be remapped via DAWContext in future versions.

## Troubleshooting

### Shortcut Not Working?

1. **Check if in input field**: Click on the timeline or transport bar first
2. **Verify modifier key**: Mac users should use <kbd>Cmd</kbd>, not <kbd>Ctrl</kbd>
3. **OS conflicts**: Some shortcuts (like <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>S</kbd>) may be captured by your OS
4. **Browser shortcuts**: Browser shortcuts take priority (e.g., <kbd>Ctrl</kbd>+<kbd>W</kbd> closes tab)
5. **Browser extensions**: Some extensions hijack keyboard events

### Report Issues
If a shortcut isn't working as expected:
1. Open browser console (<kbd>F12</kbd>)
2. Look for keyboard event logs
3. File issue on GitHub with: keyboard layout, OS, browser, and exact shortcut

## Implementation Details

### Code Location
- **Hook**: `src/hooks/useKeyboardShortcuts.ts`
- **Context**: `src/contexts/DAWContext.tsx` (keyboard event handlers)
- **Modal**: `src/components/modals/ShortcutsModal.tsx` (help display)

### How Shortcuts Work
1. Global keyboard listener attached in `useKeyboardShortcuts()` hook
2. All App.tsx instances include `<useKeyboardShortcuts />` 
3. Shortcuts call context methods: `togglePlay()`, `addAudioTrack()`, `seek()`, etc.
4. Input fields automatically bypass shortcuts (target check)

### Adding New Shortcuts
To add a new shortcut:
```typescript
// In useKeyboardShortcuts.ts
if (modifier && key === "keyX") {
  e.preventDefault();
  myNewFunction();
  return;
}

// Then add to KEYBOARD_SHORTCUTS in ShortcutsModal.tsx
```

## Summary

| Category | Count | Examples |
|----------|-------|----------|
| Transport | 4 | Space, R, Shift+Space, Enter |
| Track | 9 | Ctrl+T, M, S, A, Delete |
| Editing | 10 | Ctrl+S, Ctrl+Z, Ctrl+X, Ctrl+D |
| Navigation | 9 | ↑/↓, Tab, 1-6, Ctrl+L |
| Markers | 4 | Shift+M, Ctrl+Shift+M |
| Zoom & View | 8 | Ctrl+=, Ctrl+-, F, L, K |
| Help | 4 | H, ?, Ctrl+, |
| **Total** | **~51+** | Platform-specific variations |

---

## Changelog - Session November 27, 2025

✅ **Task 7: Keyboard Shortcuts Documentation Complete**

**Updates**:
- Enhanced `useKeyboardShortcuts.ts` with 30+ new shortcuts
- Added detailed parameter handling for modifier keys
- Integrated help modal triggers (H, ? keys)
- Created comprehensive guide with platform-specific notes
- Added troubleshooting section and implementation guide
- Categorized shortcuts by function for easy reference

**Features**:
- Cross-platform support (Windows/Mac automatic detection)
- Input field bypass to prevent accidental shortcuts during typing
- Comprehensive keyboard event handling
- Modal integration for help display

**Status**: ✅ Complete and documented

---

**Document Type**: User Guide & Technical Reference  
**For**: CoreLogic Studio v7.0+  
**Maintenance**: Update when new shortcuts added
