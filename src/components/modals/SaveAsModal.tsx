import { useState } from 'react';
import { useDAW } from '../../contexts/DAWContext';
import { ModalHeader, ModalFooter, ErrorMessage, FormField } from './ModalUtils';

export default function SaveAsModal() {
  const { showSaveAsModal, closeSaveAsModal, currentProject, saveProject } = useDAW();
  const [projectName, setProjectName] = useState(currentProject?.name || 'Untitled Project');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAs = async () => {
    // Validation
    if (!projectName.trim()) {
      setError('Project name cannot be empty');
      return;
    }

    if (projectName.trim().length < 3) {
      setError('Project name must be at least 3 characters long');
      return;
    }

    if (projectName.trim().length > 255) {
      setError('Project name cannot exceed 255 characters');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      if (currentProject) {
        await saveProject();
        closeSaveAsModal();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  if (!showSaveAsModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-screen overflow-hidden">
        <ModalHeader title="Save Project As" onClose={closeSaveAsModal} />

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <ErrorMessage message={error} />}

          <FormField label="Project Name" required error={error || undefined}>
            <input
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setError(null);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveAs()}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project name"
              maxLength={255}
            />
            <p className="text-xs text-gray-500">
              {projectName.length}/255 characters
            </p>
          </FormField>

          <div className="text-xs text-gray-500 bg-gray-800 rounded p-3 space-y-1">
            <p className="font-medium text-gray-400">Location & Format</p>
            <p>📁 Projects/</p>
            <p>📄 CoreLogic Project (.clp)</p>
          </div>
        </div>

        <ModalFooter
          onCancel={closeSaveAsModal}
          onConfirm={handleSaveAs}
          cancelText="Cancel"
          confirmText="Save As"
          isLoading={isSaving}
          confirmVariant="blue"
        />
      </div>
    </div>
  );
}
