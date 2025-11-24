import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { getAutomationRecordingEngine } from '../lib/automationRecordingEngine';
import { Track } from '../types';

interface AutomationEditorProps {
  track: Track | null;
  currentTime: number;
}

type AutomationMode = 'off' | 'read' | 'write' | 'touch' | 'latch';

interface AutomationStats {
  pointCount: number;
  min: number;
  max: number;
  average: number;
}

export default function AutomationEditor({ track, currentTime }: AutomationEditorProps) {
  const [automationMode, setAutomationMode] = useState<AutomationMode>('off');
  const [recordingParameter, setRecordingParameter] = useState<string | null>(null);
  const [automationCurves, setAutomationCurves] = useState<string[]>([]);
  const [selectedCurve, setSelectedCurve] = useState<string | null>(null);
  const [stats, setStats] = useState<AutomationStats | null>(null);

  const engine = getAutomationRecordingEngine();

  useEffect(() => {
    if (!track) return;

    // Update automation curves list
    const curves = engine.getTrackAutomation(track.id);
    const curveKeys = curves.map(c => `${c.trackId}:${c.parameter}`);
    setAutomationCurves(curveKeys);

    // Get stats for selected curve
    if (selectedCurve && curveKeys.includes(selectedCurve)) {
      const [trackId, parameter] = selectedCurve.split(':');
      const stat = engine.getAutomationStats(trackId, parameter);
      setStats(stat);
    }
  }, [track, selectedCurve, engine]);

  if (!track) {
    return (
      <div className="p-4 bg-gray-900 rounded border border-gray-700">
        <p className="text-sm text-gray-400">Select a track to edit automation</p>
      </div>
    );
  }

  const handleStartRecording = (parameter: string) => {
    if (!track) return;

    // Get current value (default to 0.5 for volume)
    const currentValue = parameter === 'volume' ? (track.volume + 60) / 72 : 0.5;

    engine.startRecording(track.id, parameter, currentValue, currentTime);
    setRecordingParameter(parameter);
    engine.setAutomationMode(track.id, parameter, 'write');
  };

  const handleStopRecording = (parameter: string) => {
    if (!track) return;

    engine.stopRecording(track.id, parameter);
    setRecordingParameter(null);
    engine.setAutomationMode(track.id, parameter, 'read');

    // Refresh curves
    const curves = engine.getTrackAutomation(track.id);
    setAutomationCurves(curves.map(c => `${c.trackId}:${c.parameter}`));
  };

  const handleDeleteCurve = (curveKey: string) => {
    const [trackId, parameter] = curveKey.split(':');
    engine.deleteCurve(trackId, parameter);
    
    // Refresh
    const curves = engine.getTrackAutomation(track.id);
    setAutomationCurves(curves.map(c => `${c.trackId}:${c.parameter}`));
    
    if (selectedCurve === curveKey) {
      setSelectedCurve(null);
      setStats(null);
    }
  };

  const parameters = [
    { id: 'volume', label: 'Volume', icon: '🔊' },
    { id: 'pan', label: 'Pan', icon: '↔️' },
    { id: 'inputGain', label: 'Input Gain', icon: '📥' },
    { id: 'stereoWidth', label: 'Stereo Width', icon: '↕️' }
  ];

  return (
    <div className="w-full p-4 bg-gray-900 rounded border border-gray-700 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Automation Mode</h3>
        <div className="flex gap-2">
          {(['off', 'read', 'write', 'touch', 'latch'] as AutomationMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setAutomationMode(mode)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                automationMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Record Parameters</h3>
        <div className="space-y-2">
          {parameters.map((param) => (
            <div key={param.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
              <span className="text-sm text-gray-300">
                {param.icon} {param.label}
              </span>
              {recordingParameter === param.id ? (
                <button
                  onClick={() => handleStopRecording(param.id)}
                  className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  ◼ Stop
                </button>
              ) : (
                <button
                  onClick={() => handleStartRecording(param.id)}
                  className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors flex items-center gap-1"
                >
                  ⏹ Rec
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {automationCurves.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Automation Curves</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {automationCurves.map((curveKey) => (
              <div
                key={curveKey}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  selectedCurve === curveKey
                    ? 'bg-blue-900/50 border border-blue-700'
                    : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setSelectedCurve(curveKey)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">
                    {curveKey.split(':')[1]}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCurve(curveKey);
                    }}
                    className="p-1 text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {selectedCurve === curveKey && stats && (
                  <div className="mt-2 text-xs text-gray-400 space-y-1 border-t border-gray-700 pt-2">
                    <p>Points: {stats.pointCount}</p>
                    <p>Min: {(stats.min * 100).toFixed(1)}%</p>
                    <p>Max: {(stats.max * 100).toFixed(1)}%</p>
                    <p>Avg: {(stats.average * 100).toFixed(1)}%</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded text-xs text-blue-200">
        <p className="font-semibold mb-1">💡 Tips:</p>
        <ul className="space-y-1">
          <li>• <strong>WRITE:</strong> Record new automation data</li>
          <li>• <strong>READ:</strong> Play back recorded automation</li>
          <li>• <strong>TOUCH:</strong> Start recording when you move a control</li>
          <li>• <strong>LATCH:</strong> Continue recording until you stop</li>
        </ul>
      </div>
    </div>
  );
}
