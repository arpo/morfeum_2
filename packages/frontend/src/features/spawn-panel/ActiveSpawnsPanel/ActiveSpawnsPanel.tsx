/**
 * Active Spawns Panel Component
 * Shows all spawns currently in progress with collapsible interface
 */

import { useState } from 'react';
import { useStore } from '@/store';
import { SpawnRow } from './SpawnRow';
import styles from './ActiveSpawnsPanel.module.css';

export function ActiveSpawnsPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const activeSpawns = useStore(state => state.activeSpawns);

  // Convert Map to array for rendering
  const spawnsArray = Array.from(activeSpawns.entries()).map(([id, spawn]) => ({
    id,
    ...spawn
  }));

  // Don't render if no active spawns
  if (spawnsArray.length === 0) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.container} data-component="active-spawns-panel">
      <div className={styles.header} onClick={toggleExpanded}>
        <div>
          <span className={styles.headerTitle}>Active Spawns</span>
          <span className={styles.headerBadge}>{spawnsArray.length}</span>
        </div>
        <span className={`${styles.toggleIcon} ${!isExpanded ? styles.collapsed : ''}`}>
          ▼
        </span>
      </div>
      
      {isExpanded && (
        <div className={styles.spawnsList}>
          {spawnsArray.map(spawn => (
            <SpawnRow
              key={spawn.id}
              spawnId={spawn.id}
              prompt={spawn.prompt}
              status={spawn.status}
              entityType={spawn.entityType}
            />
          ))}
        </div>
      )}
    </div>
  );
}
