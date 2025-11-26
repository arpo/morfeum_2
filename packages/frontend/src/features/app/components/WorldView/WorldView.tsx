import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store';
import styles from './WorldView.module.css';

export function WorldView() {
  const activeEntity = useStore(state => state.activeEntity);
  const entities = useStore(state => state.entities);
  const activeSpawns = useStore(state => state.activeSpawns);
  
  const [imageLoading, setImageLoading] = useState(true);
  
  // Get active entity session
  const activeEntitySession = activeEntity ? entities.get(activeEntity) : null;
  
  // Find the most relevant image to display
  // Priority:
  // 1. Active spawn with an image (streaming generation)
  // 2. Active entity session image (persistent state)
  const displayImage = useMemo(() => {
    // Check for active spawns with images first
    // We look for the most recent spawn that has an image
    const spawnWithImage = [...activeSpawns]
      .reverse()
      .find(spawn => spawn.status === 'processing' && spawn.imageUrl);
      
    if (spawnWithImage) {
      return {
        src: spawnWithImage.imageUrl,
        alt: `Generating ${spawnWithImage.prompt}...`
      };
    }
    
    // Fallback to active entity
    if (activeEntitySession?.entityImage) {
      return {
        src: activeEntitySession.entityImage,
        alt: activeEntitySession.entityName || 'Entity'
      };
    }
    
    return null;
  }, [activeSpawns, activeEntitySession]);

  // Reset loading state when image source changes
  useEffect(() => {
    if (displayImage?.src) {
      setImageLoading(true);
    }
  }, [displayImage?.src]);

  if (!displayImage) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonBreathing} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {imageLoading && (
        <div className={styles.skeleton}>
          <div className={styles.skeletonBreathing} />
        </div>
      )}
      <img 
        key={displayImage.src}
        src={displayImage.src} 
        alt={displayImage.alt}
        className={`${styles.image} ${!imageLoading ? styles.loaded : ''}`}
        onLoad={() => setImageLoading(false)}
      />
    </div>
  );
}
