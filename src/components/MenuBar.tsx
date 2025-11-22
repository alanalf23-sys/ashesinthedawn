import { useState } from 'react';
import { useDAW } from '../contexts/DAWContext';

interface MenuItem {
  label?: string;
  onClick?: () => void;
  submenu?: MenuItem[];
  divider?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

interface MenuSection {
  [key: string]: MenuItem[];
}

function Submenu({ items, onClose }: { items: MenuItem[]; label?: string; onClose: () => void }) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  return (
    <div
      className="absolute left-0 top-full bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-max mt-0"
      onMouseLeave={() => setOpenSubmenu(null)}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.divider ? (
            <div className="h-px bg-gray-700 my-1" />
          ) : (
            <div
              className="relative group"
              onMouseEnter={() => item.submenu && item.label && setOpenSubmenu(item.label)}
              onMouseLeave={() => item.submenu && setOpenSubmenu(null)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.onClick && !item.disabled) {
                    item.onClick();
                  }
                  if (!item.submenu) {
                    onClose();
                  }
                }}
                disabled={item.disabled}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between whitespace-nowrap transition ${
                  item.disabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                <div className="flex items-center gap-2 ml-4">
                  {item.shortcut && <span className="text-xs text-gray-500">{item.shortcut}</span>}
                  {item.submenu && <span className="text-xs">▶</span>}
                </div>
              </button>

              {item.submenu && openSubmenu === item.label && (
                <div className="absolute left-full top-0 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-max">
                  {item.submenu.map((subitem, subidx) => (
                    <button
                      key={subidx}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (subitem.onClick && !subitem.disabled) {
                          subitem.onClick();
                        }
                        onClose();
                      }}
                      disabled={subitem.disabled}
                      className={`w-full text-left px-4 py-2 text-sm whitespace-nowrap transition ${
                        subitem.disabled
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {subitem.label}
                      {subitem.shortcut && <span className="text-xs text-gray-500 float-right">{subitem.shortcut}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
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
    openSaveAsModal,
    toggleFullscreen,
    toggleMixerVisibility,
    exportAudio,
    createClip,
    deleteClip,
    splitClip,
    quantizeClip,
    selectedClip,
    createEvent,
    deleteEvent,
    selectedEvent,
    openAudioSettingsModal,
    openShortcutsModal,
    openAboutModal,
  } = useDAW();

  const menuSections: MenuSection = {
    File: [
      { label: 'New Project', onClick: () => { openNewProjectModal(); setActiveMenu(null); }, shortcut: 'Ctrl+N' },
      { label: 'Open Project', onClick: () => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,.corelogic,.cls'; input.click(); setActiveMenu(null); }, shortcut: 'Ctrl+O' },
      { label: 'Save', onClick: () => { saveProject(); setActiveMenu(null); }, shortcut: 'Ctrl+S' },
      { label: 'Save As...', onClick: () => { openSaveAsModal(); setActiveMenu(null); }, shortcut: 'Ctrl+Shift+S' },
      { divider: true },
      {
        label: 'Export',
        submenu: [
          { label: 'MP3 (320kbps)', onClick: () => { exportAudio('mp3', 'high'); setActiveMenu(null); } },
          { label: 'WAV (16-bit)', onClick: () => { exportAudio('wav', 'high'); setActiveMenu(null); } },
          { label: 'AAC (256kbps)', onClick: () => { exportAudio('aac', 'high'); setActiveMenu(null); } },
          { label: 'FLAC (lossless)', onClick: () => { exportAudio('flac', 'high'); setActiveMenu(null); } },
        ],
      },
      { divider: true },
      { label: 'Exit', onClick: () => { window.close(); setActiveMenu(null); } },
    ],
    Edit: [
      { label: 'Undo', onClick: () => { undo(); setActiveMenu(null); }, shortcut: 'Ctrl+Z' },
      { label: 'Redo', onClick: () => { redo(); setActiveMenu(null); }, shortcut: 'Ctrl+Y' },
      { divider: true },
      { label: 'Cut', onClick: () => { cut(); setActiveMenu(null); }, shortcut: 'Ctrl+X' },
      { label: 'Copy', onClick: () => { copy(); setActiveMenu(null); }, shortcut: 'Ctrl+C' },
      { label: 'Paste', onClick: () => { paste(); setActiveMenu(null); }, shortcut: 'Ctrl+V' },
      { divider: true },
      { label: 'Select All', onClick: () => { document.execCommand('selectAll'); setActiveMenu(null); }, shortcut: 'Ctrl+A' },
    ],
    View: [
      { label: 'Zoom In', onClick: () => { zoomIn(); setActiveMenu(null); }, shortcut: 'Ctrl++' },
      { label: 'Zoom Out', onClick: () => { zoomOut(); setActiveMenu(null); }, shortcut: 'Ctrl+-' },
      { label: 'Reset Zoom', onClick: () => { resetZoom(); setActiveMenu(null); }, shortcut: 'Ctrl+0' },
      { divider: true },
      { label: 'Full Screen', onClick: () => { toggleFullscreen(); setActiveMenu(null); }, shortcut: 'F11' },
      { label: 'Show Mixer', onClick: () => { toggleMixerVisibility(); setActiveMenu(null); }, shortcut: 'Ctrl+M' },
    ],
    Track: [
      {
        label: 'New Track',
        submenu: [
          { label: 'Audio Track', onClick: () => { addTrack('audio'); setActiveMenu(null); }, shortcut: 'Ctrl+T' },
          { label: 'Instrument Track', onClick: () => { addTrack('instrument'); setActiveMenu(null); } },
          { label: 'MIDI Track', onClick: () => { addTrack('midi'); setActiveMenu(null); } },
          { label: 'Aux Track', onClick: () => { addTrack('aux'); setActiveMenu(null); } },
        ],
      },
      { divider: true },
      { label: 'Delete Track', onClick: () => { if (selectedTrack) deleteTrack(selectedTrack.id); setActiveMenu(null); }, disabled: !selectedTrack },
      { label: 'Duplicate Track', onClick: () => { if (selectedTrack) duplicateTrack(selectedTrack.id); setActiveMenu(null); }, disabled: !selectedTrack },
      { divider: true },
      { label: 'Mute', onClick: () => { if (selectedTrack) muteTrack(selectedTrack.id, !selectedTrack.muted); setActiveMenu(null); }, disabled: !selectedTrack },
      { label: 'Solo', onClick: () => { if (selectedTrack) soloTrack(selectedTrack.id, !selectedTrack.soloed); setActiveMenu(null); }, disabled: !selectedTrack },
      { divider: true },
      { label: 'Mute All Tracks', onClick: () => { muteAllTracks(); setActiveMenu(null); } },
      { label: 'Unmute All Tracks', onClick: () => { unmuteAllTracks(); setActiveMenu(null); } },
    ],
    Clip: [
      { label: 'New Clip', onClick: () => { if (selectedTrack) createClip(selectedTrack.id, currentTime, 1); setActiveMenu(null); }, disabled: !selectedTrack },
      { label: 'Delete Clip', onClick: () => { if (selectedClip) deleteClip(selectedClip.id); setActiveMenu(null); }, disabled: !selectedClip },
      { label: 'Split at Cursor', onClick: () => { if (selectedClip) splitClip(selectedClip.id, currentTime); setActiveMenu(null); }, disabled: !selectedClip },
      { divider: true },
      {
        label: 'Quantize',
        submenu: [
          { label: '1/16 Note', onClick: () => { if (selectedClip) quantizeClip(selectedClip.id, 0.0625); setActiveMenu(null); } },
          { label: '1/8 Note', onClick: () => { if (selectedClip) quantizeClip(selectedClip.id, 0.125); setActiveMenu(null); } },
          { label: '1/4 Note', onClick: () => { if (selectedClip) quantizeClip(selectedClip.id, 0.25); setActiveMenu(null); } },
          { label: 'Beat', onClick: () => { if (selectedClip) quantizeClip(selectedClip.id, 1); setActiveMenu(null); } },
        ],
        disabled: !selectedClip,
      },
    ],
    Event: [
      { label: 'Create Event', onClick: () => { if (selectedTrack) createEvent(selectedTrack.id, 'note', currentTime); setActiveMenu(null); }, disabled: !selectedTrack },
      { label: 'Delete Event', onClick: () => { if (selectedEvent) deleteEvent(selectedEvent.id); setActiveMenu(null); }, disabled: !selectedEvent },
    ],
    Options: [
      { label: 'Audio Settings', onClick: () => { openAudioSettingsModal(); setActiveMenu(null); } },
      { divider: true },
      { label: 'Keyboard Shortcuts', onClick: () => { openShortcutsModal(); setActiveMenu(null); }, shortcut: 'Ctrl+?' },
    ],
    Help: [
      { label: 'Documentation', onClick: () => { window.open('https://github.com/Raiff1982/ashesinthedawn', '_blank'); setActiveMenu(null); } },
      { label: 'Tutorials', onClick: () => { window.open('https://github.com/Raiff1982/ashesinthedawn/wiki', '_blank'); setActiveMenu(null); } },
      { divider: true },
      { label: 'About CoreLogic Studio', onClick: () => { openAboutModal(); setActiveMenu(null); } },
    ],
  };

  const handleMenuItemClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  return (
    <div className="h-8 bg-gray-900 border-b border-gray-700 flex items-center px-3 gap-8 text-sm text-gray-300 font-medium relative">
      {Object.entries(menuSections).map(([menuName, items]) => (
        <div key={menuName} className="relative">
          <button
            onClick={() => handleMenuItemClick(menuName)}
            className="cursor-pointer hover:text-white transition py-1 px-2 rounded hover:bg-gray-800"
          >
            {menuName}
          </button>

          {/* Dropdown Menu */}
          {activeMenu === menuName && (
            <Submenu
              items={items}
              label={menuName}
              onClose={() => setActiveMenu(null)}
            />
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
