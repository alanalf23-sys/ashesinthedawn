# Teaching System - Visual Architecture & Integration Guide

## System Overview Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     CoreLogic Studio Application                           │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    TooltipProviderWrapper (Context)                  │  │
│  │         Provides: teachingMode, toggleTeachingMode                  │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         TopBar ✅ DONE                         │ │  │
│  │  │  ┌──────────┬──────────┬───────────┬────────────┬─────────┐   │ │  │
│  │  │  │   Stop   │   Play   │  Record   │    Loop    │  Undo   │   │ │  │
│  │  │  │ TOOLTIP  │ TOOLTIP  │ TOOLTIP   │ TOOLTIP    │ TOOLTIP │   │ │  │
│  │  │  └──────────┴──────────┴───────────┴────────────┴─────────┘   │ │  │
│  │  │  ┌──────────┬──────────┬───────────┬────────────┐              │ │  │
│  │  │  │  Redo    │Metronome │ AddMarker │ Settings  │              │ │  │
│  │  │  │ TOOLTIP  │ TOOLTIP  │ TOOLTIP   │ BUTTON    │              │ │  │
│  │  │  └──────────┴──────────┴───────────┴────────────┘              │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │                    Mixer ⏳ (TODO)                             │ │  │
│  │  │  ┌───────┬──────┬──────┬────────┬────────┬──────────────┐     │ │  │
│  │  │  │ Mute  │ Solo │ Arm  │ Volume │  Pan   │ Input Gain   │     │ │  │
│  │  │  │TOOLTIP│TOOLTIP│TOOLTIP│ SLIDER│ SLIDER│  SLIDER      │     │ │  │
│  │  │  └───────┴──────┴──────┴────────┴────────┴──────────────┘     │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │              WaveformAdjuster ⏳ (TODO)                        │ │  │
│  │  │  ┌────────────┬─────────┬──────────┬──────────┐               │ │  │
│  │  │  │   Zoom     │  Scale  │  Color   │   Grid   │               │ │  │
│  │  │  │  SLIDER    │ SLIDER  │  PICKER  │  TOGGLE  │               │ │  │
│  │  │  │  TOOLTIP   │ TOOLTIP │ TOOLTIP  │ TOOLTIP  │               │ │  │
│  │  │  └────────────┴─────────┴──────────┴──────────┘               │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │                PluginRack ⏳ (TODO)                            │ │  │
│  │  │  ┌────────────┬─────────┬───────────┬───────────┐             │ │  │
│  │  │  │ Add Effect │ Remove  │  Enable   │  Bypass   │             │ │  │
│  │  │  │  TOOLTIP   │ TOOLTIP │ TOOLTIP   │ TOOLTIP   │             │ │  │
│  │  │  └────────────┴─────────┴───────────┴───────────┘             │ │  │
│  │  │  [EQ] [Compression] [Reverb] [Delay] [Saturation] ...         │ │  │
│  │  │  Each with parameter tooltips                                 │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │             AutomationLane ⏳ (TODO)                           │ │  │
│  │  │  ┌─────────┬────────┬────────────┬────────────┐               │ │  │
│  │  │  │ Record  │ Clear  │ Curve Mode │ Envelope   │               │ │  │
│  │  │  │ TOOLTIP │ TOOLTIP│  TOOLTIP   │  TOOLTIP   │               │ │  │
│  │  │  └─────────┴────────┴────────────┴────────────┘               │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │                    [TeachingPanel]                                  │  │
│  │                    (Toggles from TopBar)                            │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

```
User Interaction
      │
      ├─ Hover over button
      │     └─ 500ms delay
      │     └─ Tooltip component shows
      │     └─ Display: title, description, hotkey, example
      │
      ├─ Check teaching mode enabled?
      │     └─ YES: Show "Show Codette Teaching" button
      │     └─ NO: Just show basic tooltip
      │
      ├─ Click "Show Codette Teaching"
      │     └─ TeachingPanel opens
      │     └─ Shows related functions
      │     └─ Show code examples
      │     └─ Mark function as learned ✓
      │
      └─ Ask Codette question
            └─ Send to /codette/teach endpoint
            └─ Receive explanation
            └─ Update learningProgress
            └─ Save to localStorage
```

---

## State Management Flow

```
┌──────────────────────────────┐
│  useTeachingMode Hook        │
├──────────────────────────────┤
│                              │
│ State:                       │
│  ├─ teachingModeEnabled      │
│  ├─ learningProgress {       │
│  │   totalLearned            │
│  │   functionsLearned[]      │
│  │   skillLevel              │
│  │   totalTimeSpent          │
│  │ }                          │
│                              │
│ Functions:                   │
│  ├─ toggleTeachingMode()     │
│  ├─ markFunctionLearned()    │
│  ├─ resetProgress()          │
│  ├─ getLearningPercentage()  │
│  ├─ askCodette() [async]     │
│                              │
│ Storage:                     │
│  └─ localStorage             │
│     corelogic_learning_prog  │
│                              │
└──────────────────────────────┘
         │
         ├─ Consumed by:
         │  ├─ TopBar (toggle button)
         │  ├─ TeachingPanel (display progress)
         │  ├─ Tooltip (show codette button)
         │  └─ Any component needing teaching features
         │
         └─ Updates from:
            ├─ User hovering over tooltip
            ├─ User clicking "Show Codette Teaching"
            ├─ User asking Codette question
            └─ Auto-save every 30 seconds
```

---

## Component Integration Pattern

### Pattern for TopBar (COMPLETE ✅)

```typescript
┌─ TopBar Component
│
├─ Import:
│  ├─ Tooltip component
│  └─ TOOLTIP_LIBRARY
│
├─ Wrap each button:
│  ├─ <Tooltip content={TOOLTIP_LIBRARY['play']}>
│  │   <button onClick={togglePlay}>Play</button>
│  │ </Tooltip>
│  │
│  ├─ <Tooltip content={TOOLTIP_LIBRARY['stop']}>
│  │   <button onClick={stop}>Stop</button>
│  │ </Tooltip>
│  │
│  └─ ... (repeat for 6 more buttons)
│
└─ Result:
   8 tooltips, all working with teaching integration
```

### Pattern for Mixer (TEMPLATE)

```typescript
┌─ Mixer Component
│
├─ Import:
│  ├─ Tooltip component
│  ├─ TOOLTIP_LIBRARY
│  └─ useDAW hook
│
├─ Mute Button:
│  └─ <Tooltip content={TOOLTIP_LIBRARY['mute']}>
│      <button onClick={toggleMute}>Mute</button>
│     </Tooltip>
│
├─ Volume Slider:
│  └─ <Tooltip content={TOOLTIP_LIBRARY['volume']} position="left">
│      <input type="range" value={volume} onChange={...} />
│     </Tooltip>
│
├─ Pan Slider:
│  └─ <Tooltip content={TOOLTIP_LIBRARY['pan']} position="left">
│      <input type="range" value={pan} onChange={...} />
│     </Tooltip>
│
└─ ... (repeat for 9 more controls)
```

---

## Tooltip Content Structure

```
Tooltip Entry in TOOLTIP_LIBRARY
│
├─ Title
│  └─ "Play"
│
├─ Description
│  └─ "Start playback from current position"
│
├─ Hotkey
│  └─ "Space"
│
├─ Category
│  └─ "transport" | "mixer" | "effects" | "tools" | "settings"
│
├─ Related Functions
│  ├─ "Pause"
│  ├─ "Stop"
│  └─ "Loop"
│
├─ Performance Tip
│  └─ "Playback uses Web Audio API with synchronized timing"
│
├─ Code Examples
│  ├─ "togglePlay() - Toggle play/pause"
│  ├─ "seek(timeSeconds) - Jump to position"
│  └─ "isPlaying - Current playback state"
│
└─ Documentation Link
   └─ "https://github.com/.../wiki/Transport-Controls"
```

---

## Learning Progress Tracking

```
User Journey:
│
├─ DAY 1: Learn Play button
│  ├─ Hover over play button → See tooltip
│  ├─ Click "Show Codette Teaching"
│  ├─ Ask "How does play work?"
│  ├─ Mark as learned ✓
│  ├─ Progress: 1/40 functions (2%)
│  └─ Skill Level: Beginner
│
├─ DAY 2: Learn Record, Stop, Undo
│  ├─ Repeat for 3 more functions
│  ├─ Progress: 4/40 functions (10%)
│  ├─ Skill Level: Beginner
│  └─ Time Spent: 45 minutes
│
├─ DAY 3: Learn Mixer controls (Mute, Solo, Volume, Pan)
│  ├─ Integrate mixer tooltips
│  ├─ Learn 4 new functions
│  ├─ Progress: 8/40 functions (20%)
│  ├─ Skill Level: Beginner
│  └─ Time Spent: 2 hours 15 minutes
│
├─ WEEK 2: Intensive learning (20 functions learned)
│  ├─ Progress: 20/40 functions (50%)
│  ├─ Skill Level: Intermediate ← LEVEL UP!
│  └─ Can now see advanced performance tips
│
└─ WEEK 3-4: Advanced learning (30 functions learned)
   ├─ Progress: 30/40 functions (75%)
   ├─ Skill Level: Intermediate
   └─ Asking more complex questions
```

---

## Tooltip Display Examples

### Example 1: Basic Tooltip (Play Button)

```
┌─────────────────────────────────┐
│ ► Play                          │
├─────────────────────────────────┤
│ Start playback from current    │
│ position                        │
│                                 │
│ [transport]                     │
│                                 │
│ Related: Pause • Stop • Loop   │
│                                 │
│ Hotkey: Space                   │
│                                 │
│ Performance Tip:                │
│ Uses Web Audio API for sync     │
│                                 │
│ Code Example:                   │
│ togglePlay() - Toggle play/pause│
│                                 │
│ 🧠 Show Codette Teaching        │
│                                 │
│ 📚 Full Documentation           │
└─────────────────────────────────┘
```

### Example 2: Teaching Mode Enabled (Play Button)

```
┌─────────────────────────────────────────┐
│ ► Play                                  │
├─────────────────────────────────────────┤
│ Start playback from current position    │
│                                          │
│ [transport]                              │
│                                          │
│ Related: Pause • Stop • Loop             │
│ Hotkey: Space                            │
│                                          │
│ Performance Tip:                         │
│ Playback uses Web Audio API with sync   │
│ for accurate timing at any tempo        │
│                                          │
│ Code Examples:                           │
│ • togglePlay() - Toggle play/pause       │
│ • seek(timeSeconds) - Jump to position   │
│ • isPlaying - Current playback state     │
│                                          │
│ Python Equivalent:                       │
│ def toggle_play():                       │
│   global is_playing                      │
│   is_playing = not is_playing            │
│                                          │
│ ═══════════════════════════════════════  │
│ 🧠 HIDE Codette Teaching                 │ ← Toggle button
│ ───────────────────────────────────────  │
│ Related Codette Functions:               │
│ • play() - Start audio playback          │
│ • stop() - Stop audio playback           │
│ • seek() - Jump to position              │
│                                          │
│ 📚 Full Documentation                    │
└─────────────────────────────────────────┘
```

---

## Integration Timeline

```
TIMELINE:
│
├─ ✅ COMPLETED (This Session)
│  ├─ Tooltip Infrastructure
│  ├─ TopBar Integration (8 tooltips)
│  ├─ Teaching Mode Hook
│  ├─ Teaching Panel UI
│  ├─ Learning Progress Tracking
│  └─ TOOLTIP_LIBRARY (20+ entries)
│
├─ ⏳ NEXT PRIORITY (2-3 hours)
│  ├─ App.tsx Root Integration
│  ├─ Teaching Panel Toggle
│  └─ TopBar Teaching Mode Button
│
├─ 📋 SHORT TERM (8-10 hours)
│  ├─ Mixer Component (12 tooltips)
│  ├─ WaveformAdjuster (8 tooltips)
│  └─ PluginRack (15+ tooltips)
│
├─ 🔧 MEDIUM TERM (4-6 hours)
│  ├─ AutomationLane (6 tooltips)
│  ├─ Effect-specific tooltips
│  └─ Advanced parameter tooltips
│
└─ 🚀 LONG TERM (Optimization)
   ├─ Codette Backend Integration
   ├─ Performance Testing
   ├─ Mobile Responsiveness
   ├─ Accessibility Audit
   └─ Analytics Integration
```

---

## File Organization

```
src/
│
├─ components/
│  ├─ TopBar.tsx ................. ✅ 8 tooltips (DONE)
│  ├─ TooltipProvider.tsx ......... ✨ Core system (NEW)
│  ├─ TeachingPanel.tsx .......... ✨ Learning UI (NEW)
│  ├─ CodetteTeachingGuide.tsx ... ✨ Docs (NEW)
│  │
│  ├─ Mixer.tsx .................. ⏳ 12 tooltips (TODO)
│  ├─ WaveformAdjuster.tsx ....... ⏳ 8 tooltips (TODO)
│  ├─ PluginRack.tsx ............ ⏳ 15 tooltips (TODO)
│  ├─ AutomationLane.tsx ........ ⏳ 6 tooltips (TODO)
│  └─ ... other components
│
├─ hooks/
│  ├─ useTeachingMode.ts ........ ✨ Teaching state (NEW)
│  └─ ... other hooks
│
├─ contexts/
│  ├─ DAWContext.tsx (existing)
│  └─ ... other contexts
│
├─ types/
│  └─ index.ts (existing)
│
└─ App.tsx ....................... ⏳ Add wrapper (TODO)

Documentation/
├─ TEACHING_SYSTEM_SUMMARY.md ................. Executive summary
├─ TEACHING_SYSTEM_INTEGRATION_STATUS.md ..... Detailed status
├─ TOOLTIP_INTEGRATION_GUIDE.md .............. Developer guide
├─ FILE_REFERENCE_COMPLETE.md ............... Technical reference
└─ ARCHITECTURE_DIAGRAM.md .................. (This file)
```

---

## Quick Reference: Tooltip Categories

```
TRANSPORT (8 tooltips)
├─ play ........... Play from current position
├─ stop ........... Stop and return to start
├─ record ......... Start recording input
├─ loop ........... Enable looping
├─ undo ........... Revert last action
├─ redo ........... Repeat last undo
├─ metronome ..... Click track
└─ addMarker ..... Create cue point

MIXER (4 tooltips)
├─ volume ........ Adjust track volume (dB)
├─ pan ........... Position in stereo field
├─ mute .......... Silent output
└─ solo .......... Isolate track

EFFECTS (4 tooltips)
├─ eq ............ Parametric EQ
├─ compression .. Dynamic range
├─ reverb ........ Room simulation
└─ delay ......... Tempo-synced echoes

TOOLS (3 tooltips)
├─ waveform-zoom  Timeline magnification
├─ waveform-scale Amplitude display
└─ seek .......... Click to jump

SETTINGS (1 tooltip)
└─ settings ...... Audio preferences
```

---

**Last Updated**: December 19, 2024
**Status**: ✅ ARCHITECTURE COMPLETE
**Total Tooltips**: 20+ configured, expandable
**Dev Server**: ✅ Running on http://localhost:5173
