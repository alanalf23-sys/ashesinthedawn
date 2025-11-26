import { useState } from 'react';
import { DAWProvider, useDAW } from './contexts/DAWContext';
import { ThemeProvider } from './themes/ThemeContext';
import MenuBar from './components/MenuBar';
import TopBar from './components/TopBar';
import TrackList from './components/TrackList';
import Timeline from './components/Timeline';
import Mixer from './components/Mixer';
import SmartMixerContainer from './components/SmartMixerContainer';
import EnhancedSidebar from './components/EnhancedSidebar';
import WelcomeModal from './components/WelcomeModal';
import ModalsContainer from './components/ModalsContainer';
import FunctionExecutionLog from './components/FunctionExecutionLog';

function AppContent() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const { uploadAudioFile, addTrack, selectTrack, tracks } = useDAW();

  // Debug: Verify MenuBar and AIPanel are imported
  console.log('AppContent rendered with MenuBar:', MenuBar.name, 'imported from components');


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
      {/* Menu Bar - Fixed */}
      <MenuBar />

      {/* SECTION 1: TOP - Arrangement/Timeline View with Tracks (Responsive) */}
      <div className="flex-1 flex overflow-hidden gap-0 min-h-0 min-w-0">
        {/* Left Sidebar - Track List (Adaptive width: 12-25% of screen) */}
        <div className="w-1/6 min-w-40 max-w-64 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden text-xs transition-all duration-300 hover:shadow-lg">
          <TrackList />
        </div>

        {/* Main Timeline View (Takes remaining space) */}
        <div className="flex-1 overflow-auto bg-gray-950 relative">
          <Timeline />
        </div>

        {/* Right Sidebar - Enhanced Multi-Tab Browser & Controls (Adaptive width: 18-25% of screen) */}
        <div className="w-1/5 min-w-48 max-w-96 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden text-xs transition-all duration-300 hover:shadow-lg">
          <EnhancedSidebar />
        </div>
      </div>

      {/* SECTION 2: MIDDLE - Transport Controls (TopBar) - Fixed Height */}
      <div className="h-12 flex-shrink-0 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        <TopBar />
      </div>

      {/* SECTION 3: BOTTOM - Mixer View with Channel Strips */}
      <SmartMixerContainer>
        <Mixer />
      </SmartMixerContainer>

      {/* Global Drag Overlay */}
      {isDraggingGlobal && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="bg-blue-600/95 text-white px-8 py-6 rounded-lg shadow-2xl text-center backdrop-blur-sm">
            <p className="font-bold text-xl">Drop audio files anywhere to import</p>
            <p className="text-sm text-blue-100 mt-2">Create new tracks or add to existing ones</p>
          </div>
        </div>
      )}

      {/* Real-time Function Execution Log */}
      <FunctionExecutionLog />

      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      <ModalsContainer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider initialTheme="codette-graphite">
      <DAWProvider>
        <AppContent />
      </DAWProvider>
    </ThemeProvider>
  );
}

export default App;
