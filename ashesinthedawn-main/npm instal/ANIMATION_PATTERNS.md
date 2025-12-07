/\*\*

- Animation & Transition Patterns - CoreLogic Studio
-
- This document outlines the smooth motion and animation strategies used
- throughout the DAW UI for professional, responsive user experience.
  \*/

// ============================================================================
// TAILWIND TRANSITION UTILITIES
// ============================================================================

/\*\*

- STANDARD TRANSITIONS USED:
-
- 1.  SMOOTH METER FILLS (Real-time Audio Levels)
- - Class: transition-all duration-75 ease-linear
- - Use case: MixerStrip level meters, waveform playhead, VU meters
- - Duration: 75ms = 13.3Hz refresh rate
- - Easing: ease-linear (constant speed, best for continuous motion)
- - Properties: height, width, boxShadow (meter glow)
-
- Example:
- <div
-     className="transition-all duration-75 ease-linear"
-     style={{ height: `${level * 100}%` }}
- />
-
- ============================================================================
-
- 2.  BUTTON INTERACTIONS (Hover/Press)
- - Class: transition-colors duration-150 ease-in-out
- - Use case: Play/Pause, transport controls, fader thumbs
- - Duration: 150ms (user-perceived instant)
- - Easing: ease-in-out (natural feel)
- - Properties: backgroundColor, color, boxShadow
-
- Example:
- <button
-     className="bg-gray-700 hover:bg-blue-600 transition-colors duration-150"
- >
-     Play
- </button>
-
- ============================================================================
-
- 3.  SLIDER DRAGGING (Volume Faders, Pan)
- - Class: transition-all duration-100 ease-out
- - Use case: Fader thumb position, pan indicator
- - Duration: 100ms
- - Easing: ease-out (responsive stop)
- - Properties: transform (translate), bottom, left
-
- Example:
- <div
-     className="transition-all duration-100 ease-out"
-     style={{ bottom: `calc(${percent}% - 8px)` }}
- />
-
- ============================================================================
-
- 4.  UI STATE CHANGES (Tooltips, Menus)
- - Class: transition-all duration-200 ease-in-out
- - Use case: Fade in/out, slide transitions
- - Duration: 200ms
- - Easing: ease-in-out (smooth entrance/exit)
- - Properties: opacity, transform, height
-
- Example:
- <div
-     className={`transition-all duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
- >
-     Content
- </div>
-
- ============================================================================
-
- 5.  FOCUS/ACTIVE STATES (Visual Feedback)
- - Class: transition-transform duration-100 active:scale-95
- - Use case: Button press feedback
- - Duration: 100ms
- - Transform: scale-95 (press down effect)
-
- Example:
- <button
-     className="transition-transform duration-100 active:scale-95"
- >
-     Click me
- </button>
-
- ============================================================================
  \*/

// ============================================================================
// MOTION PRESETS (src/lib/motionPresets.ts)
// ============================================================================

/\*\*

- MOTION PRESET CONFIGURATIONS:
-
- fadeIn: { opacity: 0 → 1, duration: 200ms }
- - Modal backgrounds
- - Transient UI elements
- - Tooltip visibility
-
- springSlide: { stiffness: 120, damping: 20 }
- - Draggable mixer tiles
- - Window detach/dock animations
-
- meterGlow: (level) → { boxShadow with dynamic radius }
- - Applied to: MixerStrip meter fill, VolumeFader thumb
- - Glow scales from 0-25px based on level (0-1)
- - Color: rgba(0, 174, 239, 0.6) - cyan blue
-
- playheadTrack: { stiffness: 500, damping: 90 }
- - Real-time playhead position tracking
- - Fast, snappy response
-
- buttonPress: { whileTap: scale-95, whileHover: scale-1.05 }
- - Transport controls feedback
- - Interactive button states
-
- faderDrag: { stiffness: 300, damping: 30 }
- - Volume/pan fader smoothing
- - Responsive but natural feeling
-
- waveformScroll: { stiffness: 200, damping: 25 }
- - Timeline horizontal panning
- - Smooth inertial scrolling
    \*/

// ============================================================================
// COMPONENT-SPECIFIC TIMING
// ============================================================================

/\*\*

- COMPONENT TIMINGS:
-
- MixerStrip:
- - Meter animation: 75ms linear (real-time responsiveness)
- - Glow effect: 50ms (from motionPresets.meterGlow)
-
- VolumeFader:
- - Thumb drag: instant (interactive)
- - Glow update: 50ms
- - Color transitions: instant (visual feedback)
-
- TransportBar:
- - Button hover: 150ms color transition
- - Button press: 100ms scale effect
- - Timecode update: instant (no animation)
-
- Timeline/Waveform:
- - Playhead tracking: 100ms spring (smooth follow)
- - Waveform scroll: 200ms spring (inertial feel)
- - Zoom transitions: 150ms (smooth zoom)
-
- Mixer Tile (Detachable):
- - Detach/dock: 120ms spring (bouncy animation)
- - Resize: instant (live feedback)
- - Position drag: 120ms spring (fluid movement)
    \*/

// ============================================================================
// BEST PRACTICES
// ============================================================================

/\*\*

- GUIDELINES FOR ANIMATION CONSISTENCY:
-
- 1.  REAL-TIME AUDIO FEEDBACK (Meters, Levels)
- ✓ Use: duration-75 ease-linear
- ✓ Keep fast and responsive (13 Hz refresh)
- ✓ Never use spring for continuous motion
-
- 2.  USER INTERACTIONS (Buttons, Sliders)
- ✓ Use: duration-100 to duration-150
- ✓ Easing: ease-in-out for natural feel
- ✓ Provide immediate visual feedback
-
- 3.  STATE TRANSITIONS (Show/Hide, Load)
- ✓ Use: duration-200 ease-in-out
- ✓ Consistent with UI framework patterns
- ✓ Avoid jarring appearance changes
-
- 4.  DRAG & DROP (Detachable Tiles, Automation)
- ✓ Use: Spring physics for natural feel
- ✓ Use: onMouseDown/onMouseMove for live tracking
- ✓ Use: Spring release for smooth settling
-
- 5.  PERFORMANCE CONSIDERATIONS
- ✓ Use: will-change: transform for dragged elements
- ✓ Use: pointer-events-none on animated overlays
- ✓ Avoid: Animating expensive properties (layout, shadows)
- ✓ Prefer: transform, opacity for GPU acceleration
-
- 6.  ACCESSIBILITY
- ✓ Respect: prefers-reduced-motion media query
- ✓ Provide: Static fallback for motion-disabled users
- ✓ Keep: Motion purposeful and not distracting
  \*/

// ============================================================================
// IMPLEMENTATION EXAMPLES
// ============================================================================

/\*\*

- EXAMPLE 1: Smooth Meter Animation
-
- <div
- className="absolute bottom-0 w-full bg-blue-600 transition-all duration-75 ease-linear"
- style={{
-     height: `${displayLevel * 100}%`,
-     boxShadow: `0 0 ${Math.min(displayLevel * 20, 15)}px rgba(37, 99, 235, 0.6)`,
- }}
- />
-
- ✓ Fast refresh (75ms) for real-time responsiveness
- ✓ Linear easing for consistent speed
- ✓ Height and boxShadow animated together
- ✓ GPU-accelerated properties (height is synthetic)
  \*/

/\*\*

- EXAMPLE 2: Button Interaction Feedback
-
- <button
- className="bg-gray-700 hover:bg-blue-600 active:scale-95 transition-all duration-150"
- >
- Play
- </button>
-
- ✓ Color change and transform: 150ms smooth transition
- ✓ Press effect: 100ms scale-down
- ✓ Two transitions for different properties
- ✓ Provides immediate user feedback
  \*/

/\*\*

- EXAMPLE 3: Fader Thumb Animation
-
- <div
- className="transition-all duration-100 ease-out cursor-grab"
- style={{
-     bottom: `calc(${thumbPercent}% - 8px)`,
-     backgroundColor: volumeColor,
-     boxShadow: glowEffect.boxShadow,
- }}
- onMouseDown={handleMouseDown}
- />
-
- ✓ Smooth position tracking: 100ms
- ✓ Dynamic glow from motionPresets
- ✓ Immediate response to mouse drag
- ✓ Responsive stop when dragging ends
  \*/

export const ANIMATION_TIMINGS = {
METER_REFRESH: '75ms', // Real-time audio levels
BUTTON_INTERACTION: '150ms', // Hover/focus states
STATE_TRANSITION: '200ms', // Show/hide animations
DRAG_RESPONSE: '100ms', // Fader/slider feedback
SPRING_SETTLE: '120ms', // Detachable tiles
};

export const EASING_FUNCTIONS = {
LINEAR: 'ease-linear', // Continuous motion
IN_OUT: 'ease-in-out', // Natural feel
OUT: 'ease-out', // Quick stop
IN: 'ease-in', // Slow start
};

export default {
ANIMATION_TIMINGS,
EASING_FUNCTIONS,
};
