/**
 * Spawn Row Component
 * Individual spawn item showing progress and cancel button
 */

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import styles from './ActiveSpawnsPanel.module.css';
import { getTransitionDuration } from './spawnTimings';

interface SpawnRowProps {
  spawnId: string;
  prompt: string;
  status: string;
  entityType?: 'character' | 'location' | 'niche';
}

export function SpawnRow({ spawnId, prompt, status, entityType = 'character' }: SpawnRowProps) {
  const cancelSpawn = useStore(state => state.cancelSpawn);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const getProgress = (status: string): number => {
    switch (status) {
      case 'starting':
      case 'generating_seed':
        return 20;
      case 'classifying':
        return 25;
      case 'generating_dna':
        return 50;
      case 'generating_flux_prompt':
        return 40;
      case 'generating_image':
        return 75;
      case 'analyzing':
        return 80;
      case 'enriching':
        return 90;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'starting':
      case 'generating_seed':
        return 'Generating seed...';
      case 'classifying':
        return 'Analyzing structure...';
      case 'generating_dna':
        return 'Generating DNA...';
      case 'generating_flux_prompt':
        return 'Creating FLUX prompt...';
      case 'generating_image':
        return 'Generating image...';
      case 'analyzing':
        return 'Analyzing...';
      case 'enriching':
        return 'Enriching profile...';
      case 'completed':
        return 'Complete';
      default:
        return status;
    }
  };

  const progress = getProgress(status);
  const statusLabel = getStatusLabel(status);
  const transitionDuration = getTransitionDuration(status, entityType);

  // Animate progress on mount and when progress changes
  useEffect(() => {
    // Use requestAnimationFrame to ensure browser has painted initial state
    // This ensures the transition is properly applied
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimatedProgress(progress);
      });
    });
  }, [progress]);

  const handleCancel = () => {
    cancelSpawn(spawnId);
  };

  return (
    <div className={styles.spawnRow}>
      <div className={styles.spawnInfo}>
        <div className={styles.spawnPrompt}>{prompt}</div>
        <div className={styles.spawnStatus}>{statusLabel}</div>
      </div>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ 
            width: `${animatedProgress}%`,
            transition: `width ${transitionDuration}ms ease`
          }}
        />
      </div>
      <button 
        className={styles.cancelButton}
        onClick={handleCancel}
        title="Cancel spawn"
      >
        ✕
      </button>
    </div>
  );
}
