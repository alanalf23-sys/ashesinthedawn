import { useState } from 'react';
import { useDAW } from '../contexts/DAWContext';

interface MenuItem {
  label: string;
  onClick: () => void;
}

interface MenuSection {
  [key: string]: MenuItem[];
}

export default function MenuBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { 
    addTrack, 
    deleteTrack,
    selectedTrack,
    currentTime,
    undo,
    redo,
    cut,
    copy,
    paste,
    zoomIn,
    zoomOut,
    resetZoom,
    duplicateTrack,
    muteTrack,
    soloTrack,
    muteAllTracks,
    unmuteAllTracks,
    saveProject,
    openNewProjectModal,
    openOpenProjectModal,
    openSaveAsModal,
    openExportModal,
    openPreferencesModal,
    openAudioSettingsModal,
    openMidiSettingsModal,
    openShortcutsModal,
    openAboutModal,
    openMixerOptionsModal,
    toggleFullscreen,
    toggleMixerVisibility,
    // Clip operations
    createClip,
    deleteClip,
    splitClip,
    quantizeClip,
    selectedClip,
    // Event operations
    createEvent,
    deleteEvent,
    selectedEvent,
  } = useDAW();

  const menuSections: MenuSection = {
    File: [
      { label: 'New Project', onClick: () => { openNewProjectModal(); setActiveMenu(null); } },
      { label: 'Open Project', onClick: () => { openOpenProjectModal(); setActiveMenu(null); } },
      { label: 'Save', onClick: () => { saveProject(); setActiveMenu(null); } },
      { label: 'Save As...', onClick: () => { openSaveAsModal(); setActiveMenu(null); } },
      { label: 'Export', onClick: () => { openExportModal(); setActiveMenu(null); } },
    ],
    Edit: [
      { label: 'Undo', onClick: () => { undo(); setActiveMenu(null); } },
      { label: 'Redo', onClick: () => { redo(); setActiveMenu(null); } },
      { label: 'Cut', onClick: () => { cut(); setActiveMenu(null); } },
      { label: 'Copy', onClick: () => { copy(); setActiveMenu(null); } },
      { label: 'Paste', onClick: () => { paste(); setActiveMenu(null); } },
    ],
    View: [
      { label: 'Zoom In', onClick: () => { zoomIn(); setActiveMenu(null); } },
      { label: 'Zoom Out', onClick: () => { zoomOut(); setActiveMenu(null); } },
      { label: 'Reset Zoom', onClick: () => { resetZoom(); setActiveMenu(null); } },
      { label: 'Full Screen', onClick: () => { toggleFullscreen(); setActiveMenu(null); } },
      { label: 'Show Mixer', onClick: () => { toggleMixerVisibility(); setActiveMenu(null); } },
    ],
    Track: [
      { label: 'New Track', onClick: () => { addTrack('audio'); setActiveMenu(null); } },
      { label: 'Delete Track', onClick: () => { if (selectedTrack) deleteTrack(selectedTrack.id); setActiveMenu(null); } },
      { label: 'Duplicate Track', onClick: () => { if (selectedTrack) duplicateTrack(selectedTrack.id); setActiveMenu(null); } },
      { label: 'Mute', onClick: () => { if (selectedTrack) muteTrack(selectedTrack.id, !selectedTrack.muted); setActiveMenu(null); } },
      { label: 'Solo', onClick: () => { if (selectedTrack) soloTrack(selectedTrack.id, !selectedTrack.soloed); setActiveMenu(null); } },
      { label: 'Mute All', onClick: () => { muteAllTracks(); setActiveMenu(null); } },
      { label: 'Unmute All', onClick: () => { unmuteAllTracks(); setActiveMenu(null); } },
    ],
    Clip: [
      { label: 'New Clip', onClick: () => { if (selectedTrack) createClip(selectedTrack.id, currentTime, 1); setActiveMenu(null); } },
      { label: 'Delete Clip', onClick: () => { if (selectedClip) deleteClip(selectedClip.id); setActiveMenu(null); } },
      { label: 'Split at Cursor', onClick: () => { if (selectedClip) splitClip(selectedClip.id, currentTime); setActiveMenu(null); } },
      { label: 'Quantize', onClick: () => { if (selectedClip) quantizeClip(selectedClip.id, 0.25); setActiveMenu(null); } },
    ],
    Event: [
      { label: 'Create Event', onClick: () => { if (selectedTrack) createEvent(selectedTrack.id, 'note', currentTime); setActiveMenu(null); } },
      { label: 'Edit Event', onClick: () => { if (selectedEvent) { console.log('Editing event:', selectedEvent); /* Event editor modal would render here */ } setActiveMenu(null); } },
      { label: 'Delete Event', onClick: () => { if (selectedEvent) deleteEvent(selectedEvent.id); setActiveMenu(null); } },
    ],
    Options: [
      { label: 'Preferences', onClick: () => { openPreferencesModal(); setActiveMenu(null); } },
      { label: 'Audio Settings', onClick: () => { openAudioSettingsModal(); setActiveMenu(null); } },
      { label: 'MIDI Settings', onClick: () => { openMidiSettingsModal(); setActiveMenu(null); } },
      { label: 'Mixer Options', onClick: () => { openMixerOptionsModal(); setActiveMenu(null); } },
      { label: 'Keyboard Shortcuts', onClick: () => { openShortcutsModal(); setActiveMenu(null); } },
    ],
    Help: [
      { label: 'Documentation', onClick: () => { window.open('https://github.com/Raiff1982/ashesinthedawn', '_blank'); setActiveMenu(null); } },
      { label: 'Tutorials', onClick: () => { window.open('https://github.com/Raiff1982/ashesinthedawn/wiki', '_blank'); setActiveMenu(null); } },
      { label: 'About', onClick: () => { openAboutModal(); setActiveMenu(null); } },
    ],
  };

  const handleMenuItemClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  return (
    <div className="h-8 bg-gray-900 border-b border-gray-700 flex items-center px-3 gap-8 text-sm text-gray-300 font-medium relative">
      {Object.entries(menuSections).map(([menuName, items]) => (
        <div key={menuName} className="relative group">
          <button
            onClick={() => handleMenuItemClick(menuName)}
            className="cursor-pointer hover:text-white transition py-1 px-2 rounded hover:bg-gray-800"
          >
            {menuName}
          </button>

          {/* Dropdown Menu */}
          {activeMenu === menuName && (
            <div className="absolute left-0 top-full mt-0 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-max">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition first:rounded-t last:rounded-b whitespace-nowrap"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Close menu when clicking outside */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
