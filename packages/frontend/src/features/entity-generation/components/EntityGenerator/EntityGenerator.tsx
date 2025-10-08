import { LoadingSpinner } from '@/components/ui';
import { EntityInputSection } from './EntityInputSection';
import { EntitySeedCard } from './EntitySeedCard';
import { VisualAnalysisCard } from './VisualAnalysisCard';
import { DeepProfileCard } from './DeepProfileCard';
import type { EntityGeneratorLogicReturn } from './types';
import styles from './EntityGenerator.module.css';

interface EntityGeneratorProps {
  entityLogic: EntityGeneratorLogicReturn;
}

export function EntityGenerator({ entityLogic }: EntityGeneratorProps) {
  const { state, handlers } = entityLogic;

  return (
    <div className={styles.container}>
      <EntityInputSection
        textPrompt={state.textPrompt}
        loading={state.loading}
        entityType={state.entityType}
        onTextPromptChange={handlers.setTextPrompt}
        onEntityTypeChange={handlers.setEntityType}
        onShuffle={handlers.shufflePrompt}
        onGenerate={handlers.generateSeed}
      />

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
          <>
            <EntitySeedCard seed={state.generatedSeed} />

            {state.imageLoading && !state.generatedSeed.imageUrl && (
              <div className={styles.imageLoadingContainer}>
                <LoadingSpinner message="Generating image..." />
              </div>
            )}

            {state.generatedSeed.imageUrl && (
              <>
                <div className={styles.imageContainer}>
                  <img 
                    src={state.generatedSeed.imageUrl} 
                    alt={state.generatedSeed.name}
                    className={styles.generatedImage}
                  />
                </div>

                {state.analysisLoading && !state.generatedSeed.visualAnalysis && (
                  <div className={styles.analysisLoadingContainer}>
                    <LoadingSpinner message="Analyzing image..." />
                  </div>
                )}

                {state.generatedSeed.visualAnalysis && (
                  <VisualAnalysisCard analysis={state.generatedSeed.visualAnalysis} />
                )}

                {state.profileLoading && !state.generatedSeed.deepProfile && (
                  <div className={styles.profileLoadingContainer}>
                    <LoadingSpinner message="Generating deep profile..." />
                  </div>
                )}

                {state.generatedSeed.deepProfile && (
                  <DeepProfileCard profile={state.generatedSeed.deepProfile} />
                )}
              </>
            )}
          </>
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
