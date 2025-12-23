import * as React from 'react';
import { DAWProvider, useDAW } from './contexts/DAWContext';
import { ThemeProvider } from './themes/ThemeContext';
import TopBar from './components/TopBar';
import MenuBar from './components/MenuBar';
import TrackList from './components/TrackList';
import Timeline from './components/Timeline';
import Mixer from './components/Mixer';
import Sidebar from './components/Sidebar';
import MediaExplorer from './components/MediaExplorer';
import FXBrowser from './components/FXBrowser';
import CodettePanel from './components/CodettePanel';
import AudioSettingsModal from './components/modals/AudioSettingsModal';
import { initializeActions } from './lib/actions/initializeActions';
import { CommandPalette } from './components/CommandPalette';
import { OnboardingTour } from './components/OnboardingTour';
import { useToast, ToastNotification } from './components/Toast';
import type { Toast } from './components/Toast';
import { VUMeterPanel } from './components/VUMeterPanel';

// Suppress 404 errors from missing Supabase tables in browser console
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || String(event);
    if (msg.includes('404') && msg.includes('codette_')) {
      event.preventDefault();
    }
  }, true);
}

function AppContent() {
  const [mixerHeight, setMixerHeight] = React.useState(200);
  const [isResizingMixer, setIsResizingMixer] = React.useState(false);
  const [rightSidebarTab, setRightSidebarTab] = React.useState('files' as 'files' | 'media' | 'fx' | 'control');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const { openAudioSettingsModal } = useDAW();

  // onboarding key to force remount of OnboardingTour when starting programmatically
  const [onboardingKey, setOnboardingKey] = React.useState(0);

  // Initialize action system on mount
  React.useEffect(() => {
    initializeActions();
  }, []);

  // Keyboard shortcut handler (Ctrl/Cmd+K to toggle command palette)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev: boolean) => !prev);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Expose small global API for dev/testing
  React.useEffect(() => {
    try {
      (window as any).app = {
        openCommandPalette: () => setIsCommandPaletteOpen(true),
        closeCommandPalette: () => setIsCommandPaletteOpen(false),
        showToast: (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => addToast(message, type, duration),
        openAudioSettings: () => openAudioSettingsModal(),
        toggleRightSidebar: (tab: 'files' | 'media' | 'fx' | 'control') => setRightSidebarTab(tab),
        startOnboarding: () => {
          // clear completed flag and remount onboarding
          try { localStorage.removeItem('onboarding-tour-completed'); } catch (e) { /* ignore */ }
          setOnboardingKey((k: number) => k + 1);
        },
      };
    } catch (e) {
      // ignore in non-browser envs
    }

    return () => {
      try { delete (window as any).app; } catch (e) { /* ignore */ }
    };
  }, [addToast, openAudioSettingsModal]);

  // showToast wrapper for internal use
  const showToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    addToast(message, type, duration);
  }, [addToast]);

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

  // helper to toggle right sidebar
  const toggleRightSidebar = React.useCallback((tab: 'files' | 'media' | 'fx' | 'control') => {
    setRightSidebarTab(tab);
  }, []);

  // helper to open audio settings modal
  const openAudioSettings = React.useCallback(() => {
    try { openAudioSettingsModal(); } catch (e) { console.debug('openAudioSettings failed', e); }
  }, [openAudioSettingsModal]);

  // helper to programmatically start onboarding
  const startOnboarding = React.useCallback(() => {
    try { localStorage.removeItem('onboarding-tour-completed'); } catch (e) { /* ignore */ }
    setOnboardingKey((k: number) => k + 1);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      <div className="h-8 flex-shrink-0">
        <MenuBar />
      </div>

      <div className="h-12 flex-shrink-0 border-b border-gray-700">
        <TopBar />
      </div>

      <div className="flex-1 flex overflow-hidden gap-0 min-h-0 min-w-0 flex-col">
        {/* Main Content Area (Tracks + Timeline + Mixer) */}
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

          {/* Right sidebar - File browser, Media Explorer, FX Browser, and Codette Control */}
          <div className="w-64 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex gap-0 border-b border-gray-700 bg-gray-800 flex-shrink-0">
              <button
                onClick={() => setRightSidebarTab('files')}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  rightSidebarTab === 'files'
                    ? 'bg-gray-700 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Files
              </button>
              <button
                onClick={() => setRightSidebarTab('media')}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  rightSidebarTab === 'media'
                    ? 'bg-gray-700 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Media
              </button>
              <button
                onClick={() => setRightSidebarTab('fx')}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  rightSidebarTab === 'fx'
                    ? 'bg-gray-700 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                FX
              </button>
              <button
                onClick={() => setRightSidebarTab('control')}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  rightSidebarTab === 'control'
                    ? 'bg-gray-700 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Control
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto pb-20">
              {rightSidebarTab === 'files' && <Sidebar />}
              {rightSidebarTab === 'media' && (
                <div className="h-full p-2">
                  <MediaExplorer className="h-full" isDocked={true} />
                </div>
              )}
              {rightSidebarTab === 'fx' && (
                <div className="h-full p-2">
                  <FXBrowser className="h-full" isPopout={false} />
                </div>
              )}
              {rightSidebarTab === 'control' && (
                <div className="p-3 space-y-3">
                  <VUMeterPanel className="w-full" />
                  <CodettePanel isVisible={true} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <AudioSettingsModal />

      {/* ENHANCEMENT #7: Command Palette (Ctrl+K) */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* ENHANCEMENT #10: Onboarding Tour */}
      <OnboardingTour key={onboardingKey} />

      {/* ENHANCEMENT #3: Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-40 space-y-2">
        {toasts.map((toast: Toast) => (
          <ToastNotification
            key={toast.id}
            {...toast}
            onClose={removeToast}
          />
        ))}
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
