import { useState } from 'react';
import { Plus, X, Volume2, Zap, ChevronDown } from 'lucide-react';
import { Plugin } from '../types';
import Tooltip from './Tooltip';

interface PluginRackProps {
  plugins: Plugin[];
  onAddPlugin: (plugin: Plugin) => void;
  onRemovePlugin: (pluginId: string) => void;
  onTogglePlugin: (pluginId: string, enabled: boolean) => void;
  trackId: string;
}

const AVAILABLE_PLUGINS = [
  { id: 'eq', name: 'Parametric EQ', type: 'eq' as const, icon: '🎚️' },
  { id: 'comp', name: 'Compressor', type: 'compressor' as const, icon: '⚙️' },
  { id: 'gate', name: 'Gate', type: 'gate' as const, icon: '🚪' },
  { id: 'sat', name: 'Saturation', type: 'saturation' as const, icon: '⚡' },
  { id: 'delay', name: 'Delay', type: 'delay' as const, icon: '⏱️' },
  { id: 'reverb', name: 'Reverb', type: 'reverb' as const, icon: '🌊' },
  { id: 'meter', name: 'Meter', type: 'meter' as const, icon: '📊' },
];

export default function PluginRack({
  plugins,
  onAddPlugin,
  onRemovePlugin,
  onTogglePlugin,
  trackId,
}: PluginRackProps) {
  const [showPluginMenu, setShowPluginMenu] = useState(false);
  const [openPluginMenu, setOpenPluginMenu] = useState<string | null>(null);

  const addPlugin = (type: string) => {
    const pluginDef = AVAILABLE_PLUGINS.find(p => p.id === type);
    if (pluginDef) {
      const newPlugin: Plugin = {
        id: `${type}-${Date.now()}-${trackId}`,
        name: pluginDef.name,
        type: pluginDef.type,
        enabled: true,
        parameters: {},
      };
      onAddPlugin(newPlugin);
      setShowPluginMenu(false);
    }
  };

  return (
    <div className="w-full bg-gray-800 rounded-lg border border-gray-700 p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-2">
          <Zap className="w-3 h-3 text-yellow-500" />
          Inserts ({plugins.length})
        </h3>
        <div className="relative">
          <Tooltip content="Add plugin to insert chain" position="left">
            <button
              onClick={() => setShowPluginMenu(!showPluginMenu)}
              className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              <Plus className="w-3 h-3" />
            </button>
          </Tooltip>

          {showPluginMenu && (
            <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-600 rounded shadow-lg z-50 min-w-max">
              {AVAILABLE_PLUGINS.map((plugin) => (
                <button
                  key={plugin.id}
                  onClick={() => addPlugin(plugin.id)}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition first:rounded-t last:rounded-b whitespace-nowrap flex items-center gap-2"
                >
                  <span>{plugin.icon}</span>
                  {plugin.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Plugin Slots */}
      <div className="space-y-2">
        {plugins.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-3 italic">
            No plugins. Click + to add.
          </div>
        ) : (
          plugins.map((plugin) => (
            <div
              key={plugin.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded border transition relative ${
                plugin.enabled
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-gray-800 border-gray-700 opacity-60'
              }`}
            >
              {/* Status Indicator */}
              <div
                className={`flex-shrink-0 w-2 h-2 rounded-full transition ${
                  plugin.enabled
                    ? 'bg-green-500'
                    : 'bg-gray-500'
                }`}
              />

              {/* Plugin Name */}
              <span className="text-xs text-gray-200 flex-1 truncate font-medium">
                {plugin.name}
              </span>

              {/* Options Dropdown */}
              <div className="relative">
                <Tooltip content="Plugin options" position="left">
                  <button
                    onClick={() => setOpenPluginMenu(openPluginMenu === plugin.id ? null : plugin.id)}
                    className="flex-shrink-0 p-0.5 rounded hover:bg-gray-600 text-gray-400 hover:text-gray-200 transition"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </Tooltip>

                {openPluginMenu === plugin.id && (
                  <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-600 rounded shadow-lg z-50 min-w-max">
                    {/* Toggle Enable/Bypass */}
                    <button
                      onClick={() => {
                        onTogglePlugin(plugin.id, !plugin.enabled);
                        setOpenPluginMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition first:rounded-t whitespace-nowrap flex items-center gap-2"
                    >
                      {plugin.enabled ? '✓ Bypass' : '✕ Enable'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        onRemovePlugin(plugin.id);
                        setOpenPluginMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-600/30 hover:text-red-300 transition last:rounded-b whitespace-nowrap flex items-center gap-2"
                    >
                      <X className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      {plugins.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            {plugins.filter(p => p.enabled).length} active
          </div>
        </div>
      )}
    </div>
  );
}
