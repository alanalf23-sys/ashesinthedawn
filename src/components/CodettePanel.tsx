/**
 * Codette AI Panel Component
 * Real-time suggestions, analysis, and chat with Codette AI backend
 */

import React, { useState, useRef, useEffect } from 'react';
import { useCodette } from '../hooks/useCodette';
import { useDAW } from '../contexts/DAWContext';
import { Plugin } from '../types';
import {
  MessageCircle,
  Send,
  Loader,
  AlertCircle,
  Lightbulb,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Minimize2,
} from 'lucide-react';

export interface CodettePanelProps {
  isVisible?: boolean;
  onClose?: () => void;
  trackContext?: Record<string, unknown>;
}

export function CodettePanel({ isVisible = true, onClose }: CodettePanelProps) {
  const {
    isConnected,
    isLoading,
    chatHistory,
    suggestions,
    analysis,
    error,
    sendMessage,
    clearHistory,
    reconnect,
    getSuggestions,
    getMasteringAdvice,
  } = useCodette({ autoConnect: true });

  // DAW Context for actual state updates
  const {
    addTrack,
    selectedTrack,
    togglePlay,
    updateTrack,
    isPlaying,
  } = useDAW();

  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'suggestions' | 'analysis' | 'chat' | 'actions'>('suggestions');
  const [selectedContext, setSelectedContext] = useState('general');
  const [expanded, setExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Load initial suggestions
  useEffect(() => {
    if (isConnected && activeTab === 'suggestions') {
      handleLoadSuggestions(selectedContext);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, selectedContext]);

  // Poll for suggestion updates every 3 seconds when in suggestions tab
  useEffect(() => {
    if (!isConnected || activeTab !== 'suggestions') return;

    const pollInterval = setInterval(() => {
      handleLoadSuggestions(selectedContext);
    }, 3000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, activeTab, selectedContext]);

  // Refresh suggestions when DAW state changes (playing, track selection, etc.)
  useEffect(() => {
    if (isConnected && activeTab === 'suggestions' && (isPlaying || selectedTrack)) {
      handleLoadSuggestions(selectedContext);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, selectedTrack?.id, isConnected, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');

    await sendMessage(message);
  };

  const handleLoadSuggestions = async (context: string) => {
    setSelectedContext(context);
    if (context === 'mastering') {
      await getMasteringAdvice();
    } else {
      await getSuggestions(context);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white text-xs">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <h3 className="font-semibold">Codette AI Assistant</h3>
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!expanded && (
        <div className="px-3 py-2 text-center text-xs text-gray-400 flex-shrink-0">
          {isConnected ? '✓ Ready for suggestions' : '✗ Connecting...'}
        </div>
      )}

      {expanded && (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700 bg-gray-850 flex-shrink-0">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'suggestions'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Lightbulb className="w-3 h-3" />
              Tips
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'analysis'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Zap className="w-3 h-3" />
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'chat'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'actions'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Zap className="w-3 h-3" />
              Actions
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900 bg-opacity-30 border-b border-red-700 px-3 py-2 flex gap-2 text-xs text-red-200 flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{error.message}</span>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div className="space-y-3">
                {/* Context Buttons */}
                <div className="flex flex-wrap gap-2">
                  {['general', 'gain-staging', 'mixing', 'mastering'].map((ctx) => (
                    <button
                      key={ctx}
                      onClick={() => handleLoadSuggestions(ctx)}
                      disabled={isLoading || !isConnected}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        selectedContext === ctx
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {ctx === 'gain-staging'
                        ? 'Gain'
                        : ctx.charAt(0).toUpperCase() + ctx.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Suggestions List */}
                {suggestions.length > 0 ? (
                  <>
                    {isLoading && (
                      <div className="flex items-center justify-center py-1 text-xs text-gray-400">
                        <Loader className="w-3 h-3 animate-spin mr-1" />
                        Refreshing suggestions...
                      </div>
                    )}
                    {suggestions.map((suggestion, idx) => (
                      <div key={idx} className={`p-2 bg-gray-800 border border-gray-700 rounded transition ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-xs text-blue-400">
                          {suggestion.title}
                        </h4>
                        <span className="text-xs px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-3">
                        {suggestion.description}
                      </p>
                      {suggestion.source && (
                        <div className="mt-1 text-xs text-gray-500">
                          Source: {suggestion.source}
                        </div>
                      )}
                    </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-xs">
                    {isLoading ? 'Loading suggestions...' : 'No suggestions yet. Click a category!'}
                  </div>
                )}
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-3">
                {analysis ? (
                  <>
                    <div className="p-2 bg-blue-900/30 border border-blue-700 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">Score</span>
                        <span className="text-lg font-bold text-blue-400">
                          {analysis.score}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${analysis.score}%` }}
                        />
                      </div>
                    </div>

                    {analysis.findings.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-300 mb-1">Findings</h4>
                        <ul className="space-y-0.5">
                          {analysis.findings.map((finding, idx) => (
                            <li key={idx} className="text-xs text-gray-400">
                              • {finding}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-300 mb-1">Recommendations</h4>
                        <ul className="space-y-0.5">
                          {analysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-xs text-gray-400">
                              → {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-xs">
                    {isLoading ? 'Analyzing audio...' : 'No analysis yet'}
                  </div>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="space-y-2">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 py-6">
                    <div className="text-center">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Ask Codette about your production</p>
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] px-2 py-1.5 rounded text-xs ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-200 border border-gray-700'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 border border-gray-700 px-2 py-1.5 rounded flex items-center gap-2">
                      <Loader className="w-3 h-3 animate-spin" />
                      <span className="text-xs text-gray-400">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 mb-3">
                  Execute Codette-recommended DAW operations
                </div>

                {/* Quick Actions */}
                <div className="space-y-1.5">
                  <button
                    onClick={() => togglePlay()}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white text-xs py-1.5 px-2 rounded transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>{isPlaying ? '⏸' : '▶'}</span> {isPlaying ? 'Pause' : 'Play'}
                  </button>

                  <button
                    onClick={() => isPlaying && togglePlay()}
                    disabled={isLoading || !isPlaying}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white text-xs py-1.5 px-2 rounded transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>⏹</span> Stop
                  </button>
                </div>

                {/* Effect Recommendations */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <h4 className="text-xs font-semibold text-blue-400 mb-1.5">Quick Effects</h4>
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => {
                        if (selectedTrack) {
                          const eqPlugin: Plugin = {
                            id: `eq-${Date.now()}`,
                            name: 'EQ',
                            type: 'eq',
                            enabled: true,
                            parameters: {},
                          };
                          updateTrack(selectedTrack.id, {
                            inserts: [...(selectedTrack.inserts || []), eqPlugin]
                          });
                        } else {
                          addTrack('audio');
                        }
                      }}
                      disabled={isLoading}
                      className="w-full text-left px-2 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 rounded text-gray-300 transition-colors"
                    >
                      + Add EQ to Track
                    </button>
                    <button
                      onClick={() => {
                        if (selectedTrack) {
                          const compPlugin: Plugin = {
                            id: `comp-${Date.now()}`,
                            name: 'Compressor',
                            type: 'compressor',
                            enabled: true,
                            parameters: {},
                          };
                          updateTrack(selectedTrack.id, {
                            inserts: [...(selectedTrack.inserts || []), compPlugin]
                          });
                        } else {
                          addTrack('audio');
                        }
                      }}
                      disabled={isLoading}
                      className="w-full text-left px-2 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 rounded text-gray-300 transition-colors"
                    >
                      + Add Compressor
                    </button>
                    <button
                      onClick={() => {
                        if (selectedTrack) {
                          const reverbPlugin: Plugin = {
                            id: `reverb-${Date.now()}`,
                            name: 'Reverb',
                            type: 'reverb',
                            enabled: true,
                            parameters: {},
                          };
                          updateTrack(selectedTrack.id, {
                            inserts: [...(selectedTrack.inserts || []), reverbPlugin]
                          });
                        } else {
                          addTrack('audio');
                        }
                      }}
                      disabled={isLoading}
                      className="w-full text-left px-2 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 rounded text-gray-300 transition-colors"
                    >
                      + Add Reverb
                    </button>
                  </div>
                </div>

                {/* Level Adjustments */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <h4 className="text-xs font-semibold text-blue-400 mb-1.5">Quick Levels</h4>
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => {
                        if (selectedTrack) {
                          updateTrack(selectedTrack.id, { volume: -6 });
                        }
                      }}
                      disabled={isLoading || !selectedTrack}
                      className="w-full text-left px-2 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 rounded text-gray-300 transition-colors"
                    >
                      Set Volume to -6dB
                    </button>
                    <button
                      onClick={() => {
                        if (selectedTrack) {
                          updateTrack(selectedTrack.id, { pan: 0 });
                        }
                      }}
                      disabled={isLoading || !selectedTrack}
                      className="w-full text-left px-2 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 rounded text-gray-300 transition-colors"
                    >
                      Center Pan
                    </button>
                  </div>
                </div>

                {/* Track Context Info */}
                <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
                  {selectedTrack ? (
                    <div>
                      <span className="text-gray-300">Selected:</span> {selectedTrack.name}
                      <div className="mt-1 text-xs text-gray-500">Type: {selectedTrack.type}</div>
                    </div>
                  ) : (
                    <div className="text-yellow-600">No track selected - actions will create new track</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-gray-800 border-t border-gray-700 p-2 space-y-1.5 flex-shrink-0">
            {activeTab === 'chat' ? (
              <form onSubmit={handleSendMessage} className="flex gap-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Codette..."
                  disabled={isLoading || !isConnected}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim() || !isConnected}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-1.5 rounded transition-colors disabled:cursor-not-allowed"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => handleLoadSuggestions(selectedContext)}
                disabled={isLoading || !isConnected}
                className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-xs py-1.5 px-2 rounded transition-colors disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                {activeTab === 'suggestions' ? 'Refresh Tips' : 'Analyze'}
              </button>
            )}

            {!isConnected && (
              <button
                onClick={reconnect}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1 px-2 rounded transition-colors"
              >
                Reconnect
              </button>
            )}

            {activeTab === 'chat' && chatHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="w-full text-xs text-gray-500 hover:text-gray-400 transition-colors py-0.5"
              >
                Clear History
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CodettePanel;
