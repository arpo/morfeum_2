import { CollapsiblePanel } from '@/components/ui';
import styles from './ImagePromptPanel.module.css';

export interface ImagePromptPanelProps {
  imagePrompt: string;
}

export function ImagePromptPanel({ imagePrompt }: ImagePromptPanelProps) {
  return (
    <CollapsiblePanel 
      title="Image Prompt" 
      defaultExpanded={false}
    >
      <div className={styles.promptText}>
        {imagePrompt}
      </div>
    </CollapsiblePanel>
  );
}
