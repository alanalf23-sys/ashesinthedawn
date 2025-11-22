import { useEffect } from "react";
import { useDAW } from "../contexts/DAWContext";

/**
 * useKeyboardShortcuts - Global keyboard shortcuts for DAW
 *
 * Shortcuts:
 * Space - Toggle play/pause
 * Enter - Toggle record
 * M - Add marker at current position
 * L - Toggle loop
 * K - Toggle metronome
 * Cmd/Ctrl + Z - Undo
 * Cmd/Ctrl + Shift + Z - Redo
 * Left Arrow - Seek backward 1 second
 * Right Arrow - Seek forward 1 second
 * Shift + Left Arrow - Seek backward 5 seconds
 * Shift + Right Arrow - Seek forward 5 seconds
 */
export function useKeyboardShortcuts() {
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

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;

        case "Enter":
          e.preventDefault();
          toggleRecord();
          break;

        case "KeyM":
          if (!modifier && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            addMarker(currentTime, `Marker ${Date.now()}`);
          }
          break;

        case "KeyL":
          if (!modifier && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            toggleLoop();
          }
          break;

        case "KeyK":
          if (!modifier && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            toggleMetronome();
          }
          break;

        case "KeyZ":
          if (modifier && !e.shiftKey) {
            e.preventDefault();
            if (canUndo) undo();
          } else if (modifier && e.shiftKey) {
            e.preventDefault();
            if (canRedo) redo();
          }
          break;

        case "ArrowLeft": {
          e.preventDefault();
          const seekBackAmount = e.shiftKey ? 5 : 1;
          seek(Math.max(0, currentTime - seekBackAmount));
          break;
        }

        case "ArrowRight": {
          e.preventDefault();
          const seekForwardAmount = e.shiftKey ? 5 : 1;
          seek(currentTime + seekForwardAmount);
          break;
        }

        default:
          break;
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
  ]);
}
