import { X } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  category: 'transport' | 'track' | 'editing' | 'navigation' | 'other';
  platform?: 'windows' | 'mac' | 'all';
}

const KEYBOARD_SHORTCUTS: Shortcut[] = [
  // Transport Controls
  {
    key: 'Space',
    description: 'Play / Stop playback',
    category: 'transport',
  },
  {
    key: 'R',
    description: 'Rewind to start (0:00)',
    category: 'transport',
  },
  {
    key: 'Shift + Space',
    description: 'Play from current cursor position',
    category: 'transport',
  },

  // Track Management
  {
    key: 'Ctrl + T',
    description: 'Add new audio track',
    category: 'track',
  },
  {
    key: 'Ctrl + M',
    description: 'Add new instrument track',
    category: 'track',
  },
  {
    key: 'Delete',
    description: 'Delete selected track',
    category: 'track',
  },
  {
    key: 'M',
    description: 'Mute / Unmute selected track',
    category: 'track',
  },
  {
    key: 'S',
    description: 'Solo / Unsolo selected track',
    category: 'track',
  },
  {
    key: 'A',
    description: 'Arm / Disarm selected track for recording',
    category: 'track',
  },

  // Editing
  {
    key: 'Ctrl + S',
    description: 'Save project to storage',
    category: 'editing',
  },
  {
    key: 'Ctrl + E',
    description: 'Export project as JSON',
    category: 'editing',
  },
  {
    key: 'Ctrl + I',
    description: 'Import project from file',
    category: 'editing',
  },
  {
    key: 'Ctrl + Z',
    description: 'Undo last action',
    category: 'editing',
  },
  {
    key: 'Ctrl + Y',
    description: 'Redo last undone action',
    category: 'editing',
  },
  {
    key: 'Ctrl + A',
    description: 'Select all tracks',
    category: 'editing',
  },

  // Navigation
  {
    key: 'Tab',
    description: 'Cycle through sidebar tabs',
    category: 'navigation',
  },
  {
    key: 'Shift + Tab',
    description: 'Cycle tabs backwards',
    category: 'navigation',
  },
  {
    key: 'Up / Down Arrow',
    description: 'Select previous / next track',
    category: 'navigation',
  },
  {
    key: 'Left / Right Arrow',
    description: 'Seek backwards / forwards (1 second)',
    category: 'navigation',
  },

  // Other
  {
    key: 'H',
    description: 'Open this help / shortcuts dialog',
    category: 'other',
  },
  {
    key: '?',
    description: 'Toggle help overlay',
    category: 'other',
  },
  {
    key: 'Ctrl + ,',
    description: 'Open preferences / settings',
    category: 'other',
  },
];

const CATEGORY_LABELS: Record<Shortcut['category'], string> = {
  transport: '⏯️ Transport Controls',
  track: '🎵 Track Management',
  editing: '✏️ Editing',
  navigation: '🧭 Navigation',
  other: '⚙️ Other',
};

const CATEGORY_ORDER: Shortcut['category'][] = [
  'transport',
  'track',
  'editing',
  'navigation',
  'other',
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = KEYBOARD_SHORTCUTS.filter((s) => s.category === category);
      return acc;
    },
    {} as Record<Shortcut['category'], Shortcut[]>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800">
          <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition text-gray-400 hover:text-gray-200"
            title="Close (Esc)"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {CATEGORY_ORDER.map((category) => {
              const shortcuts = groupedShortcuts[category];
              if (shortcuts.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">
                    {CATEGORY_LABELS[category]}
                  </h3>

                  <div className="space-y-2">
                    {shortcuts.map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition"
                      >
                        <span className="text-gray-300">{shortcut.description}</span>
                        <kbd className="px-3 py-1 bg-gray-900 border border-gray-600 rounded text-sm font-mono text-gray-200">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700/30 rounded text-sm text-blue-300">
            <p className="mb-2">
              💡 <strong>Pro Tip:</strong> Many shortcuts follow standard conventions:
            </p>
            <ul className="ml-6 space-y-1 list-disc">
              <li>Ctrl+S to save, Ctrl+Z to undo</li>
              <li>Space to play, arrow keys to navigate</li>
              <li>Delete to remove items</li>
              <li>M/S/A for Mute/Solo/Arm on tracks</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Total shortcuts: {KEYBOARD_SHORTCUTS.length}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Close on Escape */}
      {isOpen && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                  // Dispatch close event
                  window.dispatchEvent(new CustomEvent('closeShortcutsModal'));
                }
              });
            `,
          }}
        />
      )}
    </div>
  );
}
