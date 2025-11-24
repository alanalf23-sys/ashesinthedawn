import { useState, useMemo } from 'react';
import { Search, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

interface PluginCategory {
  name: string;
  plugins: string[];
}

const PLUGIN_LIBRARY: PluginCategory[] = [
  {
    name: 'EQ',
    plugins: ['4-Band Parametric', '31-Band Graphic', 'Linear Phase EQ', 'Dynamic EQ'],
  },
  {
    name: 'Compression',
    plugins: ['FET Compressor', 'VCA Compressor', 'Optical Compressor', 'Multiband'],
  },
  {
    name: 'Reverb',
    plugins: ['Room Reverb', 'Hall Reverb', 'Plate Reverb', 'Spring Reverb'],
  },
  {
    name: 'Delay',
    plugins: ['Analog Delay', 'Digital Delay', 'Multitap Delay', 'Ping Pong Delay'],
  },
  {
    name: 'Saturation',
    plugins: ['Soft Clipper', 'Tape Saturation', 'Waveshaper', 'Distortion'],
  },
  {
    name: 'Utility',
    plugins: ['Gain', 'Phase Invert', 'Mono/Stereo', 'Spectrum Analyzer'],
  },
];

export default function PluginBrowser() {
  const { selectedTrack, loadPlugin, loadedPlugins, unloadPlugin } = useDAW();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('EQ');
  const [loadingPlugin, setLoadingPlugin] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return PLUGIN_LIBRARY;

    const term = searchTerm.toLowerCase();
    return PLUGIN_LIBRARY.map(cat => ({
      ...cat,
      plugins: cat.plugins.filter(p => p.toLowerCase().includes(term)),
    })).filter(cat => cat.plugins.length > 0);
  }, [searchTerm]);

  const handleLoadPlugin = async (pluginName: string) => {
    if (!selectedTrack) {
      alert('Please select a track first');
      return;
    }

    setLoadingPlugin(pluginName);
    try {
      loadPlugin(selectedTrack.id, pluginName);
      console.log(`Loaded ${pluginName} on ${selectedTrack.name}`);
    } catch (error) {
      console.error('Failed to load plugin:', error);
    } finally {
      setLoadingPlugin(null);
    }
  };

  const trackPlugins = selectedTrack ? loadedPlugins.get(selectedTrack.id) || [] : [];

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-100 mb-3">Plugin Browser</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 pl-9 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Selected Track Info */}
      {selectedTrack && (
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
          <p className="text-xs text-gray-400">Selected Track</p>
          <p className="text-sm font-medium text-gray-100">{selectedTrack.name}</p>
          <p className="text-xs text-gray-500 mt-1">{trackPlugins.length} plugin(s) loaded</p>
        </div>
      )}

      {/* Plugin Categories */}
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-xs">
            No plugins found matching "{searchTerm}"
          </div>
        ) : (
          filteredCategories.map(category => (
            <div key={category.name} className="border-b border-gray-700">
              <button
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category.name ? null : category.name
                  )
                }
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <ChevronRight
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    expandedCategory === category.name ? 'rotate-90' : ''
                  }`}
                />
                <span className="text-sm font-medium text-gray-300">{category.name}</span>
                <span className="text-xs text-gray-500 ml-auto">{category.plugins.length}</span>
              </button>

              {expandedCategory === category.name && (
                <div className="bg-gray-800 border-t border-gray-700">
                  {category.plugins.map(plugin => (
                    <div
                      key={plugin}
                      className="px-6 py-2 flex items-center justify-between hover:bg-gray-750 transition-colors group"
                    >
                      <span className="text-xs text-gray-300">{plugin}</span>
                      <button
                        onClick={() => handleLoadPlugin(plugin)}
                        disabled={loadingPlugin === plugin || !selectedTrack}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Plus className="w-4 h-4 text-blue-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Loaded Plugins */}
      {trackPlugins.length > 0 && (
        <div className="border-t border-gray-700 bg-gray-800 p-3">
          <p className="text-xs font-semibold text-gray-400 mb-2">Active Plugins</p>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {trackPlugins.map(plugin => (
              <div key={plugin.id} className="flex items-center justify-between bg-gray-900 p-1 rounded">
                <span className="text-xs text-gray-300">{plugin.name}</span>
                <button
                  onClick={() => unloadPlugin(selectedTrack!.id, plugin.id)}
                  className="p-0.5 rounded hover:bg-red-600/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
