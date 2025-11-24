import { useState } from 'react';
import { X } from 'lucide-react';
import { useDAW } from '../../contexts/DAWContext';

export default function MixerOptionsModal() {
  const { showMixerOptionsModal, closeMixerOptionsModal } = useDAW();
  const [stripWidth, setStripWidth] = useState(100);
  const [stripHeight, setStripHeight] = useState(400);
  const [showMeters, setShowMeters] = useState(true);
  const [showPanning, setShowPanning] = useState(true);
  const [showPlugins, setShowPlugins] = useState(true);
  const [autoMute, setAutoMute] = useState(false);
  const [peakHold, setPeakHold] = useState(true);
  const [peakHoldTime, setPeakHoldTime] = useState(3);

  // Calculate max/min dimensions based on screen size
  const maxStripWidth = Math.floor(window.innerWidth * 0.9);
  const maxStripHeight = Math.floor(window.innerHeight * 0.85);
  const minStripWidth = 60;
  const minStripHeight = 200;

  if (!showMixerOptionsModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Mixer Options</h2>
          <button
            onClick={closeMixerOptionsModal}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Channel Strip Size */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Channel Strip Size</h3>
            <div className="space-y-4 pl-4 border-l border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Width: <span className="text-blue-400 font-mono">{stripWidth}px</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={minStripWidth}
                    max={maxStripWidth}
                    value={stripWidth}
                    onChange={(e) => setStripWidth(parseInt(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-xs text-gray-500 w-16">
                    {minStripWidth}-{maxStripWidth}px
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Height: <span className="text-blue-400 font-mono">{stripHeight}px</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={minStripHeight}
                    max={maxStripHeight}
                    value={stripHeight}
                    onChange={(e) => setStripHeight(parseInt(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-xs text-gray-500 w-16">
                    {minStripHeight}-{maxStripHeight}px
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Display Options */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Display Options</h3>
            <div className="space-y-2 pl-4 border-l border-gray-700">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showMeters}
                  onChange={(e) => setShowMeters(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Show level meters</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showPanning}
                  onChange={(e) => setShowPanning(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Show panning controls</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showPlugins}
                  onChange={(e) => setShowPlugins(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Show plugin rack</span>
              </label>
            </div>
          </section>

          {/* Metering */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Metering</h3>
            <div className="space-y-3 pl-4 border-l border-gray-700">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={peakHold}
                  onChange={(e) => setPeakHold(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Enable peak hold</span>
              </label>

              {peakHold && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Peak hold time: <span className="text-blue-400">{peakHoldTime}s</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={peakHoldTime}
                    onChange={(e) => setPeakHoldTime(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Behavior */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Behavior</h3>
            <div className="space-y-2 pl-4 border-l border-gray-700">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoMute}
                  onChange={(e) => setAutoMute(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Auto-mute when other track soloed</span>
              </label>

              <p className="text-xs text-gray-500 mt-3">
                These settings apply to the mixer display and behavior. Changes take effect immediately.
              </p>
            </div>
          </section>
        </div>

        <div className="flex gap-2 mt-8">
          <button
            onClick={closeMixerOptionsModal}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
          >
            Reset to Defaults
          </button>
          <button
            onClick={closeMixerOptionsModal}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
