import { useState } from 'react';
import { X } from 'lucide-react';
import { useDAW } from '../../contexts/DAWContext';
import { Project } from '../../types';

export default function NewProjectModal() {
  const { showNewProjectModal, closeNewProjectModal, setCurrentProject } = useDAW();
  const [projectName, setProjectName] = useState('Untitled Project');
  const [sampleRate, setSampleRate] = useState(44100);
  const [bitDepth, setBitDepth] = useState(24);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');

  const handleCreate = () => {
    const now = new Date().toISOString();
    const newProject: Project = {
      id: 'project-' + Date.now(),
      name: projectName,
      tracks: [],
      buses: [],
      bpm,
      timeSignature,
      sampleRate,
      bitDepth,
      createdAt: now,
      updatedAt: now,
    };
    setCurrentProject(newProject);
    closeNewProjectModal();
  };

  if (!showNewProjectModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">New Project</h2>
          <button
            onClick={closeNewProjectModal}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Sample Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sample Rate (Hz)
            </label>
            <select
              value={sampleRate}
              onChange={(e) => setSampleRate(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value={44100}>44,100 Hz</option>
              <option value={48000}>48,000 Hz</option>
              <option value={96000}>96,000 Hz</option>
            </select>
          </div>

          {/* Bit Depth */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bit Depth
            </label>
            <select
              value={bitDepth}
              onChange={(e) => setBitDepth(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value={16}>16-bit</option>
              <option value={24}>24-bit</option>
              <option value={32}>32-bit</option>
            </select>
          </div>

          {/* BPM */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tempo (BPM)
            </label>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              min="20"
              max="300"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Time Signature */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time Signature
            </label>
            <select
              value={timeSignature}
              onChange={(e) => setTimeSignature(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="2/4">2/4</option>
              <option value="3/4">3/4</option>
              <option value="4/4">4/4</option>
              <option value="5/4">5/4</option>
              <option value="6/8">6/8</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={closeNewProjectModal}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
