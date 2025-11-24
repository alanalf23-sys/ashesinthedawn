import { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface DraggableWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  onClose?: () => void;
  minWidth?: number;
  minHeight?: number;
}

export default function DraggableWindow({
  title,
  children,
  defaultX = 100,
  defaultY = 100,
  defaultWidth = 400,
  defaultHeight = 300,
  onClose,
  minWidth = 250,
  minHeight = 200,
}: DraggableWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Dragging logic
  const handleMouseDownTitle = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Resizing logic
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
      if (isResizing) {
        const newWidth = Math.max(minWidth, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(minHeight, resizeStart.height + (e.clientY - resizeStart.y));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, minWidth, minHeight]);

  return (
    <div
      ref={windowRef}
      className="absolute flex flex-col bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: isDragging ? 1000 : 100,
      }}
    >
      {/* Title Bar - Draggable */}
      <div
        onMouseDown={handleMouseDownTitle}
        className="h-8 bg-gradient-to-r from-gray-800 via-gray-750 to-gray-800 border-b border-gray-600 flex items-center justify-between px-4 flex-shrink-0 cursor-move hover:bg-gradient-to-r hover:from-gray-700 hover:via-gray-700 hover:to-gray-700 transition-all"
      >
        <span className="text-xs font-semibold text-gray-100">{title}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-0.5 hover:bg-red-600/30 rounded transition-colors text-gray-400 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Resize Handle - Bottom Right Corner */}
      <div
        onMouseDown={handleMouseDownResize}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-gradient-to-tl from-blue-500/40 to-transparent hover:from-blue-500/80 transition-all"
        style={{ zIndex: 50 }}
      />
    </div>
  );
}
