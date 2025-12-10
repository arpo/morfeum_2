import { IconCheck, IconX } from '@/icons';
import { useInlineConfirm } from './useInlineConfirm';
import type { InlineConfirmProps } from './types';
import styles from './InlineConfirm.module.css';

export function InlineConfirm({
  onConfirm,
  trigger,
  confirmIcon,
  cancelIcon,
  iconSize = 16,
  triggerTitle,
  confirmTitle = 'Confirm',
  cancelTitle = 'Cancel',
  className,
}: InlineConfirmProps) {
  const { isConfirming, handleTriggerClick, handleConfirm, handleCancel } = useInlineConfirm(onConfirm);

  return (
    <div className={`${styles.container} ${className || ''}`} data-component="inline-confirm">
      <button
        className={`${styles.triggerButton} ${isConfirming ? styles.confirming : ''}`}
        onClick={handleTriggerClick}
        title={triggerTitle}
      >
        {trigger}
      </button>
      <div className={`${styles.confirmButtons} ${isConfirming ? styles.visible : ''}`}>
        <button
          className={styles.confirmButton}
          onClick={handleConfirm}
          title={confirmTitle}
        >
          {confirmIcon || <IconCheck size={iconSize} />}
        </button>
        <button
          className={styles.cancelButton}
          onClick={handleCancel}
          title={cancelTitle}
        >
          {cancelIcon || <IconX size={iconSize} />}
        </button>
      </div>
    </div>
  );
}
