/**
 * CodetteAnalysisPanel
 * Displays audio analysis results from Codette AI
 */

import React, { useState, useEffect } from "react";
import { useDAW } from "../contexts/DAWContext";

interface CodetteAnalysisPanelProps {
  trackId?: string;
  autoAnalyze?: boolean;
}

export function CodetteAnalysisPanel({
  trackId,
  autoAnalyze = false,
}: CodetteAnalysisPanelProps) {
  const { selectedTrack, analyzeTrackWithCodette, codetteConnected } =
    useDAW();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  const currentTrackId = trackId || selectedTrack?.id;

  const performAnalysis = async () => {
    if (!currentTrackId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeTrackWithCodette(currentTrackId);
      setAnalysis(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze track"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoAnalyze && currentTrackId && codetteConnected) {
      performAnalysis();
    }
  }, [currentTrackId, autoAnalyze, codetteConnected]);

  if (!codetteConnected) {
    return (
      <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded">
        <p className="text-sm text-yellow-300">
          Codette AI not connected
        </p>
      </div>
    );
  }

  if (!selectedTrack) {
    return (
      <div className="p-4 bg-gray-800 border border-gray-700 rounded">
        <p className="text-sm text-gray-400">Select a track to analyze</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">
          📊 Track Analysis
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

      {/* Analyze Button */}
      <button
        onClick={performAnalysis}
        disabled={loading}
        className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
      >
        {loading ? "Analyzing..." : "Analyze Track"}
      </button>

      {/* Analysis Results */}
      {analysis && (
        <div className="p-3 bg-gray-800 border border-gray-700 rounded space-y-3">
          {/* Quality Score */}
          {analysis.quality_score !== undefined && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">Quality Score</span>
                <span className="text-sm font-medium text-gray-200">
                  {(analysis.quality_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(analysis.quality_score * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Recommendations:</p>
              <ul className="space-y-1">
                {analysis.recommendations.map(
                  (rec: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-xs text-gray-300 flex items-start gap-2"
                    >
                      <span className="text-green-400 flex-shrink-0">✓</span>
                      <span>{rec}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Results */}
          {analysis.results && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Analysis Results:</p>
              <div className="space-y-2">
                {Object.entries(analysis.results).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-400">{key}:</span>
                    <span className="text-gray-200 font-medium">
                      {typeof value === "number"
                        ? value.toFixed(2)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && (
        <div className="p-3 bg-gray-800 rounded text-center">
          <p className="text-xs text-gray-500">
            Click "Analyze Track" to start
          </p>
        </div>
      )}
    </div>
  );
}

export default CodetteAnalysisPanel;
