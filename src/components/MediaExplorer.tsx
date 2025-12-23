import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  Music,
  File as FileIcon,
  Search,
  X,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  Grid3x3,
  List,
  Home,
  ArrowLeft,
  RefreshCw,
  MoreVertical,
  FolderPlus,
  Edit,
  Trash2,
  Info,
} from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { fileSystemService, type FileItem } from '../lib/fileSystemService';
import { WaveformPreview } from './WaveformPreview';

interface MediaExplorerProps {
  className?: string;
  isDocked?: boolean;
  onUndock?: () => void;
}

/**
 * MediaExplorer - REAPER-style file browser with audio preview
 * 
 * Features:
 * - Directory tree navigation with File System Access API
 * - Audio file preview with waveform
 * - Drag-and-drop to tracks
 * - Search and filter
 * - Multiple view modes (list/grid)
 * - File metadata display
 * - Context menu for file operations
 */
export function MediaExplorer({
  className = '',
  isDocked = true,
  onUndock,
}: MediaExplorerProps) {
  const { uploadAudioFile, isUploadingFile } = useDAW();
  
  // Navigation state
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  // File system state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [filterType, setFilterType] = useState<'all' | 'audio' | 'midi' | 'projects'>('all');
  
  // Preview state
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [previewVolume, setPreviewVolume] = useState<number>(0.7);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File System Access API state
  const [rootDirHandle, setRootDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [currentDirHandle, setCurrentDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);
  
  // Load files from current directory
  const loadFiles = useCallback(async () => {
    const loadedFiles = await fileSystemService.listDirectory(currentPath, currentDirHandle || undefined);
    setFiles(loadedFiles);
  }, [currentPath, currentDirHandle]);
  
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);
  
  // Request directory access
  const requestDirectoryAccess = async () => {
    const handle = await fileSystemService.requestDirectoryAccess();
    if (handle) {
      setRootDirHandle(handle);
      setCurrentDirHandle(handle);
      navigateTo('');
    }
  };
  
  // Navigation functions
  const navigateTo = useCallback((path: string) => {
    // Update history
    const newHistory = pathHistory.slice(0, historyIndex + 1);
    newHistory.push(path);
    setPathHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(path);
  }, [pathHistory, historyIndex]);
  
  const navigateBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(pathHistory[historyIndex - 1]);
    }
  }, [historyIndex, pathHistory]);
  
  const navigateForward = useCallback(() => {
    if (historyIndex < pathHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(pathHistory[historyIndex + 1]);
    }
  }, [historyIndex, pathHistory]);
  
  const navigateHome = useCallback(() => {
    navigateTo('');
  }, [navigateTo]);
  
  const refresh = useCallback(() => {
    loadFiles();
  }, [loadFiles]);
  
  // File operations
  const toggleFolder = useCallback((path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  }, [expandedFolders]);
  
  const handleFileClick = useCallback(async (file: FileItem) => {
    if (file.type === 'directory') {
      if (file.handle && file.handle.kind === 'directory') {
        setCurrentDirHandle(file.handle as FileSystemDirectoryHandle);
      }
      navigateTo(file.path);
    } else {
      setSelectedFile(file);
      
      // Load file for preview
      const fileData = await fileSystemService.readFile(file);
      if (fileData) {
        setPreviewFile(fileData);
      }
    }
  }, [navigateTo]);
  
  const handleFileDrag = useCallback((e: React.DragEvent, file: FileItem) => {
    if (file.type === 'file') {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', file.path);
      e.dataTransfer.setData('application/x-corelogic-audio', JSON.stringify(file));
    }
  }, []);
  
  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  }, []);
  
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);
  
  const handleRename = useCallback(async (file: FileItem) => {
    const newName = prompt('Enter new name:', file.name);
    if (newName && newName !== file.name) {
      const success = await fileSystemService.renameFile(file, newName, currentDirHandle || undefined);
      if (success) {
        refresh();
      } else {
        alert('Rename failed. File System Access API does not support rename.');
      }
    }
    closeContextMenu();
  }, [currentDirHandle, refresh, closeContextMenu]);
  
  const handleDelete = useCallback(async (file: FileItem) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    
    if (currentDirHandle) {
      const success = await fileSystemService.deleteFile(
        currentDirHandle,
        file.name,
        file.type === 'directory'
      );
      if (success) {
        refresh();
      } else {
        alert('Delete failed. Permission denied or file in use.');
      }
    }
    closeContextMenu();
  }, [currentDirHandle, refresh, closeContextMenu]);
  
  const handleProperties = useCallback((file: FileItem) => {
    const props = [
      `Name: ${file.name}`,
      `Type: ${file.type}`,
      file.size ? `Size: ${formatFileSize(file.size)}` : null,
      file.duration ? `Duration: ${formatDuration(file.duration)}` : null,
      file.format ? `Format: ${file.format.toUpperCase()}` : null,
      file.lastModified ? `Modified: ${file.lastModified.toLocaleString()}` : null,
    ].filter(Boolean).join('\n');
    
    alert(props);
    closeContextMenu();
  }, [closeContextMenu]);
  
  // Close context menu on click outside
  useEffect(() => {
    if (contextMenu) {
      const handler = () => closeContextMenu();
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [contextMenu, closeContextMenu]);
  
  // Preview controls
  const togglePreview = useCallback(() => {
    if (!selectedFile || selectedFile.type !== 'file') return;
    
    if (audioPreviewRef.current) {
      if (isPreviewPlaying) {
        audioPreviewRef.current.pause();
      } else {
        audioPreviewRef.current.play();
      }
      setIsPreviewPlaying(!isPreviewPlaying);
    }
  }, [selectedFile, isPreviewPlaying]);
  
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setPreviewVolume(volume);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.volume = volume;
    }
  }, []);
  
  // File upload
  const handleFileUpload = useCallback(async (file: File) => {
    await uploadAudioFile(file);
    refresh();
  }, [uploadAudioFile, refresh]);
  
  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);
  
  // Filter and sort
  const filteredFiles = files.filter((file) => {
    // Search filter
    if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (filterType !== 'all') {
      if (filterType === 'audio' && file.type === 'file' && !file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i)) {
        return false;
      }
      if (filterType === 'midi' && file.type === 'file' && !file.name.match(/\.mid$/i)) {
        return false;
      }
      if (filterType === 'projects' && file.type === 'file' && !file.name.match(/\.(json|corelogic|cls)$/i)) {
        return false;
      }
    }
    
    return true;
  });
  
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    // Directories first
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0);
      case 'size':
        return (b.size || 0) - (a.size || 0);
      case 'type':
        return (a.format || '').localeCompare(b.format || '');
      default:
        return 0;
    }
  });
  
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };
  
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={`flex flex-col bg-slate-950 border border-slate-800 rounded-md shadow-sm overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        {/* Navigation buttons */}
        <button
          onClick={navigateBack}
          disabled={historyIndex <= 0}
          className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <button
          onClick={navigateForward}
          disabled={historyIndex >= pathHistory.length - 1}
          className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Forward"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180" />
        </button>
        <button
          onClick={navigateHome}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
          title="Home"
        >
          <Home className="w-4 h-4 text-slate-400" />
        </button>
        <button
          onClick={refresh}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </button>
        
        <div className="flex-1" />
        
        {/* View mode toggle */}
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
          title={viewMode === 'list' ? 'Grid view' : 'List view'}
        >
          {viewMode === 'list' ? (
            <Grid3x3 className="w-4 h-4 text-slate-400" />
          ) : (
            <List className="w-4 h-4 text-slate-400" />
          )}
        </button>
        
        {/* Open folder button (File System Access API) */}
        {fileSystemService.isFileSystemAccessSupported() && (
          <button
            onClick={requestDirectoryAccess}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
            title="Open folder"
          >
            <FolderPlus className="w-4 h-4 text-slate-400" />
          </button>
        )}
        
        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingFile}
          className="p-1 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
          title="Upload file"
        >
          <FileIcon className="w-4 h-4 text-slate-400" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          accept=".mp3,.wav,.ogg,.flac,.aac,.m4a,.mid,.json,.corelogic,.cls"
          style={{ display: 'none' }}
          aria-label="Upload audio file"
        />
        
        {/* Undock button (if docked) */}
        {isDocked && onUndock && (
          <button
            onClick={onUndock}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
            title="Pop out"
          >
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col gap-2 p-2 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-7 pr-7 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-slate-300"
            >
              <X className="w-3 h-3 text-slate-500" />
            </button>
          )}
        </div>
        
        {/* Filter and sort controls */}
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
            title="Filter by type"
          >
            <option value="all">All Files</option>
            <option value="audio">Audio</option>
            <option value="midi">MIDI</option>
            <option value="projects">Projects</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
            title="Sort by"
          >
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>
      
      {/* Path breadcrumb */}
      {currentPath && (
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/50 border-b border-slate-800 text-xs text-slate-400 flex-shrink-0 overflow-x-auto">
          <Home className="w-3 h-3" />
          {currentPath.split('/').filter(Boolean).map((segment, index, arr) => (
            <div key={index} className="flex items-center gap-1 flex-shrink-0">
              <ChevronRight className="w-3 h-3" />
              <span className={index === arr.length - 1 ? 'text-cyan-400' : ''}>
                {segment}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* File list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sortedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs p-4">
            <Folder className="w-8 h-8 mb-2 opacity-50" />
            <p>No files found</p>
          </div>
        ) : (
          <div className={viewMode === 'list' ? 'divide-y divide-slate-800' : 'grid grid-cols-2 gap-2 p-2'}>
            {sortedFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => handleFileClick(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
                draggable={file.type === 'file'}
                onDragStart={(e) => handleFileDrag(e, file)}
                className={`
                  ${viewMode === 'list' ? 'flex items-center gap-2 px-2 py-1.5' : 'flex flex-col items-center p-2 rounded-md'}
                  ${selectedFile?.path === file.path ? 'bg-cyan-900/30' : 'hover:bg-slate-800/50'}
                  cursor-pointer transition-colors text-xs
                `}
              >
                {file.type === 'directory' ? (
                  expandedFolders.has(file.path) ? (
                    <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )
                ) : (
                  <Music className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                )}
                
                <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'text-center' : ''}`}>
                  <p className="text-slate-200 truncate">{file.name}</p>
                  {viewMode === 'list' && file.type === 'file' && (
                    <div className="flex gap-2 text-slate-500 text-xs">
                      {file.size && <span>{formatFileSize(file.size)}</span>}
                      {file.duration && <span>{formatDuration(file.duration)}</span>}
                    </div>
                  )}
                </div>
                
                {viewMode === 'list' && file.type === 'directory' && (
                  <ChevronRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Preview panel (if file selected) */}
      {selectedFile && selectedFile.type === 'file' && (
        <div className="border-t border-slate-800 bg-slate-900 p-2 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-200 flex-1 truncate">{selectedFile.name}</span>
          </div>
          
          {/* Waveform preview */}
          {previewFile && fileSystemService.isAudioFile(selectedFile.name) && (
            <div className="mb-2">
              <WaveformPreview
                audioFile={previewFile}
                width={Math.min(400, window.innerWidth - 100)}
                height={60}
                className="rounded"
              />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={togglePreview}
              className="p-1 hover:bg-slate-800 rounded transition-colors"
              title={isPreviewPlaying ? 'Pause' : 'Play'}
            >
              {isPreviewPlaying ? (
                <Pause className="w-4 h-4 text-cyan-400" />
              ) : (
                <Play className="w-4 h-4 text-cyan-400" />
              )}
            </button>
            
            <Volume2 className="w-3 h-3 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={previewVolume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 accent-cyan-600"
              title={`Volume: ${Math.round(previewVolume * 100)}%`}
            />
            
            <span className="text-xs text-slate-400 w-8 text-right">
              {Math.round(previewVolume * 100)}%
            </span>
          </div>
          
          {/* Hidden audio element for preview */}
          {previewFile && (
            <audio 
              ref={audioPreviewRef}
              src={URL.createObjectURL(previewFile)}
              onEnded={() => setIsPreviewPlaying(false)}
            />
          )}
        </div>
      )}
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-slate-900 border border-slate-700 rounded shadow-lg py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleRename(contextMenu.file)}
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-800 flex items-center gap-2 text-slate-200"
          >
            <Edit className="w-3 h-3" />
            Rename
          </button>
          <button
            onClick={() => handleDelete(contextMenu.file)}
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-800 flex items-center gap-2 text-red-400"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <div className="h-px bg-slate-700 my-1" />
          <button
            onClick={() => handleProperties(contextMenu.file)}
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-800 flex items-center gap-2 text-slate-200"
          >
            <Info className="w-3 h-3" />
            Properties
          </button>
        </div>
      )}
    </div>
  );
}

export default MediaExplorer;
