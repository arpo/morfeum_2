/**
 * Spawn Input Bar Component
 * Simplified input for triggering entity spawn processes
 */

import { useState, KeyboardEvent, useCallback } from 'react';
import { useSpawnInputLogic } from './useSpawnInputLogic';
import { useNavigationLogic } from './useNavigationLogic';
import { useImageDropLogic } from './useImageDropLogic';
import { useStore } from '@/store';
import { IconDice, IconChevronDown, IconChevronUp, IconBookmark } from '@/icons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tabs, Button, SlashCommandInput } from '@/components/ui';
import { NAVIGATION_COMMANDS } from '@backend/config/navigation';
import { useLocationsStore } from '@/store/slices/locations';
import styles from './SpawnInputBar.module.css';

interface SpawnInputBarProps {
  onOpenSavedEntities?: () => void;
}

export function SpawnInputBar({ onOpenSavedEntities }: SpawnInputBarProps) {
  const { state, handlers } = useSpawnInputLogic();
  const navigation = useNavigationLogic();
  const [activeTab, setActiveTab] = useState('character');
  
  // Get current node type for contextual commands
  const activeEntityId = useStore(state => state.activeEntity);
  const getNode = useLocationsStore(state => state.getNode);
  const currentNode = activeEntityId ? getNode(activeEntityId) : null;
  const currentNodeType = currentNode?.type as 'host' | 'region' | 'location' | 'niche' | null;
  
  // Handle image paste - use store's append function
  const appendSpawnInputText = useStore(state => state.appendSpawnInputText);
  const handleDescriptionReceived = useCallback((description: string) => {
    appendSpawnInputText(description);
  }, [appendSpawnInputText]);
  
  const imageDrop = useImageDropLogic({ onDescriptionReceived: handleDescriptionReceived });
  
  // Get spawn input state from store
  const isMinimized = useStore(state => state.spawnInputMinimized);
  const toggleSpawnInput = useStore(state => state.toggleSpawnInput);
  
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
              className={styles.minimizeButton}
              onClick={toggleSpawnInput}
              title="Minimize (or press 1)"
            >
              <IconChevronDown size={18} />
            </button>
          </div>
          
          <Tabs
            activeTabId={activeTab}
            onChange={(tabId) => {
              setActiveTab(tabId);
              if (tabId === 'character') {
                handlers.setEntityType('character');
              } else if (tabId === 'location') {
                handlers.setEntityType('location');
              }
            }}
            items={[
              {
                id: 'character',
                label: 'Character',
                content: (
                  <div className={styles.tabContent}>
                    <div className={styles.dropZone}>
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
                        onPaste={imageDrop.handlers.handlePaste}
                        placeholder="Describe a character to spawn... (paste an image)"
                        rows={3}
                      />
                      {imageDrop.state.isAnalyzing && (
                        <div className={styles.analyzingOverlay}>
                          <span className={styles.analyzingText}>
                            <span className={styles.spinner} />
                            Analyzing image...
                          </span>
                        </div>
                      )}
                    </div>
                    {imageDrop.state.error && (
                      <div className={styles.errorMessage}>{imageDrop.state.error}</div>
                    )}
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
                )
              },
              {
                id: 'location',
                label: 'Location',
                content: (
                  <div className={styles.tabContent}>
                    <div className={styles.dropZone}>
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
                        onPaste={imageDrop.handlers.handlePaste}
                        placeholder="Describe a location to spawn... (paste an image)"
                        rows={3}
                      />
                      {imageDrop.state.isAnalyzing && (
                        <div className={styles.analyzingOverlay}>
                          <span className={styles.analyzingText}>
                            <span className={styles.spinner} />
                            Analyzing image...
                          </span>
                        </div>
                      )}
                    </div>
                    {imageDrop.state.error && (
                      <div className={styles.errorMessage}>{imageDrop.state.error}</div>
                    )}
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
                )
              },
              {
                id: 'navigate',
                label: 'Navigate',
                content: (
                  <div className={styles.tabContent}>
                    {!navigation.state.activeEntity ? (
                      <p className={styles.noLocationMessage}>
                        Select or generate a location to navigate
                      </p>
                    ) : (
                      <>
                        <p className={styles.navigationDescription}>
                          Type / to see navigation commands.
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
                            placeholder="Type / to see commands..."
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
                      </>
                    )}
                  </div>
                )
              }
            ]}
          />
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
