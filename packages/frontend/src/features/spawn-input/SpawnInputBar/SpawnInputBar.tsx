/**
 * Spawn Input Bar Component
 * Command-based input for creating worlds, characters, and navigating
 */

import { KeyboardEvent, useCallback } from 'react';
import { useNavigationLogic } from './useNavigationLogic';
import { useImageDropLogic } from './useImageDropLogic';
import { useStore } from '@/store';
import { IconChevronDown, IconChevronUp, IconLoader2 } from '@/icons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button, SlashCommandInput } from '@/components/ui';
import { NAVIGATION_COMMANDS } from '@backend/config/navigation';
import { useLocationsStore } from '@/store/slices/locations';
import styles from './SpawnInputBar.module.css';
import buttonStyles from './SpawnInputButtons.module.css';

interface SpawnInputBarProps {
  onOpenSavedEntities?: () => void;
}

export function SpawnInputBar({ onOpenSavedEntities }: SpawnInputBarProps) {
  const navigation = useNavigationLogic();
  
  // Image drop/paste handling - append analyzed description to existing input
  const handleDescriptionReceived = useCallback((description: string) => {
    navigation.handlers.setMovementInput((prev: string) => 
      prev ? `${prev}\n\n${description}` : description
    );
  }, [navigation.handlers]);
  
  const imageDrop = useImageDropLogic({ onDescriptionReceived: handleDescriptionReceived });
  
  // Get current node type for contextual commands
  const activeEntityId = useStore(state => state.activeEntity);
  const getNode = useLocationsStore(state => state.getNode);
  const currentNode = activeEntityId ? getNode(activeEntityId) : null;
  const currentNodeType = currentNode?.type as 'host' | 'region' | 'location' | 'niche' | null;
  
  // Get spawn input state from store
  const isMinimized = useStore(state => state.spawnInputMinimized);
  const toggleSpawnInput = useStore(state => state.toggleSpawnInput);
  
  // Get active spawns from store
  const activeSpawns = useStore(state => state.activeSpawns);
  
  // Filter to processing and recently completed spawns
  // Include 'completed' so progress bar can animate to 100% before being removed
  const activeProcesses = activeSpawns.filter(spawn => 
    spawn.status === 'processing' || spawn.status === 'completed'
  );

  return (
    <div 
      data-component="spawn-input-bar"
      onDragEnter={imageDrop.handlers.handleDragEnter}
      onDragLeave={imageDrop.handlers.handleDragLeave}
      onDragOver={imageDrop.handlers.handleDragOver}
      onDrop={imageDrop.handlers.handleDrop}
    >
      {/* Image drop overlay */}
      {imageDrop.state.isDragging && (
        <div className={styles.dropOverlay}>
          <div className={styles.dropOverlayText}>Drop image to analyze</div>
        </div>
      )}
      
      {/* Analyzing overlay */}
      {imageDrop.state.isAnalyzing && (
        <div className={styles.analyzingOverlay}>
          <IconLoader2 size={24} className={styles.spinner} />
          <span>Analyzing image...</span>
        </div>
      )}
      
      {/* Drop error message */}
      {imageDrop.state.error && (
        <div className={styles.dropError}>{imageDrop.state.error}</div>
      )}
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
                onComplete={() => {
                  // Remove spawn after progress bar animation completes
                  useStore.getState().removeSpawn(spawn.id);
                }}
              />
            );
          })}
        </div>
      )}
      
      <div className={`${styles.wrapper} ${isMinimized ? styles.minimized : styles.expanded}`}>
        {/* Minimized Tab */}
        <div 
          className={styles.minimizedTab}
          onClick={toggleSpawnInput}
          title="Click to expand (or press 1)"
        >
          <IconChevronUp size={16} />
          <span className={styles.minimizedText}></span>
        </div>
        
        {/* Expanded Content */}
        <div className={styles.expandedContent}>
          <div className={styles.topRow}>
            <button
              className={buttonStyles.minimizeButton}
              onClick={toggleSpawnInput}
              title="Minimize (or press 1)"
            >
              <IconChevronDown size={18} />
            </button>
          </div>
          
          <div className={styles.commandContent}>
            <p className={styles.navigationDescription}>
              Type / to see available commands
            </p>
            {navigation.state.errorMessage && (
              <div className={styles.errorMessage}>
                {navigation.state.errorMessage}
              </div>
            )}
            <div className={styles.navigationSection}>
              <SlashCommandInput
                className={styles.navigationInput}
                value={navigation.state.movementInput}
                onChange={navigation.handlers.setMovementInput}
                commands={NAVIGATION_COMMANDS}
                currentNodeType={currentNodeType}
                onInvalidCommand={navigation.handlers.handleInvalidCommand}
                onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter' && !navigation.state.isMoving) {
                    e.preventDefault();
                    navigation.handlers.handleMove();
                  }
                }}
                onPaste={imageDrop.handlers.handlePaste}
                placeholder="Type / to see commands... (paste or drop image)"
                disabled={navigation.state.isMoving}
              />
              <Button
                onClick={navigation.handlers.handleMove}
                disabled={navigation.state.isMoving || !navigation.state.movementInput.trim()}
                loading={navigation.state.isMoving}
              >
                Go
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
