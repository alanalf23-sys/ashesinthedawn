/**
 * Production Checklist Tab
 * Stage-specific workflow checklists for music production
 */

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader, Award } from 'lucide-react';
import {
  getProductionChecklist,
  ProductionChecklistResult,
  ProductionChecklistItem,
  formatAPIError,
} from '../../services/codetteAdvancedApi';

export default function ProductionChecklist() {
  const [stage, setStage] = useState<'recording' | 'arrangement' | 'mixing' | 'mastering'>('mixing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductionChecklistResult | null>(null);
  const [localItems, setLocalItems] = useState<ProductionChecklistItem[]>([]);

  useEffect(() => {
    handleFetch();
  }, [stage]);

  useEffect(() => {
    if (result?.items) {
      // Load completed states from localStorage
      const saved = localStorage.getItem(`checklist_${stage}`);
      if (saved) {
        try {
          const completedIds = JSON.parse(saved) as string[];
          setLocalItems(
            result.items.map((item) => ({
              ...item,
              completed: completedIds.includes(item.id),
            }))
          );
        } catch {
          setLocalItems(result.items);
        }
      } else {
        setLocalItems(result.items);
      }
    }
  }, [result, stage]);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductionChecklist(stage);
      setResult(data);
    } catch (err) {
      setError(formatAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    const updated = localItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setLocalItems(updated);
    // Save to localStorage
    const completedIds = updated.filter((i) => i.completed).map((i) => i.id);
    localStorage.setItem(`checklist_${stage}`, JSON.stringify(completedIds));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-700 bg-red-900/20';
      case 'medium':
        return 'border-yellow-700 bg-yellow-900/20';
      case 'low':
        return 'border-gray-700 bg-gray-900/20';
      default:
        return 'border-gray-700 bg-gray-900';
    }
  };

  const completedCount = localItems.filter((i) => i.completed).length;
  const completionPercentage =
    localItems.length > 0 ? Math.round((completedCount / localItems.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stage Selector */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Production Stage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['recording', 'arrangement', 'mixing', 'mastering'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                stage === s
                  ? 'bg-purple-600 text-white border-2 border-purple-500'
                  : 'bg-gray-800 text-gray-300 border-2 border-gray-700 hover:border-gray-600'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-sm text-red-400">Error: {error}</p>
        </div>
      )}

      {/* Completion Progress */}
      {!loading && localItems.length > 0 && (
        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg p-4 border border-purple-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-200">Progress</span>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-lg font-bold text-purple-300">{completionPercentage}%</span>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {completedCount} of {localItems.length} tasks completed
          </p>
        </div>
      )}

      {/* Checklist Items */}
      {!loading && localItems.length > 0 && (
        <div className="space-y-3">
          {localItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg p-4 border ${getPriorityColor(item.priority)} transition ${
                item.completed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-purple-400 transition"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-purple-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        item.priority === 'high'
                          ? 'bg-red-900/50 text-red-300'
                          : item.priority === 'medium'
                          ? 'bg-yellow-900/50 text-yellow-300'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {item.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{item.category}</span>
                  </div>
                  <p
                    className={`text-sm ${
                      item.completed ? 'line-through text-gray-500' : 'text-gray-200'
                    }`}
                  >
                    {item.task}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Pro Tip:</span> Follow these checklists sequentially for
          best results. High-priority items should be completed before moving to the next stage.
          Your progress is saved automatically.
        </p>
      </div>
    </div>
  );
}
