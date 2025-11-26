import { useState, useEffect } from 'react';
import { useDAW } from '../contexts/DAWContext';
import { Zap, CheckCircle, AlertCircle, Trash2, ChevronDown } from 'lucide-react';

interface ExecutionEvent {
  id: string;
  timestamp: number;
  functionName: string;
  category: 'transport' | 'track' | 'effect' | 'level' | 'routing' | 'analysis';
  status: 'success' | 'info' | 'warning';
  message: string;
  details?: string;
}

export default function FunctionExecutionLog() {
  const { isPlaying, selectedTrack } = useDAW();
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Simulate real-time function execution logging
  useEffect(() => {
    const checkForChanges = () => {
      const now = Date.now();
      const recentEvents: ExecutionEvent[] = [];

      // Log transport state changes
      if (isPlaying) {
        const lastEvent = events.find(e => e.functionName === 'togglePlay');
        if (!lastEvent || (now - lastEvent.timestamp) > 3000) {
          recentEvents.push({
            id: `transport-${now}`,
            timestamp: now,
            functionName: 'togglePlay()',
            category: 'transport',
            status: 'success',
            message: 'Playback Started',
            details: 'Audio engine playing all active tracks',
          });
        }
      }

      // Log track selection changes
      if (selectedTrack) {
        const lastEvent = events.find(e => 
          e.functionName === 'selectTrack' && 
          e.details?.includes(selectedTrack.id)
        );
        if (!lastEvent || (now - lastEvent.timestamp) > 5000) {
          recentEvents.push({
            id: `track-${selectedTrack.id}-${now}`,
            timestamp: now,
            functionName: 'selectTrack()',
            category: 'track',
            status: 'info',
            message: `Track Selected: ${selectedTrack.name}`,
            details: `Type: ${selectedTrack.type} | Effects: ${selectedTrack.inserts?.length || 0}`,
          });
        }
      }

      // Log active effects
      if (selectedTrack && selectedTrack.inserts && selectedTrack.inserts.length > 0) {
        const activeEffects = selectedTrack.inserts.filter(p => typeof p !== 'string' && p.enabled);
        if (activeEffects.length > 0) {
          const effectNames = activeEffects
            .map(p => typeof p !== 'string' ? p.name : '')
            .filter(Boolean)
            .join(', ');
          
          const lastEvent = events.find(e => 
            e.functionName === 'effectChain' && 
            e.details?.includes(effectNames)
          );
          if (!lastEvent || (now - lastEvent.timestamp) > 5000) {
            recentEvents.push({
              id: `effects-${now}`,
              timestamp: now,
              functionName: 'effectChain',
              category: 'effect',
              status: 'success',
              message: `${activeEffects.length} Effects Active`,
              details: effectNames,
            });
          }
        }
      }

      // Add new events
      if (recentEvents.length > 0) {
        setEvents(prev => [...recentEvents.slice(0, 3), ...prev.slice(0, 9)]);
      }
    };

    const interval = setInterval(checkForChanges, 2000);
    return () => clearInterval(interval);
  }, [isPlaying, selectedTrack, events]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Zap className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transport':
        return 'bg-green-900/20 border-green-700/30';
      case 'track':
        return 'bg-blue-900/20 border-blue-700/30';
      case 'effect':
        return 'bg-purple-900/20 border-purple-700/30';
      case 'level':
        return 'bg-yellow-900/20 border-yellow-700/30';
      case 'routing':
        return 'bg-pink-900/20 border-pink-700/30';
      case 'analysis':
        return 'bg-cyan-900/20 border-cyan-700/30';
      default:
        return 'bg-gray-800/50 border-gray-700/30';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 1000) return 'now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    return `${Math.floor(diff / 60000)}m ago`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-40 max-w-md">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="font-semibold text-sm text-gray-200">Function Execution</span>
          <span className="px-2 py-0.5 bg-purple-600/30 text-purple-300 rounded text-xs">
            {events.length}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Events List */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              Waiting for function calls...
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`p-2 rounded border text-xs space-y-1 ${getCategoryColor(
                    event.category
                  )}`}
                >
                  <div className="flex items-start gap-2">
                    {getStatusIcon(event.status)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-200 flex items-center gap-2">
                        <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs text-purple-300">
                          {event.functionName}
                        </code>
                        <span className="text-gray-500">{formatTime(event.timestamp)}</span>
                      </div>
                      <div className="text-gray-400">{event.message}</div>
                      {event.details && (
                        <div className="text-gray-500 text-xs mt-1 italic">
                          {event.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Clear Button */}
          {events.length > 0 && (
            <div className="p-2 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setEvents([])}
                className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded transition flex items-center gap-1 text-xs"
                title="Clear log"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapsed Mode - Show Active Functions */}
      {!isExpanded && events.length > 0 && (
        <div className="px-3 py-2 text-xs text-gray-400 space-y-1 max-h-20 overflow-hidden">
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="flex items-center gap-1 text-gray-500">
              <span className="w-1 h-1 rounded-full bg-purple-500"></span>
              {event.functionName}
            </div>
          ))}
          {events.length > 3 && (
            <div className="text-gray-600 italic text-xs">
              +{events.length - 3} more...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
