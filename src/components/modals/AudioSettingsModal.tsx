import { useEffect, useState } from 'react';
import { X, RefreshCw, Play, Square } from 'lucide-react';
import { useDAW } from '../../contexts/DAWContext';
import type { AudioDevice } from '../../types';

export default function AudioSettingsModal() {
  const {
    showAudioSettingsModal,
    closeAudioSettingsModal,
    selectedInputDevice,
    selectedOutputDevice,
    getInputDevices,
    getOutputDevices,
    selectInputDevice,
    selectOutputDevice,
    startAudioIO,
    isAudioIOActive,
    audioIOError,
    refreshDeviceList,
    startTestTone,
    stopTestTone,
  } = useDAW();

  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [selectedBufferSize, setSelectedBufferSize] = useState('8192');
  const [testToneFrequency, setTestToneFrequency] = useState('440');
  const [isPlayingTestTone, setIsPlayingTestTone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load devices on mount and when modal opens
  useEffect(() => {
    if (!showAudioSettingsModal) return;

    const loadDevices = async () => {
      try {
        setIsLoadingDevices(true);
        setError(null);
        const inputDev = await getInputDevices();
        const outputDev = await getOutputDevices();
        setInputDevices(inputDev);
        setOutputDevices(outputDev);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load devices');
      } finally {
        setIsLoadingDevices(false);
      }
    };

    loadDevices();
  }, [showAudioSettingsModal, getInputDevices, getOutputDevices]);

  const handleInputDeviceChange = async (deviceId: string) => {
    try {
      setError(null);
      const success = await selectInputDevice(deviceId);
      if (!success) {
        setError('Failed to select input device');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error selecting device');
    }
  };

  const handleOutputDeviceChange = async (deviceId: string) => {
    try {
      setError(null);
      const success = await selectOutputDevice(deviceId);
      if (!success) {
        setError('Failed to select output device');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error selecting device');
    }
  };

  const handleRefreshDevices = async () => {
    try {
      setError(null);
      setIsLoadingDevices(true);
      await refreshDeviceList();
      const inputDev = await getInputDevices();
      const outputDev = await getOutputDevices();
      setInputDevices(inputDev);
      setOutputDevices(outputDev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh devices');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handlePlayTestTone = async () => {
    try {
      setError(null);
      if (!isPlayingTestTone) {
        // Start audio I/O if not already active
        if (!isAudioIOActive) {
          const success = await startAudioIO();
          if (!success) {
            setError('Failed to start audio I/O');
            return;
          }
        }
        // Parse frequency and start test tone
        const freq = parseFloat(testToneFrequency);
        if (isNaN(freq) || freq < 20 || freq > 20000) {
          setError('Invalid frequency. Must be between 20Hz and 20kHz');
          return;
        }
        const success = startTestTone(freq, 0.1); // 10% volume for safety
        if (success) {
          setIsPlayingTestTone(true);
        } else {
          setError('Failed to start test tone');
        }
      } else {
        stopTestTone();
        setIsPlayingTestTone(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error playing test tone');
      setIsPlayingTestTone(false);
    }
  };

  if (!showAudioSettingsModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-gray-100">Audio Settings</h2>
          <button
            onClick={closeAudioSettingsModal}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {audioIOError && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
              Audio I/O Error: {audioIOError}
            </div>
          )}

          {/* Device Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={handleRefreshDevices}
              disabled={isLoadingDevices}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDevices ? 'animate-spin' : ''}`} />
              Refresh Devices
            </button>
          </div>

          {/* Input Devices Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-200">Input Device</label>
            <div className="relative">
              <select
                value={selectedInputDevice?.deviceId || ''}
                onChange={(e) => handleInputDeviceChange(e.target.value)}
                disabled={isLoadingDevices || inputDevices.length === 0}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingDevices
                    ? 'Loading devices...'
                    : inputDevices.length === 0
                      ? 'No input devices found'
                      : 'Select an input device'}
                </option>
                {inputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Input Device (${device.kind})`}
                  </option>
                ))}
              </select>
            </div>
            {selectedInputDevice && (
              <div className="text-xs text-gray-400 space-y-1">
                <p>State: {selectedInputDevice.state}</p>
                <p>Group ID: {selectedInputDevice.groupId || 'N/A'}</p>
              </div>
            )}
          </div>

          {/* Output Devices Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-200">Output Device</label>
            <div className="relative">
              <select
                value={selectedOutputDevice?.deviceId || ''}
                onChange={(e) => handleOutputDeviceChange(e.target.value)}
                disabled={isLoadingDevices || outputDevices.length === 0}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingDevices
                    ? 'Loading devices...'
                    : outputDevices.length === 0
                      ? 'No output devices found'
                      : 'Select an output device'}
                </option>
                {outputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Output Device (${device.kind})`}
                  </option>
                ))}
              </select>
            </div>
            {selectedOutputDevice && (
              <div className="text-xs text-gray-400 space-y-1">
                <p>State: {selectedOutputDevice.state}</p>
                <p>Group ID: {selectedOutputDevice.groupId || 'N/A'}</p>
              </div>
            )}
          </div>

          {/* Buffer Size Configuration */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-200">Buffer Size</label>
            <div className="grid grid-cols-4 gap-2">
              {['256', '512', '1024', '2048', '4096', '8192', '16384', '32768'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedBufferSize(size)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedBufferSize === size
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {selectedBufferSize === '256' && 'Lowest latency (~5ms @ 48kHz) - May cause issues on slower systems'}
              {selectedBufferSize === '512' && 'Very low latency (~11ms @ 48kHz)'}
              {selectedBufferSize === '1024' && 'Low latency (~21ms @ 48kHz)'}
              {selectedBufferSize === '2048' && 'Normal latency (~43ms @ 48kHz)'}
              {selectedBufferSize === '4096' && 'Higher latency (~85ms @ 48kHz)'}
              {selectedBufferSize === '8192' && 'Professional standard (~170ms @ 48kHz) - Recommended'}
              {selectedBufferSize === '16384' && 'High latency (~341ms @ 48kHz)'}
              {selectedBufferSize === '32768' && 'Maximum latency (~682ms @ 48kHz) - Recording only'}
            </p>
          </div>

          {/* Test Tone Generator */}
          <div className="space-y-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <label className="block text-sm font-semibold text-gray-200">Test Tone Generator</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs text-gray-400">Frequency (Hz)</label>
                <input
                  type="number"
                  value={testToneFrequency}
                  onChange={(e) => setTestToneFrequency(e.target.value)}
                  min="20"
                  max="20000"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handlePlayTestTone}
                  disabled={isLoadingDevices}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isPlayingTestTone
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700'
                  }`}
                >
                  {isPlayingTestTone ? (
                    <>
                      <Square className="w-4 h-4" />
                      Stop Tone
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Play Tone
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Generate a sine wave at the specified frequency to test output and detect audio levels.
            </p>
          </div>

          {/* Audio I/O Status */}
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-2">
            <label className="block text-sm font-semibold text-gray-200">Audio I/O Status</label>
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${isAudioIOActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}
              />
              <span className="text-sm text-gray-300">
                {isAudioIOActive ? 'Audio I/O Active' : 'Audio I/O Inactive'}
              </span>
            </div>
            {isAudioIOActive && (
              <p className="text-xs text-gray-400">
                Real-time audio I/O is active. Check AudioMonitor for live metrics.
              </p>
            )}
          </div>

          {/* Information Section */}
          <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg space-y-2">
            <h3 className="text-sm font-semibold text-blue-300">ℹ️ Audio Setup Guide</h3>
            <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
              <li>Select your audio input device (microphone)</li>
              <li>Select your audio output device (speakers/headphones)</li>
              <li>Choose an appropriate buffer size based on your system</li>
              <li>Use test tone to verify audio routing</li>
              <li>Monitor real-time levels in the AudioMonitor panel</li>
              <li>Aim for latency under 10ms for professional recording</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 flex justify-end gap-3 p-6">
          <button
            onClick={closeAudioSettingsModal}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
          <button
            onClick={closeAudioSettingsModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
