import { Button } from '@/components/ui';
import styles from './EntityInputSection.module.css';

interface EntityInputSectionProps {
  textPrompt: string;
  loading: boolean;
  onTextPromptChange: (value: string) => void;
  onShuffle: () => void;
  onGenerate: () => void;
}

export function EntityInputSection({
  textPrompt,
  loading,
  onTextPromptChange,
  onShuffle,
  onGenerate
}: EntityInputSectionProps) {
  return (
    <div className={styles.inputSection}>
      <label className={styles.label}>
        Character Description
      </label>
      <textarea
        className={styles.textarea}
        value={textPrompt}
        onChange={(e) => onTextPromptChange(e.target.value)}
        placeholder="e.g., curious explorer, late 20s, blonde..."
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
