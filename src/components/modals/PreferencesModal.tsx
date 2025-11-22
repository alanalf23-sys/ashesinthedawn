import { useState } from 'react';
import { X } from 'lucide-react';
import { useDAW } from '../../contexts/DAWContext';

export default function PreferencesModal() {
  const { showPreferencesModal, closePreferencesModal } = useDAW();
  const [theme, setTheme] = useState('dark');
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(16);
  const [playbackLatency, setPlaybackLatency] = useState(256);

  if (!showPreferencesModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Preferences</h2>
          <button
            onClick={closePreferencesModal}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* General */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">General</h3>
            <div className="space-y-3 pl-4 border-l border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-300">Auto-save enabled</span>
                </label>
              </div>

              {autoSave && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Auto-save interval (minutes)
                  </label>
                  <input
                    type="number"
                    value={autoSaveInterval}
                    onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                    min="1"
                    max="60"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Editor */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Editor</h3>
            <div className="space-y-3 pl-4 border-l border-gray-700">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-300">Snap to grid</span>
                </label>
              </div>

              {snapToGrid && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Grid size (divisions per beat)
                  </label>
                  <select
                    value={gridSize}
                    onChange={(e) => setGridSize(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={4}>4 (Quarter notes)</option>
                    <option value={8}>8 (Eighth notes)</option>
                    <option value={16}>16 (Sixteenth notes)</option>
                    <option value={32}>32 (Thirty-second notes)</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Audio */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Audio</h3>
            <div className="space-y-3 pl-4 border-l border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Buffer Size (samples)
                </label>
                <select
                  value={playbackLatency}
                  onChange={(e) => setPlaybackLatency(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={64}>64 (0.67ms @ 96kHz)</option>
                  <option value={128}>128 (1.33ms @ 96kHz)</option>
                  <option value={256}>256 (2.67ms @ 96kHz)</option>
                  <option value={512}>512 (5.33ms @ 96kHz)</option>
                  <option value={1024}>1024 (10.67ms @ 96kHz)</option>
                </select>
              </div>

              <div className="text-xs text-gray-500">
                Lower latency = more responsive but higher CPU usage
              </div>
            </div>
          </section>
        </div>

        <div className="flex gap-2 mt-8">
          <button
            onClick={closePreferencesModal}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
