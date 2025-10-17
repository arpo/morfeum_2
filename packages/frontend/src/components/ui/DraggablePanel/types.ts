export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface DraggablePanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  initialPosition?: Position;
  initialSize?: Size;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface DraggablePanelLogicReturn {
  position: Position;
  size: Size;
  isDragging: boolean;
  isResizing: boolean;
  panelRef: React.RefObject<HTMLDivElement>;
  dragBarRef: React.RefObject<HTMLDivElement>;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleResizeMouseDown: (e: React.MouseEvent, direction: ResizeDirection) => void;
  bringToFront: () => void;
  zIndex: number;
}

export type ResizeDirection = 
  | 'n' 
  | 's' 
  | 'e' 
  | 'w' 
  | 'ne' 
  | 'nw' 
  | 'se' 
  | 'sw';
