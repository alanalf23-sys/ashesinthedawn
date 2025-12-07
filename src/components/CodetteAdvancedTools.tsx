/**
 * Codette Advanced Tools Modal
 * Main component with tabbed interface for 5 advanced features
 */

import { useState } from 'react';
import { X, Music, ListChecks, Volume2, Headphones, Clock } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import GenreDetection from './CodetteAdvancedTools/GenreDetection';
import ProductionChecklist from './CodetteAdvancedTools/ProductionChecklist';
import InstrumentGuide from './CodetteAdvancedTools/InstrumentGuide';
import EarTraining from './CodetteAdvancedTools/EarTraining';
import DelaySync from './CodetteAdvancedTools/DelaySync';

interface CodetteAdvancedToolsProps {
  onClose: () => void;
}

type TabId = 'genre' | 'checklist' | 'instrument' | 'training' | 'delay';

export default function CodetteAdvancedTools({ onClose }: CodetteAdvancedToolsProps) {
  const { currentProject, tracks } = useDAW();
  const [activeTab, setActiveTab] = useState<TabId>('genre');

  const tabs = [
    { id: 'genre' as TabId, label: 'Genre Detection', icon: Music },
    { id: 'checklist' as TabId, label: 'Checklist', icon: ListChecks },
    { id: 'instrument' as TabId, label: 'Instrument Guide', icon: Volume2 },
    { id: 'training' as TabId, label: 'Ear Training', icon: Headphones },
    { id: 'delay' as TabId, label: 'Delay Sync', icon: Clock },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-5xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <div>
            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-400" />
              Codette Advanced Tools
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Professional music production tools powered by AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 bg-gray-900/50 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                  isActive
                    ? 'border-purple-500 text-purple-400 bg-purple-900/20'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'genre' && (
            <GenreDetection
              bpm={currentProject?.bpm || 120}
              tracks={tracks}
              projectName={currentProject?.name || ''}
            />
          )}
          {activeTab === 'checklist' && <ProductionChecklist />}
          {activeTab === 'instrument' && <InstrumentGuide />}
          {activeTab === 'training' && <EarTraining />}
          {activeTab === 'delay' && (
            <DelaySync bpm={currentProject?.bpm || 120} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700 bg-gray-900/50 flex items-center justify-between text-xs text-gray-500">
          <span>Powered by Codette AI Engine</span>
          <span>Version 2.0</span>
        </div>
      </div>
    </div>
  );
}
