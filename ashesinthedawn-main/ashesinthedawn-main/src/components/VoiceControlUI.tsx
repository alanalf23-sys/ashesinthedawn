import { useEffect, useState } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { getVoiceControlEngine } from '../lib/voiceControlEngine';

interface VoiceControlUIProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function VoiceControlUI({ isEnabled, onToggle }: VoiceControlUIProps) {
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [lastCommand, setLastCommand] = useState<string>('');
  const [commandConfidence, setCommandConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const engine = getVoiceControlEngine();

  useEffect(() => {
    if (!engine.isSupported()) {
      setError('Speech Recognition not supported in this browser');
      return;
    }

    if (isEnabled) {
      engine.enable();
    } else {
      engine.disable();
    }

    // Listen to voice events
    const handleListening = (e: Event) => {
      setIsListening((e as CustomEvent).detail);
    };

    const handleInterim = (e: Event) => {
      setInterim((e as CustomEvent).detail);
    };

    const handleCommand = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setLastCommand(detail.transcript);
      setCommandConfidence(Math.round(detail.confidence * 100));
      setInterim('');
    };

    const handleError = (e: Event) => {
      setError((e as CustomEvent).detail);
    };

    window.addEventListener('voice:listening', handleListening);
    window.addEventListener('voice:interim', handleInterim);
    window.addEventListener('voice:command', handleCommand);
    window.addEventListener('voice:error', handleError);

    return () => {
      window.removeEventListener('voice:listening', handleListening);
      window.removeEventListener('voice:interim', handleInterim);
      window.removeEventListener('voice:command', handleCommand);
      window.removeEventListener('voice:error', handleError);
    };
  }, [isEnabled, engine]);

  return (
    <div className="w-full p-4 bg-gray-900 border-t border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => onToggle(!isEnabled)}
          className={`p-2 rounded-lg transition-colors ${
            isEnabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
          }`}
          title={isEnabled ? 'Voice Control: ON' : 'Voice Control: OFF'}
        >
          {isEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <div className="flex-1">
          <div className="text-sm text-gray-400">
            {isListening ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Listening...
              </span>
            ) : isEnabled ? (
              <span className="text-gray-500">Ready for voice commands</span>
            ) : (
              <span className="text-gray-600">Voice Control: OFF</span>
            )}
          </div>
        </div>
      </div>

      {interim && (
        <div className="mb-3 p-2 bg-blue-900/30 rounded border border-blue-700 text-sm text-blue-200">
          <span className="font-semibold">Interim:</span> {interim}
        </div>
      )}

      {lastCommand && (
        <div className="mb-3 p-2 bg-green-900/30 rounded border border-green-700 text-sm text-green-200">
          <span className="font-semibold">Command:</span> {lastCommand}
          <span className="ml-2 text-gray-400">({commandConfidence}% confidence)</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-900/30 rounded border border-red-700 text-sm text-red-200">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-400">Available commands:</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p>• Play / Pause</p>
            <p>• Stop / Record</p>
            <p>• Next / Previous</p>
          </div>
          <div>
            <p>• Undo / Redo</p>
            <p>• Solo / Mute</p>
            <p>• Volume [0-100]</p>
          </div>
        </div>
      </div>
    </div>
  );
}
