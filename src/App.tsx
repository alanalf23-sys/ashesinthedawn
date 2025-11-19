import { useState } from 'react';
import { DAWProvider } from './contexts/DAWContext';
import TopBar from './components/TopBar';
import TrackList from './components/TrackList';
import Timeline from './components/Timeline';
import Mixer from './components/Mixer';
import Sidebar from './components/Sidebar';
import WelcomeModal from './components/WelcomeModal';

function App() {
  const [showWelcome, setShowWelcome] = useState(false);

  return (
    <DAWProvider>
      <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
        {/* Menu Bar */}
        <div className="h-8 bg-gray-900 border-b border-gray-700 flex items-center px-2 gap-6 text-xs text-gray-300">
          <span className="font-semibold">File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Track</span>
          <span>Clip</span>
          <span>Event</span>
          <span>Options</span>
          <span>Help</span>
        </div>

        {/* Top Bar */}
        <TopBar />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden gap-0">
          {/* Left Sidebar - Compact Track List */}
          <div className="w-48 bg-gray-900 border-r border-gray-700 overflow-y-auto flex flex-col text-xs">
            <TrackList />
          </div>

          {/* Center - Arrange/Timeline (Takes most space) */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
            {/* Arrange/Timeline Area - Large */}
            <div className="flex-1 overflow-hidden">
              <Timeline />
            </div>

            {/* Mixer/Insert Section - Smaller height */}
            <div className="h-48 bg-gray-900 border-t border-gray-700 overflow-x-auto flex flex-col">
              <Mixer />
            </div>
          </div>

          {/* Right Sidebar - Browser */}
          <div className="w-64 bg-gray-900 border-l border-gray-700 overflow-hidden flex flex-col text-xs">
            <Sidebar />
          </div>
        </div>

        {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      </div>
    </DAWProvider>
  );
}

export default App;
