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
          Character Description 2
        </label>
        <textarea
          className={styles.textarea}
          value={state.textPrompt}
          onChange={(e) => handlers.setTextPrompt(e.target.value)}
          placeholder="e.g., curious explorer, late 20s, blonde..."
          disabled={state.loading}
        />
        <div className={styles.buttonGroup}>
          <Button
            onClick={handlers.shufflePrompt}
            disabled={state.loading}
            className={styles.shuffleButton}
          >
            Shuffle
          </Button>
          <Button
            onClick={handlers.generateSeed}
            disabled={state.loading || !state.textPrompt.trim()}
            loading={state.loading}
            className={styles.generateButton}
          >
            Generate
          </Button>
        </div>
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
          <>
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

              {state.generatedSeed.presence && (
                <div className={styles.seedField}>
                  <div className={styles.fieldLabel}>Presence</div>
                  <div className={styles.fieldValue}>{state.generatedSeed.presence}</div>
                </div>
              )}

              {state.generatedSeed.setting && (
                <div className={styles.seedField}>
                  <div className={styles.fieldLabel}>Setting</div>
                  <div className={styles.fieldValue}>{state.generatedSeed.setting}</div>
                </div>
              )}
            </div>

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
                  <div className={styles.analysisCard}>
                    <div className={styles.analysisTitle}>Visual Analysis</div>
                    
                    <div className={styles.analysisField}>
                      <div className={styles.fieldLabel}>Face</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.visualAnalysis.face}</div>
                    </div>

                    <div className={styles.analysisField}>
                      <div className={styles.fieldLabel}>Hair</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.visualAnalysis.hair}</div>
                    </div>

                    <div className={styles.analysisField}>
                      <div className={styles.fieldLabel}>Body</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.visualAnalysis.body}</div>
                    </div>

                    <div className={styles.analysisField}>
                      <div className={styles.fieldLabel}>Specific Details</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.visualAnalysis.specificdetails}</div>
                    </div>
                  </div>
                )}

                {state.profileLoading && !state.generatedSeed.deepProfile && (
                  <div className={styles.profileLoadingContainer}>
                    <LoadingSpinner message="Generating deep profile..." />
                  </div>
                )}

                {state.generatedSeed.deepProfile && (
                  <div className={styles.profileCard}>
                    <div className={styles.profileTitle}>Deep Profile</div>
                    
                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Looks</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.looks}</div>
                    </div>

                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Wearing</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.wearing}</div>
                    </div>

                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Face</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.face}</div>
                    </div>

                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Hair</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.hair}</div>
                    </div>

                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Body</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.body}</div>
                    </div>

                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Specific Details</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.specificDetails}</div>
                    </div>

                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Style</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.style}</div>
                    </div>

                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Personality</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.personality}</div>
                    </div>

                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Voice</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.voice}</div>
                    </div>

                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Speech Style</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.speechStyle}</div>
                    </div>

                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Gender</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.gender}</div>
                    </div>

                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Nationality</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.nationality}</div>
                    </div>

                    <div className={styles.profileField}>
                      <div className={styles.fieldLabel}>Tags</div>
                      <div className={styles.fieldValue}>{state.generatedSeed.deepProfile.tags}</div>
                    </div>
                  </div>
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
