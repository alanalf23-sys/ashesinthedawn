/**
 * Enhanced Plugin Browser with Plugin Scanning and Presets
 * Extends FXBrowser.tsx with real plugin discovery and preset management
 * 
 * Integration Instructions:
 * 1. Replace existing FXBrowser.tsx or use alongside it
 * 2. Import usePlugins, usePluginPresets from hooks
 * 3. Call register_all_endpoints() in codette_server_unified.py startup
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Star,
  Filter,
  ChevronRight,
  ChevronDown,
  Download,
  Settings,
  Save,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { usePopoutWindow } from '../hooks/usePopoutWindow';

// ============================================================================
// HOOKS FOR PLUGIN MANAGEMENT
// ============================================================================

/**
 * usePlugins - Manage plugin discovery and scanning
 */
export function usePlugins(baseUrl: string = 'http://localhost:8000') {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const scanPlugins = useCallback(async (force = false) => {
    try {
      setScanning(true);
      setError(null);
      setScanProgress(0);

      const response = await fetch(
        `${baseUrl}/api/plugins/scan?force=${force}`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setPlugins(data.plugins);
      setScanProgress(100);

      return data.plugins;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      setError(message);
      return [];
    } finally {
      setScanning(false);
    }
  }, [baseUrl]);

  const getPlugins = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${baseUrl}/api/plugins`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setPlugins(data.plugins);
      return data.plugins;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load plugins';
      setError(message);
      return [];
    }
  }, [baseUrl]);

  const getPluginsByCategory = useCallback(
    async (category: string) => {
      try {
        setError(null);
        const response = await fetch(`${baseUrl}/api/plugins/category/${category}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        return data.plugins;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load plugins';
        setError(message);
        return [];
      }
    },
    [baseUrl]
  );

  // Load plugins on mount
  useEffect(() => {
    getPlugins();
  }, [getPlugins]);

  return {
    plugins,
    scanning,
    scanProgress,
    error,
    scanPlugins,
    getPlugins,
    getPluginsByCategory
  };
}

/**
 * usePluginPresets - Manage plugin presets with CRUD operations
 */
export function usePluginPresets(baseUrl: string = 'http://localhost:8000') {
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPluginPresets = useCallback(async (pluginId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${baseUrl}/api/plugins/${encodeURIComponent(pluginId)}/presets`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setPresets(data.presets);
      return data.presets;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load presets';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const createPreset = useCallback(
    async (pluginId: string, name: string, data: Record<string, any>, description = '', tags: string[] = []) => {
      try {
        setError(null);
        const params = new URLSearchParams({
          name,
          description,
          tags: JSON.stringify(tags)
        });

        const response = await fetch(
          `${baseUrl}/api/plugins/${encodeURIComponent(pluginId)}/presets?${params}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const newPreset = await response.json();
        setPresets(prev => [...prev, newPreset]);
        return newPreset;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create preset';
        setError(message);
        return null;
      }
    },
    [baseUrl]
  );

  const updatePreset = useCallback(
    async (pluginId: string, presetId: string, updates: any) => {
      try {
        setError(null);
        const params = new URLSearchParams();
        if (updates.name) params.append('name', updates.name);
        if (updates.description !== undefined) params.append('description', updates.description);
        if (updates.tags) params.append('tags', JSON.stringify(updates.tags));

        const response = await fetch(
          `${baseUrl}/api/plugins/${encodeURIComponent(pluginId)}/presets/${presetId}?${params}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: updates.data ? JSON.stringify(updates.data) : undefined
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const updated = await response.json();
        setPresets(prev => prev.map(p => (p.id === presetId ? updated : p)));
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update preset';
        setError(message);
        return null;
      }
    },
    [baseUrl]
  );

  const deletePreset = useCallback(
    async (pluginId: string, presetId: string) => {
      try {
        setError(null);
        const response = await fetch(
          `${baseUrl}/api/plugins/${encodeURIComponent(pluginId)}/presets/${presetId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        setPresets(prev => prev.filter(p => p.id !== presetId));
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete preset';
        setError(message);
        return false;
      }
    },
    [baseUrl]
  );

  const searchPresets = useCallback(
    async (query: string) => {
      try {
        setError(null);
        const response = await fetch(
          `${baseUrl}/api/presets/search?query=${encodeURIComponent(query)}`
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        return data.presets;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed';
        setError(message);
        return [];
      }
    },
    [baseUrl]
  );

  return {
    presets,
    loading,
    error,
    getPluginPresets,
    createPreset,
    updatePreset,
    deletePreset,
    searchPresets
  };
}

// ============================================================================
// ENHANCED PLUGIN BROWSER COMPONENT
// ============================================================================

interface EnhancedFXBrowserProps {
  className?: string;
  isPopout?: boolean;
  onClose?: () => void;
}

export function EnhancedFXBrowser({
  className = '',
  isPopout = false,
  onClose
}: EnhancedFXBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<any | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');

  const { plugins, scanning, scanProgress, scanPlugins } = usePlugins();
  const { presets, getPluginPresets, createPreset, deletePreset } = usePluginPresets();
  const { openPopout } = usePopoutWindow('PluginBrowser', { width: 900, height: 700 });

  // Filter plugins
  const filteredPlugins = useMemo(() => {
    let result = plugins;

    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.manufacturer.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [plugins, selectedCategory, searchQuery]);

  // Get categories
  const categories = useMemo(() => {
    const cats = new Set(plugins.map(p => p.category));
    return Array.from(cats).sort();
  }, [plugins]);

  const handleSelectPlugin = useCallback(async (plugin: any) => {
    setSelectedPlugin(plugin);
    await getPluginPresets(plugin.id);
  }, [getPluginPresets]);

  const handleSavePreset = useCallback(async () => {
    if (!selectedPlugin || !presetName) return;

    const preset = await createPreset(
      selectedPlugin.id,
      presetName,
      {},
      `Auto-saved on ${new Date().toLocaleDateString()}`
    );

    if (preset) {
      setPresetName('');
      // Show confirmation
    }
  }, [selectedPlugin, presetName, createPreset]);

  const handleScanPlugins = useCallback(() => {
    scanPlugins(true);
  }, [scanPlugins]);

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Plugin Browser</h2>
          {scanning && (
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">{Math.round(scanProgress)}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleScanPlugins}
            disabled={scanning}
            className="p-2 hover:bg-gray-700 rounded-lg disabled:opacity-50"
            title="Scan for plugins"
          >
            <Download className="w-4 h-4" />
          </button>
          {!isPopout && (
            <button
              onClick={openPopout}
              className="p-2 hover:bg-gray-700 rounded-lg"
              title="Pop-out window"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {isPopout && onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search plugins..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Categories */}
        <div className="w-48 border-r border-gray-700 overflow-y-auto">
          <div className="p-4 space-y-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg transition ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-800'
              }`}
            >
              All Plugins
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-800'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Plugin List */}
        <div className="flex-1 border-r border-gray-700 overflow-y-auto">
          <div className="divide-y divide-gray-700">
            {filteredPlugins.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {scanning ? 'Scanning for plugins...' : 'No plugins found'}
              </div>
            ) : (
              filteredPlugins.map(plugin => (
                <button
                  key={plugin.id}
                  onClick={() => handleSelectPlugin(plugin)}
                  className={`w-full text-left p-4 transition ${
                    selectedPlugin?.id === plugin.id
                      ? 'bg-blue-600/20 border-l-2 border-blue-600'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <div className="font-medium">{plugin.name}</div>
                  <div className="text-sm text-gray-400">{plugin.manufacturer}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Details/Presets Panel */}
        {selectedPlugin && (
          <div className="w-64 overflow-y-auto bg-gray-800/50 p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedPlugin.name}</h3>
                <p className="text-sm text-gray-400">{selectedPlugin.manufacturer}</p>
              </div>

              {selectedPlugin.description && (
                <p className="text-sm text-gray-300">{selectedPlugin.description}</p>
              )}

              {/* Presets Section */}
              <div>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowPresets(!showPresets)}
                >
                  <h4 className="font-medium">Presets</h4>
                  {showPresets ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>

                {showPresets && (
                  <div className="mt-2 space-y-2">
                    {presets.length === 0 ? (
                      <p className="text-sm text-gray-500">No presets</p>
                    ) : (
                      presets.map(preset => (
                        <div
                          key={preset.id}
                          className="flex items-center justify-between p-2 bg-gray-700/50 rounded text-sm"
                        >
                          <span>{preset.name}</span>
                          <button
                            onClick={() => deletePreset(selectedPlugin.id, preset.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}

                    {/* Save Preset */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={presetName}
                        onChange={e => setPresetName(e.target.value)}
                        placeholder="New preset..."
                        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleSavePreset}
                        className="p-1 bg-blue-600 hover:bg-blue-700 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
