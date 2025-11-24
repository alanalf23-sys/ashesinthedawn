import { useState } from 'react';
import { Settings, Music, Plus, Grid, Zap, MessageCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import AudioMonitor from './AudioMonitor';
import TrackDetailsPanel from './TrackDetailsPanel';
import RoutingMatrix from './RoutingMatrix';
import PluginBrowser from './PluginBrowser';
import MIDISettings from './MIDISettings';
import SpectrumVisualizerPanel from './SpectrumVisualizerPanel';
import MarkerPanel from './MarkerPanel';
import CodettePanel from './CodettePanel';

type SidebarTab = 'files' | 'track' | 'routing' | 'plugins' | 'midi' | 'spectrum' | 'markers' | 'monitor' | 'codette';

export default function EnhancedSidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('track');

  const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: 'track', label: 'Track', icon: <Music className="w-4 h-4" /> },
    { id: 'files', label: 'Files', icon: <Plus className="w-4 h-4" /> },
    { id: 'routing', label: 'Routing', icon: <Grid className="w-4 h-4" /> },
    { id: 'plugins', label: 'Plugins', icon: <Zap className="w-4 h-4" /> },
    { id: 'midi', label: 'MIDI', icon: <Music className="w-4 h-4" /> },
    { id: 'spectrum', label: 'Analysis', icon: <Grid className="w-4 h-4" /> },
    { id: 'markers', label: 'Markers', icon: <Plus className="w-4 h-4" /> },
    { id: 'monitor', label: 'Monitor', icon: <Settings className="w-4 h-4" /> },
    { id: 'codette', label: 'Codette', icon: <MessageCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700 overflow-hidden text-xs">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-2 border-b border-gray-700 bg-gray-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={tab.label}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'track' && <TrackDetailsPanel />}
        {activeTab === 'files' && <Sidebar />}
        {activeTab === 'routing' && <RoutingMatrix />}
        {activeTab === 'plugins' && <PluginBrowser />}
        {activeTab === 'midi' && <MIDISettings />}
        {activeTab === 'spectrum' && <SpectrumVisualizerPanel />}
        {activeTab === 'markers' && <MarkerPanel />}
        {activeTab === 'monitor' && <AudioMonitor />}
        {activeTab === 'codette' && <CodettePanel isVisible={true} />}
      </div>
    </div>
  );
}
