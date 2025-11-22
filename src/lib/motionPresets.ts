/**
 * Motion Presets - Reusable animation configurations
 *
 * Centralizes animation logic for consistent UI motion across CoreLogic Studio.
 * Includes fade-in, spring animations, and dynamic glow effects for metering.
 */

export const motionPresets = {
  /**
   * Simple fade-in animation
   * Used for modal overlays, tooltips, and transient UI elements
   */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  /**
   * Spring-based slide animation
   * Creates bouncy, natural-feeling transitions for draggable elements
   */
  springSlide: {
    type: "spring",
    stiffness: 120,
    damping: 20,
    mass: 1,
  },

  /**
   * Dynamic meter glow effect
   * Scales glow intensity based on audio level (-60dB to +12dB range)
   *
   * @param level - Current audio level in dB (-60 to +12)
   * @returns Animation object with dynamic boxShadow
   */
  meterGlow: (level: number) => ({
    boxShadow: `0 0 ${Math.min(
      Math.max(level * 20, 0),
      25
    )}px rgba(0,174,239,0.6)`,
    transition: { duration: 0.05 },
  }),

  /**
   * Playhead tracking animation
   * Smooth position update for real-time playback indicator
   */
  playheadTrack: {
    type: "spring",
    stiffness: 500,
    damping: 90,
    mass: 0.5,
  },

  /**
   * Button press animation
   * Gives tactile feedback when clicking controls
   */
  buttonPress: {
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.05 },
    transition: { duration: 0.1 },
  },

  /**
   * Fader drag animation
   * Smooth interpolation during volume/pan changes
   */
  faderDrag: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },

  /**
   * Waveform scroll animation
   * Smooth horizontal panning through timeline
   */
  waveformScroll: {
    type: "spring",
    stiffness: 200,
    damping: 25,
  },
};

export default motionPresets;
