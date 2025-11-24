import React, { useState, useRef } from 'react';
import { Download, Upload, Plus, Trash2, Copy } from 'lucide-react';
import {
  AutomationPresetManager,
  AutomationPreset,
  AutomationCurveData,
} from '../lib/automationPresetManager';

interface AutomationPresetManagerUIProps {
  onExport?: (preset: AutomationPreset) => void;
  onImport?: (preset: AutomationPreset) => void;
  curves?: AutomationCurveData[];
}

export const AutomationPresetManagerUI: React.FC<AutomationPresetManagerUIProps> = ({
  onExport,
  onImport,
  curves = [],
}) => {
  const [presets, setPresets] = useState<AutomationPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<AutomationPreset | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportName, setExportName] = useState('New Preset');
  const [exportDescription, setExportDescription] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStats, setShowStats] = useState(false);

  const handleExport = () => {
    if (!curves || curves.length === 0) {
      setImportError('No curves to export');
      return;
    }

    const preset = AutomationPresetManager.exportPreset(
      curves,
      exportName,
      exportDescription,
      {
        projectName: 'CoreLogic Studio',
      }
    );

    setPresets([...presets, preset]);
    setSelectedPreset(preset);
    onExport?.(preset);
    setShowExportDialog(false);
    setExportName('New Preset');
    setExportDescription('');
  };

  const handleDownload = (preset: AutomationPreset) => {
    AutomationPresetManager.downloadPreset(preset);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      const preset = await AutomationPresetManager.importPreset(file);
      setPresets([...presets, preset]);
      setSelectedPreset(preset);
      onImport?.(preset);
      setShowExportDialog(false);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeletePreset = (index: number) => {
    const newPresets = presets.filter((_, i) => i !== index);
    setPresets(newPresets);
    if (selectedPreset === presets[index]) {
      setSelectedPreset(null);
    }
  };

  const handleDuplicatePreset = (preset: AutomationPreset) => {
    const duplicated: AutomationPreset = {
      ...preset,
      name: `${preset.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    setPresets([...presets, duplicated]);
    setSelectedPreset(duplicated);
  };

  const getPresetStats = (preset: AutomationPreset) => {
    const stats = {
      totalCurves: preset.curves.length,
      totalPoints: preset.curves.reduce((sum, c) => sum + c.points.length, 0),
      parameters: new Set(preset.curves.map(c => c.parameterName)).size,
    };
    return stats;
  };

  return (
    <div className="bg-gray-900 rounded border border-gray-700 p-3">
      <h3 className="text-xs font-semibold text-gray-300 mb-3">Automation Presets</h3>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setShowExportDialog(true)}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
        >
          <Download size={14} />
          Export
        </button>
        <button
          onClick={handleImportClick}
          className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white transition-colors"
        >
          <Upload size={14} />
          Import
        </button>
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
          Stats
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {importError && (
        <div className="mb-3 p-2 bg-red-900/30 border border-red-700 rounded text-xs text-red-300">
          {importError}
        </div>
      )}

      {/* Preset List */}
      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
        {presets.length === 0 ? (
          <div className="text-xs text-gray-500 py-2">No presets saved</div>
        ) : (
          presets.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedPreset(preset)}
              className={`p-2 rounded cursor-pointer border transition-colors ${
                selectedPreset === preset
                  ? 'bg-blue-900 border-blue-600'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="text-xs font-medium text-gray-200">{preset.name}</div>
                  <div className="text-xs text-gray-500">{preset.curves.length} curves</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(preset);
                    }}
                    className="p-1 hover:bg-blue-600 rounded transition-colors"
                    title="Download"
                  >
                    <Download size={12} className="text-blue-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicatePreset(preset);
                    }}
                    className="p-1 hover:bg-green-600 rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy size={12} className="text-green-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(idx);
                    }}
                    className="p-1 hover:bg-red-600 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              </div>
              {preset.description && (
                <div className="text-xs text-gray-400">{preset.description}</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Statistics */}
      {showStats && selectedPreset && (
        <div className="mb-3 p-2 bg-gray-800 rounded border border-gray-700">
          <div className="text-xs font-semibold text-gray-300 mb-2">Preset Statistics</div>
          {(() => {
            const stats = getPresetStats(selectedPreset);
            return (
              <div className="space-y-1 text-xs text-gray-400">
                <div>Curves: {stats.totalCurves}</div>
                <div>Total Points: {stats.totalPoints}</div>
                <div>Parameters: {stats.parameters}</div>
                <div>Created: {new Date(selectedPreset.createdAt).toLocaleDateString()}</div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded border border-gray-700 p-4 w-80 shadow-lg">
            <h4 className="text-sm font-semibold text-gray-100 mb-3">Export Automation Preset</h4>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Preset Name</label>
                <input
                  type="text"
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Volume Sweep"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Description (optional)</label>
                <textarea
                  value={exportDescription}
                  onChange={(e) => setExportDescription(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-blue-500 h-16 resize-none"
                  placeholder="Add notes about this preset..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleExport}
                  className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
                >
                  <Plus size={14} className="inline mr-1" />
                  Create Preset
                </button>
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="flex-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
