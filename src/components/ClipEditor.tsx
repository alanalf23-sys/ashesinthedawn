import React, { useState, useMemo } from 'react';
import { Clip } from '../types';
import { Trash2, Copy, Download } from 'lucide-react';
import { AudioClipProcessor } from '../lib/audioClipProcessor';

interface ClipEditorProps {
  clip: Clip;
  onUpdateClip: (updates: Partial<Clip>) => void;
  onDeleteClip: () => void;
  onDuplicateClip: () => void;
  onExportClip: () => void;
  duration?: number;
}

interface ClipProcessingState {
  playbackRate: number;
  pitchShift: number;
  fadeInMs: number;
  fadeOutMs: number;
  processedDuration: number;
}

export const ClipEditor: React.FC<ClipEditorProps> = ({
  clip,
  onUpdateClip,
  onDeleteClip,
  onDuplicateClip,
  onExportClip,
  duration = clip.duration,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [processingState, setProcessingState] = useState<ClipProcessingState>({
    playbackRate: 1.0,
    pitchShift: 0,
    fadeInMs: 0,
    fadeOutMs: 0,
    processedDuration: duration,
  });

  // Calculate processed duration
  const processedDuration = useMemo(() => {
    return AudioClipProcessor.getProcessedDuration(
      duration,
      processingState.playbackRate,
      processingState.pitchShift
    );
  }, [duration, processingState.playbackRate, processingState.pitchShift]);

  const handlePlaybackRateChange = (rate: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, rate));
    setProcessingState(prev => ({
      ...prev,
      playbackRate: clamped,
      processedDuration: AudioClipProcessor.getProcessedDuration(
        duration,
        clamped,
        prev.pitchShift
      ),
    }));
  };

  const handlePitchShiftChange = (semitones: number) => {
    const clamped = Math.max(-12, Math.min(12, semitones));
    setProcessingState(prev => ({
      ...prev,
      pitchShift: clamped,
      processedDuration: AudioClipProcessor.getProcessedDuration(
        duration,
        prev.playbackRate,
        clamped
      ),
    }));
  };

  const handleFadeInChange = (ms: number) => {
    const clamped = Math.max(0, Math.min(duration * 1000 * 0.5, ms));
    setProcessingState(prev => ({ ...prev, fadeInMs: clamped }));
  };

  const handleFadeOutChange = (ms: number) => {
    const clamped = Math.max(0, Math.min(duration * 1000 * 0.5, ms));
    setProcessingState(prev => ({ ...prev, fadeOutMs: clamped }));
  };

  const handleApplyProcessing = () => {
    onUpdateClip({
      ...clip,
      duration: processedDuration,
    });
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors"
        >
          {clip.name}
          <span className="text-xs text-gray-500 ml-2">{clip.duration.toFixed(2)}s</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onDuplicateClip}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Duplicate clip"
          >
            <Copy size={14} className="text-gray-400" />
          </button>
          <button
            onClick={onExportClip}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Export clip"
          >
            <Download size={14} className="text-gray-400" />
          </button>
          <button
            onClick={onDeleteClip}
            className="p-1 hover:bg-red-900/30 rounded transition-colors"
            title="Delete clip"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Expanded Editor */}
      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-gray-700">
          {/* Playback Rate */}
          <div>
            <label htmlFor="playback-rate" className="text-xs text-gray-400 block mb-1">
              Playback Rate: {processingState.playbackRate.toFixed(2)}x
            </label>
            <div className="flex items-center gap-2">
              <input
                id="playback-rate"
                name="playback-rate"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={processingState.playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded"
              />
              <input
                id="playback-rate-value"
                name="playback-rate-value"
                type="number"
                min="0.5"
                max="2.0"
                step="0.1"
                value={processingState.playbackRate.toFixed(2)}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className="w-12 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-gray-300"
              />
            </div>
          </div>

          {/* Pitch Shift */}
          <div>
            <label htmlFor="pitch-shift" className="text-xs text-gray-400 block mb-1">
              Pitch Shift: {processingState.pitchShift > 0 ? '+' : ''}{processingState.pitchShift} semitones
            </label>
            <div className="flex items-center gap-2">
              <input
                id="pitch-shift"
                name="pitch-shift"
                type="range"
                min="-12"
                max="12"
                step="1"
                value={processingState.pitchShift}
                onChange={(e) => handlePitchShiftChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded"
              />
              <input
                id="pitch-shift-value"
                name="pitch-shift-value"
                type="number"
                min="-12"
                max="12"
                step="1"
                value={processingState.pitchShift}
                onChange={(e) => handlePitchShiftChange(parseInt(e.target.value))}
                className="w-12 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-gray-300"
              />
            </div>
          </div>

          {/* Fade In */}
          <div>
            <label htmlFor="fade-in" className="text-xs text-gray-400 block mb-1">
              Fade In: {(processingState.fadeInMs / 1000).toFixed(2)}s
            </label>
            <div className="flex items-center gap-2">
              <input
                id="fade-in"
                name="fade-in"
                type="range"
                min="0"
                max={duration * 500}
                step="10"
                value={processingState.fadeInMs}
                onChange={(e) => handleFadeInChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded"
              />
              <input
                id="fade-in-value"
                name="fade-in-value"
                type="number"
                min="0"
                step="10"
                value={processingState.fadeInMs}
                onChange={(e) => handleFadeInChange(parseFloat(e.target.value))}
                className="w-16 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-gray-300"
              />
            </div>
          </div>

          {/* Fade Out */}
          <div>
            <label htmlFor="fade-out" className="text-xs text-gray-400 block mb-1">
              Fade Out: {(processingState.fadeOutMs / 1000).toFixed(2)}s
            </label>
            <div className="flex items-center gap-2">
              <input
                id="fade-out"
                name="fade-out"
                type="range"
                min="0"
                max={duration * 500}
                step="10"
                value={processingState.fadeOutMs}
                onChange={(e) => handleFadeOutChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded"
              />
              <input
                id="fade-out-value"
                name="fade-out-value"
                type="number"
                min="0"
                step="10"
                value={processingState.fadeOutMs}
                onChange={(e) => handleFadeOutChange(parseFloat(e.target.value))}
                className="w-16 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-gray-300"
              />
            </div>
          </div>

          {/* Processed Duration */}
          <div className="p-2 bg-gray-700/50 rounded border border-gray-600">
            <div className="text-xs text-gray-400 space-y-1">
              <div>Original Duration: {duration.toFixed(2)}s</div>
              <div>Processed Duration: {processedDuration.toFixed(2)}s</div>
              <div>Change: {((processedDuration / duration - 1) * 100).toFixed(1)}%</div>
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApplyProcessing}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            Apply Processing
          </button>
        </div>
      )}
    </div>
  );
};
