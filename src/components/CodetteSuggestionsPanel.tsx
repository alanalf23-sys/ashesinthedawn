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

import React, { useState, useEffect } from "react";
import { useDAW } from "../contexts/DAWContext";
import { CodetteSuggestion } from "../lib/codetteBridge";

interface CodetteSuggestionsPanelProps {
  trackId?: string;
  context?: string;
  onApply?: (suggestion: CodetteSuggestion) => void;
}

export function CodetteSuggestionsPanel({
  trackId,
  context = "general",
  onApply,
}: CodetteSuggestionsPanelProps) {
  const {
    selectedTrack,
    getSuggestionsForTrack,
    applyCodetteSuggestion,
    codetteConnected,
    codetteSuggestions,
  } = useDAW();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [confirmApply, setConfirmApply] = useState<string | null>(null);

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
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">
          💡 Codette Suggestions
        </h3>
        {loading && <div className="animate-spin text-xs">⟳</div>}
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-300">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-3 bg-gray-800 rounded text-center">
          <p className="text-xs text-gray-400">Loading suggestions...</p>
        </div>
      )}

      {/* Suggestions List */}
      {!loading && codetteSuggestions.length === 0 && (
        <div className="p-3 bg-gray-800 rounded text-center">
          <p className="text-xs text-gray-500">No suggestions at this time</p>
        </div>
      )}

      {codetteSuggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="p-3 bg-gray-800 border border-gray-700 rounded hover:border-gray-600 transition-colors"
        >
          {/* Suggestion Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-100">
                {suggestion.title}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {suggestion.description}
              </p>
            </div>

            {/* Category Badge */}
            <div className="flex-shrink-0">
              <span className="inline-block px-2 py-1 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-300">
                {suggestion.category}
              </span>
            </div>
          </div>

          {/* Confidence & Type */}
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="text-gray-400">
              Type: <span className="text-gray-300 font-medium">{suggestion.type}</span>
            </span>
            <span className="text-gray-400">
              Confidence:{" "}
              <span className="text-gray-300 font-medium">
                {(suggestion.confidence * 100).toFixed(0)}%
              </span>
            </span>
          </div>

          {/* Parameters Preview */}
          {Object.keys(suggestion.parameters).length > 0 && (
            <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs">
              <p className="text-gray-400 mb-1">Parameters:</p>
              <div className="space-y-1">
                {Object.entries(suggestion.parameters).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between text-gray-400"
                  >
                    <span>{key}:</span>
                    <span className="text-gray-300">
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
          <div className="flex gap-2 mt-3">
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
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
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
  );
}

export default CodetteSuggestionsPanel;
