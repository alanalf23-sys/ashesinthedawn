import { useState } from 'react';
import { X } from 'lucide-react';
import { useDAW } from '../../contexts/DAWContext';

export default function SaveAsModal() {
  const { showSaveAsModal, closeSaveAsModal, currentProject, saveProject } = useDAW();
  const [projectName, setProjectName] = useState(currentProject?.name || 'Untitled Project');

  const handleSaveAs = async () => {
    if (!projectName.trim()) {
      alert('Project name cannot be empty');
      return;
    }
    // Create a new project object with the new name
    if (currentProject) {
      // Update the project name in the current project
      const updatedProject = {
        ...currentProject,
        name: projectName,
        updatedAt: new Date().toISOString(),
      };
      // Note: In production, this would call a backend endpoint or Supabase to create a new project
      // For now, we're simulating it by updating the current project
      console.log(`Saved project as: ${projectName}`, updatedProject);
      await saveProject();
      closeSaveAsModal();
    }
  };

  if (!showSaveAsModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Save Project As</h2>
          <button
            onClick={closeSaveAsModal}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
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

          <div className="text-xs text-gray-500">
            <p>Location: Projects/</p>
            <p>Format: CoreLogic Project (.clp)</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={closeSaveAsModal}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAs}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
          >
            Save As
          </button>
        </div>
      </div>
    </div>
  );
}
