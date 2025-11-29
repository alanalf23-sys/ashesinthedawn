/**
 * Unified Codette AI System
 * Consolidates all Codette functionality in one cohesive UI component
 * Provides chat, suggestions, analysis, and DAW control in a unified interface
 */

import { useState, useRef, useEffect } from 'react';
import { useCodette } from '../hooks/useCodette';
import { useCodetteDAWIntegration } from '../hooks/useCodetteDAWIntegration';
import { useDAW } from '../contexts/DAWContext';
import {
  Lightbulb,
  Send,
  Sparkles,
  X,
  Brain,
  CheckCircle2,
  AlertCircle,
  Loader,
  BarChart3,
  Music,
  MessageSquare,
  Settings,
} from 'lucide-react';

type CodetteTab = 'chat' | 'suggestions' | 'analysis' | 'checklist' | 'control';

interface CodetteSystemProps {
  defaultTab?: CodetteTab;
  compactMode?: boolean;
}

export function CodetteSystem({ defaultTab = 'chat', compactMode = false }: CodetteSystemProps) {
  const { isConnected, isLoading, chatHistory, sendMessage } = useCodette({ autoConnect: true });

  const { getSuggestionsForCurrentState, analyzeCurrentMix, getProductionChecklist, applySuggestion } =
    useCodetteDAWIntegration();

  const { selectedTrack } = useDAW();

  // State management
  const [isOpen, setIsOpen] = useState(!compactMode);
  const [activeTab, setActiveTab] = useState<CodetteTab>(defaultTab);
  const [inputValue, setInputValue] = useState('');
  const [_response, setResponse] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('pop');
  const [availableGenres, setAvailableGenres] = useState<any[]>([]);
  const [wsData, setWsData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (compactMode) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen && compactMode) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, compactMode]);

  // Load data based on active tab
  useEffect(() => {
    const loadTabData = async () => {
      setIsLoadingData(true);
      try {
        if (activeTab === 'suggestions') {
          const result = await getSuggestionsForCurrentState();
          setSuggestions(Array.isArray(result) ? result : []);
        } else if (activeTab === 'analysis') {
          const result = await analyzeCurrentMix();
          setAnalysis(result);
        } else if (activeTab === 'checklist') {
          const result = await getProductionChecklist();
          setChecklist(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        console.error('[CodetteSystem] Failed to load tab data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (isOpen && isConnected) {
      loadTabData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOpen, isConnected]);

  // Load available genres on mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const apiUrl = import.meta.env.VITE_CODETTE_API || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/codette/genres`);
        if (response.ok) {
          const data = await response.json();
          if (data.genres && Array.isArray(data.genres)) {
            setAvailableGenres(data.genres);
          }
        }
      } catch (err) {
        console.error('[CodetteSystem] Failed to load genres:', err);
      }
    };
    
    loadGenres();
  }, []);

  // WebSocket listener for real-time analysis streaming
  useEffect(() => {
    if (!isOpen || activeTab !== 'analysis') return;

    const apiUrl = import.meta.env.VITE_CODETTE_API || 'http://localhost:8000';
    const wsUrl = apiUrl.replace('http', 'ws').replace('https', 'wss') + '/ws';

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[CodetteSystem] WebSocket connected for real-time streaming');
        // Request real-time analysis
        ws.send(JSON.stringify({
          type: 'analyze_stream',
          analysis_type: 'spectrum',
          interval_ms: 100,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'analysis_update') {
            setWsData(data.payload);
            // Also update analysis state with streamed data
            setAnalysis((prev: any) => ({
              ...prev,
              ...data.payload,
              timestamp: new Date().toISOString(),
            }));
          }
        } catch (err) {
          console.error('[CodetteSystem] WebSocket parse error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[CodetteSystem] WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('[CodetteSystem] WebSocket disconnected');
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (err) {
      console.error('[CodetteSystem] WebSocket connection failed:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');

    try {
      const result = await sendMessage(message);
      if (result) {
        setResponse(result);
      }
    } catch (err) {
      setResponse('Failed to get response from Codette');
    }
  };

  // Handle applying suggestion
  const handleApplySuggestion = async (suggestion: any) => {
    try {
      const success = await applySuggestion(suggestion);
      if (success) {
        // Reload suggestions
        const result = await getSuggestionsForCurrentState();
        setSuggestions(Array.isArray(result) ? result : []);
      }
    } catch (err) {
      console.error('[CodetteSystem] Failed to apply suggestion:', err);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    if (isLoadingData) {
      return (
        <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'chat':
        return (
          <div className="flex flex-col gap-3">
            <div className="h-48 overflow-y-auto space-y-2 bg-gray-800 rounded p-2">
              {chatHistory.length === 0 ? (
                <div className="text-gray-500 text-xs text-center py-8">
                  Start a conversation with Codette AI
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-xs ${
                      msg.role === 'user'
                        ? 'bg-blue-900/30 text-blue-200 ml-4'
                        : 'bg-green-900/30 text-green-200 mr-4'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask Codette..."
                disabled={!isConnected || isLoading}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!isConnected || isLoading || !inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white p-1.5 rounded transition"
              >
                {isLoading ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        );

      case 'suggestions':
        return (
          <div className="space-y-2 h-96 overflow-y-auto">
            {suggestions.length === 0 ? (
              <div className="text-gray-400 text-xs text-center py-8">No suggestions available</div>
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
                      <div className="text-xs text-gray-400 mt-1">{suggestion.description}</div>
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
        );

      case 'analysis':
        return (
          <div className="h-96 overflow-y-auto">
            {analysis ? (
              <div className="bg-gray-800 border border-gray-700 rounded p-2">
                <div className="font-semibold text-sm text-blue-400 mb-2">Analysis Results</div>
                <pre className="text-xs text-gray-300 overflow-auto max-h-80 bg-gray-900 p-2 rounded">
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-gray-400 text-xs text-center py-8">No analysis available</div>
            )}
          </div>
        );

      case 'checklist':
        return (
          <div className="space-y-1 h-96 overflow-y-auto">
            {checklist.length === 0 ? (
              <div className="text-gray-400 text-xs text-center py-8">No checklist items</div>
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
                  <input type="checkbox" checked={item.completed} onChange={() => {}} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold">{item.task}</div>
                    <div className="text-xs opacity-75">Priority: {item.priority}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'control':
        return (
          <div className="space-y-2 h-96 overflow-y-auto p-2">
            <div className="text-xs text-gray-400 mb-2">
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
            <div className="bg-gray-800 border border-gray-700 rounded p-2 text-xs">
              <p className="text-gray-300">
                Use the other tabs to get AI-powered suggestions for your tracks. Codette can recommend effects,
                parameters, routing, and mixing techniques based on your project context.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (compactMode && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg hover:shadow-xl transition"
        title={isConnected ? 'Codette AI - Connected' : 'Codette AI - Offline'}
      >
        <Lightbulb className="w-4 h-4" />
        <span className="hidden sm:inline">Codette</span>
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col ${compactMode ? 'fixed bottom-4 right-4 w-80 rounded-lg shadow-2xl' : 'h-full'} bg-gray-900 border border-gray-700 overflow-hidden z-50`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span className="font-semibold text-sm">Codette AI</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
        {compactMode && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-blue-700 p-1 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-2 py-2 border-b border-gray-700 bg-gray-800 overflow-x-auto flex-shrink-0">
        {[
          { id: 'chat' as CodetteTab, label: 'Chat', icon: <MessageSquare className="w-3 h-3" /> },
          {
            id: 'suggestions' as CodetteTab,
            label: 'Suggestions',
            icon: <Lightbulb className="w-3 h-3" />,
          },
          { id: 'analysis' as CodetteTab, label: 'Analysis', icon: <BarChart3 className="w-3 h-3" /> },
          { id: 'checklist' as CodetteTab, label: 'Checklist', icon: <CheckCircle2 className="w-3 h-3" /> },
          { id: 'control' as CodetteTab, label: 'Control', icon: <Settings className="w-3 h-3" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">{renderTabContent()}</div>

      {/* Footer */}
      {!isConnected && (
        <div className="border-t border-gray-700 p-2 bg-yellow-900/20 text-xs text-yellow-300">
          <span className="font-semibold">Offline:</span> Start backend with
          <code className="ml-1 bg-gray-800 px-1 rounded">python codette_server_unified.py</code>
        </div>
      )}
    </div>
  );
}

export default CodetteSystem;
