import React from 'react';
import { DAWProvider } from './contexts/DAWContext';
import { ThemeProvider } from './themes/ThemeContext';
import TopBar from './components/TopBar';
import MenuBar from './components/MenuBar';
import TrackList from './components/TrackList';
import Timeline from './components/Timeline';
import Mixer from './components/Mixer';
import EnhancedSidebar from './components/EnhancedSidebar';

function AppContent() {
  const [mixerHeight, setMixerHeight] = React.useState(200);
  const [isResizingMixer, setIsResizingMixer] = React.useState(false);

  React.useEffect(() => {
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

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      <div className="h-8 flex-shrink-0">
        <MenuBar />
      </div>

      <div className="h-12 flex-shrink-0 border-b border-gray-700">
        <TopBar />
      </div>

      <div className="flex-1 flex overflow-hidden gap-0 min-h-0 min-w-0">
        <div className="w-52 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden text-xs">
          <TrackList />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
          <div className="flex-1 overflow-auto">
            <Timeline />
          </div>

          <div
            onMouseDown={() => setIsResizingMixer(true)}
            className="h-1 bg-gradient-to-r from-gray-700 via-blue-600 to-gray-700 hover:from-gray-600 hover:via-blue-500 hover:to-gray-600 cursor-ns-resize transition-colors group flex items-center justify-center"
            title="Drag to resize mixer"
          >
            <div className="w-12 h-0.5 bg-blue-400/50 rounded group-hover:bg-blue-300 transition-colors" />
          </div>

          <div
            id="mixer-container"
            className="border-t border-gray-700 bg-gray-900 flex-shrink-0 overflow-hidden flex flex-col transition-all"
            style={{ height: `${mixerHeight}px` }}
          >
            <div className="w-full h-full flex flex-col overflow-hidden">
              <Mixer />
            </div>
          </div>
        </div>

        <div className="w-64 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden text-xs">
          <EnhancedSidebar />
        </div>
      </div>
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
