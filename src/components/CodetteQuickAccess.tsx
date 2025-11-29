/**
 * Codette Quick Access Widget
 * Floating widget for quick Codette AI access from anywhere in the DAW
 * Integrated into TopBar for constant visibility
 */

import { useState, useRef, useEffect } from 'react';
import { useCodette } from '../hooks/useCodette';
import { useDAW } from '../contexts/DAWContext';
import {
  Lightbulb,
  Send,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';

export function CodetteQuickAccess(): React.ReactElement {
  const { isConnected, isLoading, sendMessage } = useCodette({ autoConnect: true });
  const { selectedTrack } = useDAW();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');

    try {
      const result = await sendMessage(message);
      if (result) {
        setResponse(result);
        setShowResponse(true);
      }
    } catch (err) {
      setResponse('Failed to get response from Codette');
      setShowResponse(true);
    }
  };

  const handleSuggestion = async (suggestion: string) => {
    setInputValue(suggestion);
  };

  const quickSuggestions = [
    selectedTrack?.type === 'audio' ? 'Analyze this audio track' : 'Create a new track',
    'Suggest effects for this track',
    'What are best practices?',
    'Help with mixing',
  ];

  return (
    <div ref={containerRef} className="relative">
      {/* Compact Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded transition ${
          isConnected
            ? 'bg-blue-600 hover:bg-blue-500 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        } text-sm font-medium shadow-lg hover:shadow-xl`}
        title={isConnected ? 'Codette AI - Connected' : 'Codette AI - Offline'}
      >
        <Lightbulb className="w-4 h-4" />
        <span className="hidden sm:inline">Codette</span>
        {isOpen && <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              <span className="font-semibold text-sm">Codette AI</span>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 p-1 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Response Display */}
          {showResponse && response && (
            <div className="border-b border-gray-700 p-3 bg-gray-800 max-h-48 overflow-y-auto">
              <div className="text-xs text-gray-300 mb-1">Response:</div>
              <p className="text-sm text-gray-100 leading-relaxed">{response}</p>
              <button
                onClick={() => setShowResponse(false)}
                className="text-xs text-blue-400 hover:text-blue-300 mt-2"
              >
                Clear
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-b border-gray-700 bg-gray-800">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Codette..."
                disabled={!isConnected || isLoading}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!isConnected || isLoading || !inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white p-1.5 rounded transition"
                title="Send message (Enter)"
              >
                {isLoading ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="text-xs text-gray-400 mb-1">Quick actions:</div>
            <div className="flex flex-wrap gap-1">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition whitespace-nowrap"
                >
                  {suggestion.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Help Text */}
          {!isConnected && (
            <div className="p-2 bg-yellow-900/20 border-t border-gray-700 text-xs text-yellow-300">
              <span className="font-semibold">Offline Mode:</span> Start Codette backend with
              <code className="ml-1 bg-gray-800 px-1 rounded">python codette_server_unified.py</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CodetteQuickAccess;
