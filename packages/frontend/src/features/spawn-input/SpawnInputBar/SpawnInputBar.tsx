/**
 * Spawn Input Bar Component
 * Simplified input for triggering entity spawn processes
 */

import { useState } from 'react';
import { useSpawnInputLogic } from './useSpawnInputLogic';
import { useStore } from '@/store';
import { IconDice, IconChevronDown, IconChevronUp, IconBookmark } from '@/icons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import styles from './SpawnInputBar.module.css';

interface SpawnInputBarProps {
  onOpenSavedEntities?: () => void;
}

export function SpawnInputBar({ onOpenSavedEntities }: SpawnInputBarProps) {
  const { state, handlers } = useSpawnInputLogic();
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Get active spawns from store
  const activeSpawns = useStore(state => state.activeSpawns);
  
  // Filter to processing spawns (steps will be added by first SSE event)
  const activeProcesses = activeSpawns.filter(spawn => 
    spawn.status === 'processing'
  );

  return (
    <div data-component="spawn-input-bar">
      {/* Active Spawn Progress Bars */}
      {activeProcesses.length > 0 && (
        <div style={{
          marginBottom: 'var(--spacing-sm)',
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)',
        }}>
          {activeProcesses.map(spawn => {
            // Only render progress bar if steps are available
            if (!spawn.steps || spawn.steps.length === 0) {
              return null;
            }
            
            return (
              <ProgressBar
                key={spawn.id}
                steps={spawn.steps.map(s => ({ name: s.name, duration: s.duration }))}
                currentStep={spawn.currentStepIndex ?? -1}
                isComplete={spawn.status === 'completed'}
              />
            );
          })}
        </div>
      )}
      
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && state.textPrompt.trim()) {
                e.preventDefault();
                handlers.handleGenerate();
              }
            }}
            placeholder={state.entityType === 'character' 
              ? "Describe a character to spawn..."
              : "Describe a location to spawn..."
            }
            rows={3}
          />
          <div className={styles.buttonRow}>
            <button
              className={styles.generateButton}
              onClick={handlers.handleGenerate}
              disabled={!state.textPrompt.trim()}
            >
              Generate
            </button>
            
            <button
              className={styles.shuffleButton}
              onClick={handlers.handleShuffle}
              title="Random example"
            >
              <IconDice size={18} />
            </button>
            {onOpenSavedEntities && (
              <button
                className={styles.shuffleButton}
                onClick={onOpenSavedEntities}
                title="Saved Entities"
              >
                <IconBookmark size={18} />
              </button>
            )}
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
