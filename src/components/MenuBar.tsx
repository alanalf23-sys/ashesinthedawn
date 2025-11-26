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
    tracks,
    undo,
    redo,
    updateTrack,
    saveProject,
    openNewProjectModal,
    openExportModal,
  } = useDAW();

  const menuSections: MenuSection = {
    File: [
      { label: 'New Project', onClick: () => { openNewProjectModal(); setActiveMenu(null); }, shortcut: 'Ctrl+N' },
      { label: 'Open Project', onClick: () => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,.corelogic,.cls'; input.onchange = (e: Event) => { const target = e.target as HTMLInputElement; const file = target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev: ProgressEvent<FileReader>) => { try { const result = ev.target?.result; const project = JSON.parse(result as string); console.log('Opening project:', project); } catch { console.error('Invalid project file'); } }; reader.readAsText(file); } }; input.click(); setActiveMenu(null); }, shortcut: 'Ctrl+O' },
      { label: 'Save', onClick: () => { saveProject(); setActiveMenu(null); }, shortcut: 'Ctrl+S' },
      { label: 'Save As...', onClick: () => { const name = prompt('Project name:', 'My Project'); if (name) { console.log('Saving as:', name); saveProject(); } setActiveMenu(null); }, shortcut: 'Ctrl+Shift+S' },
      { divider: true },
      {
        label: 'Export',
        submenu: [
          { label: 'MP3 (320kbps)', onClick: () => { openExportModal(); setActiveMenu(null); } },
          { label: 'WAV (16-bit)', onClick: () => { openExportModal(); setActiveMenu(null); } },
          { label: 'AAC (256kbps)', onClick: () => { openExportModal(); setActiveMenu(null); } },
          { label: 'FLAC (lossless)', onClick: () => { openExportModal(); setActiveMenu(null); } },
        ],
      },
      { divider: true },
      { label: 'Exit', onClick: () => { window.close(); setActiveMenu(null); } },
    ],
    Edit: [
      { label: 'Undo', onClick: () => { undo(); setActiveMenu(null); }, shortcut: 'Ctrl+Z' },
      { label: 'Redo', onClick: () => { redo(); setActiveMenu(null); }, shortcut: 'Ctrl+Y' },
      { divider: true },
      { label: 'Cut', onClick: () => { console.log('Cut selected'); setActiveMenu(null); }, shortcut: 'Ctrl+X', disabled: true },
      { label: 'Copy', onClick: () => { console.log('Copy selected'); setActiveMenu(null); }, shortcut: 'Ctrl+C', disabled: true },
      { label: 'Paste', onClick: () => { console.log('Paste'); setActiveMenu(null); }, shortcut: 'Ctrl+V', disabled: true },
      { divider: true },
      { label: 'Select All', onClick: () => { document.execCommand('selectAll'); setActiveMenu(null); }, shortcut: 'Ctrl+A', disabled: true },
    ],
    View: [
      { label: 'Full Screen', onClick: () => { if (document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen(); } setActiveMenu(null); }, shortcut: 'F11' },
    ],
    Track: [
      {
        label: 'New Track',
        submenu: [
          { label: 'Audio Track', onClick: () => { addTrack('audio'); setActiveMenu(null); }, shortcut: 'Ctrl+T' },
          { label: 'Instrument Track', onClick: () => { addTrack('instrument'); setActiveMenu(null); } },
          { label: 'MIDI Track', onClick: () => { addTrack('midi'); setActiveMenu(null); } },
          { label: 'Aux Track', onClick: () => { addTrack('aux'); setActiveMenu(null); } },
          { label: 'VCA Track', onClick: () => { addTrack('vca'); setActiveMenu(null); } },
        ],
      },
      { divider: true },
      { label: 'Delete Track', onClick: () => { if (selectedTrack) deleteTrack(selectedTrack.id); setActiveMenu(null); }, disabled: !selectedTrack },
      { label: 'Duplicate Track', onClick: () => { if (selectedTrack) { const newTrack = { ...selectedTrack, id: 'track-' + Date.now() }; console.log('Duplicated track:', newTrack); } setActiveMenu(null); }, disabled: !selectedTrack },
      { divider: true },
      { label: 'Mute', onClick: () => { if (selectedTrack) updateTrack(selectedTrack.id, { muted: !selectedTrack.muted }); setActiveMenu(null); }, disabled: !selectedTrack },
      { label: 'Solo', onClick: () => { if (selectedTrack) updateTrack(selectedTrack.id, { soloed: !selectedTrack.soloed }); setActiveMenu(null); }, disabled: !selectedTrack },
      { divider: true },
      { label: 'Mute All Tracks', onClick: () => { const allTracks = tracks.filter(t => !t.muted); allTracks.forEach(t => updateTrack(t.id, { muted: true })); setActiveMenu(null); }, disabled: !tracks.some(t => !t.muted) },
      { label: 'Unmute All Tracks', onClick: () => { const mutedTracks = tracks.filter(t => t.muted); mutedTracks.forEach(t => updateTrack(t.id, { muted: false })); setActiveMenu(null); }, disabled: !tracks.some(t => t.muted) },
    ],
    Clip: [
      { label: 'New Clip', onClick: () => { console.log('Create clip'); setActiveMenu(null); }, disabled: !selectedTrack },
      { label: 'Delete Clip', onClick: () => { console.log('Delete clip'); setActiveMenu(null); }, disabled: true },
      { label: 'Split at Cursor', onClick: () => { console.log('Split clip'); setActiveMenu(null); }, disabled: true },
    ],
    Tools: [
      {
        label: 'Codette AI Assistant',
        submenu: [
          { label: 'Music Theory Reference', onClick: () => { console.log('Open theory reference'); setActiveMenu(null); } },
          { label: 'Composition Helper', onClick: () => { console.log('Open composition helper'); setActiveMenu(null); } },
          { label: 'AI Suggestions Panel', onClick: () => { console.log('Open suggestions'); setActiveMenu(null); } },
          { divider: true },
          { label: 'Delay Sync Calculator', onClick: () => { const bpm = prompt('Enter BPM:', '120'); if (bpm) { const quarter = (60000 / parseFloat(bpm)) / 0.25; alert(`Delay times at ${bpm} BPM:\n• Quarter: ${(quarter/1000).toFixed(2)}s\n• Eighth: ${(quarter*2/1000).toFixed(2)}s\n• Triplet: ${(quarter/1.5/1000).toFixed(2)}s`); } setActiveMenu(null); } },
          { label: 'Genre Analysis', onClick: () => { console.log('Analyze genre'); setActiveMenu(null); } },
          { label: 'Harmonic Progression Analysis', onClick: () => { console.log('Analyze progression'); setActiveMenu(null); } },
          { label: 'Ear Training Exercises', onClick: () => { console.log('Start ear training'); setActiveMenu(null); } },
        ],
      },
    ],
    Help: [
      { label: 'Documentation', onClick: () => { window.open('https://github.com/Raiff1982/ashesinthedawn', '_blank'); setActiveMenu(null); } },
      { label: 'Tutorials', onClick: () => { window.open('https://github.com/Raiff1982/ashesinthedawn/wiki', '_blank'); setActiveMenu(null); } },
      { label: 'Codette Music Knowledge', onClick: () => { alert('Codette has been trained on:\n✓ All music theory (scales, chords, intervals)\n✓ Tempo and rhythm systems\n✓ Musical notation\n✓ 11 genres (Pop, Rock, Jazz, Classical, Electronic, Hip-Hop, Funk, Soul, Country, Latin, Reggae)\n✓ Advanced analysis (harmonic progressions, melodic contour, rhythm patterns)\n✓ Microtonality and spectral analysis\n✓ Composition and ear training'); setActiveMenu(null); } },
      { divider: true },
      { label: 'About CoreLogic Studio', onClick: () => { window.open('https://github.com/Raiff1982/ashesinthedawn', '_blank'); setActiveMenu(null); } },
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
