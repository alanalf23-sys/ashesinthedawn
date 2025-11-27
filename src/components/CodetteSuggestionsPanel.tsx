/**
 * CodetteSuggestionsPanel
 * Displays Codette AI suggestions and allows applying them to selected track
 * 
 * Features:
 * - Real-time suggestion loading
 * - Apply buttons for each suggestion
 * - Confidence scores and categories
 * - Error handling and loading states
 */

import { useState, useEffect } from "react";
import { useDAW } from "../contexts/DAWContext";

interface CodetteSuggestion {
  id: string;
  type: "effect" | "parameter" | "automation" | "routing" | "mixing";
  title: string;
  description: string;
  parameters: Record<string, any>;
  confidence: number;
  category: string;
}

interface CodetteSuggestionsPanelProps {
  trackId?: string;
  context?: string;
  onApply?: (suggestion: CodetteSuggestion) => void;
}

export function CodetteSuggestionsPanel(props: CodetteSuggestionsPanelProps) {
  // Initialize state hooks first (before any early returns)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [confirmApply, setConfirmApply] = useState<string | null>(null);

  // Safely extract props with defaults
  const { trackId, context = "general", onApply } = props || {};
  
  const contextData = useDAW();
  
  // Guard against undefined context
  if (!contextData) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-700 rounded">
        <p className="text-sm text-red-300">Context not available</p>
      </div>
    );
  }
  
  const {
    selectedTrack,
    getSuggestionsForTrack,
    applyCodetteSuggestion,
    codetteConnected,
    codetteSuggestions: rawSuggestions,
  } = contextData;
  
  // Guard against undefined methods
  if (!getSuggestionsForTrack || !applyCodetteSuggestion) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-700 rounded">
        <p className="text-sm text-red-300">Codette methods not initialized</p>
      </div>
    );
  }

  // Ensure codetteSuggestions is an array with safe objects
  const codetteSuggestions = Array.isArray(rawSuggestions) 
    ? rawSuggestions.map(s => ({
        id: s?.id || `suggestion-${Math.random()}`,
        type: s?.type || 'effect',
        title: s?.title || 'Suggestion',
        description: s?.description || '',
        parameters: s?.parameters || {},
        confidence: s?.confidence || 0,
        category: s?.category || 'general',
      }))
    : [];

  const currentTrackId = trackId || selectedTrack?.id;

  // Load suggestions when track changes
  useEffect(() => {
    if (!currentTrackId || !codetteConnected) return;

    const loadSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        await getSuggestionsForTrack(currentTrackId, context);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load suggestions"
        );
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadSuggestions, 300); // Debounce
    return () => clearTimeout(timer);
  }, [currentTrackId, context, codetteConnected, getSuggestionsForTrack]);

  const handleApply = async (suggestion: CodetteSuggestion) => {
    if (!currentTrackId) return;

    setApplying(suggestion.id);

    try {
      const success = await applyCodetteSuggestion(
        currentTrackId,
        suggestion
      );

      if (success) {
        setConfirmApply(null);
        onApply?.(suggestion);
      } else {
        setError("Failed to apply suggestion");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to apply suggestion"
      );
    } finally {
      setApplying(null);
    }
  };

  if (!codetteConnected) {
    return (
      <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded">
        <p className="text-sm text-yellow-300">
          Codette AI not connected. Ensure backend is running on port 8000.
        </p>
      </div>
    );
  }

  if (!selectedTrack) {
    return (
      <div className="p-4 bg-gray-800 border border-gray-700 rounded">
        <p className="text-sm text-gray-400">Select a track to see suggestions</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-100">
          💡 Codette Suggestions
        </h3>
        {loading && <div className="animate-spin text-xs text-blue-400">⟳</div>}
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 bg-red-900/30 border border-red-700 rounded text-xs text-red-300 flex-shrink-0">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-3 bg-blue-900/30 rounded text-center flex-shrink-0">
          <p className="text-xs text-blue-300">Loading suggestions...</p>
        </div>
      )}

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!loading && codetteSuggestions.length === 0 && (
          <div className="p-3 bg-gray-800 rounded text-center">
            <p className="text-xs text-gray-400">No suggestions at this time</p>
          </div>
        )}

        <div className="space-y-3 pr-2">
          {codetteSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 bg-gray-800 border border-gray-700 rounded hover:border-blue-600 transition-colors flex flex-col gap-3"
            >
              {/* Suggestion Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-100 break-words">
                    {suggestion.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 break-words">
                    {suggestion.description}
                  </p>
                </div>

                {/* Category Badge */}
                <div className="flex-shrink-0">
                  <span className="inline-block px-2 py-1 bg-blue-900 border border-blue-700 rounded text-xs text-blue-200 whitespace-nowrap">
                    {suggestion.category}
                  </span>
                </div>
              </div>

              {/* Confidence & Type */}
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="text-gray-400">
                  Type: <span className="text-gray-200 font-medium">{suggestion.type}</span>
                </span>
                <span className="text-gray-400">
                  Confidence:{" "}
                  <span className="text-gray-200 font-medium">
                    {(suggestion.confidence * 100).toFixed(0)}%
                  </span>
                </span>
              </div>

              {/* Parameters Preview */}
              {suggestion.parameters && Object.keys(suggestion.parameters).length > 0 && (
                <div className="p-2 bg-gray-900/50 rounded text-xs border border-gray-700">
                  <p className="text-gray-400 mb-2 font-medium">Parameters:</p>
                  <div className="space-y-1">
                    {Object.entries(suggestion.parameters || {}).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between text-gray-400"
                      >
                        <span className="break-words">{key}:</span>
                        <span className="text-gray-300 font-mono ml-2">
                          {typeof value === "number"
                            ? value.toFixed(2)
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <div className="flex gap-2">
                {confirmApply === suggestion.id ? (
                  <>
                    <button
                      onClick={() => handleApply(suggestion)}
                      disabled={applying === suggestion.id}
                      className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
                    >
                      {applying === suggestion.id ? "Applying..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmApply(null)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmApply(suggestion.id)}
                    disabled={applying === suggestion.id}
                    className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
                  >
                    Apply to {selectedTrack.name}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CodetteSuggestionsPanel;
