import { Button } from '@/components/ui';
import { IconLayoutSidebar } from '@/icons';
import styles from './EntityExplorerToggle.module.css';

interface EntityExplorerToggleProps {
  onClick: () => void;
}

export function EntityExplorerToggle({ onClick }: EntityExplorerToggleProps) {
  return (
    <Button
      onClick={onClick}
      className={styles.toggleButton}
      data-component="entity-explorer-toggle"
      aria-label="Toggle Entity Explorer"
    >
      <IconLayoutSidebar size={20} />
    </Button>
  );
}
