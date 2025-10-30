/**
 * Spawn Input Bar Component
 * Simplified input for triggering entity spawn processes
 */

import { useState } from 'react';
import { useSpawnInputLogic } from './useSpawnInputLogic';
import { IconDice, IconChevronDown, IconChevronUp } from '@/icons';
import styles from './SpawnInputBar.module.css';

export function SpawnInputBar() {
  const { state, handlers } = useSpawnInputLogic();
  const [isMinimized, setIsMinimized] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && state.textPrompt.trim()) {
      handlers.handleGenerate();
    }
  };

  return (
    <div data-component="spawn-input-bar">
      <div className={`${styles.wrapper} ${isMinimized ? styles.minimized : styles.expanded}`}>
        {/* Minimized Tab */}
        <div 
          className={styles.minimizedTab}
          onClick={() => setIsMinimized(false)}
          title="Click to expand"
        >
          <IconChevronUp size={16} />
          <span className={styles.minimizedText}>Generate</span>
        </div>
        
        {/* Expanded Content */}
        <div className={styles.expandedContent}>
          <div className={styles.topRow}>
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
            <button
              className={styles.minimizeButton}
              onClick={() => setIsMinimized(true)}
              title="Minimize"
            >
              <IconChevronDown size={18} />
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
              className={styles.generateButton}
              onClick={handlers.handleGenerate}
              disabled={!state.textPrompt.trim()}
            >
              Generate
            </button>
          </div>
        </div>
      </div>
      
      {state.error && (
        <div className={styles.errorMessage}>
          {state.error}
        </div>
      )}
    </div>
  );
}
