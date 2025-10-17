import { IconX } from '@/icons';
import { useDraggablePanel } from './useDraggablePanel';
import styles from './DraggablePanel.module.css';
import type { DraggablePanelProps } from './types';

export function DraggablePanel({
  title,
  onClose,
  children,
  initialPosition,
  initialSize,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
}: DraggablePanelProps) {
  const {
    position,
    size,
    panelRef,
    handleMouseDown,
    handleResizeMouseDown,
    bringToFront,
    zIndex,
  } = useDraggablePanel({
    initialPosition,
    initialSize,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
  });

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex,
      }}
      onClick={bringToFront}
    >
      {/* Drag bar */}
      <div
        className={styles.dragBar}
        onMouseDown={handleMouseDown}
      >
        <h3 className={styles.title}>{title}</h3>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close panel"
        >
          <IconX size={20} />
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {children}
      </div>

      {/* Resize handles */}
      <div className={styles.resizeHandleN} onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
      <div className={styles.resizeHandleS} onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
      <div className={styles.resizeHandleE} onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
      <div className={styles.resizeHandleW} onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
      <div className={styles.resizeHandleNE} onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
      <div className={styles.resizeHandleNW} onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
      <div className={styles.resizeHandleSE} onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
      <div className={styles.resizeHandleSW} onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
    </div>
  );
}
