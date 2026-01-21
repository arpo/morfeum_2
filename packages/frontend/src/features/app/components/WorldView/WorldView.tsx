import { useEffect, useRef, useState, useCallback } from 'react';
import { useWorldViewLogic } from './useWorldViewLogic';
import { WORLD_VIEW_3D_CONFIG } from '@/config';
import styles from './WorldView.module.css';
// Import to ensure CSS variables are loaded
import '@/styles/model-filters.module.css';

// Target aspect ratio (16:9)
const TARGET_ASPECT_RATIO = 16 / 9;

export function WorldView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    initRenderer, 
    isLoading, 
    hasImage,
    imageModelClass
  } = useWorldViewLogic();
  const [letterboxHeight, setLetterboxHeight] = useState(0);
  
  const letterboxEnabled = WORLD_VIEW_3D_CONFIG.LETTERBOX.ENABLED;
  const extraHeight = WORLD_VIEW_3D_CONFIG.LETTERBOX.EXTRA_HEIGHT;

  // Calculate letterbox height based on viewport and 16:9 aspect ratio
  const calculateLetterboxHeight = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const currentAspect = viewportWidth / viewportHeight;
    
    // If viewport is taller than 16:9, add top/bottom bars
    if (currentAspect < TARGET_ASPECT_RATIO) {
      // Calculate the height needed to achieve 16:9
      const targetHeight = viewportWidth / TARGET_ASPECT_RATIO;
      const excessHeight = viewportHeight - targetHeight;
      // Each bar gets half the excess height + extra height for cutting edges
      setLetterboxHeight(Math.max(0, excessHeight / 2) + extraHeight);
    } else {
      // Viewport is wider than 16:9, still add extra height if configured
      setLetterboxHeight(extraHeight);
    }
  }, [extraHeight]);

  // Update letterbox on resize
  useEffect(() => {
    calculateLetterboxHeight();
    window.addEventListener('resize', calculateLetterboxHeight);
    return () => window.removeEventListener('resize', calculateLetterboxHeight);
  }, [calculateLetterboxHeight]);

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
        className={`${styles.canvas} ${!isLoading && hasImage ? styles.loaded : ''}${imageModelClass ? ` ${styles[imageModelClass]}` : ''}`}
        data-model-class={imageModelClass || 'none'}
      />
      
      {/* Letterbox bars to enforce 16:9 aspect ratio */}
      {letterboxEnabled && letterboxHeight > 0 && (
        <>
          <div 
            className={styles.letterboxTop} 
            style={{ height: `${letterboxHeight}px` }}
          />
          <div 
            className={styles.letterboxBottom} 
            style={{ height: `${letterboxHeight}px` }}
          />
        </>
      )}
    </div>
  );
}
