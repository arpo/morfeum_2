import { useEffect, useRef } from 'react';
import { useWorldViewLogic } from './useWorldViewLogic';
import styles from './WorldView.module.css';

export function WorldView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { initRenderer, isLoading, hasImage } = useWorldViewLogic();

  // Initialize renderer when container is mounted
  useEffect(() => {
    if (containerRef.current) {
      initRenderer(containerRef.current);
    }
  }, [initRenderer]);

  return (
    <div className={styles.container} data-component="world-view">
      {isLoading && (
        <div className={styles.skeleton}>
          <div className={styles.skeletonBreathing} />
        </div>
      )}
      <div 
        ref={containerRef} 
        className={`${styles.canvas} ${!isLoading && hasImage ? styles.loaded : ''}`}
      />
    </div>
  );
}
