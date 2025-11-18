import { useState } from 'react';
import { X, FileText, FolderOpen, Play } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { Project } from '../types';

interface WelcomeModalProps {
  onClose: () => void;
}

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [projectName, setProjectName] = useState('Untitled Project');
  const [sampleRate, setSampleRate] = useState(48000);
  const [bitDepth, setBitDepth] = useState(24);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const { setCurrentProject } = useDAW();

  const createNewProject = () => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: projectName,
      sampleRate,
      bitDepth,
      bpm,
      timeSignature,
      tracks: [],
      buses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Welcome to CoreLogic Studio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              Professional Digital Audio Workstation with AI-powered workflow assistance, voice control, and console-style mixing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => {
                createNewProject();
              }}
              className="p-6 bg-gray-800 hover:bg-gray-750 rounded-lg border-2 border-blue-600 transition-all"
            >
              <FileText className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-white font-semibold mb-1">New Project</h3>
              <p className="text-xs text-gray-400">Start from scratch</p>
            </button>

            <button className="p-6 bg-gray-800 hover:bg-gray-750 rounded-lg border-2 border-gray-700 hover:border-blue-500 transition-all">
              <FolderOpen className="w-8 h-8 text-gray-400 mb-3" />
              <h3 className="text-white font-semibold mb-1">Open Project</h3>
              <p className="text-xs text-gray-400">Continue working</p>
            </button>

            <button className="p-6 bg-gray-800 hover:bg-gray-750 rounded-lg border-2 border-gray-700 hover:border-blue-500 transition-all">
              <Play className="w-8 h-8 text-gray-400 mb-3" />
              <h3 className="text-white font-semibold mb-1">Templates</h3>
              <p className="text-xs text-gray-400">Quick start</p>
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-white font-semibold mb-3">New Project Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sample Rate</label>
                  <select 
                    value={sampleRate}
                    onChange={(e) => setSampleRate(Number(e.target.value))}
                    className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600"
                  >
                    <option value={44100}>44100 Hz</option>
                    <option value={48000}>48000 Hz</option>
                    <option value={96000}>96000 Hz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bit Depth</label>
                  <select 
                    value={bitDepth}
                    onChange={(e) => setBitDepth(Number(e.target.value))}
                    className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600"
                  >
                    <option value={16}>16 bit</option>
                    <option value={24}>24 bit</option>
                    <option value={32}>32 bit</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">BPM</label>
                  <input
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Time Signature</label>
                  <select 
                    value={timeSignature}
                    onChange={(e) => setTimeSignature(e.target.value)}
                    className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600"
                  >
                    <option>4/4</option>
                    <option>3/4</option>
                    <option>6/8</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createNewProject}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
