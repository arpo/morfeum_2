/**
 * Spawn Input Bar Component
 * Simplified input for triggering entity spawn processes
 */

import { useState, useRef, useEffect } from 'react';
import { useSpawnInputLogic } from './useSpawnInputLogic';
import { IconDice, IconChevronDown, IconChevronUp, IconBookmark } from '@/icons';
import { ProgressBar, type ProgressStep } from '@/components/ui/ProgressBar';
import styles from './SpawnInputBar.module.css';

interface SpawnInputBarProps {
  onOpenSavedEntities?: () => void;
}

// Test interface for progress simulation
interface TestProgress {
  id: string;
  steps: ProgressStep[];
  currentStep: number;
  isComplete: boolean;
}

export function SpawnInputBar({ onOpenSavedEntities }: SpawnInputBarProps) {
  const { state, handlers } = useSpawnInputLogic();
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Test state for progress bar demonstration
  const [testProgresses, setTestProgresses] = useState<TestProgress[]>([]);
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Test function to demonstrate progress bar
  const startTestProgress = () => {
    const progressId = `test-${Date.now()}`;
    
    // Create test steps based on entity type
    const steps: ProgressStep[] = state.entityType === 'character' 
      ? [
          { name: 'Generating seed', duration: 2000 },
          { name: 'Building profile', duration: 3000 },
          { name: 'Creating image', duration: 4000 },
          { name: 'Analyzing visuals', duration: 2000 },
          { name: 'Generating DNA', duration: 1500 },
          { name: 'Finalizing', duration: 500 }
        ]
      : [
          { name: 'Analyzing hierarchy', duration: 1500 },
          { name: 'Building world tree', duration: 3000 },
          { name: 'Generating nodes', duration: 4000 },
          { name: 'Creating visuals', duration: 3500 },
          { name: 'Mapping DNA', duration: 2000 },
          { name: 'Completing', duration: 1000 }
        ];
    
    // Add new progress to state
    setTestProgresses(prev => [...prev, {
      id: progressId,
      steps,
      currentStep: -1, // Start at -1 for initial animation
      isComplete: false
    }]);
    
    // Simulate step progression
    let stepIndex = -1;
    const advanceStep = () => {
      stepIndex++;
      
      if (stepIndex >= steps.length) {
        // Mark as complete
        setTestProgresses(prev => prev.map(p => 
          p.id === progressId ? { ...p, isComplete: true } : p
        ));
        
        // Remove after delay
        const removeTimeout = setTimeout(() => {
          setTestProgresses(prev => prev.filter(p => p.id !== progressId));
          timeouts.current.delete(`${progressId}-remove`);
        }, 2000);
        timeouts.current.set(`${progressId}-remove`, removeTimeout);
      } else {
        // Update current step
        setTestProgresses(prev => prev.map(p => 
          p.id === progressId ? { ...p, currentStep: stepIndex } : p
        ));
        
        // Schedule next step
        const stepTimeout = setTimeout(advanceStep, steps[stepIndex].duration);
        timeouts.current.set(`${progressId}-${stepIndex}`, stepTimeout);
      }
    };
    
    // Start first step after brief delay
    const startTimeout = setTimeout(advanceStep, 100);
    timeouts.current.set(`${progressId}-start`, startTimeout);
  };

  return (
    <div data-component="spawn-input-bar">
      {/* Test Progress Bars Display */}
      {testProgresses.length > 0 && (
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
          {testProgresses.map(progress => (
            <ProgressBar
              key={progress.id}
              steps={progress.steps}
              currentStep={progress.currentStep}
              isComplete={progress.isComplete}
            />
          ))}
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
            
            {/* TEST BUTTON - For testing progress bars */}
            <button
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'var(--color-secondary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: 'var(--text-md)',
                fontWeight: '600',
              }}
              onClick={startTestProgress}
              title="Test Progress Bar"
            >
              Test Progress
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
