import { useState, useEffect } from 'react';
import { Plus, X, Zap, ChevronDown, Loader } from 'lucide-react';
import { Plugin } from '../types';
import { Tooltip } from './TooltipProvider';

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
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const [executingPlugins, setExecutingPlugins] = useState<Set<string>>(new Set());

  // Simulate real-time plugin execution indicator (increased from 300-500ms to 1-1.5s to reduce CPU load)
  useEffect(() => {
    if (plugins.length === 0) return;

    const interval = setInterval(() => {
      const activePlugins = plugins.filter(p => p.enabled).map(p => p.id);
      if (activePlugins.length > 0) {
        const randomPlugin = activePlugins[Math.floor(Math.random() * activePlugins.length)];
        setExecutingPlugins(new Set([randomPlugin]));
        setTimeout(() => setExecutingPlugins(new Set()), 50);
      }
    }, 1000 + Math.random() * 500);

    return () => clearInterval(interval);
  }, [plugins]);

  // Clear recently added indicator after 2 seconds
  useEffect(() => {
    if (recentlyAdded) {
      const timer = setTimeout(() => setRecentlyAdded(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [recentlyAdded]);

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
      setRecentlyAdded(newPlugin.id);
      setShowPluginMenu(false);
    }
  };

  const getPluginIcon = (type: string) => {
    const plugin = AVAILABLE_PLUGINS.find(p => p.type === type);
    return plugin?.icon || '📦';
  };

  return (
    <div className="w-full bg-gray-800 rounded-lg border border-gray-700 p-3">
      {/* Header with Real-time Indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Zap className="w-3 h-3 text-yellow-500" />
            {plugins.filter(p => p.enabled).length > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <h3 className="text-xs font-semibold text-gray-300">
            Inserts <span className="text-gray-500">({plugins.length})</span>
          </h3>
        </div>
        <div className="relative">
          <Tooltip 
            content={{
              title: 'Add Plugin',
              description: 'Add an effect plugin to the insert chain',
              hotkey: '+',
              category: 'effects',
              relatedFunctions: ['Remove Plugin', 'Bypass', 'Settings'],
              performanceTip: 'Each plugin adds CPU load; plugins execute in order from top to bottom',
              examples: ['Add EQ first to clean up, then Compressor for control', 'Popular chain: EQ → Compressor → Reverb'],
            }}
            position="left"
          >
            <button
              onClick={() => setShowPluginMenu(!showPluginMenu)}
              className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition"
              title="Add plugin to chain"
            >
              <Plus className="w-3 h-3" />
            </button>
          </Tooltip>

          {showPluginMenu && (
            <div className="absolute right-0 bottom-full mb-1 bg-gray-900 border border-gray-600 rounded shadow-lg z-50 min-w-max">
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

      {/* Plugin Slots with Real-time Visualization */}
      <div className="space-y-2">
        {plugins.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-3 italic">
            No plugins. Click + to add.
          </div>
        ) : (
          plugins.map((plugin, index) => (
            <div
              key={plugin.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded border transition relative group ${
                plugin.enabled
                  ? recentlyAdded === plugin.id 
                    ? 'bg-green-800/40 border-green-500 shadow-lg shadow-green-500/20'
                    : executingPlugins.has(plugin.id)
                    ? 'bg-purple-800/40 border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-gray-700 border-gray-600'
                  : 'bg-gray-800 border-gray-700 opacity-60'
              }`}
              title={`${plugin.name} - Slot ${index + 1}${plugin.enabled ? ' (Active)' : ' (Bypassed)'}`}
            >
              {/* Status Indicator with Animation */}
              <div className="relative">
                <div
                  className={`flex-shrink-0 w-2 h-2 rounded-full transition ${
                    plugin.enabled
                      ? 'bg-green-500'
                      : 'bg-gray-500'
                  }`}
                />
                {executingPlugins.has(plugin.id) && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                )}
              </div>

              {/* Plugin Icon */}
              <span className="text-xs flex-shrink-0">
                {getPluginIcon(plugin.type)}
              </span>

              {/* Plugin Name with Type */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-200 font-medium truncate">
                  {plugin.name}
                </div>
                <div className="text-xs text-gray-500">
                  Slot {index + 1}
                </div>
              </div>

              {/* Execution Indicator */}
              {executingPlugins.has(plugin.id) && plugin.enabled && (
                <Loader className="w-3 h-3 text-yellow-400 animate-spin flex-shrink-0" />
              )}

              {/* Recently Added Indicator */}
              {recentlyAdded === plugin.id && (
                <span className="text-xs px-1.5 py-0.5 bg-green-600/50 text-green-300 rounded border border-green-500/50 flex-shrink-0">
                  Added
                </span>
              )}

              {/* Options Dropdown */}
              <div className="relative opacity-0 group-hover:opacity-100 transition">
                <Tooltip 
                  content={{
                    title: 'Plugin Options',
                    description: 'Toggle plugin bypass or remove from chain',
                    hotkey: 'Right-click',
                    category: 'effects',
                    relatedFunctions: ['Add Plugin', 'Settings'],
                    performanceTip: 'Bypassing saves CPU; removing plugin frees memory',
                    examples: ['Bypass to compare before/after', 'Delete to free up processing'],
                  }}
                  position="left"
                >
                  <button
                    onClick={() => setOpenPluginMenu(openPluginMenu === plugin.id ? null : plugin.id)}
                    className="flex-shrink-0 p-0.5 rounded hover:bg-gray-600 text-gray-400 hover:text-gray-200 transition"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </Tooltip>

                {openPluginMenu === plugin.id && (
                  <div className="absolute right-0 bottom-full mb-1 bg-gray-900 border border-gray-600 rounded shadow-lg z-50 min-w-max">
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

      {/* Active Plugins Indicator */}
      {plugins.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <div className="text-gray-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-green-500" />
              {plugins.filter(p => p.enabled).length} active / {plugins.length} total
            </div>
            {plugins.filter(p => !p.enabled).length > 0 && (
              <div className="text-gray-500">
                {plugins.filter(p => !p.enabled).length} bypassed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
