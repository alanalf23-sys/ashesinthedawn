/**
 * Codette AI Panel Component
 * Interactive panel for Codette AI assistance in CoreLogic Studio
 */

import React, { useState, useRef, useEffect } from 'react';
import { useCodette } from '../hooks/useCodette';
import { MessageCircle, Send, Loader, AlertCircle, Settings } from 'lucide-react';

type Perspective = 'neuralnets' | 'newtonian' | 'davinci' | 'quantum';

export interface CodettePanelProps {
  isVisible: boolean;
  onClose?: () => void;
  trackContext?: Record<string, unknown>;
}

export function CodettePanel({ isVisible, onClose }: CodettePanelProps) {
  const {
    isConnected,
    isLoading,
    chatHistory,
    error,
    sendMessage,
    clearHistory,
    reconnect,
  } = useCodette({ autoConnect: true });

  const [inputValue, setInputValue] = useState('');
  const [selectedPerspective, setSelectedPerspective] =
    useState<Perspective>('neuralnets');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');

    await sendMessage(message, selectedPerspective);
  };

  const perspectives: { value: Perspective; label: string; description: string }[] = [
    {
      value: 'neuralnets',
      label: 'Neural Nets',
      description: 'Pattern recognition & dynamic analysis',
    },
    {
      value: 'newtonian',
      label: 'Newtonian',
      description: 'Logical cause & effect reasoning',
    },
    {
      value: 'davinci',
      label: 'Da Vinci',
      description: 'Creative synthesis & analogies',
    },
    {
      value: 'quantum',
      label: 'Quantum',
      description: 'Advanced probabilistic analysis',
    },
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 right-0 w-96 h-96 bg-gray-950 border-l border-t border-gray-700 rounded-tl-lg shadow-xl flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-tl-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold text-white">Codette AI Assistant</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-purple-700 rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-700 rounded transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-900 border-b border-gray-700 p-3 space-y-2 max-h-24 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase">Perspective</p>
          <div className="grid grid-cols-2 gap-2">
            {perspectives.map((p) => (
              <button
                key={p.value}
                onClick={() => setSelectedPerspective(p.value)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selectedPerspective === p.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {perspectives.find((p) => p.value === selectedPerspective)?.description}
          </p>
          {!isConnected && (
            <button
              onClick={reconnect}
              className="w-full mt-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1 px-2 rounded transition-colors"
            >
              Reconnect to Backend
            </button>
          )}
        </div>
      )}

      {/* Status Indicator */}
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-700 flex items-center gap-2 text-xs">
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span className="text-gray-400">
          {isConnected ? 'Connected' : 'Offline - Using local responses'}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 bg-opacity-20 border-b border-red-700 px-4 py-2 flex gap-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error.message}</span>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Start a conversation with Codette</p>
              <p className="text-xs mt-1">Ask questions about audio processing, effects, or mixing</p>
            </div>
          </div>
        ) : (
          chatHistory.map((msg: { role: string; perspective?: string; content: string; timestamp: number }, idx: number) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-200 border border-gray-700'
                }`}
              >
                <p className="text-xs text-gray-400 mb-1 uppercase font-semibold">
                  {msg.role === 'codette'
                    ? `Codette (${msg.perspective || 'neuralnets'})`
                    : 'You'}
                </p>
                <p>{msg.content}</p>
                <p className="text-xs text-gray-500 mt-1 opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 px-3 py-2 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-900 border-t border-gray-700 p-3">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Codette anything..."
            disabled={isLoading}
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white p-2 rounded transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <button
          onClick={clearHistory}
          className="w-full mt-2 text-xs text-gray-500 hover:text-gray-400 transition-colors py-1"
        >
          Clear History
        </button>
      </div>
    </div>
  );
}

export default CodettePanel;
