/**
 * Project Import/Export Utilities
 * Handles JSON serialization and file operations for DAW projects
 */

import { Project } from '../types';

interface ExportOptions {
  includeMetadata?: boolean;
  prettyPrint?: boolean;
}

interface ImportOptions {
  validate?: boolean;
  merge?: boolean; // If true, merge with existing project instead of replacing
}

/**
 * Export project to JSON string
 */
export function exportProjectToJSON(
  project: Project,
  options: ExportOptions = {}
): string {
  const { includeMetadata = true, prettyPrint = true } = options;

  const exportData = {
    ...project,
    ...(includeMetadata && {
      _exportMeta: {
        version: '7.0.0',
        exported: new Date().toISOString(),
        appName: 'CoreLogic Studio',
      },
    }),
  };

  return JSON.stringify(exportData, null, prettyPrint ? 2 : 0);
}

/**
 * Export project as downloadable file
 */
export function downloadProjectFile(project: Project, filename?: string): void {
  const name = filename || `${project.name || 'project'}-${Date.now()}.corelogic.json`;
  const jsonString = exportProjectToJSON(project, { prettyPrint: true });
  
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`[ProjectExport] Downloaded: ${name}`);
}

/**
 * Validate project structure
 */
function validateProjectStructure(data: unknown): data is Project {
  if (typeof data !== 'object' || data === null) return false;
  
  const project = data as any;
  
  // Check required fields
  if (typeof project.id !== 'string') return false;
  if (typeof project.name !== 'string') return false;
  if (!Array.isArray(project.tracks)) return false;
  if (typeof project.bpm !== 'number') return false;
  
  // Validate tracks array structure (basic check)
  for (const track of project.tracks) {
    if (typeof track.id !== 'string') return false;
    if (typeof track.name !== 'string') return false;
    if (typeof track.type !== 'string') return false;
  }
  
  return true;
}

/**
 * Import project from JSON string
 */
export function importProjectFromJSON(
  jsonString: string,
  options: ImportOptions = {}
): { success: boolean; project: Project | null; error: string | null } {
  const { validate = true } = options;

  try {
    const parsed = JSON.parse(jsonString);
    
    // Remove metadata if present
    const { _exportMeta, ...projectData } = parsed;
    
    // Validate structure if requested
    if (validate && !validateProjectStructure(projectData)) {
      return {
        success: false,
        project: null,
        error: 'Invalid project structure: missing required fields',
      };
    }
    
    console.log('[ProjectImport] Successfully parsed project:', projectData.name);
    
    return {
      success: true,
      project: projectData as Project,
      error: null,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ProjectImport] Failed to parse JSON:', errorMsg);
    
    return {
      success: false,
      project: null,
      error: `Failed to parse project file: ${errorMsg}`,
    };
  }
}

/**
 * Handle file upload and import
 */
export function importProjectFromFile(
  file: File,
  options: ImportOptions = {}
): Promise<{ success: boolean; project: Project | null; error: string | null }> {
  return new Promise((resolve) => {
    // Validate file
    if (!file.name.endsWith('.json') && !file.name.endsWith('.corelogic.json')) {
      resolve({
        success: false,
        project: null,
        error: 'Invalid file type: must be JSON file',
      });
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      resolve({
        success: false,
        project: null,
        error: 'File too large: maximum 50MB',
      });
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = importProjectFromJSON(content, options);
        resolve(result);
      } catch (error) {
        resolve({
          success: false,
          project: null,
          error: 'Failed to read file',
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        project: null,
        error: 'Failed to read file',
      });
    };
    
    reader.readAsText(file);
  });
}

/**
 * Create a dialog for file selection (import)
 */
export function openFileDialog(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.corelogic.json';
    input.multiple = false;
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      resolve(files?.[0] || null);
    };
    
    input.click();
  });
}

/**
 * Batch export multiple projects
 */
export function exportMultipleProjects(projects: Project[]): string {
  const exportData = {
    _batch: true,
    _exportMeta: {
      version: '7.0.0',
      exported: new Date().toISOString(),
      appName: 'CoreLogic Studio',
      count: projects.length,
    },
    projects,
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Get file size estimate for project
 */
export function getProjectFileSize(project: Project): number {
  const json = exportProjectToJSON(project, { prettyPrint: false });
  return new Blob([json]).size;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
