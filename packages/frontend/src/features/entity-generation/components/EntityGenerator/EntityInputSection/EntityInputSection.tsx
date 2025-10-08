import { Button } from '@/components/ui';
import styles from './EntityInputSection.module.css';

interface EntityInputSectionProps {
  textPrompt: string;
  loading: boolean;
  entityType: 'character' | 'location';
  onTextPromptChange: (value: string) => void;
  onEntityTypeChange: (type: 'character' | 'location') => void;
  onShuffle: () => void;
  onGenerate: () => void;
}

export function EntityInputSection({
  textPrompt,
  loading,
  entityType,
  onTextPromptChange,
  onEntityTypeChange,
  onShuffle,
  onGenerate
}: EntityInputSectionProps) {
  // Debug logging
  console.log('[EntityInputSection] Rendering with entityType:', entityType);
  console.log('[EntityInputSection] Props:', { textPrompt, loading, entityType });
  
  return (
    <div className={styles.inputSection}>
      <div className={styles.toggleGroup}>
        <button
          className={`${styles.toggleButton} ${entityType === 'character' ? styles.active : ''}`}
          onClick={() => onEntityTypeChange('character')}
          disabled={loading}
        >
          Character
        </button>
        <button
          className={`${styles.toggleButton} ${entityType === 'location' ? styles.active : ''}`}
          onClick={() => onEntityTypeChange('location')}
          disabled={loading}
        >
          Location
        </button>
      </div>
      
      <label className={styles.label}>
        {entityType === 'character' ? 'Character Description' : 'Location Description'}
      </label>
      <textarea
        className={styles.textarea}
        value={textPrompt}
        onChange={(e) => onTextPromptChange(e.target.value)}
        placeholder={entityType === 'character' 
          ? "e.g., curious explorer, late 20s, blonde..."
          : "e.g., A fog-covered pier where old radios still play..."
        }
        disabled={loading}
      />
      <div className={styles.buttonGroup}>
        <Button
          onClick={onShuffle}
          disabled={loading}
          className={styles.shuffleButton}
        >
          Shuffle
        </Button>
        <Button
          onClick={onGenerate}
          disabled={loading || !textPrompt.trim()}
          loading={loading}
          className={styles.generateButton}
        >
          Generate
        </Button>
      </div>
    </div>
  );
}
