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
        <div className="h-8 bg-gray-900 border-b border-gray-700 flex items-center px-3 gap-8 text-sm text-gray-300 font-medium">
          <span className="cursor-pointer hover:text-white transition">File</span>
          <span className="cursor-pointer hover:text-white transition">Edit</span>
          <span className="cursor-pointer hover:text-white transition">View</span>
          <span className="cursor-pointer hover:text-white transition">Track</span>
          <span className="cursor-pointer hover:text-white transition">Clip</span>
          <span className="cursor-pointer hover:text-white transition">Event</span>
          <span className="cursor-pointer hover:text-white transition">Options</span>
          <span className="cursor-pointer hover:text-white transition">Help</span>
        </div>

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

          {/* Right Sidebar - Browser */}
          <div className="w-56 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden text-xs">
            <Sidebar />
          </div>
        </div>

        {/* SECTION 2: MIDDLE - Transport Controls (TopBar) */}
        <TopBar />

        {/* SECTION 3: BOTTOM - Mixer View with Channel Strips */}
        <div className="h-72 bg-gray-900 border-t border-gray-700 flex flex-col overflow-hidden">
          <Mixer />
        </div>

        {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      </div>
    </DAWProvider>
  );
}

export default App;
