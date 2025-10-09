/**
 * Spawn Input Bar Component
 * Simplified input for triggering entity spawn processes
 */

import { useState } from 'react';
import { useSpawnInputLogic } from './useSpawnInputLogic';
import { SavedEntitiesModal } from '@/features/saved-locations/SavedLocationsModal';
import { IconBookmark, IconDice } from '@/icons';
import styles from './SpawnInputBar.module.css';

export function SpawnInputBar() {
  const { state, handlers } = useSpawnInputLogic();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && state.textPrompt.trim()) {
      handlers.handleGenerate();
    }
  };

  return (
    <div>
      <div className={styles.container}>
        <div className={styles.toggleGroup}>
          <button
            className={`${styles.toggleButton} ${state.entityType === 'character' ? styles.active : ''}`}
            onClick={() => handlers.setEntityType('character')}
          >
            Character
          </button>
          <button
            className={`${styles.toggleButton} ${state.entityType === 'location' ? styles.active : ''}`}
            onClick={() => handlers.setEntityType('location')}
          >
            Location
          </button>
        </div>
        <textarea
          className={styles.textarea}
          value={state.textPrompt}
          onChange={(e) => handlers.setTextPrompt(e.target.value)}
          placeholder={state.entityType === 'character' 
            ? "Describe a character to spawn..."
            : "Describe a location to spawn..."
          }
          rows={3}
        />
        <div className={styles.buttonRow}>
          <button
            className={styles.shuffleButton}
            onClick={handlers.handleShuffle}
            title="Random example"
          >
            <IconDice size={18} />
          </button>
          <button
            className={styles.savedButton}
            onClick={() => setIsModalOpen(true)}
            title="Browse saved locations"
          >
            <IconBookmark size={18} />
          </button>
          <button
            className={styles.generateButton}
            onClick={handlers.handleGenerate}
            disabled={!state.textPrompt.trim()}
          >
            Generate
          </button>
        </div>
      </div>
      {state.error && (
        <div className={styles.errorMessage}>
          {state.error}
        </div>
      )}
      <SavedEntitiesModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
