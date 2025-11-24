import React, { useState, useEffect } from 'react';
import { Trash2, Zap, Download, Upload } from 'lucide-react';
import { ParameterMapping, getParameterMapperEngine } from '../lib/parameterMapperEngine';
import { useDAW } from '../contexts/DAWContext';
import type { MidiDevice } from '../types';

interface PluginParameterMapperProps {
  pluginId: string;
  pluginName: string;
  onMappingChange?: (mappings: ParameterMapping[]) => void;
}

export const PluginParameterMapper: React.FC<PluginParameterMapperProps> = ({
  pluginId,
  pluginName,
  onMappingChange,
}) => {
  const { midiDevices } = useDAW();
  const [mappings, setMappings] = useState<ParameterMapping[]>([]);
  const [learningId, setLearningId] = useState<string | null>(null);
  const [showNewMappingForm, setShowNewMappingForm] = useState(false);
  const [newMappingParam, setNewMappingParam] = useState('');
  const [newMappingChannel, setNewMappingChannel] = useState(1);
  const mapperEngine = getParameterMapperEngine();

  // Load mappings for this plugin
  useEffect(() => {
    const pluginMappings = mapperEngine.getMappingsForPlugin(pluginId);
    setMappings(pluginMappings);
  }, [pluginId, mapperEngine]);

  // Handle learning mode
  useEffect(() => {
    if (learningId) {
      mapperEngine.startLearning(learningId);
      const timer = setTimeout(() => {
        setLearningId(null);
        mapperEngine.stopLearning();
      }, 5000); // 5 second timeout

      return () => {
        clearTimeout(timer);
        mapperEngine.stopLearning();
      };
    }
  }, [learningId, mapperEngine]);

  const handleAddMapping = (
    paramId: string,
    paramName: string,
    midiChannel: number
  ) => {
    const mapping = mapperEngine.addMapping({
      pluginId,
      parameterId: paramId,
      name: paramName,
      midiChannel,
      midiCC: 0,
      minValue: 0,
      maxValue: 1,
      midiMin: 0,
      midiMax: 127,
      enabled: true,
    });

    setLearningId(mapping);
    const updated = mapperEngine.getMappingsForPlugin(pluginId);
    setMappings(updated);
    onMappingChange?.(updated);
  };

  const handleCreateNewMapping = () => {
    if (newMappingParam.trim()) {
      handleAddMapping(
        `param-${Date.now()}`,
        newMappingParam,
        newMappingChannel
      );
      setNewMappingParam('');
      setNewMappingChannel(1);
      setShowNewMappingForm(false);
    }
  };

  const handleDeleteMapping = (mappingId: string) => {
    mapperEngine.removeMapping(mappingId);
    const updated = mapperEngine.getMappingsForPlugin(pluginId);
    setMappings(updated);
    onMappingChange?.(updated);
  };

  const handleToggleMappingEnabled = (mappingId: string) => {
    const mapping = mappings.find(m => m.id === mappingId);
    if (mapping) {
      mapperEngine.updateMapping(mappingId, {
        enabled: !mapping.enabled,
      });
      const updated = mapperEngine.getMappingsForPlugin(pluginId);
      setMappings(updated);
      onMappingChange?.(updated);
    }
  };

  const handleUpdateMapping = (
    mappingId: string,
    updates: Partial<ParameterMapping>
  ) => {
    mapperEngine.updateMapping(mappingId, updates);
    const updated = mapperEngine.getMappingsForPlugin(pluginId);
    setMappings(updated);
    onMappingChange?.(updated);
  };

  const handleExportMappings = () => {
    const json = mapperEngine.exportMappings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pluginName}-mappings.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportMappings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const json = e.target?.result as string;
        mapperEngine.importMappings(json);
        const updated = mapperEngine.getMappingsForPlugin(pluginId);
        setMappings(updated);
        onMappingChange?.(updated);
      };
      reader.readAsText(file);
    }
  };

  const inputDevices = midiDevices.filter((d): d is MidiDevice => d !== null);

  return (
    <div className="bg-gray-900 rounded border border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-300">MIDI Parameter Mapping</h3>
          <p className="text-xs text-gray-500">{pluginName}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMappings}
            title="Export mappings as JSON"
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <Download size={14} className="text-gray-400" />
          </button>

          <label title="Import mappings from JSON">
            <input
              type="file"
              accept=".json"
              onChange={handleImportMappings}
              className="hidden"
            />
            <div className="p-2 hover:bg-gray-700 rounded transition-colors cursor-pointer">
              <Upload size={14} className="text-gray-400" />
            </div>
          </label>
        </div>
      </div>

      {/* Info message */}
      {learningId && (
        <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-300">
          <Zap size={14} className="inline mr-2" />
          Learning mode active - move your MIDI controller to assign CC
        </div>
      )}

      {/* Mappings list */}
      {mappings.length > 0 ? (
        <div className="space-y-2 mb-4">
          {mappings.map(mapping => (
            <div
              key={mapping.id}
              className={`p-3 bg-gray-800 rounded border border-gray-700 text-xs ${
                learningId === mapping.id ? 'border-blue-500 bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={mapping.enabled}
                      onChange={() => handleToggleMappingEnabled(mapping.id)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium text-gray-300">{mapping.name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-gray-400">
                    <div>
                      <label className="text-gray-500">Channel</label>
                      <input
                        type="number"
                        min="1"
                        max="16"
                        value={mapping.midiChannel}
                        onChange={(e) =>
                          handleUpdateMapping(mapping.id, {
                            midiChannel: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-300"
                      />
                    </div>

                    <div>
                      <label className="text-gray-500">CC</label>
                      <input
                        type="number"
                        min="0"
                        max="127"
                        value={mapping.midiCC}
                        onChange={(e) =>
                          handleUpdateMapping(mapping.id, {
                            midiCC: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-300"
                      />
                    </div>

                    <div>
                      <label className="text-gray-500">Min Value</label>
                      <input
                        type="number"
                        step="0.01"
                        value={mapping.minValue}
                        onChange={(e) =>
                          handleUpdateMapping(mapping.id, {
                            minValue: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-300"
                      />
                    </div>

                    <div>
                      <label className="text-gray-500">Max Value</label>
                      <input
                        type="number"
                        step="0.01"
                        value={mapping.maxValue}
                        onChange={(e) =>
                          handleUpdateMapping(mapping.id, {
                            maxValue: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-300"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setLearningId(mapping.id)}
                    disabled={learningId !== null && learningId !== mapping.id}
                    className="mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                  >
                    {learningId === mapping.id ? 'Learning...' : 'Learn CC'}
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteMapping(mapping.id)}
                  className="p-2 hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                >
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-700 text-xs text-gray-500 text-center">
          No mappings configured
        </div>
      )}

      {/* Add new mapping button */}
      {inputDevices.length > 0 ? (
        <button
          onClick={() => setShowNewMappingForm(!showNewMappingForm)}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
        >
          {showNewMappingForm ? 'Cancel' : '+ Add Mapping'}
        </button>
      ) : (
        <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-300 text-center">
          No MIDI input devices available
        </div>
      )}

      {/* New mapping form */}
      {showNewMappingForm && inputDevices.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
          <h4 className="text-xs font-semibold text-gray-300 mb-3">New Mapping</h4>

          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400">Parameter</label>
              <input
                type="text"
                placeholder="e.g., Cutoff Frequency"
                value={newMappingParam}
                onChange={(e) => setNewMappingParam(e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-300"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400">MIDI Channel</label>
              <select
                value={newMappingChannel}
                onChange={(e) => setNewMappingChannel(parseInt(e.target.value))}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-300"
              >
                {Array.from({ length: 16 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Channel {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreateNewMapping}
              className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            >
              Create & Learn
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
