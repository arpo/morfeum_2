import { Button } from '@/components/ui';
import { IconLayoutSidebar, IconInfoCircle, IconMessageCircle } from '@/icons';
import styles from './TopButtonRow.module.css';

interface TopButtonRowProps {
  onToggleSidebar: () => void;
  onOpenInfo: () => void;
  onOpenChat: () => void;
  isCharacter: boolean;
  infoDisabled: boolean;
  chatDisabled: boolean;
}

export function TopButtonRow({
  onToggleSidebar,
  onOpenInfo,
  onOpenChat,
  isCharacter,
  infoDisabled,
  chatDisabled,
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
    </div>
  );
}
