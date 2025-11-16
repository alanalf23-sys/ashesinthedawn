import { useState } from 'react';
import { Folder, Grid3X3, Zap, BookOpen } from 'lucide-react';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<'browser' | 'plugins' | 'templates' | 'ai'>('browser');

  const handlePluginClick = (plugin: string) => {
    console.log('Plugin selected:', plugin);
  };

  const handleTemplateClick = (template: string) => {
    console.log('Template selected:', template);
  };

  const handleSmartGainStaging = () => {
    console.log('Smart Gain Staging activated');
  };

  const handleRoutingAssistant = () => {
    console.log('Routing Assistant activated');
  };

  const handleSessionHealth = () => {
    console.log('Session Health Check started');
  };

  const handleCreateTemplate = () => {
    console.log('Create Template from Session started');
  };

  return (
    <div className="w-64 bg-gray-900 border-l border-gray-700 flex flex-col">
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('browser')}
          className={`flex-1 p-3 flex items-center justify-center space-x-2 ${
            activeTab === 'browser' ? 'bg-gray-800 text-blue-400' : 'text-gray-400 hover:text-white'
          }`}
          title="File Browser"
        >
          <Folder className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTab('plugins')}
          className={`flex-1 p-3 flex items-center justify-center space-x-2 ${
            activeTab === 'plugins' ? 'bg-gray-800 text-blue-400' : 'text-gray-400 hover:text-white'
          }`}
          title="Stock Plugins"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 p-3 flex items-center justify-center space-x-2 ${
            activeTab === 'templates' ? 'bg-gray-800 text-blue-400' : 'text-gray-400 hover:text-white'
          }`}
          title="Templates"
        >
          <BookOpen className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 p-3 flex items-center justify-center space-x-2 ${
            activeTab === 'ai' ? 'bg-gray-800 text-blue-400' : 'text-gray-400 hover:text-white'
          }`}
          title="LogicCore AI"
        >
          <Zap className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'browser' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white mb-3">File Browser</h3>
            <div className="text-xs text-gray-400">
              <div className="p-2 hover:bg-gray-800 rounded cursor-pointer">My Projects</div>
              <div className="p-2 hover:bg-gray-800 rounded cursor-pointer">Audio Files</div>
              <div className="p-2 hover:bg-gray-800 rounded cursor-pointer">Samples</div>
              <div className="p-2 hover:bg-gray-800 rounded cursor-pointer">Loops</div>
            </div>
          </div>
        )}

        {activeTab === 'plugins' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white mb-3">Stock Plugins</h3>
            <div className="space-y-1">
              {['Channel EQ', 'Channel Compressor', 'Gate/Expander', 'Saturation', 'Delay', 'Reverb', 'Utility', 'Metering'].map((plugin) => (
                <div
                  key={plugin}
                  className="p-2 bg-gray-800 rounded text-xs text-white hover:bg-gray-700 cursor-pointer"
                  onClick={() => handlePluginClick(plugin)}
                >
                  {plugin}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white mb-3">Templates</h3>
            <div className="space-y-1">
              {['Rock Band', 'Electronic Production', 'Podcast Mix', 'Orchestral', 'Hip Hop'].map((template) => (
                <div
                  key={template}
                  className="p-2 bg-gray-800 rounded text-xs text-white hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleTemplateClick(template)}
                >
                  {template}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white mb-3">LogicCore AI</h3>
            <div className="space-y-2">
              <button
                className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
                onClick={handleSmartGainStaging}
              >
                Smart Gain Staging
              </button>
              <button
                className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
                onClick={handleRoutingAssistant}
              >
                Routing Assistant
              </button>
              <button
                className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
                onClick={handleSessionHealth}
              >
                Session Health Check
              </button>
              <button
                className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
                onClick={handleCreateTemplate}
              >
                Create Template from Session
              </button>
            </div>
            <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-300">
              <p className="font-semibold text-white mb-1">Tip:</p>
              <p>Enable voice control to use commands like "Create four drum tracks" or "Route all guitars to new bus"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
