import { useState } from 'react';
import { Sliders, Volume2, Trash2 } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

export default function EffectChainPanel() {
  const { selectedTrack, removePluginFromTrack } = useDAW();
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);

  const trackPlugins = selectedTrack?.inserts || [];

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-4 h-4 text-purple-500" />
          <h2 className="text-sm font-semibold text-gray-100">Effect Chain</h2>
        </div>
        <p className="text-xs text-gray-500">Manage effects on selected track</p>
      </div>

      {/* Effect Chain Status */}
      {selectedTrack ? (
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Track: {selectedTrack.name}</p>
          <p className="text-xs text-gray-500">{trackPlugins.length} effects loaded</p>
        </div>
      ) : (
        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <p className="text-xs text-gray-500">Select a track to view effects</p>
        </div>
      )}

      {/* Effect Chain */}
      <div className="flex-1 overflow-y-auto p-3">
        {trackPlugins.length === 0 ? (
          <div className="text-center py-8">
            <Volume2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No effects loaded</p>
            <p className="text-xs text-gray-600 mt-1">Use Plugin Rack to add effects</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trackPlugins.map((plugin, index) => (
              <div key={plugin.id} className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
                {/* Plugin Header */}
                <button
                  onClick={() => setExpandedPlugin(expandedPlugin === plugin.id ? null : plugin.id)}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-750 transition-colors group"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-medium text-gray-200 bg-gray-700 px-1.5 py-0.5 rounded">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-100">{plugin.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-gray-700 rounded">
                      <Volume2 className="w-3 h-3 text-gray-400" />
                    </button>
                    {selectedTrack && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePluginFromTrack(selectedTrack.id, plugin.id);
                        }}
                        className="p-1 hover:bg-red-600/20 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    )}
                  </div>
                </button>

                {/* Plugin Parameters */}
                {expandedPlugin === plugin.id && (
                  <div className="bg-gray-900 border-t border-gray-700 p-3 space-y-3">
                    <div className="text-xs text-gray-400">
                      <p className="font-mono">Type: {plugin.type}</p>
                      <p className="font-mono text-gray-500 mt-1">ID: {plugin.id}</p>
                      {plugin.enabled !== undefined && (
                        <p className="mt-1">
                          Status: {plugin.enabled ? (
                            <span className="text-green-400">Enabled</span>
                          ) : (
                            <span className="text-gray-500">Disabled</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Output Gain */}
      <div className="border-t border-gray-700 bg-gray-800 p-3">
        <label className="text-xs font-semibold text-gray-400 block mb-2">Output Gain</label>
        <div className="flex items-center gap-2">
          <input type="range" min="-12" max="12" defaultValue="0" className="flex-1" />
          <span className="text-xs text-gray-400 w-8 text-right">0 dB</span>
        </div>
      </div>
    </div>
  );
}
