/**
 * Spawn Row Component
 * Individual spawn item showing progress and cancel button
 */

import { useStore } from '@/store';
import styles from './ActiveSpawnsPanel.module.css';

interface SpawnRowProps {
  spawnId: string;
  prompt: string;
  status: string;
}

export function SpawnRow({ spawnId, prompt, status }: SpawnRowProps) {
  const cancelSpawn = useStore(state => state.cancelSpawn);

  const getProgress = (status: string): number => {
    switch (status) {
      case 'starting':
      case 'generating_seed':
        return 25;
      case 'generating_image':
        return 50;
      case 'analyzing':
        return 75;
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
      case 'generating_image':
        return 'Creating image...';
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
          style={{ width: `${progress}%` }}
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
