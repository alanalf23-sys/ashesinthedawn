import { X } from 'lucide-react';
import { useDAW } from '../../contexts/DAWContext';

export default function ShortcutsModal() {
  const { showShortcutsModal, closeShortcutsModal } = useDAW();

  const shortcuts = [
    { category: 'Playback', items: [
      { key: 'Space', action: 'Play/Pause' },
      { key: 'Stop', action: 'Stop playback' },
      { key: 'Ctrl+Shift+Z', action: 'Go to start' },
      { key: 'Ctrl+Z', action: 'Undo' },
      { key: 'Ctrl+Shift+Z', action: 'Redo' },
    ]},
    { category: 'Editing', items: [
      { key: 'Ctrl+X', action: 'Cut' },
      { key: 'Ctrl+C', action: 'Copy' },
      { key: 'Ctrl+V', action: 'Paste' },
      { key: 'Ctrl+D', action: 'Duplicate' },
      { key: 'Delete', action: 'Delete selected' },
    ]},
    { category: 'Track', items: [
      { key: 'Ctrl+T', action: 'New track' },
      { key: 'M', action: 'Mute/unmute' },
      { key: 'S', action: 'Solo/unsolo' },
      { key: 'Ctrl+Shift+M', action: 'Mute all' },
      { key: 'Ctrl+Shift+S', action: 'Unsolo all' },
    ]},
    { category: 'View', items: [
      { key: 'Ctrl++', action: 'Zoom in' },
      { key: 'Ctrl+-', action: 'Zoom out' },
      { key: 'Ctrl+0', action: 'Reset zoom' },
      { key: 'F', action: 'Toggle fullscreen' },
      { key: 'Ctrl+M', action: 'Toggle mixer' },
    ]},
    { category: 'File', items: [
      { key: 'Ctrl+N', action: 'New project' },
      { key: 'Ctrl+O', action: 'Open project' },
      { key: 'Ctrl+S', action: 'Save' },
      { key: 'Ctrl+Shift+S', action: 'Save as' },
      { key: 'Ctrl+E', action: 'Export' },
    ]},
  ];

  if (!showShortcutsModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={closeShortcutsModal}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between px-3 py-2 bg-gray-800 border border-gray-700 rounded hover:border-gray-600 transition"
                  >
                    <span className="text-sm text-gray-300">{item.action}</span>
                    <kbd className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono text-gray-300">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={closeShortcutsModal}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
