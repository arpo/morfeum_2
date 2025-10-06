import { Button, LoadingSpinner } from '@/components/ui';
import type { EntityGeneratorLogicReturn } from './types';
import styles from './EntityGenerator.module.css';

interface EntityGeneratorProps {
  entityLogic: EntityGeneratorLogicReturn;
}

export function EntityGenerator({ entityLogic }: EntityGeneratorProps) {
  const { state, handlers } = entityLogic;

  return (
    <div className={styles.container}>
      <div className={styles.inputSection}>
        <label className={styles.label}>
          Character Description
        </label>
        <textarea
          className={styles.textarea}
          value={state.textPrompt}
          onChange={(e) => handlers.setTextPrompt(e.target.value)}
          placeholder="e.g., curious explorer, late 20s, blonde..."
          disabled={state.loading}
        />
        <Button
          onClick={handlers.generateSeed}
          disabled={state.loading || !state.textPrompt.trim()}
          loading={state.loading}
          className={styles.generateButton}
        >
          Generate
        </Button>
      </div>

      {state.error && (
        <div className={styles.errorMessage}>
          {state.error}
        </div>
      )}

      <div className={styles.outputSection}>
        {state.loading && (
          <LoadingSpinner message="Generating character seed..." />
        )}

        {!state.loading && state.generatedSeed && (
          <div className={styles.seedCard}>
            <div className={styles.seedField}>
              <div className={styles.fieldLabel}>Name</div>
              <div className={styles.fieldValue}>{state.generatedSeed.name}</div>
            </div>

            <div className={styles.seedField}>
              <div className={styles.fieldLabel}>Looks</div>
              <div className={styles.fieldValue}>{state.generatedSeed.looks}</div>
            </div>

            <div className={styles.seedField}>
              <div className={styles.fieldLabel}>Wearing</div>
              <div className={styles.fieldValue}>{state.generatedSeed.wearing}</div>
            </div>

            <div className={styles.seedField}>
              <div className={styles.fieldLabel}>Personality</div>
              <div className={styles.fieldValue}>{state.generatedSeed.personality}</div>
            </div>
          </div>
        )}

        {!state.loading && !state.generatedSeed && (
          <div className={styles.emptyState}>
            Character seed will appear here
          </div>
        )}
      </div>
    </div>
  );
}
