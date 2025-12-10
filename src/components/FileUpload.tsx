import React, { useState, useCallback } from 'react';
import { Upload, File, X, Music, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

interface UploadedFileInfo {
  file: File;
  id: string;
  preview?: string;
  type: 'audio' | 'midi' | 'text' | 'code' | 'other';
}

export function FileUpload({ onFileSelect, maxFiles = 5, acceptedTypes }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<UploadedFileInfo[]>([]);
  const [dragging, setDragging] = useState(false);

  const getFileType = (file: File): UploadedFileInfo['type'] => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if ([' wav', 'mp3', 'flac', 'aiff', 'ogg', 'm4a'].includes(extension || '')) return 'audio';
    if (['mid', 'midi'].includes(extension || '')) return 'midi';
    if (['txt', 'md'].includes(extension || '')) return 'text';
    if (['js', 'ts', 'py', 'json', 'xml'].includes(extension || '')) return 'code';
    return 'other';
  };

  const getFileIcon = (type: UploadedFileInfo['type']) => {
    switch (type) {
      case 'audio': return <Music className="w-5 h-5" />;
      case 'midi': return <Music className="w-5 h-5" />;
      case 'text': return <FileText className="w-5 h-5" />;
      case 'code': return <FileText className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newFiles: UploadedFileInfo[] = [];

    fileArray.slice(0, maxFiles - selectedFiles.length).forEach(file => {
      const fileInfo: UploadedFileInfo = {
        file,
        id: `${Date.now()}-${Math.random()}`,
        type: getFileType(file)
      };

      // Create preview for text files
      if (fileInfo.type === 'text' || fileInfo.type === 'code') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          fileInfo.preview = content.substring(0, 200);
          setSelectedFiles(prev => 
            prev.map(f => f.id === fileInfo.id ? fileInfo : f)
          );
        };
        reader.readAsText(file);
      }

      newFiles.push(fileInfo);
    });

    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);
    onFileSelect(updatedFiles.map(f => f.file));
  }, [selectedFiles, maxFiles, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const removeFile = (id: string) => {
    const updatedFiles = selectedFiles.filter(f => f.id !== id);
    setSelectedFiles(updatedFiles);
    onFileSelect(updatedFiles.map(f => f.file));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 transition-colors
          ${dragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 bg-gray-800/50'}
          hover:border-gray-500 cursor-pointer
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          accept={acceptedTypes?.join(',') || '.wav,.mp3,.flac,.mid,.midi,.txt,.json,.md,.py,.js,.ts'}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        
        <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
          <Upload className="w-8 h-8" />
          <p className="text-sm">
            {dragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="text-xs text-gray-500">
            Audio, MIDI, text, code files ({maxFiles - selectedFiles.length} remaining)
          </p>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-300">Selected Files ({selectedFiles.length})</h3>
          {selectedFiles.map((fileInfo) => (
            <div
              key={fileInfo.id}
              className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700"
            >
              {/* File Icon */}
              <div className="text-blue-400">
                {getFileIcon(fileInfo.type)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {fileInfo.file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{formatFileSize(fileInfo.file.size)}</span>
                  <span>•</span>
                  <span className="capitalize">{fileInfo.type}</span>
                </div>
                {fileInfo.preview && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {fileInfo.preview}...
                  </p>
                )}
              </div>

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(fileInfo.id);
                }}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
