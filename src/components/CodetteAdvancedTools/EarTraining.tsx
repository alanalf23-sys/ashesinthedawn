/**
 * Ear Training Tab
 * Interactive ear training exercises for intervals, chords, and rhythm
 */

import { useState } from 'react';
import { Headphones, Loader, Play } from 'lucide-react';
import {
  getEarTrainingExercise,
  EarTrainingResult,
  formatAPIError,
} from '../../services/codetteAdvancedApi';

export default function EarTraining() {
  const [exerciseType, setExerciseType] = useState<'interval' | 'chord' | 'rhythm'>('interval');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EarTrainingResult | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEarTrainingExercise(exerciseType, difficulty);
      setResult(data);
    } catch (err) {
      setError(formatAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  const playAudioPlaceholder = () => {
    // Placeholder for future Web Audio API implementation
    alert('Audio playback coming soon! This will play the interval/chord using Web Audio API.');
  };

  return (
    <div className="space-y-6">
      {/* Exercise Configuration */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Exercise Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Exercise Type</label>
            <select
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-purple-500"
            >
              <option value="interval">Intervals</option>
              <option value="chord">Chords</option>
              <option value="rhythm">Rhythm</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-purple-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Headphones className="w-4 h-4" />
              Generate Exercises
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-sm text-red-400">Error: {error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && result.success && (
        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg p-4 border border-purple-700/50">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Instructions</h3>
            <p className="text-sm text-gray-300">{result.instructions}</p>
          </div>

          {/* Exercise Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-300">
                Exercises ({result.total_exercises})
              </h4>
              <span className="text-xs text-gray-500">
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level
              </span>
            </div>

            {result.quiz_items.map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-purple-600/50 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-purple-900/40 border border-purple-700 rounded-full text-sm font-bold text-purple-300">
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="text-sm font-semibold text-gray-200">{item.name}</h5>
                      {item.example && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.example}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={playAudioPlaceholder}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium text-white transition"
                  >
                    <Play className="w-3 h-3" />
                    Play
                  </button>
                </div>

                {/* Additional Info */}
                {item.semitones !== undefined && (
                  <div className="mt-2 pt-2 border-t border-gray-800">
                    <span className="text-xs text-gray-500">Semitones: </span>
                    <span className="text-xs text-gray-400 font-medium">{item.semitones}</span>
                  </div>
                )}

                {item.notes && item.notes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.notes.map((note, noteIdx) => (
                      <span
                        key={noteIdx}
                        className="px-2 py-0.5 bg-blue-900/30 border border-blue-700/30 rounded text-xs text-blue-300 font-mono"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Note:</span> Audio playback uses Web Audio API synthesis.
          Practice regularly to develop perfect pitch and rhythmic accuracy. Progress from beginner
          to advanced exercises for best results.
        </p>
      </div>
    </div>
  );
}
