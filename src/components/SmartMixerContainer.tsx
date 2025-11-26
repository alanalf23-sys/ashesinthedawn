import { useState, useRef, useEffect, ReactNode } from 'react';
import { GripVertical, Maximize2, Minimize2, X } from 'lucide-react';

interface MixerPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

interface SmartMixerContainerProps {
  children: ReactNode;
  onPositionChange?: (position: MixerPosition) => void;
}

const SNAP_GRID = 20; // Snap to 20px grid
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const TASKBAR_HEIGHT = 60;

export default function SmartMixerContainer({ children, onPositionChange }: SmartMixerContainerProps) {
  const [position, setPosition] = useState<MixerPosition>({
    x: 10,
    y: TASKBAR_HEIGHT + 10,
    width: Math.min(window.innerWidth - 20, 1200),
    height: Math.max(200, window.innerHeight - TASKBAR_HEIGHT - 40),
    isMaximized: false,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalPos, setOriginalPos] = useState(position);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-save position to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mixerPosition');
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch {
        // Use default position if parsing fails
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mixerPosition', JSON.stringify(position));
    onPositionChange?.(position);
  }, [position, onPositionChange]);

  // Snap to grid helper
  const snapToGrid = (val: number) => Math.round(val / SNAP_GRID) * SNAP_GRID;

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOriginalPos(position);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, edge: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(edge);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOriginalPos(position);
  };

  // Handle global mouse move
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (isDragging) {
        // Dragging the window
        const newX = snapToGrid(originalPos.x + deltaX);
        const newY = snapToGrid(originalPos.y + deltaY);

        // Keep window within viewport
        const maxX = window.innerWidth - position.width;
        const maxY = window.innerHeight - 50;

        setPosition((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(TASKBAR_HEIGHT, Math.min(newY, maxY)),
        }));
      } else if (isResizing) {
        // Resizing the window
        let newWidth = originalPos.width;
        let newHeight = originalPos.height;
        let newX = originalPos.x;
        let newY = originalPos.y;

        const resizeEdges = isResizing.split('-');

        for (const edge of resizeEdges) {
          if (edge === 'e') {
            // East (right)
            newWidth = snapToGrid(originalPos.width + deltaX);
          } else if (edge === 'w') {
            // West (left)
            newWidth = snapToGrid(originalPos.width - deltaX);
            newX = snapToGrid(originalPos.x + deltaX);
          } else if (edge === 's') {
            // South (bottom)
            newHeight = snapToGrid(originalPos.height + deltaY);
          } else if (edge === 'n') {
            // North (top)
            newHeight = snapToGrid(originalPos.height - deltaY);
            newY = snapToGrid(originalPos.y + deltaY);
          }
        }

        // Enforce minimum sizes
        newWidth = Math.max(MIN_WIDTH, newWidth);
        newHeight = Math.max(MIN_HEIGHT, newHeight);

        // Keep within viewport
        const maxX = window.innerWidth - newWidth;
        const maxY = window.innerHeight - 50;

        setPosition((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(TASKBAR_HEIGHT, Math.min(newY, maxY)),
          width: newWidth,
          height: newHeight,
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, originalPos, position.width]);

  // Handle maximize/minimize
  const toggleMaximize = () => {
    if (position.isMaximized) {
      // Restore previous size
      setPosition({
        x: 10,
        y: TASKBAR_HEIGHT + 10,
        width: 800,
        height: 500,
        isMaximized: false,
      });
    } else {
      // Maximize
      setPosition({
        x: 0,
        y: TASKBAR_HEIGHT,
        width: window.innerWidth,
        height: window.innerHeight - TASKBAR_HEIGHT,
        isMaximized: true,
      });
    }
  };

  // Resize edge cursor styles
  const getResizeCursor = (edge: string) => {
    if (edge === 'e' || edge === 'w') return 'ew-resize';
    if (edge === 'n' || edge === 's') return 'ns-resize';
    if (edge === 'ne' || edge === 'sw') return 'nesw-resize';
    if (edge === 'nw' || edge === 'se') return 'nwse-resize';
    return 'default';
  };

  const resizeEdges = [
    'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'
  ];

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-gray-900 border-2 border-blue-600 rounded-lg shadow-2xl flex flex-col overflow-hidden transition-shadow hover:shadow-blue-500/50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Title Bar */}
      <div
        className="h-10 bg-gradient-to-r from-blue-700 to-blue-600 flex items-center justify-between px-3 flex-shrink-0 select-none cursor-grab active:cursor-grabbing border-b border-blue-500"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2 flex-1">
          <GripVertical size={16} className="text-blue-200 flex-shrink-0" />
          <span className="text-sm font-semibold text-white truncate">Mixer Studio</span>
          <span className="text-xs text-blue-200 ml-auto">
            {position.width} × {position.height}
          </span>
        </div>
        <div data-no-drag className="flex items-center gap-1">
          <button
            onClick={toggleMaximize}
            className="p-1 hover:bg-blue-600 rounded transition-colors text-blue-200 hover:text-white"
            title={position.isMaximized ? 'Restore' : 'Maximize'}
          >
            {position.isMaximized ? (
              <Minimize2 size={14} />
            ) : (
              <Maximize2 size={14} />
            )}
          </button>
          <button
            onClick={() => setPosition((prev) => ({ ...prev, height: 0 }))}
            className="p-1 hover:bg-blue-600 rounded transition-colors text-blue-200 hover:text-white"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" data-no-drag>
        {children}
      </div>

      {/* Resize Handles */}
      {!position.isMaximized && (
        <>
          {/* Corner and edge resize handles */}
          {resizeEdges.map((edge) => (
            <div
              key={edge}
              onMouseDown={(e) => handleResizeStart(e, edge)}
              className="absolute hover:bg-blue-500/30 transition-colors"
              style={{
                cursor: getResizeCursor(edge),
                ...(edge === 'n' && {
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: '4px',
                  zIndex: 30,
                }),
                ...(edge === 's' && {
                  bottom: 0,
                  left: '20%',
                  right: '20%',
                  height: '4px',
                  zIndex: 30,
                }),
                ...(edge === 'e' && {
                  right: 0,
                  top: '20%',
                  bottom: '20%',
                  width: '4px',
                  zIndex: 30,
                }),
                ...(edge === 'w' && {
                  left: 0,
                  top: '20%',
                  bottom: '20%',
                  width: '4px',
                  zIndex: 30,
                }),
                ...(edge === 'ne' && {
                  top: 0,
                  right: 0,
                  width: '12px',
                  height: '12px',
                  zIndex: 40,
                }),
                ...(edge === 'nw' && {
                  top: 0,
                  left: 0,
                  width: '12px',
                  height: '12px',
                  zIndex: 40,
                }),
                ...(edge === 'se' && {
                  bottom: 0,
                  right: 0,
                  width: '12px',
                  height: '12px',
                  zIndex: 40,
                }),
                ...(edge === 'sw' && {
                  bottom: 0,
                  left: 0,
                  width: '12px',
                  height: '12px',
                  zIndex: 40,
                }),
              }}
            />
          ))}

          {/* Bottom-right corner indicator */}
          <div
            className="absolute bottom-1 right-1 text-blue-600/40 group-hover:text-blue-400/60 transition-colors pointer-events-none"
            style={{
              fontSize: '12px',
              lineHeight: '1',
            }}
          >
            ⋰
          </div>
        </>
      )}
    </div>
  );
}
