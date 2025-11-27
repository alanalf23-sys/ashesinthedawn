import { useState, useEffect } from 'react';
import { 
  Sparkles, Brain, BarChart3, Radio, Loader, AlertCircle, CheckCircle
} from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { getCodetteBridge } from '../lib/codetteBridgeService';

interface ActionItem {
  action: string;
  parameter: string;
  value: string | number;
  priority: 'high' | 'medium' | 'low';
}

interface AISuggestion {
  type: 'gain' | 'mixing' | 'health' | 'routing' | 'mastering' | 'creative' | 'full';
  suggestion: string;
  confidence: number;
  actionable: boolean;
  actionItems?: ActionItem[];
}

export default function AIPanel() {
  const { tracks, selectedTrack } = useDAW();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'health' | 'mixing' | 'routing' | 'full'>('health');

  useEffect(() => {
    // Initial connection check
    checkBackendConnection();

    // Check backend connection periodically (reduced from 5s to 30s to prevent blocking)
    const healthCheckInterval = setInterval(() => {
      checkBackendConnection().catch(err => {
        console.debug('[AIPanel] Health check failed:', err);
      });
    }, 30000);

    return () => clearInterval(healthCheckInterval);
  }, []);

  const checkBackendConnection = async () => {
    try {
      const bridge = getCodetteBridge();
      const response = await bridge.healthCheck();
      setBackendConnected(response.success);
    } catch {
      setBackendConnected(false);
    }
  };

  const analyzeSessionWithBackend = async () => {
    setLoading(true);
    try {
      const bridge = getCodetteBridge();
      
      // Build session context from DAW state
      const trackMetrics = tracks.map(t => ({
        trackId: t.id,
        name: t.name,
        type: t.type,
        level: t.volume || -60,
        peak: (t.volume || -60) + 3,
        plugins: (t.inserts || []).map(p => typeof p === 'string' ? p : 'Unknown'),
      }));

      const hasClipping = tracks.some(t => (t.volume || -60) > -1);
      const masterLevel = Math.max(...tracks.map(t => t.volume || -60), -60);
      const masterPeak = masterLevel + 3;

      const context = {
        trackCount: tracks.length,
        totalDuration: 0,
        sampleRate: 48000,
        trackMetrics,
        masterLevel,
        masterPeak,
        hasClipping,
      };

      const prediction = await bridge.analyzeSession(context);

      setSuggestions([{
        type: 'full',
        suggestion: prediction.prediction,
        confidence: prediction.confidence,
        actionable: (prediction.actionItems?.length || 0) > 0,
        actionItems: prediction.actionItems?.map(item => ({
          action: item.action || 'Action',
          parameter: item.parameter || '',
          value: item.value || '',
          priority: item.priority || 'medium'
        })),
      }]);
    } catch (error) {
      console.error('Backend analysis error:', error);
      setSuggestions([{
        type: 'full',
        suggestion: `Backend error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        actionable: false,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestMixingChain = async () => {
    if (!selectedTrack) return;
    
    setLoading(true);
    try {
      const bridge = getCodetteBridge();
      
      const analysis = await bridge.getMixingIntelligence(selectedTrack.type, {
        level: selectedTrack.volume || -60,
        peak: (selectedTrack.volume || -60) + 3,
        plugins: (selectedTrack.inserts || []).map(p => typeof p === 'string' ? p : 'Unknown'),
      });
      
      setSuggestions([{
        type: 'mixing',
        suggestion: analysis.prediction,
        confidence: analysis.confidence,
        actionable: true,
        actionItems: analysis.actionItems?.map(item => ({
          action: item.action || 'Action',
          parameter: item.parameter || '',
          value: item.value || '',
          priority: item.priority || 'medium'
        })),
      }]);
    } catch (error) {
      console.error('Mixing suggestion error:', error);
      setSuggestions([{
        type: 'mixing',
        suggestion: `Error: ${error instanceof Error ? error.message : 'Analysis failed'}`,
        confidence: 0,
        actionable: false,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestRouting = async () => {
    setLoading(true);
    try {
      const bridge = getCodetteBridge();
      
      const trackTypes = tracks.map(t => t.type);
      const hasAux = tracks.some(t => t.type === 'aux');

      const analysis = await bridge.getRoutingIntelligence({
        trackCount: tracks.length,
        trackTypes,
        hasAux,
      });
      
      setSuggestions([{
        type: 'routing',
        suggestion: analysis.prediction,
        confidence: analysis.confidence,
        actionable: true,
        actionItems: analysis.actionItems?.map(item => ({
          action: item.action || 'Action',
          parameter: item.parameter || '',
          value: item.value || '',
          priority: item.priority || 'medium'
        })),
      }]);
    } catch (error) {
      console.error('Routing suggestion error:', error);
      setSuggestions([{
        type: 'routing',
        suggestion: `Error: ${error instanceof Error ? error.message : 'Analysis failed'}`,
        confidence: 0,
        actionable: false,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestGainStaging = async () => {
    setLoading(true);
    try {
      const bridge = getCodetteBridge();
      
      const analysis = await bridge.getGainStagingAdvice(
        tracks.map(t => ({
          id: t.id,
          level: t.volume || -60,
          peak: (t.volume || -60) + 3,
        }))
      );
      
      setSuggestions([{
        type: 'gain',
        suggestion: analysis.prediction,
        confidence: analysis.confidence,
        actionable: true,
        actionItems: analysis.actionItems?.map(item => ({
          action: item.action || 'Action',
          parameter: item.parameter || '',
          value: item.value || '',
          priority: item.priority || 'medium'
        })),
      }]);
    } catch (error) {
      console.error('Gain staging error:', error);
      setSuggestions([{
        type: 'gain',
        suggestion: `Error: ${error instanceof Error ? error.message : 'Analysis failed'}`,
        confidence: 0,
        actionable: false,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-purple-400" />
          <h3 className="font-semibold text-gray-100">🤖 Codette AI</h3>
          <div className="ml-auto flex items-center gap-1">
            {backendConnected ? (
              <>
                <CheckCircle size={12} className="text-green-500" />
                <span className="text-xs text-green-500">Connected</span>
              </>
            ) : (
              <>
                <AlertCircle size={12} className="text-yellow-500" />
                <span className="text-xs text-yellow-500">Offline</span>
              </>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 text-xs mb-2 flex-wrap">
          <button
            onClick={() => setActiveTab('health')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'health'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <BarChart3 size={12} className="inline mr-1" />
            Health
          </button>
          <button
            onClick={() => setActiveTab('mixing')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'mixing'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            disabled={!selectedTrack}
          >
            <Sparkles size={12} className="inline mr-1" />
            Mixing
          </button>
          <button
            onClick={() => setActiveTab('routing')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'routing'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Radio size={12} className="inline mr-1" />
            Routing
          </button>
          <button
            onClick={() => setActiveTab('full')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'full'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Brain size={12} className="inline mr-1" />
            Full
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'health' && (
          <button
            onClick={suggestGainStaging}
            disabled={loading}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 size={14} />
                Gain Staging Analysis
              </>
            )}
          </button>
        )}

        {activeTab === 'mixing' && (
          <>
            <button
              onClick={suggestMixingChain}
              disabled={loading || !selectedTrack}
              className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Suggest Mixing Chain
                </>
              )}
            </button>
            {!selectedTrack && (
              <p className="text-xs text-gray-400 text-center py-2">Select a track first</p>
            )}
          </>
        )}

        {activeTab === 'routing' && (
          <button
            onClick={suggestRouting}
            disabled={loading}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Radio size={14} />
                Suggest Routing
              </>
            )}
          </button>
        )}

        {activeTab === 'full' && (
          <button
            onClick={analyzeSessionWithBackend}
            disabled={loading}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                Codette Analyzing...
              </>
            ) : (
              <>
                <Brain size={14} />
                Full Session Analysis
              </>
            )}
          </button>
        )}

        {/* Results Tiles */}
        {suggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className="p-3 bg-gray-800 rounded-lg border border-purple-700 hover:border-purple-600 transition-colors">
                <div className="flex items-start gap-2">
                  <Sparkles size={14} className="text-purple-400 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-purple-300 mb-1 uppercase">
                      {suggestion.type}
                    </p>
                    <p className="text-xs text-gray-300 leading-relaxed break-words">
                      {suggestion.suggestion}
                    </p>
                    
                    {/* Action Items if present */}
                    {suggestion.actionItems && suggestion.actionItems.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
                        {suggestion.actionItems.map((item, i) => (
                          <div key={i} className="text-xs text-gray-400 flex items-start gap-2">
                            <span className="text-purple-400 mt-0.5">•</span>
                            <div>
                              <p className="text-gray-300">{item.action}: {item.parameter}</p>
                              <p className="text-gray-500">Set to: {item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-500">
                        Confidence: {Math.round(suggestion.confidence * 100)}%
                      </span>
                      {suggestion.actionable && (
                        <span className="text-xs px-2 py-0.5 bg-purple-600/20 text-purple-300 rounded">
                          Actionable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Backend Status Tile */}
        {!backendConnected && (
          <div className="p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs space-y-1">
            <p className="text-yellow-400 flex items-center gap-2">
              <AlertCircle size={12} />
              Backend offline - local processing active
            </p>
          </div>
        )}

        {/* Session Status Tile */}
        <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">Session Status</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-900 rounded p-2">
              <p className="text-gray-500 mb-1">Tracks</p>
              <p className="text-gray-200 font-semibold">{tracks.length}</p>
            </div>
            <div className="bg-gray-900 rounded p-2">
              <p className="text-gray-500 mb-1">Selected</p>
              <p className="text-gray-200 font-semibold text-xs truncate">{selectedTrack?.name || 'None'}</p>
            </div>
            <div className="bg-gray-900 rounded p-2">
              <p className="text-gray-500 mb-1">Backend</p>
              <p className={`font-semibold text-xs ${backendConnected ? 'text-green-400' : 'text-red-400'}`}>
                {backendConnected ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className="bg-gray-900 rounded p-2">
              <p className="text-gray-500 mb-1">Ready</p>
              <p className={`font-semibold text-xs ${backendConnected && tracks.length > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                {backendConnected && tracks.length > 0 ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
