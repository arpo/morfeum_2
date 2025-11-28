import { Button } from '@/components/ui';
import { IconLayoutSidebar, IconInfoCircle, IconMessageCircle, IconStack2, IconLoader2 } from '@/icons';
import styles from './TopButtonRow.module.css';

interface TopButtonRowProps {
  onToggleSidebar: () => void;
  onOpenInfo: () => void;
  onOpenChat: () => void;
  onGenerateDepthMap: () => void;
  isCharacter: boolean;
  infoDisabled: boolean;
  chatDisabled: boolean;
  depthMapDisabled: boolean;
  depthMapGenerating: boolean;
}

export function TopButtonRow({
  onToggleSidebar,
  onOpenInfo,
  onOpenChat,
  onGenerateDepthMap,
  isCharacter,
  infoDisabled,
  chatDisabled,
  depthMapDisabled,
  depthMapGenerating,
}: TopButtonRowProps) {
  return (
    <div className={styles.buttonRow} data-component="top-button-row">
      <Button
        onClick={onToggleSidebar}
        className={styles.button}
        aria-label="Toggle Entity Explorer"
      >
        <IconLayoutSidebar size={20} />
      </Button>
      
      <Button
        onClick={onOpenInfo}
        className={styles.button}
        disabled={infoDisabled}
        aria-label="View info"
      >
        <IconInfoCircle size={20} />
      </Button>
      
      {isCharacter && (
        <Button
          onClick={onOpenChat}
          className={styles.button}
          disabled={chatDisabled}
          aria-label="Open chat"
        >
          <IconMessageCircle size={20} />
        </Button>
      )}

      <Button
        onClick={onGenerateDepthMap}
        className={styles.button}
        disabled={depthMapDisabled || depthMapGenerating}
        aria-label="Generate depth map"
      >
        {depthMapGenerating ? (
          <IconLoader2 size={20} className={styles.spinner} />
        ) : (
          <IconStack2 size={20} />
        )}
      </Button>
    </div>
  );
}
