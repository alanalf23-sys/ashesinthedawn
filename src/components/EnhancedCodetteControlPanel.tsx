/**
 * Enhanced Codette Control Panel
 * Advanced AI-powered DAW control with real-time suggestions and analysis
 */

import { useState, useEffect } from 'react';
import { useCodetteDAWIntegration } from '../hooks/useCodetteDAWIntegration';
import { useDAW } from '../contexts/DAWContext';
import {
  Lightbulb,
  Brain,
  CheckCircle2,
  AlertCircle,
  Loader,
  BarChart3,
  Music,
  Sparkles,
} from 'lucide-react';

interface EnhancedCodetteControlPanelProps {
  expanded?: boolean;
}

export function EnhancedCodetteControlPanel({
  expanded = true,
}: EnhancedCodetteControlPanelProps) {
  const {
    getSuggestionsForCurrentState,
    analyzeCurrentMix,
    getMixingTips,
    getProductionChecklist,
    applySuggestion,
  } = useCodetteDAWIntegration();

  const { selectedTrack } = useDAW();

  const [activeTab, setActiveTab] = useState<'suggestions' | 'analysis' | 'checklist' | 'tips'>(
    'suggestions'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [tips, setTips] = useState<string[]>([]);

  // Load suggestions
  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await getSuggestionsForCurrentState();
      setSuggestions(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load analysis
  const loadAnalysis = async () => {
    setIsLoading(true);
    try {
      const result = await analyzeCurrentMix();
      setAnalysis(result);
    } catch (err) {
      console.error('Failed to load analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load checklist
  const loadChecklist = async () => {
    setIsLoading(true);
    try {
      const result = await getProductionChecklist();
      setChecklist(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Failed to load checklist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load tips
  const loadTips = async () => {
    setIsLoading(true);
    try {
      const result = await getMixingTips();
      setTips(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Failed to load tips:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load content based on active tab
  useEffect(() => {
    if (!expanded) return;

    if (activeTab === 'suggestions') {
      loadSuggestions();
    } else if (activeTab === 'analysis') {
      loadAnalysis();
    } else if (activeTab === 'checklist') {
      loadChecklist();
    } else if (activeTab === 'tips') {
      loadTips();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, expanded]);

  const handleApplySuggestion = async (suggestion: any) => {
    try {
      const success = await applySuggestion(suggestion);
      if (success) {
        // Reload suggestions
        loadSuggestions();
      }
    } catch (err) {
      console.error('Failed to apply suggestion:', err);
    }
  };

  if (!expanded) return null;

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span className="font-semibold text-sm">Codette AI Control</span>
        </div>
        <Sparkles className="w-4 h-4 opacity-75" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-2 py-2 border-b border-gray-700 bg-gray-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition ${
            activeTab === 'suggestions'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Lightbulb className="w-3 h-3" />
          Suggestions
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition ${
            activeTab === 'analysis'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <BarChart3 className="w-3 h-3" />
          Analysis
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition ${
            activeTab === 'checklist'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          Checklist
        </button>
        <button
          onClick={() => setActiveTab('tips')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition ${
            activeTab === 'tips'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Music className="w-3 h-3" />
          Tips
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading && (
          <div className="flex items-center justify-center h-32 gap-2 text-gray-400">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && !isLoading && (
          <div className="space-y-2">
            {suggestions.length === 0 ? (
              <div className="text-gray-400 text-xs text-center py-4">
                No suggestions available
              </div>
            ) : (
              suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 border border-gray-700 rounded p-2 hover:border-blue-500 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-blue-400">
                        {suggestion.title || 'Suggestion'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {suggestion.description}
                      </div>
                      {suggestion.confidence && (
                        <div className="text-xs text-gray-500 mt-1">
                          Confidence: {Math.round(suggestion.confidence * 100)}%
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs whitespace-nowrap transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && !isLoading && (
          <div className="space-y-2">
            {analysis ? (
              <>
                <div className="bg-gray-800 border border-gray-700 rounded p-2">
                  <div className="font-semibold text-sm text-blue-400 mb-2">
                    Mix Analysis Results
                  </div>
                  <pre className="text-xs text-gray-300 overflow-auto max-h-48 bg-gray-900 p-2 rounded">
                    {JSON.stringify(analysis, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-xs text-center py-4">
                No analysis available
              </div>
            )}
          </div>
        )}

        {/* Checklist Tab */}
        {activeTab === 'checklist' && !isLoading && (
          <div className="space-y-1">
            {checklist.length === 0 ? (
              <div className="text-gray-400 text-xs text-center py-4">
                No checklist items
              </div>
            ) : (
              checklist.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-2 rounded text-xs ${
                    item.completed
                      ? 'bg-green-900/20 text-green-300'
                      : item.priority === 'high'
                      ? 'bg-red-900/20 text-red-300'
                      : 'bg-yellow-900/20 text-yellow-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => {}}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{item.task}</div>
                    <div className="text-xs opacity-75">Priority: {item.priority}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tips Tab */}
        {activeTab === 'tips' && !isLoading && (
          <div className="space-y-2">
            {tips.length === 0 ? (
              <div className="text-gray-400 text-xs text-center py-4">
                No tips available
              </div>
            ) : (
              tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 border border-gray-700 rounded p-2 flex gap-2"
                >
                  <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-300 leading-relaxed">{tip}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 p-2 bg-gray-800 text-xs text-gray-400">
        {selectedTrack ? (
          <div className="flex items-center gap-1">
            <Music className="w-3 h-3" />
            <span>{selectedTrack.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-500">
            <AlertCircle className="w-3 h-3" />
            <span>Select a track for more options</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedCodetteControlPanel;
