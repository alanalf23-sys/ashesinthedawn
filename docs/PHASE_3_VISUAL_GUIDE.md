# Phase 3 Features - Visual Quick Guide

## 📍 MARKERS: Navigate Your Timeline

### What It Does

Jump between different sections of your project instantly.

### Visual Layout

```
Timeline:
┌─────────────────────────────────────────────────────────┐
│ 🎵 Verse 1  🎵 Chorus  🎵 Verse 2  🎵 Bridge  🎵 Outro │
│ 0s          15s        30s         45s        60s      │
└─────────────────────────────────────────────────────────┘
     ↑ Click marker to jump here instantly
```

### User Interface

```
┌─ Markers ──────────────────────────────┐
│                                        │
│ [Input: "Marker name..."] [Add]       │
│                                        │
│ • Verse 1         0.00s  🔓 ✕          │
│ • Chorus          15.00s 🔓 ✕          │
│ • Bridge          45.00s 🔓 ✕          │
│                                        │
│ Pro tip: Press M to add marker         │
│ at current playhead position           │
└────────────────────────────────────────┘
```

### Workflow Example

```
Step 1: Name your marker
   → Type: "Verse 1"

Step 2: Click Add (or press M)
   → Marker created at current time

Step 3: Navigate
   → Click any marker to jump to it

Step 4: Lock important markers
   → Click lock icon to prevent deletion
```

### Keyboard

```
M = Add marker at current position
Click marker = Jump to that time
```

---

## 🔄 LOOP REGIONS: Repeat Sections

### What It Does

Repeat a specific section of your project. Great for recording multiple takes or practicing.

### Visual Layout

```
Timeline:
┌──────────────────────────────────────────────────────┐
│ ▶───────────────────────────────────────────────────│
│ Start→ ┌───────── Loop Region ───────┐ ←End       │
│ 10s    │ (repeats this section)      │ 20s       │
│        └───────────────────────────────┘           │
└──────────────────────────────────────────────────────┘
```

### User Interface

```
┌─ Loop ─────────────────────────────────────┐
│                                            │
│ ☑ Loop: 10.00s - 20.00s (10.00s duration) │
│                                            │
│ [Set Start] [Set End]  [Clear]            │
│                                            │
│ Start: 10.00s                             │
│ End:   20.00s                             │
│ Duration: 10.00s                          │
│                                            │
│ Pro tip: Press L to toggle loop on/off    │
└────────────────────────────────────────────┘
```

### Workflow Example

```
Step 1: Position playhead at start point
   → Play to 10 seconds

Step 2: Click "Set Start"
   → Loop start marked

Step 3: Position playhead at end point
   → Play to 20 seconds

Step 4: Click "Set End"
   → Loop region defined

Step 5: Enable loop
   → Check enabled box

Step 6: Play
   → Repeats 10-20 second section
```

### Keyboard

```
L = Toggle loop on/off
Click markers = Set start/end positions
```

---

## 🎵 METRONOME: Click Track

### What It Does

Professional click track for keeping time while recording or practicing.

### Sound Options

```
┌──────────────────────────────────┐
│ Beat Sound Selection             │
├──────────────────────────────────┤
│ • CLICK    [crisp, precise]      │
│ • COWBELL  [warm, musical]       │
│ • WOODBLOCK [natural, organic]   │
└──────────────────────────────────┘
```

### User Interface

```
┌─ Metronome ────────────────────────┐
│                                    │
│ ☑ Enabled                          │
│                                    │
│ Volume: ▁▂▃▄▅▆ 50%                │
│         └─ Drag to adjust         │
│                                    │
│ Beat: [Click] [Cowbell] [Wood]     │
│        (selected) (option) (option)│
│                                    │
│ ☑ Accent first beat                │
│                                    │
│ Pro tip: Press K to toggle metro   │
└────────────────────────────────────┘
```

### Workflow Example

```
Step 1: Enable metronome
   → Check "Enabled" box

Step 2: Choose beat sound
   → Click your preferred sound

Step 3: Set volume
   → Drag volume slider to comfortable level
   → Typical: 30-50% while recording

Step 4: Play
   → Metronome plays at project BPM

Step 5: Start recording (Press ENTER)
   → Record with click reference
```

### Keyboard

```
K = Toggle metronome on/off
Volume slider = Adjust audibility
```

---

## ⌨️ KEYBOARD SHORTCUTS: Pro Workflow

### Quick Reference Grid

```
┌───────────────────────────────────────────────────┐
│             KEYBOARD SHORTCUTS GRID                │
├───────────────────────────────────────────────────┤
│                                                   │
│  PLAYBACK                 NAVIGATION              │
│  ├─ SPACE: Play/Pause     ├─ ← Arrow: -1 sec     │
│  └─ ENTER: Record         ├─ → Arrow: +1 sec     │
│                           ├─ SHIFT+←: -5 sec     │
│  MARKERS & LOOPS          └─ SHIFT+→: +5 sec     │
│  ├─ M: Add Marker                                │
│  ├─ L: Toggle Loop        EDITING                │
│  └─ K: Toggle Metro       ├─ CTRL+Z: Undo        │
│                           └─ CTRL+SHIFT+Z: Redo  │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Full Shortcut Map

| Key                  | Function     | Use Case                 |
| -------------------- | ------------ | ------------------------ |
| **SPACE**            | Play/Pause   | Start/stop playback      |
| **ENTER**            | Record       | Toggle recording on/off  |
| **M**                | Add Marker   | Mark sections instantly  |
| **L**                | Toggle Loop  | Enable/disable looping   |
| **K**                | Toggle Metro | Turn click on/off        |
| **←**                | Seek -1s     | Fine position adjustment |
| **→**                | Seek +1s     | Fine position adjustment |
| **SHIFT+←**          | Seek -5s     | Quick backward skip      |
| **SHIFT+→**          | Seek +5s     | Quick forward skip       |
| **CTRL/CMD+Z**       | Undo         | Revert last action       |
| **CTRL/CMD+SHIFT+Z** | Redo         | Redo last undo           |

### Real-Time Workflow

```
START OF SESSION:
1. SPACE          → Play project
2. M M M          → Add markers: Verse, Chorus, Bridge
3. L              → Set loop on chorus
4. K              → Enable metronome
5. ENTER          → Start recording

DURING RECORDING:
- SPACE           → Pause/resume
- L               → Loop on/off
- K               → Toggle metro volume
- SHIFT+←/→       → Skip to next section

AFTER RECORDING:
- CTRL+Z          → Fix mistakes with undo
- M               → Mark new sections
- ENTER           → Record new pass
```

---

## 🎯 COMPLETE WORKFLOW EXAMPLE

### Scenario: Record Vocals Over Beat

```
SETUP PHASE:
┌─────────────────────────────────────────┐
│ 1. Load backing track                   │
│ 2. Set metronome:                       │
│    • Enable (K key)                     │
│    • Set volume to 40%                  │
│    • Choose "cowbell" sound             │
│ 3. Add markers:                         │
│    • M → "Intro" (0s)                   │
│    • M → "Verse 1" (8s)                 │
│    • M → "Chorus" (16s)                 │
│ 4. Create loop for verse:               │
│    • L → Set start at 8s                │
│    • L → Set end at 16s                 │
│ 5. Ready to record!                     │
└─────────────────────────────────────────┘

RECORDING PHASE:
┌─────────────────────────────────────────┐
│ 1. Position at intro (click "Intro")    │
│ 2. SPACE → Play/preview                 │
│ 3. SPACE → Stop                         │
│ 4. ENTER → Start recording              │
│ 5. SPACE → Stop recording               │
│ 6. ENTER → Toggle off record mode       │
│ 7. M → "Take 1" (mark good spot)        │
│                                         │
│ TAKE 2: (Practice with loop)            │
│ 1. Click "Verse 1" marker → Jump there  │
│ 2. L → Enable loop (loops just verse)   │
│ 3. SPACE → Play with loop               │
│ 4. SPACE → Stop                         │
│ 5. ENTER → Record take 2                │
│ 6. SPACE → Stop                         │
│                                         │
│ EDITING: (Use undo if needed)           │
│ CTRL+Z → Undo last action               │
│ CTRL+SHIFT+Z → Redo                     │
└─────────────────────────────────────────┘

RESULT:
✓ Multiple vocal takes recorded
✓ Each take marked and navigable
✓ Kept in time with metronome
✓ Loop helped practice sections
✓ Easy navigation with markers
```

---

## 💡 POWER TIPS

### Markers

- Use consistent naming: "Verse 1", "Chorus", "Bridge"
- Lock important markers to prevent accidents
- Color-code sections by type

### Loops

- Loop challenging sections while practicing
- Record multiple takes on same loop
- Use loop to perfect difficult parts

### Metronome

- Start at 50% volume for first pass
- Use "click" for tempo accuracy
- Use "cowbell" for jazz/funk feels
- "Woodblock" for world music

### Shortcuts

- **Learn 3 first**: SPACE, M, L
- **Then add**: K, ENTER
- **Finally**: Arrow keys for navigation
- Gradual learning = better retention

---

## 🎹 PRACTICE EXERCISE

### Beginner (10 minutes)

```
1. Add 3 markers to a project
2. Click each marker to jump around
3. Press M key 5 times to add markers
4. Set a loop region
5. Toggle loop on/off
```

### Intermediate (15 minutes)

```
1. Load song with multiple sections
2. Mark each section (Verse, Chorus, etc)
3. Create loop on chorus
4. Enable metronome
5. Use keyboard shortcuts to navigate
```

### Advanced (30 minutes)

```
1. Record multiple vocal takes:
   - Use markers to label sections
   - Use loop on each section
   - Use metro for timing
   - Use keyboard shortcuts for speed
2. Navigate back to best takes
3. Use undo/redo to fix mistakes
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] Markers panel appears in Phase 3 tab
- [ ] Can add marker with M key
- [ ] Can delete markers
- [ ] Loop region shows on timeline
- [ ] Metronome plays when enabled
- [ ] Keyboard shortcuts respond
- [ ] Space bar plays/pauses
- [ ] Arrow keys navigate timeline
- [ ] All features work together

---

## 🚀 YOU'RE READY!

You now have professional DAW features at your fingertips:

✓ **Markers** for navigation
✓ **Loops** for focused practice
✓ **Metronome** for timing
✓ **Shortcuts** for efficiency

**Start creating music! 🎵**
