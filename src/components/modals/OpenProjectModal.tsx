import { useState } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { useDAW } from '../../contexts/DAWContext';

export default function OpenProjectModal() {
  const { showOpenProjectModal, closeOpenProjectModal, loadProject } = useDAW();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Mock project list
  const recentProjects = [
    { id: 'proj-1', name: 'My Podcast Episode 1', date: '2024-11-22', size: '125 MB' },
    { id: 'proj-2', name: 'Summer Beats 2024', date: '2024-11-20', size: '342 MB' },
    { id: 'proj-3', name: 'Ambient Loop Pack', date: '2024-11-18', size: '89 MB' },
    { id: 'proj-4', name: 'Electronic Draft', date: '2024-11-15', size: '156 MB' },
  ];

  const handleOpen = async () => {
    if (selectedProject) {
      await loadProject(selectedProject);
      closeOpenProjectModal();
    }
  };

  if (!showOpenProjectModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Open Project</h2>
          <button
            onClick={closeOpenProjectModal}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Search/Filter */}
          <div>
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Recent Projects */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Projects</h3>
            <div className="space-y-2">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project.id)}
                  className={`p-3 border rounded cursor-pointer transition ${
                    selectedProject === project.id
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-200">{project.name}</p>
                        <p className="text-xs text-gray-500">
                          Modified {project.date} • {project.size}
                        </p>
                      </div>
                    </div>
                    {selectedProject === project.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Browser */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Or Browse Files</h3>
            <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition text-sm">
              Browse Local Files...
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={closeOpenProjectModal}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleOpen}
            disabled={!selectedProject}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}
