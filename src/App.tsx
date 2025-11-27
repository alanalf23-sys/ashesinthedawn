import { useState, useEffect } from 'react';
import { DAWProvider, useDAW } from './contexts/DAWContext';
import { ThemeProvider } from './themes/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import TopBar from './components/TopBar';
import MenuBar from './components/MenuBar';
import TrackList from './components/TrackList';
import Timeline from './components/Timeline';
import Mixer from './components/Mixer';
import EnhancedSidebar from './components/EnhancedSidebar';
import WelcomeModal from './components/WelcomeModal';
import ModalsContainer from './components/ModalsContainer';

function AppContent() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const [mixerDocked, setMixerDocked] = useState(true);
  const [mixerHeight, setMixerHeight] = useState(200); // Initial mixer height in pixels
  const [isResizingMixer, setIsResizingMixer] = useState(false);
  const { uploadAudioFile, addTrack, selectTrack, tracks } = useDAW();

  // Handle mixer resize
  useEffect(() => {
    if (!isResizingMixer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('mixer-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newHeight = Math.max(100, Math.min(500, containerRect.bottom - e.clientY));
      setMixerHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizingMixer(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingMixer]);

  const handleGlobalDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items) {
      const hasAudioFiles = Array.from(e.dataTransfer.items).some(item => {
        return item.type.startsWith('audio/') || item.type === 'application/octet-stream';
      });
      if (hasAudioFiles) {
        setIsDraggingGlobal(true);
      }
    }
  };

  const handleGlobalDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.currentTarget === e.target) {
      setIsDraggingGlobal(false);
    }
  };

  const handleGlobalDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingGlobal(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    // Create audio track if needed
    if (tracks.length === 0) {
      addTrack('audio');
    }

    // Get first audio track or create one
    let audioTrack = tracks.find(t => t.type === 'audio');
    if (!audioTrack) {
      addTrack('audio');
      audioTrack = tracks.find(t => t.type === 'audio');
    }

    if (audioTrack) {
      selectTrack(audioTrack.id);

      // Process each audio file
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const file = files[i];
        if (!file.type.startsWith('audio/') && file.type !== 'application/octet-stream') continue;
        await uploadAudioFile(file);
      }
    }
  };

  return (
    <div 
      className={`h-screen flex flex-col bg-gray-950 overflow-hidden transition-colors ${
        isDraggingGlobal ? 'bg-gradient-to-b from-gray-950 to-blue-950/20' : ''
      }`}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      {/* Menu Bar */}
      <div className="h-8 flex-shrink-0">
        <MenuBar />
      </div>

      {/* Top Bar - Transport Controls */}
      <div className="h-12 flex-shrink-0 border-b border-gray-700">
        <TopBar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden gap-0 min-h-0 min-w-0">
        {/* Left Sidebar - Track List */}
        <div className="w-52 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden text-xs">
          <TrackList />
        </div>

        {/* Main Timeline + Mixer View */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
          {/* Timeline */}
          <div className="flex-1 overflow-auto">
            <Timeline />
          </div>

          {/* Resizable Divider */}
          {mixerDocked && (
            <div
              onMouseDown={() => setIsResizingMixer(true)}
              className="h-1 bg-gradient-to-r from-gray-700 via-blue-600 to-gray-700 hover:from-gray-600 hover:via-blue-500 hover:to-gray-600 cursor-ns-resize transition-colors group flex items-center justify-center"
              title="Drag to resize mixer"
            >
              <div className="w-12 h-0.5 bg-blue-400/50 rounded group-hover:bg-blue-300 transition-colors" />
            </div>
          )}

          {/* Mixer Below Timeline - With Adjustable Height */}
          {mixerDocked && (
            <div
              id="mixer-container"
              className="border-t border-gray-700 bg-gray-900 flex-shrink-0 overflow-hidden flex flex-col transition-all"
              style={{ height: `${mixerHeight}px` }}
            >
              <div className="w-full h-full flex flex-col overflow-hidden">
                <Mixer />
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Browser & Codette */}
        <div className="w-64 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden text-xs">
          <EnhancedSidebar />
        </div>
      </div>

      {/* Global Drag Overlay */}
      {isDraggingGlobal && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="bg-blue-600/95 text-white px-8 py-6 rounded-lg shadow-2xl text-center backdrop-blur-sm">
            <p className="font-bold text-xl">Drop audio files anywhere to import</p>
            <p className="text-sm text-blue-100 mt-2">Create new tracks or add to existing ones</p>
          </div>
        </div>
      )}

      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      <ModalsContainer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider initialTheme="codette-graphite">
        <DAWProvider>
          <AppContent />
        </DAWProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
