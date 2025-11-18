import { useRef, useState } from 'react';
import { Folder, Grid3X3, Zap, BookOpen, Upload, AlertCircle, CheckCircle, FolderOpen, Music, Disc3, Waves } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<'browser' | 'plugins' | 'templates' | 'ai'>('browser');
  const [selectedBrowserTab, setSelectedBrowserTab] = useState<'projects' | 'audio' | 'samples' | 'loops'>('projects');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addTrack, uploadAudioFile, isUploadingFile, uploadError, currentProject } = useDAW();
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handlePluginClick = (plugin: string) => {
    addTrack('audio');
  };

  const handleTemplateClick = (template: string) => {
    const trackCounts: Record<string, number> = {
      'Rock Band': 4,
      'Electronic Production': 6,
      'Podcast Mix': 3,
      'Orchestral': 5,
      'Hip Hop': 4,
    };
    const count = trackCounts[template] || 4;
    for (let i = 0; i < count; i++) {
      addTrack('audio');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadSuccess(false);
    const result = await uploadAudioFile(file);

    if (result) {
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setUploadSuccess(false);
    const result = await uploadAudioFile(file);

    if (result) {
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white mb-3">File Browser</h3>

            {/* Project Browser Tabs */}
            <div className="flex gap-1 border-b border-gray-700">
              <button
                onClick={() => setSelectedBrowserTab('projects')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border-b-2 transition-colors ${
                  selectedBrowserTab === 'projects'
                    ? 'text-blue-400 border-blue-500'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                <FolderOpen className="w-3 h-3" />
                Projects
              </button>
              <button
                onClick={() => setSelectedBrowserTab('audio')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border-b-2 transition-colors ${
                  selectedBrowserTab === 'audio'
                    ? 'text-blue-400 border-blue-500'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                <Music className="w-3 h-3" />
                Audio Files
              </button>
              <button
                onClick={() => setSelectedBrowserTab('samples')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border-b-2 transition-colors ${
                  selectedBrowserTab === 'samples'
                    ? 'text-blue-400 border-blue-500'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                <Disc3 className="w-3 h-3" />
                Samples
              </button>
              <button
                onClick={() => setSelectedBrowserTab('loops')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border-b-2 transition-colors ${
                  selectedBrowserTab === 'loops'
                    ? 'text-blue-400 border-blue-500'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                <Waves className="w-3 h-3" />
                Loops
              </button>
            </div>

            {/* Projects Tab */}
            {selectedBrowserTab === 'projects' && (
              <div className="space-y-2">
                {currentProject ? (
                  <div className="p-3 bg-gray-800 rounded border border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <FolderOpen className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white truncate">{currentProject.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 space-y-0.5 ml-6">
                      <div>SR: {currentProject.sampleRate}Hz</div>
                      <div>BD: {currentProject.bitDepth}-bit</div>
                      <div>BPM: {currentProject.bpm}</div>
                      <div>Sig: {currentProject.timeSignature}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 py-8 text-center">
                    No project open
                  </div>
                )}
              </div>
            )}

            {/* Audio Files Tab */}
            {selectedBrowserTab === 'audio' && (
              <div className="space-y-2">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors cursor-pointer bg-gray-800/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".mp3,.wav,.ogg,.aac,.flac,.m4a"
                    className="hidden"
                    disabled={isUploadingFile}
                  />

                  <div className="flex flex-col items-center space-y-2">
                    {isUploadingFile ? (
                      <>
                        <div className="animate-spin">
                          <Upload className="w-6 h-6 text-blue-400" />
                        </div>
                        <p className="text-xs text-gray-300">Uploading...</p>
                      </>
                    ) : uploadSuccess ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <p className="text-xs text-green-400">Upload successful!</p>
                      </>
                    ) : uploadError ? (
                      <>
                        <AlertCircle className="w-6 h-6 text-red-400" />
                        <p className="text-xs text-red-400">{uploadError}</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-300 font-medium">Drag or click to upload</p>
                          <p className="text-xs text-gray-500 mt-0.5">MP3, WAV, OGG, etc.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Samples Tab */}
            {selectedBrowserTab === 'samples' && (
              <div className="text-xs text-gray-500 text-center py-8">
                No samples available
              </div>
            )}

            {/* Loops Tab */}
            {selectedBrowserTab === 'loops' && (
              <div className="text-xs text-gray-500 text-center py-8">
                No loops available
              </div>
            )}
          </div>
        )}

        {activeTab === 'plugins' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white mb-3">Stock Plugins</h3>
            <p className="text-xs text-gray-500 mb-3">Click a plugin to add an audio track</p>
            <div className="space-y-1">
              {['Channel EQ', 'Channel Compressor', 'Gate/Expander', 'Saturation', 'Delay', 'Reverb', 'Utility', 'Metering'].map((plugin) => (
                <button
                  key={plugin}
                  className="w-full p-2 bg-gray-800 rounded text-xs text-white hover:bg-gray-700 transition-colors text-left"
                  onClick={() => handlePluginClick(plugin)}
                >
                  {plugin}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white mb-3">Templates</h3>
            <p className="text-xs text-gray-500 mb-3">Click to create template tracks</p>
            <div className="space-y-1">
              {['Rock Band', 'Electronic Production', 'Podcast Mix', 'Orchestral', 'Hip Hop'].map((template) => (
                <button
                  key={template}
                  className="w-full p-2 bg-gray-800 rounded text-xs text-white hover:bg-gray-700 transition-colors text-left"
                  onClick={() => handleTemplateClick(template)}
                >
                  {template}
                </button>
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
