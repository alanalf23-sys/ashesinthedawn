import { X } from 'lucide-react';
import { useDAW } from '../../contexts/DAWContext';
import { useEffect, useState } from 'react';

interface CodettStatus {
  connected: boolean;
  status: string;
  error?: string;
}

export default function AboutModal() {
  const { showAboutModal, closeAboutModal } = useDAW();
  const [codetteStatus, setCodetteStatus] = useState<CodettStatus>({
    connected: false,
    status: 'checking...',
  });

  useEffect(() => {
    const checkCodette = async () => {
      try {
        const response = await fetch('http://localhost:8000/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setCodetteStatus({
            connected: true,
            status: data.status,
          });
        } else {
          setCodetteStatus({
            connected: false,
            status: 'offline',
            error: `HTTP ${response.status}`,
          });
        }
      } catch (err) {
        setCodetteStatus({
          connected: false,
          status: 'offline',
          error: 'Connection refused',
        });
      }
    };

    if (showAboutModal) {
      checkCodette();
      const interval = setInterval(checkCodette, 30000);
      return () => clearInterval(interval);
    }
  }, [showAboutModal]);

  if (!showAboutModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">About CoreLogic Studio</h2>
          <button
            onClick={closeAboutModal}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Logo/Title */}
          <div className="text-center py-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              CoreLogic Studio
            </div>
            <p className="text-sm text-gray-400">Professional Audio Workstation</p>
          </div>

          {/* Version Info */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Version</span>
              <span className="text-gray-200 font-mono">1.0.0 Beta</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Build</span>
              <span className="text-gray-200 font-mono">2024.11.22</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Platform</span>
              <span className="text-gray-200 font-mono">Web</span>
            </div>
          </div>

          {/* Codette Status */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Codette AI Engine</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${codetteStatus.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className={`text-sm font-mono ${codetteStatus.connected ? 'text-green-400' : 'text-red-400'}`}>
                  {codetteStatus.connected ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
            {codetteStatus.connected && (
              <p className="text-xs text-gray-500 mt-1">
                Status: <span className="text-gray-400">{codetteStatus.status}</span>
              </p>
            )}
            {!codetteStatus.connected && codetteStatus.error && (
              <p className="text-xs text-red-400 mt-1">
                Error: {codetteStatus.error}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="text-sm text-gray-300 space-y-3">
            <p>
              CoreLogic Studio is a modern, browser-based Digital Audio Workstation designed for professional audio production and music creation.
            </p>
            <p>
              Features include multi-track recording, real-time audio processing, MIDI sequencing, and Logic Pro-inspired workflow.
            </p>
          </div>

          {/* Credits */}
          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Technology</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Built with React 18 + TypeScript</li>
              <li>• Web Audio API for audio processing</li>
              <li>• Vite for fast development</li>
              <li>• Tailwind CSS for styling</li>
              <li>• Codette AI Engine for intelligent features</li>
            </ul>
          </div>

          {/* Links */}
          <div className="flex gap-2 text-xs pt-2">
            <button className="flex-1 px-3 py-1 text-blue-400 hover:text-blue-300 transition">
              Documentation
            </button>
            <button className="flex-1 px-3 py-1 text-blue-400 hover:text-blue-300 transition">
              GitHub
            </button>
          </div>

          {/* Copyright */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
            <p>© 2024 CoreLogic Studio. All rights reserved.</p>
            <p className="mt-1">Made with ❤️ by Raiff1982</p>
          </div>
        </div>

        <button
          onClick={closeAboutModal}
          className="w-full px-4 py-2 mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}
