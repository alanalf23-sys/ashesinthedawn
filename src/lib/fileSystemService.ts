/**
 * FileSystemService - Unified file system access
 * 
 * Supports:
 * - File System Access API (browser native)
 * - Backend file browsing endpoint
 * - Mock file system for demo/testing
 */

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  duration?: number;
  format?: string;
  lastModified?: Date;
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
}

export interface FileSystemServiceConfig {
  useBackend?: boolean;
  backendUrl?: string;
  useMock?: boolean;
}

class FileSystemService {
  private config: FileSystemServiceConfig;
  private rootHandle: FileSystemDirectoryHandle | null = null;
  private permissionStatus: Map<string, PermissionStatus> = new Map();
  
  constructor(config: FileSystemServiceConfig = {}) {
    this.config = {
      useBackend: config.useBackend ?? false,
      backendUrl: config.backendUrl ?? 'http://localhost:8000',
      useMock: config.useMock ?? true,
    };
  }
  
  /**
   * Check if File System Access API is supported
   */
  isFileSystemAccessSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }
  
  /**
   * Request directory access from user
   */
  async requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isFileSystemAccessSupported()) {
      console.warn('File System Access API not supported');
      return null;
    }
    
    try {
      this.rootHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'music',
      });
      return this.rootHandle;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Directory access denied:', err);
      }
      return null;
    }
  }
  
  /**
   * Verify and request permissions for a handle
   */
  async verifyPermission(
    handle: FileSystemHandle,
    mode: 'read' | 'readwrite' = 'read'
  ): Promise<boolean> {
    const options: FileSystemHandlePermissionDescriptor = { mode };
    
    // Check existing permission
    if ((await handle.queryPermission(options)) === 'granted') {
      return true;
    }
    
    // Request permission
    if ((await handle.requestPermission(options)) === 'granted') {
      return true;
    }
    
    return false;
  }
  
  /**
   * List files in a directory
   */
  async listDirectory(path: string = '', directoryHandle?: FileSystemDirectoryHandle): Promise<FileItem[]> {
    // Use File System Access API if handle provided
    if (directoryHandle) {
      return this.listDirectoryNative(directoryHandle);
    }
    
    // Use backend API if configured
    if (this.config.useBackend) {
      return this.listDirectoryBackend(path);
    }
    
    // Use mock data
    if (this.config.useMock) {
      return this.listDirectoryMock(path);
    }
    
    return [];
  }
  
  /**
   * List directory using File System Access API
   */
  private async listDirectoryNative(dirHandle: FileSystemDirectoryHandle): Promise<FileItem[]> {
    const items: FileItem[] = [];
    
    try {
      // Verify read permission
      if (!(await this.verifyPermission(dirHandle, 'read'))) {
        throw new Error('Permission denied');
      }
      
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          
          items.push({
            name: entry.name,
            path: `${dirHandle.name}/${entry.name}`,
            type: 'file',
            size: file.size,
            lastModified: new Date(file.lastModified),
            format: this.getFileExtension(entry.name),
            handle: fileHandle,
          });
        } else if (entry.kind === 'directory') {
          items.push({
            name: entry.name,
            path: `${dirHandle.name}/${entry.name}`,
            type: 'directory',
            handle: entry as FileSystemDirectoryHandle,
          });
        }
      }
    } catch (err) {
      console.error('Error listing directory:', err);
    }
    
    return items;
  }
  
  /**
   * List directory using backend API
   */
  private async listDirectoryBackend(path: string): Promise<FileItem[]> {
    try {
      const response = await fetch(`${this.config.backendUrl}/api/files/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.files || [];
    } catch (err) {
      console.error('Backend file listing failed:', err);
      return [];
    }
  }
  
  /**
   * Mock file system data for testing
   */
  private listDirectoryMock(path: string): FileItem[] {
    const mockFileSystem: Record<string, FileItem[]> = {
      '': [
        { name: 'My Projects', path: '/projects', type: 'directory' },
        { name: 'Audio Files', path: '/audio', type: 'directory' },
        { name: 'Samples', path: '/samples', type: 'directory' },
        { name: 'Loops', path: '/loops', type: 'directory' },
        { name: 'Recordings', path: '/recordings', type: 'directory' },
      ],
      '/projects': [
        { name: 'Project 1.cls', path: '/projects/Project 1.cls', type: 'file', size: 245678, format: 'cls', lastModified: new Date('2024-12-20') },
        { name: 'Project 2.json', path: '/projects/Project 2.json', type: 'file', size: 128453, format: 'json', lastModified: new Date('2024-12-19') },
      ],
      '/audio': [
        { name: 'Guitar.wav', path: '/audio/Guitar.wav', type: 'file', size: 5242880, format: 'wav', duration: 32.5, lastModified: new Date('2024-12-18') },
        { name: 'Vocals.mp3', path: '/audio/Vocals.mp3', type: 'file', size: 3145728, format: 'mp3', duration: 45.2, lastModified: new Date('2024-12-17') },
        { name: 'Bass.flac', path: '/audio/Bass.flac', type: 'file', size: 8388608, format: 'flac', duration: 28.8, lastModified: new Date('2024-12-16') },
      ],
      '/samples': [
        { name: 'Kick', path: '/samples/Kick', type: 'directory' },
        { name: 'Snare', path: '/samples/Snare', type: 'directory' },
        { name: 'Hihat', path: '/samples/Hihat', type: 'directory' },
      ],
      '/samples/Kick': [
        { name: 'Kick_01.wav', path: '/samples/Kick/Kick_01.wav', type: 'file', size: 102400, format: 'wav', duration: 0.8, lastModified: new Date('2024-12-15') },
        { name: 'Kick_02.wav', path: '/samples/Kick/Kick_02.wav', type: 'file', size: 98304, format: 'wav', duration: 0.7, lastModified: new Date('2024-12-15') },
      ],
      '/loops': [
        { name: 'Drum Loop 120.wav', path: '/loops/Drum Loop 120.wav', type: 'file', size: 2097152, format: 'wav', duration: 16.0, lastModified: new Date('2024-12-14') },
        { name: 'Bass Loop.wav', path: '/loops/Bass Loop.wav', type: 'file', size: 1572864, format: 'wav', duration: 12.0, lastModified: new Date('2024-12-14') },
      ],
      '/recordings': [
        { name: 'Take 1.wav', path: '/recordings/Take 1.wav', type: 'file', size: 10485760, format: 'wav', duration: 65.3, lastModified: new Date('2024-12-22') },
        { name: 'Take 2.wav', path: '/recordings/Take 2.wav', type: 'file', size: 9437184, format: 'wav', duration: 58.7, lastModified: new Date('2024-12-22') },
      ],
    };
    
    return mockFileSystem[path] || [];
  }
  
  /**
   * Read file content
   */
  async readFile(fileItem: FileItem): Promise<File | null> {
    // Native file handle
    if (fileItem.handle && fileItem.handle.kind === 'file') {
      const fileHandle = fileItem.handle as FileSystemFileHandle;
      return await fileHandle.getFile();
    }
    
    // Backend API
    if (this.config.useBackend) {
      try {
        const response = await fetch(`${this.config.backendUrl}/api/files/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: fileItem.path }),
        });
        
        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }
        
        const blob = await response.blob();
        return new File([blob], fileItem.name, { type: blob.type });
      } catch (err) {
        console.error('Backend file read failed:', err);
        return null;
      }
    }
    
    return null;
  }
  
  /**
   * Create new file
   */
  async createFile(
    parentDirHandle: FileSystemDirectoryHandle,
    fileName: string,
    content: Blob | string
  ): Promise<FileSystemFileHandle | null> {
    if (!this.isFileSystemAccessSupported()) {
      return null;
    }
    
    try {
      if (!(await this.verifyPermission(parentDirHandle, 'readwrite'))) {
        throw new Error('Permission denied');
      }
      
      const fileHandle = await parentDirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      
      if (typeof content === 'string') {
        await writable.write(content);
      } else {
        await writable.write(content);
      }
      
      await writable.close();
      return fileHandle;
    } catch (err) {
      console.error('Create file failed:', err);
      return null;
    }
  }
  
  /**
   * Delete file or directory
   */
  async deleteFile(
    parentDirHandle: FileSystemDirectoryHandle,
    name: string,
    recursive: boolean = false
  ): Promise<boolean> {
    if (!this.isFileSystemAccessSupported()) {
      return false;
    }
    
    try {
      if (!(await this.verifyPermission(parentDirHandle, 'readwrite'))) {
        throw new Error('Permission denied');
      }
      
      await parentDirHandle.removeEntry(name, { recursive });
      return true;
    } catch (err) {
      console.error('Delete file failed:', err);
      return false;
    }
  }
  
  /**
   * Rename file
   */
  async renameFile(
    fileItem: FileItem,
    newName: string,
    parentDirHandle?: FileSystemDirectoryHandle
  ): Promise<boolean> {
    // File System Access API doesn't support rename directly
    // Need to copy and delete (not implemented here for safety)
    
    // Use backend API if available
    if (this.config.useBackend) {
      try {
        const response = await fetch(`${this.config.backendUrl}/api/files/rename`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            oldPath: fileItem.path,
            newName,
          }),
        });
        
        return response.ok;
      } catch (err) {
        console.error('Rename file failed:', err);
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Get file extension
   */
  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }
  
  /**
   * Check if file is audio
   */
  isAudioFile(fileName: string): boolean {
    const ext = this.getFileExtension(fileName);
    return ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus', 'webm'].includes(ext);
  }
  
  /**
   * Check if file is MIDI
   */
  isMidiFile(fileName: string): boolean {
    const ext = this.getFileExtension(fileName);
    return ['mid', 'midi'].includes(ext);
  }
  
  /**
   * Check if file is project
   */
  isProjectFile(fileName: string): boolean {
    const ext = this.getFileExtension(fileName);
    return ['cls', 'json', 'corelogic'].includes(ext);
  }
}

// Singleton instance
export const fileSystemService = new FileSystemService({
  useMock: true, // Start with mock data, can be changed via UI
  useBackend: false,
  backendUrl: 'http://localhost:8000',
});

export default FileSystemService;
