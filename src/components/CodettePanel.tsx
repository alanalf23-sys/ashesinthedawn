/**
 * Codette AI Panel Component
 * Interactive panel for Codette AI assistance in CoreLogic Studio
 */

import React, { useState, useRef, useEffect } from 'react';
import { useCodette } from '../hooks/useCodette';
import { MessageCircle, Send, Loader, AlertCircle, Settings } from 'lucide-react';

type Perspective = 'neuralnets' | 'newtonian' | 'davinci' | 'quantum';

export interface CodettePanelProps {
  isVisible?: boolean;
  onClose?: () => void;
  trackContext?: Record<string, unknown>;
}

export function CodettePanel({ isVisible = true }: CodettePanelProps) {
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
    <div className="flex flex-col h-full bg-gray-900 text-white text-xs">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <h3 className="font-semibold">Codette AI</h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 hover:bg-purple-700 rounded transition-colors"
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Status Indicator */}
      <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 flex items-center gap-2 flex-shrink-0">
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span className="text-gray-400">
          {isConnected ? 'Connected' : 'Offline'}
        </span>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 border-b border-gray-700 p-2 space-y-2 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase">Perspective</p>
          <div className="grid grid-cols-2 gap-1">
            {perspectives.map((p) => (
              <button
                key={p.value}
                onClick={() => setSelectedPerspective(p.value)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selectedPerspective === p.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {!isConnected && (
            <button
              onClick={reconnect}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1 px-2 rounded transition-colors"
            >
              Reconnect
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 bg-opacity-30 border-b border-red-700 px-3 py-2 flex gap-2 text-xs text-red-200 flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error.message}</span>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {chatHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Start conversation</p>
            </div>
          </div>
        ) : (
          chatHistory.map((msg: typeof chatHistory[0], idx: number) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-2 py-1.5 rounded text-xs ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-200 border border-gray-700'
                }`}
              >
                <p className="text-gray-400 mb-0.5 font-semibold">
                  {msg.role === 'codette'
                    ? `Codette (${msg.perspective || 'NN'})`
                    : 'You'}
                </p>
                <p>{msg.content}</p>
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

      {/* Input Area */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 space-y-1.5 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Codette..."
            disabled={isLoading}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-1.5 rounded transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
        <button
          onClick={clearHistory}
          className="w-full text-xs text-gray-500 hover:text-gray-400 transition-colors py-0.5"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default CodettePanel;
