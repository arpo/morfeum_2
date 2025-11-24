/**
 * Spawn Input Bar Component
 * Simplified input for triggering entity spawn processes
 */

import { useState, useEffect, useRef } from 'react';
import { useSpawnInputLogic } from './useSpawnInputLogic';
import { IconDice, IconChevronDown, IconChevronUp, IconBookmark } from '@/icons';
import { ProgressBar, type ProgressStep } from '@/components/ui/ProgressBar';
import styles from './SpawnInputBar.module.css';

interface SpawnInputBarProps {
  onOpenSavedEntities?: () => void;
}

// Test progress state interface
interface TestProgress {
  id: string;
  label: string;
  steps: ProgressStep[];
  currentStep: number;
  currentStepProgress: number;
  isComplete: boolean;
}

export function SpawnInputBar({ onOpenSavedEntities }: SpawnInputBarProps) {
  const { state, handlers } = useSpawnInputLogic();
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Test harness state
  const [testProgressBars, setTestProgressBars] = useState<TestProgress[]>([]);
  const progressIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && state.textPrompt.trim()) {
      handlers.handleGenerate();
    }
  };

  // Test function to create sample progress bars
  const startTestProgress = () => {
    const progressId = `test-${Date.now()}`;
    
    // Define test steps with different durations
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
    
    const newProgress: TestProgress = {
      id: progressId,
      label: '', // No longer displaying labels for minimal design
      steps,
      currentStep: -1, // Start with -1 so first step animates from 0%
      currentStepProgress: 0,
      isComplete: false
    };
    
    setTestProgressBars(prev => [...prev, newProgress]);
    
    // Simulate step progression - trigger on START
    let currentStepIndex = -1;
    
    // Function to advance to next step
    const advanceStep = () => {
      currentStepIndex++;
      
      if (currentStepIndex >= steps.length) {
        // All steps done - mark as complete
        setTestProgressBars(prev => prev.map(bar => 
          bar.id === progressId 
            ? { ...bar, isComplete: true }
            : bar
        ));
        
        // Remove after 2 seconds
        setTimeout(() => {
          setTestProgressBars(p => p.filter(b => b.id !== progressId));
        }, 2000);
      } else {
        // Move to next step - this triggers the animation
        setTestProgressBars(prev => prev.map(bar => 
          bar.id === progressId 
            ? { ...bar, currentStep: currentStepIndex }
            : bar
        ));
        
        // Schedule next step after current step's duration
        const timeout = setTimeout(advanceStep, steps[currentStepIndex].duration);
        progressIntervals.current.set(`${progressId}-${currentStepIndex}`, timeout);
      }
    };
    
    // Start the first step after a brief delay to show initial state
    const initTimeout = setTimeout(() => {
      advanceStep(); // This will set currentStep to 0 and trigger first animation
    }, 100);
    progressIntervals.current.set(`${progressId}-init`, initTimeout);
  };
  
  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      progressIntervals.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  return (
    <div data-component="spawn-input-bar">
      {/* Test Progress Bars - Display above the input */}
      {testProgressBars.length > 0 && (
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
          {testProgressBars.map(progress => (
            <ProgressBar
              key={progress.id}
              steps={progress.steps}
              currentStep={progress.currentStep}
              currentStepProgress={progress.currentStepProgress}
              isComplete={progress.isComplete}
              onComplete={() => {
                // Progress bar will auto-remove after 2 seconds
              }}
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
            
            {/* TEST BUTTON - Temporary for testing progress bars */}
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
                className={styles.shuffleButton} // Reusing shuffle button style for now
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
