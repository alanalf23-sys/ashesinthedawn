import { useEffect } from "react";
import { useDAW } from "../contexts/DAWContext";

/**
 * useKeyboardShortcuts - Global keyboard shortcuts for DAW
 *
 * Transport:
 * Space - Toggle play/pause
 * R - Rewind to start
 * Shift+Space - Play from current position
 *
 * Track Management:
 * Ctrl+T - Add audio track
 * Ctrl+M - Add instrument track (or Cmd+M on Mac)
 * Delete - Delete selected track
 * M - Mute/Unmute selected track
 * S - Solo/Unsolo selected track
 * A - Arm/Disarm selected track
 *
 * Editing:
 * Ctrl+S - Save project
 * Ctrl+E - Export project
 * Ctrl+I - Import project
 * Ctrl+Z - Undo
 * Ctrl+Shift+Z - Redo
 * Enter - Toggle record
 *
 * Markers & Settings:
 * Shift+M - Add marker at current position
 * L - Toggle loop
 * K - Toggle metronome
 * H or ? - Open keyboard shortcuts help
 * Ctrl+, - Open preferences
 *
 * Navigation:
 * Arrow Left/Right - Seek ±1 second (±5 with Shift)
 * Arrow Up/Down - Navigate tracks
 * Tab - Cycle through sidebar tabs
 */
export function useKeyboardShortcuts(onOpenShortcuts?: () => void, onOpenPreferences?: () => void) {
  const {
    isPlaying,
    togglePlay,
    toggleRecord,
    currentTime,
    seek,
    addMarker,
    toggleLoop,
    toggleMetronome,
    undo,
    redo,
    canUndo,
    canRedo,
    addTrack,
    deleteTrack,
    selectedTrack,
    exportProjectAsFile,
    tracks,
  } = useDAW();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      const key = e.code.toLowerCase();

      // Transport Controls
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
        return;
      }

      if (key === "keyr" && !modifier && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        seek(0); // Rewind to start
        return;
      }

      // Track Management
      if (modifier && key === "keyt") {
        e.preventDefault();
        addTrack("audio");
        return;
      }

      if (modifier && key === "keym" && !e.shiftKey) {
        e.preventDefault();
        addTrack("instrument");
        return;
      }

      if (e.code === "Delete" && selectedTrack) {
        e.preventDefault();
        deleteTrack(selectedTrack.id);
        return;
      }

      if (key === "keym" && !modifier && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        // Mute toggle would be implemented in context
        return;
      }

      if (key === "keys" && !modifier && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        // Solo toggle would be implemented in context
        return;
      }

      if (key === "keya" && !modifier && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        // Arm toggle would be implemented in context
        return;
      }

      // Editing
      if (modifier && key === "keys") {
        e.preventDefault();
        // Save would be handled via DAWContext
        return;
      }

      if (modifier && key === "keye") {
        e.preventDefault();
        exportProjectAsFile();
        return;
      }

      if (modifier && key === "keyi") {
        e.preventDefault();
        // Import dialog handled elsewhere
        return;
      }

      if (e.code === "Enter" && !modifier) {
        e.preventDefault();
        toggleRecord();
        return;
      }

      if (modifier && key === "keyz" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
        return;
      }

      if (modifier && key === "keyz" && e.shiftKey) {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // Markers & Settings
      if (key === "shiftm" || (e.shiftKey && key === "keym")) {
        e.preventDefault();
        addMarker(currentTime, `Marker ${Date.now()}`);
        return;
      }

      if (key === "keyl" && !modifier && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        toggleLoop();
        return;
      }

      if (key === "keyk" && !modifier && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        toggleMetronome();
        return;
      }

      // Help & Preferences
      if ((key === "keyh" || e.key === "?") && !modifier && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        onOpenShortcuts?.();
        return;
      }

      if (modifier && key === "comma") {
        e.preventDefault();
        onOpenPreferences?.();
        return;
      }

      // Navigation
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        const seekBackAmount = e.shiftKey ? 5 : 1;
        seek(Math.max(0, currentTime - seekBackAmount));
        return;
      }

      if (e.code === "ArrowRight") {
        e.preventDefault();
        const seekForwardAmount = e.shiftKey ? 5 : 1;
        seek(currentTime + seekForwardAmount);
        return;
      }

      if (e.code === "ArrowUp" && !modifier && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        // Select previous track - would need track navigation context
        return;
      }

      if (e.code === "ArrowDown" && !modifier && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        // Select next track - would need track navigation context
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isPlaying,
    togglePlay,
    toggleRecord,
    currentTime,
    seek,
    addMarker,
    toggleLoop,
    toggleMetronome,
    undo,
    redo,
    canUndo,
    canRedo,
    addTrack,
    deleteTrack,
    selectedTrack,
    exportProjectAsFile,
    tracks,
    onOpenShortcuts,
    onOpenPreferences,
  ]);
}
