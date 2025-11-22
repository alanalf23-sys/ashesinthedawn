import { useState } from 'react';
import { DAWProvider } from './contexts/DAWContext';
import MenuBar from './components/MenuBar';
import TopBar from './components/TopBar';
import TrackList from './components/TrackList';
import Timeline from './components/Timeline';
import Mixer from './components/Mixer';
import Sidebar from './components/Sidebar';
import AudioMonitor from './components/AudioMonitor';
import WelcomeModal from './components/WelcomeModal';
import ModalsContainer from './components/ModalsContainer';

function App() {
  const [showWelcome, setShowWelcome] = useState(false);

  return (
    <DAWProvider>
      <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
        {/* Menu Bar */}
        <MenuBar />

        {/* SECTION 1: TOP - Arrangement/Timeline View with Tracks */}
        <div className="flex-1 flex overflow-hidden gap-0 min-h-0">
          {/* Left Sidebar - Track List */}
          <div className="w-56 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden text-xs">
            <TrackList />
          </div>

          {/* Main Timeline View */}
          <div className="flex-1 overflow-hidden bg-gray-950">
            <Timeline />
          </div>

          {/* Right Sidebar - Browser & Audio Monitor */}
          <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden text-xs">
            <div className="flex-1 overflow-y-auto border-b border-gray-700">
              <Sidebar />
            </div>
            <div className="h-64 border-t border-gray-700 overflow-y-auto">
              <AudioMonitor />
            </div>
          </div>
        </div>

        {/* SECTION 2: MIDDLE - Transport Controls (TopBar) */}
        <TopBar />

        {/* SECTION 3: BOTTOM - Mixer View with Channel Strips */}
        <div className="h-72 bg-gray-900 border-t border-gray-700 flex flex-col overflow-hidden">
          <Mixer />
        </div>

        {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
        <ModalsContainer />
      </div>
    </DAWProvider>
  );
}

export default App;
