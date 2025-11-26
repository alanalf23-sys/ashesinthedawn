import { useState, useRef, useEffect, ReactNode } from 'react';
import { GripVertical, Maximize2, Minimize2, X, Wind } from 'lucide-react';

interface MixerPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isDocked: boolean;
}

interface SmartMixerContainerProps {
  children: ReactNode;
  onPositionChange?: (position: MixerPosition) => void;
  onDockChange?: (isDocked: boolean) => void;
}

const SNAP_GRID = 20; // Snap to 20px grid
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const TASKBAR_HEIGHT = 60;

export default function SmartMixerContainer({ children, onPositionChange, onDockChange }: SmartMixerContainerProps) {
  const [position, setPosition] = useState<MixerPosition>({
    x: 10,
    y: TASKBAR_HEIGHT + 10,
    width: Math.min(window.innerWidth - 20, 1200),
    height: Math.max(200, window.innerHeight - TASKBAR_HEIGHT - 40),
    isMaximized: false,
    isDocked: false,
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

  // Notify parent when dock state changes
  useEffect(() => {
    onDockChange?.(position.isDocked);
  }, [position.isDocked, onDockChange]);

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
        ...position,
        x: 10,
        y: TASKBAR_HEIGHT + 10,
        width: 800,
        height: 500,
        isMaximized: false,
      });
    } else {
      // Maximize
      setPosition({
        ...position,
        x: 0,
        y: TASKBAR_HEIGHT,
        width: window.innerWidth,
        height: window.innerHeight - TASKBAR_HEIGHT,
        isMaximized: true,
      });
    }
  };

  // Handle dock/undock toggle
  const toggleDock = () => {
    setPosition((prev) => ({
      ...prev,
      isDocked: !prev.isDocked,
    }));
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
      className={`${
        position.isDocked 
          ? 'relative z-0 border-t border-blue-600 rounded-t-none' 
          : 'fixed z-50 rounded-lg border-2 border-blue-600'
      } bg-gray-900 shadow-2xl flex flex-col overflow-hidden transition-shadow hover:shadow-blue-500/50`}
      style={
        position.isDocked 
          ? { width: '100%', height: '100%' } 
          : {
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: `${position.width}px`,
              height: `${position.height}px`,
              cursor: isDragging ? 'grabbing' : 'default',
            }
      }
    >
      {/* Title Bar */}
      <div
        className={`h-10 ${
          position.isDocked 
            ? 'bg-gradient-to-r from-gray-700 to-gray-600' 
            : 'bg-gradient-to-r from-blue-700 to-blue-600'
        } flex items-center justify-between px-3 flex-shrink-0 select-none transition-colors ${
          !position.isDocked ? 'cursor-grab active:cursor-grabbing' : ''
        } border-b ${
          position.isDocked ? 'border-gray-500' : 'border-blue-500'
        }`}
        onMouseDown={!position.isDocked ? handleDragStart : undefined}
      >
        <div className="flex items-center gap-2 flex-1">
          {!position.isDocked && (
            <GripVertical size={16} className="text-blue-200 flex-shrink-0" />
          )}
          <span className={`text-sm font-semibold ${
            position.isDocked ? 'text-gray-200' : 'text-white'
          } truncate`}>
            Mixer Studio {position.isDocked && '(Docked)'}
          </span>
          {!position.isDocked && (
            <span className="text-xs text-blue-200 ml-auto">
              {position.width} × {position.height}
            </span>
          )}
        </div>
        <div data-no-drag className="flex items-center gap-1">
          <button
            onClick={toggleDock}
            className={`p-1 rounded transition-colors ${
              position.isDocked
                ? 'hover:bg-gray-500 text-gray-300 hover:text-white'
                : 'hover:bg-blue-600 text-blue-200 hover:text-white'
            }`}
            title={position.isDocked ? 'Undock' : 'Dock to window'}
          >
            <Wind size={14} />
          </button>
          <button
            onClick={toggleMaximize}
            className={`p-1 rounded transition-colors ${
              position.isDocked
                ? 'hover:bg-gray-500 text-gray-300 hover:text-white'
                : 'hover:bg-blue-600 text-blue-200 hover:text-white'
            }`}
            title={position.isMaximized ? 'Restore' : 'Maximize'}
          >
            {position.isMaximized ? (
              <Minimize2 size={14} />
            ) : (
              <Maximize2 size={14} />
            )}
          </button>
          {!position.isDocked && (
            <button
              onClick={() => setPosition((prev) => ({ ...prev, height: 0 }))}
              className="p-1 hover:bg-blue-600 rounded transition-colors text-blue-200 hover:text-white"
              title="Close"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" data-no-drag>
        {children}
      </div>

      {/* Resize Handles - Only show when floating */}
      {!position.isMaximized && !position.isDocked && (
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
