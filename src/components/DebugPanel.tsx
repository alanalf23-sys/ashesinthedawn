import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';
import { useDAW } from '../contexts/DAWContext';

interface DebugSection {
  title: string;
  content: Record<string, string | number | boolean>;
}

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Config']));
  const { tracks, selectedTrack, isPlaying, currentTime } = useDAW();

  if (APP_CONFIG.debug.LOG_LEVEL !== 'debug') {
    return null;
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const debugSections: DebugSection[] = [
    {
      title: 'Config',
      content: {
        APP_NAME: APP_CONFIG.system.APP_NAME,
        VERSION: APP_CONFIG.system.VERSION,
        LOG_LEVEL: APP_CONFIG.debug.LOG_LEVEL,
        PERF_MONITOR: APP_CONFIG.debug.SHOW_PERFORMANCE_MONITOR,
        LAYOUT_GUIDES: APP_CONFIG.debug.SHOW_LAYOUT_GUIDES,
      },
    },
    {
      title: 'DAW State',
      content: {
        TotalTracks: tracks.length,
        SelectedTrack: selectedTrack?.name || 'None',
        IsPlaying: isPlaying,
        CurrentTime: currentTime.toFixed(3),
        Recording: 'Off',
      },
    },
    {
      title: 'Tracks',
      content: tracks.reduce(
        (acc, track) => ({
          ...acc,
          [track.name]: {
            Type: track.type,
            Volume: `${track.volume.toFixed(1)}dB`,
            Muted: track.muted,
            Armed: track.armed,
          },
        }),
        {}
      ),
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-xs">
      {/* Minimize Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 shadow-lg"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Debug
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="bg-gray-950 border border-blue-600 rounded shadow-xl max-w-sm max-h-96 overflow-auto">
          <div className="p-3 space-y-2">
            {debugSections.map((section) => (
              <div key={section.title} className="border border-gray-700 rounded">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center gap-2 px-2 py-1 hover:bg-gray-900 bg-gray-800"
                >
                  {expandedSections.has(section.title) ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  <span className="text-blue-400 font-bold">{section.title}</span>
                </button>

                {expandedSections.has(section.title) && (
                  <div className="px-2 py-1 bg-gray-900 space-y-1 text-gray-300">
                    {Object.entries(section.content).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4">
                        <span className="text-gray-400">{key}:</span>
                        <span className="text-green-400 font-semibold text-right">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
