import { useState, useRef, useEffect, useCallback } from 'react';
import type { DraggablePanelProps, DraggablePanelLogicReturn, Position, Size, ResizeDirection } from './types';

let globalZIndex = 1000;

export function useDraggablePanel({
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 400, height: 500 },
  minWidth = 300,
  minHeight = 200,
  maxWidth,
  maxHeight,
}: Partial<DraggablePanelProps>): DraggablePanelLogicReturn {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [size, setSize] = useState<Size>(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [zIndex, setZIndex] = useState(globalZIndex++);

  const panelRef = useRef<HTMLDivElement>(null);
  const dragBarRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const resizeDirection = useRef<ResizeDirection | null>(null);
  const resizeStartPos = useRef<Position>({ x: 0, y: 0 });
  const resizeStartSize = useRef<Size>({ width: 0, height: 0 });

  const bringToFront = useCallback(() => {
    setZIndex(++globalZIndex);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    bringToFront();
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position, bringToFront]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    bringToFront();
    resizeDirection.current = direction;
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    resizeStartSize.current = { ...size };
  }, [size, bringToFront]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;

        // Keep within viewport bounds
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }

      if (isResizing && resizeDirection.current) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;
        const direction = resizeDirection.current;

        let newWidth = resizeStartSize.current.width;
        let newHeight = resizeStartSize.current.height;
        let newX = position.x;
        let newY = position.y;

        // Handle horizontal resizing
        if (direction.includes('e')) {
          newWidth = resizeStartSize.current.width + deltaX;
        } else if (direction.includes('w')) {
          newWidth = resizeStartSize.current.width - deltaX;
          newX = position.x + deltaX;
        }

        // Handle vertical resizing
        if (direction.includes('s')) {
          newHeight = resizeStartSize.current.height + deltaY;
        } else if (direction.includes('n')) {
          newHeight = resizeStartSize.current.height - deltaY;
          newY = position.y + deltaY;
        }

        // Apply constraints
        newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth || window.innerWidth));
        newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight || window.innerHeight));

        // Only update position for west/north resize if size changed
        if (direction.includes('w') && newWidth !== size.width) {
          setPosition(prev => ({ ...prev, x: newX }));
        }
        if (direction.includes('n') && newHeight !== size.height) {
          setPosition(prev => ({ ...prev, y: newY }));
        }

        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      resizeDirection.current = null;
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isDragging ? 'move' : 'nwse-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, isResizing, position, size, minWidth, minHeight, maxWidth, maxHeight]);

  return {
    position,
    size,
    isDragging,
    isResizing,
    panelRef,
    dragBarRef,
    handleMouseDown,
    handleResizeMouseDown,
    bringToFront,
    zIndex,
  };
}
