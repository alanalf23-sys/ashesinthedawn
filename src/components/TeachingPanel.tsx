import { useState, useCallback } from 'react';
import {
  BookOpen,
  Brain,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  TrendingUp,
  Zap,
  Lightbulb,
} from 'lucide-react';
import { useTeachingMode, useCodetteTeaching, useFormattedTime } from '../hooks/useTeachingMode';
import { CODETTE_TEACHING_PROMPTS } from './CodetteTeachingGuide';

/**
 * Comprehensive Teaching Panel Component
 * 
 * Displays:
 * - Learning progress and statistics
 * - Available learning paths (beginner→intermediate→advanced)
 * - Recent functions learned
 * - Codette teaching interface
 * - Quick access to common learning topics
 */

interface TeachingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentBPM?: number;
  selectedTrackName?: string;
}

export default function TeachingPanel({
  isOpen,
  onClose,
  currentBPM = 120,
  selectedTrackName = 'Master',
}: TeachingPanelProps) {
  const {
    teachingModeEnabled,
    toggleTeachingMode,
    learningProgress,
    resetProgress,
    getLearningPercentage,
  } = useTeachingMode();

  const { isLoading, response, askCodette, clearResponse } = useCodetteTeaching();

  const [expandedSection, setExpandedSection] = useState<'overview' | 'paths' | 'codette' | null>(
    'overview'
  );
  const [codettePrompt, setCodettePrompt] = useState('');
  // const [selectedTopic, setSelectedTopic] = useState<keyof typeof CODETTE_TEACHING_PROMPTS | null>(null);

  const learningPercentage = getLearningPercentage();
  const formattedTime = useFormattedTime(learningProgress.totalTimeSpent);

  // Handle learning topic selection
  const handleSelectTopic = useCallback(
    async (topic: keyof typeof CODETTE_TEACHING_PROMPTS) => {
      let prompt = '';
      if (topic === 'learning-path') {
        prompt = CODETTE_TEACHING_PROMPTS['learning-path'](learningProgress.skillLevel);
      } else if (topic === 'performance-tips') {
        prompt = CODETTE_TEACHING_PROMPTS['performance-tips']('mixing', currentBPM);
      } else if (topic === 'music-theory') {
        prompt = CODETTE_TEACHING_PROMPTS['music-theory']('chord progressions');
      } else if (topic === 'dsp-explanation') {
        prompt = CODETTE_TEACHING_PROMPTS['dsp-explanation']('reverb');
      }

      await askCodette(prompt, { currentBPM, selectedTrackName });
    },
    [learningProgress.skillLevel, currentBPM, selectedTrackName, askCodette]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 top-0 bg-gradient-to-l from-purple-900/90 to-gray-900 border-l border-purple-700 shadow-2xl z-50 w-96 flex flex-col animate-slide-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-700 bg-gray-900/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-purple-300">Learning Center</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition"
          title="Close"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {/* Toggle Teaching Mode */}
        <button
          onClick={toggleTeachingMode}
          className={`w-full px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
            teachingModeEnabled
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Zap className="w-4 h-4" />
          {teachingModeEnabled ? 'Teaching Mode: ON' : 'Teaching Mode: OFF'}
        </button>

        {/* Overview Section */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'overview' ? null : 'overview')
            }
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition"
          >
            <div className="flex items-center gap-2 text-left">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-gray-200">Learning Overview</span>
            </div>
            {expandedSection === 'overview' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expandedSection === 'overview' && (
            <div className="p-4 space-y-3 border-t border-gray-700">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Overall Progress</span>
                  <span className="text-xs font-mono text-purple-300">{learningPercentage}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                    style={{ width: `${learningPercentage}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                  <div className="text-xs text-gray-400">Functions Learned</div>
                  <div className="text-lg font-bold text-purple-300">
                    {learningProgress.totalLearned}
                  </div>
                </div>
                <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                  <div className="text-xs text-gray-400">Skill Level</div>
                  <div className="text-lg font-bold text-blue-300 capitalize">
                    {learningProgress.skillLevel}
                  </div>
                </div>
                <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                  <div className="text-xs text-gray-400">Time Spent</div>
                  <div className="text-sm font-mono text-cyan-300">{formattedTime}</div>
                </div>
                <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                  <div className="text-xs text-gray-400">Last Updated</div>
                  <div className="text-xs text-gray-400">
                    {new Date(learningProgress.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Skill Badges */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-300">Unlocked Skills:</div>
                <div className="flex flex-wrap gap-1">
                  {learningProgress.skillLevel === 'beginner' && (
                    <span className="px-2 py-1 bg-blue-900/50 border border-blue-700 rounded text-xs text-blue-300">
                      🎓 Beginner
                    </span>
                  )}
                  {['intermediate', 'advanced'].includes(learningProgress.skillLevel) && (
                    <>
                      <span className="px-2 py-1 bg-blue-900/50 border border-blue-700 rounded text-xs text-blue-300">
                        🎓 Beginner
                      </span>
                      <span className="px-2 py-1 bg-green-900/50 border border-green-700 rounded text-xs text-green-300">
                        📈 Intermediate
                      </span>
                    </>
                  )}
                  {learningProgress.skillLevel === 'advanced' && (
                    <>
                      <span className="px-2 py-1 bg-green-900/50 border border-green-700 rounded text-xs text-green-300">
                        📈 Intermediate
                      </span>
                      <span className="px-2 py-1 bg-purple-900/50 border border-purple-700 rounded text-xs text-purple-300">
                        🚀 Advanced
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  if (confirm('Reset all learning progress?')) {
                    resetProgress();
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded border border-red-700/50 text-red-400 hover:bg-red-900/20 transition flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Progress
              </button>
            </div>
          )}
        </div>

        {/* Learning Paths Section */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'paths' ? null : 'paths')
            }
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition"
          >
            <div className="flex items-center gap-2 text-left">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-gray-200">Learning Paths</span>
            </div>
            {expandedSection === 'paths' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expandedSection === 'paths' && (
            <div className="p-4 space-y-2 border-t border-gray-700">
              <button
                onClick={() => handleSelectTopic('learning-path')}
                className="w-full px-3 py-2 text-left text-xs rounded bg-gray-900/50 hover:bg-gray-700 border border-gray-700 text-gray-300 transition"
              >
                <div className="font-semibold text-blue-300 mb-1">
                  📚 {learningProgress.skillLevel.charAt(0).toUpperCase() +
                    learningProgress.skillLevel.slice(1)}{' '}
                  Path
                </div>
                <div className="text-gray-400 text-xs">
                  Recommended functions to learn next
                </div>
              </button>

              <button
                onClick={() => handleSelectTopic('music-theory')}
                className="w-full px-3 py-2 text-left text-xs rounded bg-gray-900/50 hover:bg-gray-700 border border-gray-700 text-gray-300 transition"
              >
                <div className="font-semibold text-purple-300 mb-1">🎵 Music Theory</div>
                <div className="text-gray-400 text-xs">Learn chords, scales, and harmony</div>
              </button>

              <button
                onClick={() => handleSelectTopic('dsp-explanation')}
                className="w-full px-3 py-2 text-left text-xs rounded bg-gray-900/50 hover:bg-gray-700 border border-gray-700 text-gray-300 transition"
              >
                <div className="font-semibold text-cyan-300 mb-1">🔧 DSP Basics</div>
                <div className="text-gray-400 text-xs">
                  Digital signal processing fundamentals
                </div>
              </button>

              <button
                onClick={() => handleSelectTopic('performance-tips')}
                className="w-full px-3 py-2 text-left text-xs rounded bg-gray-900/50 hover:bg-gray-700 border border-gray-700 text-gray-300 transition"
              >
                <div className="font-semibold text-yellow-300 mb-1">⚡ Performance Optimization</div>
                <div className="text-gray-400 text-xs">
                  CPU usage, buffer sizes, and latency
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Codette Teaching Section */}
        <div className="bg-gray-800/50 border border-purple-700 rounded-lg overflow-hidden">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'codette' ? null : 'codette')
            }
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition bg-purple-900/20"
          >
            <div className="flex items-center gap-2 text-left">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span className="font-semibold text-purple-300">Ask Codette</span>
            </div>
            {expandedSection === 'codette' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expandedSection === 'codette' && (
            <div className="p-4 space-y-2 border-t border-purple-700">
              <textarea
                value={codettePrompt}
                onChange={(e) => setCodettePrompt(e.target.value)}
                placeholder="Ask a question about DAW functions, music theory, or DSP..."
                className="w-full h-16 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-purple-600"
              />
              <button
                onClick={() => askCodette(codettePrompt)}
                disabled={!codettePrompt.trim() || isLoading}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white text-xs rounded font-semibold transition"
              >
                {isLoading ? 'Thinking...' : 'Ask Codette'}
              </button>

              {response && (
                <div className="bg-gray-900/50 border border-purple-700 rounded p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs text-purple-300 font-semibold mb-1">Codette Says:</div>
                  <div className="text-xs text-gray-300 leading-relaxed">{response}</div>
                  <button
                    onClick={clearResponse}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-400"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Teaching Mode Info */}
        {teachingModeEnabled && (
          <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-3 text-xs text-purple-300 space-y-1">
            <div className="font-semibold">✨ Teaching Mode Active</div>
            <div>Hover over UI buttons to see tooltips with code examples and performance tips</div>
            <div>Mark functions as learned to track your progress</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-purple-700 bg-gray-900/50 p-3 text-xs text-gray-500">
        <div>
          CoreLogic Studio Learning Center • v1.0{' '}
          <span className="text-purple-400">| Powered by Codette</span>
        </div>
      </div>
    </div>
  );
}
