import { Download, Upload, X } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { formatFileSize, getProjectFileSize } from '../lib/projectImportExport';

export default function ProjectImportExportModal() {
  const { currentProject, showExportModal, closeExportModal, exportProjectAsFile, importProjectFromFile } = useDAW();

  if (!showExportModal) return null;

  const projectSize = currentProject ? getProjectFileSize(currentProject) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Project Import/Export</h2>
          <button
            onClick={closeExportModal}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Export Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-200">Export Project</h3>
            <p className="text-xs text-gray-400">
              Save your current project as a JSON file. Can be imported later or shared with others.
            </p>
            
            {currentProject && (
              <div className="text-xs text-gray-500 bg-gray-900/50 p-2 rounded">
                <div><strong>Project:</strong> {currentProject.name}</div>
                <div><strong>Tracks:</strong> {currentProject.tracks?.length || 0}</div>
                <div><strong>File Size:</strong> ~{formatFileSize(projectSize)}</div>
                <div><strong>Format:</strong> JSON (.corelogic.json)</div>
              </div>
            )}
            
            <button
              onClick={exportProjectAsFile}
              disabled={!currentProject}
              className={`w-full px-4 py-2 rounded font-medium transition flex items-center justify-center gap-2 ${
                currentProject
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              Export Project
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700" />

          {/* Import Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-200">Import Project</h3>
            <p className="text-xs text-gray-400">
              Load a previously exported project file. This will replace your current project.
            </p>
            
            <div className="text-xs text-gray-500 bg-gray-900/50 p-2 rounded">
              <div><strong>Supported Format:</strong> .json, .corelogic.json</div>
              <div><strong>Max File Size:</strong> 50 MB</div>
              <div><strong>Action:</strong> Replaces current project</div>
            </div>
            
            <button
              onClick={importProjectFromFile}
              className="w-full px-4 py-2 rounded font-medium transition flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Upload className="w-4 h-4" />
              Import Project
            </button>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
            <p className="font-semibold text-gray-400 mb-1">💡 Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Projects are saved to browser storage automatically</li>
              <li>Export for backup or sharing with collaborators</li>
              <li>Audio files are stored as references, not included in export</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
