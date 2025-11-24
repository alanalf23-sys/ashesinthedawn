/**
 * Theme Switcher Component
 * Panel for switching between themes and managing custom themes
 */

import { useState } from 'react';
import { Palette, Plus, Download, Upload, Trash2, Edit2 } from 'lucide-react';
import { useTheme } from '../themes/ThemeContext';
import { Theme } from '../themes/types';

export default function ThemeSwitcher() {
  const { currentTheme, themes, switchTheme, createCustomTheme, deleteCustomTheme, exportTheme, importTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomThemeForm, setShowCustomThemeForm] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');

  const handleCreateCustomTheme = () => {
    if (!newThemeName.trim()) return;

    const customTheme: Theme = {
      ...currentTheme,
      id: `custom-${Date.now()}`,
      name: newThemeName,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createCustomTheme(customTheme);
    setNewThemeName('');
    setShowCustomThemeForm(false);
  };

  const handleExport = (themeId: string) => {
    try {
      const json = exportTheme(themeId);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${themeId}.theme.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export theme:', error);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        importTheme(json);
      } catch (error) {
        console.error('Failed to import theme:', error);
        alert('Failed to import theme. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const sortedThemes = Object.values(themes).sort((a, b) => {
    if (a.isCustom !== b.isCustom) return a.isCustom ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all transform hover:scale-110"
        title="Theme Switcher"
      >
        <Palette className="w-5 h-5" />
      </button>

      {/* Theme Switcher Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Theme Manager
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-300 text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Current Theme Info */}
          <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Current</p>
            <p className="text-sm font-semibold text-gray-100">{currentTheme.name}</p>
            <p className="text-xs text-gray-500 mt-1">{currentTheme.description}</p>
          </div>

          {/* Theme List */}
          <div className="max-h-64 overflow-y-auto">
            {/* Preset Themes */}
            <div className="px-4 py-2 bg-gray-800/50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Presets</p>
            </div>

            {sortedThemes
              .filter(t => !t.isCustom)
              .map(theme => (
                <button
                  key={theme.id}
                  onClick={() => switchTheme(theme.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-700 transition-colors ${
                    currentTheme.id === theme.id
                      ? 'bg-blue-600/30 border-l-2 border-l-blue-500'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-100">{theme.name}</p>
                  <p className="text-xs text-gray-500">{theme.category}</p>
                </button>
              ))}

            {/* Custom Themes */}
            {sortedThemes.some(t => t.isCustom) && (
              <>
                <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Custom</p>
                </div>

                {sortedThemes
                  .filter(t => t.isCustom)
                  .map(theme => (
                    <div
                      key={theme.id}
                      className={`flex items-center px-4 py-3 border-b border-gray-700 transition-colors group ${
                        currentTheme.id === theme.id ? 'bg-blue-600/30' : 'hover:bg-gray-800'
                      }`}
                    >
                      <button
                        onClick={() => switchTheme(theme.id)}
                        className="flex-1 text-left"
                      >
                        <p className="text-sm font-medium text-gray-100">{theme.name}</p>
                        <p className="text-xs text-gray-500">Custom theme</p>
                      </button>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleExport(theme.id)}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                          title="Export"
                        >
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => deleteCustomTheme(theme.id)}
                          className="p-1 hover:bg-red-600/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-700 p-3 space-y-2">
            {showCustomThemeForm ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Theme name..."
                  value={newThemeName}
                  onChange={e => setNewThemeName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  onKeyPress={e => {
                    if (e.key === 'Enter') handleCreateCustomTheme();
                    if (e.key === 'Escape') setShowCustomThemeForm(false);
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateCustomTheme}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCustomThemeForm(false)}
                    className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowCustomThemeForm(true)}
                  className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 text-sm rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Save Current as Custom
                </button>

                <label className="block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <div className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 text-sm rounded transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Import Theme
                  </div>
                </label>

                <button
                  onClick={() => handleExport(currentTheme.id)}
                  className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 text-sm rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Current
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
