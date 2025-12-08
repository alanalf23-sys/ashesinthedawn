/**
 * DAW Action Initialization
 * Registers all REAPER-like actions for CoreLogic Studio
 * 
 * Action ID Naming:
 * - Transport: 40xxx (40044 = play, 40045 = pause, etc)
 * - Track: 41xxx (41xxx = add/delete/select tracks)
 * - Edit: 42xxx (42xxx = undo/redo/cut/copy/paste)
 * - Arrange: 43xxx
 * - View: 44xxx
 * - Item/Media: 45xxx
 */

import { actionRegistry, shortcutManager } from '../actionSystem';

/**
 * Store references to DAW functions globally
 * These will be set by the DAWProvider via initializeActions()
 */
let dawContext: any = null;

export function setDAWContext(context: any) {
  dawContext = context;
}

export function getDAWContext() {
  if (dawContext) return dawContext;
  // fallback to global window if set by DAWProvider
  try {
    return (window as any).__CORELOGIC_DAW_CONTEXT__ || null;
  } catch (e) {
    return null;
  }
}

/**
 * Register Transport Actions
 */
export function registerTransportActions() {
  // 40044: Play
  actionRegistry.register(
    {
      id: '40044',
      name: 'Transport: Play',
      category: 'Transport',
      description: 'Start playback from current position',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'space',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.togglePlay) {
        console.warn('DAW context not initialized');
        return;
      }
      // Check if already playing
      if (!ctx.isPlaying) {
        ctx.togglePlay();
      }
    }
  );

  // 40045: Pause
  actionRegistry.register(
    {
      id: '40045',
      name: 'Transport: Pause',
      category: 'Transport',
      description: 'Pause playback',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'ctrl+space',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.togglePlay) return;
      if (ctx.isPlaying) {
        ctx.togglePlay();
      }
    }
  );

  // 40046: Stop
  actionRegistry.register(
    {
      id: '40046',
      name: 'Transport: Stop',
      category: 'Transport',
      description: 'Stop playback and return to beginning',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'shift+space',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx) return;
      if (ctx.isPlaying) {
        ctx.togglePlay();
      }
      if (ctx.seek) {
        ctx.seek(0);
      }
    }
  );

  // 40047: Record
  actionRegistry.register(
    {
      id: '40047',
      name: 'Transport: Record',
      category: 'Transport',
      description: 'Toggle record mode',
      contexts: ['main', 'arrange'],
      accel: 'ctrl+r',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.toggleRecord) return;
      ctx.toggleRecord();
    }
  );

  // 40048: Seek to Start
  actionRegistry.register(
    {
      id: '40048',
      name: 'Transport: Seek to Start',
      category: 'Transport',
      description: 'Jump to beginning',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'home',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.seek) return;
      ctx.seek(0);
    }
  );

  // 40049: Rewind
  actionRegistry.register(
    {
      id: '40049',
      name: 'Transport: Rewind',
      category: 'Transport',
      description: 'Move back 5 seconds',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'left',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.seek) return;
      const newTime = Math.max(0, ctx.currentTime - 5);
      ctx.seek(newTime);
    }
  );

  // 40050: Forward
  actionRegistry.register(
    {
      id: '40050',
      name: 'Transport: Forward',
      category: 'Transport',
      description: 'Move forward 5 seconds',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'right',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.seek) return;
      const newTime = Math.min(ctx.projectDuration || 300, ctx.currentTime + 5);
      ctx.seek(newTime);
    }
  );

  // Register shortcuts
  shortcutManager.register({ actionId: '40044', keys: 'space', context: 'main' });
  shortcutManager.register({ actionId: '40045', keys: 'ctrl+space', context: 'main' });
  shortcutManager.register({ actionId: '40046', keys: 'shift+space', context: 'main' });
  shortcutManager.register({ actionId: '40047', keys: 'ctrl+r', context: 'main' });
}

/**
 * Register Track Actions
 */
export function registerTrackActions() {
  // 41000: Add Audio Track
  actionRegistry.register(
    {
      id: '41000',
      name: 'Track: Add Audio Track',
      category: 'Track',
      description: 'Insert a new audio track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'ctrl+alt+a',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.addTrack) return;
      ctx.addTrack('audio');
    }
  );

  // 41001: Add Instrument Track
  actionRegistry.register(
    {
      id: '41001',
      name: 'Track: Add Instrument Track',
      category: 'Track',
      description: 'Insert a new instrument track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'ctrl+alt+i',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.addTrack) return;
      ctx.addTrack('instrument');
    }
  );

  // 41002: Add MIDI Track
  actionRegistry.register(
    {
      id: '41002',
      name: 'Track: Add MIDI Track',
      category: 'Track',
      description: 'Insert a new MIDI track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'ctrl+alt+m',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.addTrack) return;
      ctx.addTrack('midi');
    }
  );

  // 41003: Add Aux Track
  actionRegistry.register(
    {
      id: '41003',
      name: 'Track: Add Aux Track',
      category: 'Track',
      description: 'Insert a new auxiliary/bus track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'ctrl+alt+u',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.addTrack) return;
      ctx.addTrack('aux');
    }
  );

  // 41010: Delete Track
  actionRegistry.register(
    {
      id: '41010',
      name: 'Track: Delete Track',
      category: 'Track',
      description: 'Delete selected track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'ctrl+delete',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.deleteTrack) return;
      ctx.deleteTrack(ctx.selectedTrack.id);
    }
  );

  // 41020: Mute Track
  actionRegistry.register(
    {
      id: '41020',
      name: 'Track: Toggle Mute',
      category: 'Track',
      description: 'Toggle mute on selected track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'm',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;
      ctx.updateTrack(ctx.selectedTrack.id, {
        muted: !ctx.selectedTrack.muted,
      });
    }
  );

  // 41021: Solo Track
  actionRegistry.register(
    {
      id: '41021',
      name: 'Track: Toggle Solo',
      category: 'Track',
      description: 'Toggle solo on selected track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 's',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;
      ctx.updateTrack(ctx.selectedTrack.id, {
        soloed: !ctx.selectedTrack.soloed,
      });
    }
  );

  // 41022: Arm Record
  actionRegistry.register(
    {
      id: '41022',
      name: 'Track: Toggle Record Arm',
      category: 'Track',
      description: 'Toggle record arm on selected track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'r',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;
      ctx.updateTrack(ctx.selectedTrack.id, {
        armed: !ctx.selectedTrack.armed,
      });
    }
  );

  // Register shortcuts
  shortcutManager.register({ actionId: '41000', keys: 'ctrl+alt+a', context: 'main' });
  shortcutManager.register({ actionId: '41001', keys: 'ctrl+alt+i', context: 'main' });
  shortcutManager.register({ actionId: '41002', keys: 'ctrl+alt+m', context: 'main' });
}

/**
 * Register Edit Actions
 */
export function registerEditActions() {
  // 42000: Undo
  actionRegistry.register(
    {
      id: '42000',
      name: 'Edit: Undo',
      category: 'Edit',
      description: 'Undo last action',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'ctrl+z',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.undo) return;
      ctx.undo();
    }
  );

  // 42001: Redo
  actionRegistry.register(
    {
      id: '42001',
      name: 'Edit: Redo',
      category: 'Edit',
      description: 'Redo last undone action',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'ctrl+y',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.redo) return;
      ctx.redo();
    }
  );

  shortcutManager.register({ actionId: '42000', keys: 'ctrl+z', context: 'main' });
  shortcutManager.register({ actionId: '42001', keys: 'ctrl+y', context: 'main' });
}

/**
 * Register View Actions
 */
export function registerViewActions() {
  // 44000: Zoom In
  actionRegistry.register(
    {
      id: '44000',
      name: 'View: Zoom In',
      category: 'View',
      description: 'Zoom in on timeline',
      contexts: ['main', 'arrange'],
      accel: 'ctrl+scroll',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.setZoom) return;
      ctx.setZoom(Math.min(4, (ctx.zoom || 1) * 1.2));
    }
  );

  // 44001: Zoom Out
  actionRegistry.register(
    {
      id: '44001',
      name: 'View: Zoom Out',
      category: 'View',
      description: 'Zoom out on timeline',
      contexts: ['main', 'arrange'],
      accel: 'ctrl+shift+scroll',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.setZoom) return;
      ctx.setZoom(Math.max(0.25, (ctx.zoom || 1) / 1.2));
    }
  );

  // 44010: Toggle Mixer View
  actionRegistry.register(
    {
      id: '44010',
      name: 'View: Toggle Mixer',
      category: 'View',
      description: 'Show or hide mixer panel',
      contexts: ['main'],
      accel: 'ctrl+alt+m',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.toggleMixerView) return;
      ctx.toggleMixerView();
    }
  );
}

/**
 * Import extended action modules
 */
import registerTransportActionsExtended from './transportActionsExtended';
import registerTrackActionsExtended from './trackActionsExtended';
import registerItemEditActionsExtended from './itemEditActionsExtended';
import registerMixerActionsExtended from './mixerActionsExtended';
import registerMIDIActionsExtended from './midiActionsExtended';

/**
 * Main initialization function
 * Called once on app startup
 * Registers all REAPER-compatible actions across all categories
 */
export function initializeActions() {
  // Register all action categories
  registerTransportActions();
  registerTrackActions();
  registerEditActions();
  registerViewActions();
  
  // Register extended action sets
  registerTransportActionsExtended();
  registerTrackActionsExtended();
  registerItemEditActionsExtended();
  registerMixerActionsExtended();
  registerMIDIActionsExtended();
  
  const totalActions = actionRegistry.getAllActions().length;
  console.log(`✅ Registered ${totalActions} REAPER-compatible actions`);
  
  // Log action summary
  const categories = new Set(actionRegistry.getAllActions().map(a => a.category));
  console.log(`📊 Categories: ${Array.from(categories).join(', ')}`);
}
