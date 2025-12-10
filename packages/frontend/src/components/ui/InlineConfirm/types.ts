import type { ReactNode } from 'react';

export interface InlineConfirmProps {
  /** Callback when user confirms the action */
  onConfirm: () => void;
  /** The trigger element (e.g., trash icon button) */
  trigger: ReactNode;
  /** Custom confirm icon (defaults to IconCheck) */
  confirmIcon?: ReactNode;
  /** Custom cancel icon (defaults to IconX) */
  cancelIcon?: ReactNode;
  /** Size of default icons */
  iconSize?: number;
  /** Title for the trigger button */
  triggerTitle?: string;
  /** Title for the confirm button */
  confirmTitle?: string;
  /** Title for the cancel button */
  cancelTitle?: string;
  /** Additional class name for the container */
  className?: string;
}

export interface UseInlineConfirmReturn {
  isConfirming: boolean;
  handleTriggerClick: (e: React.MouseEvent) => void;
  handleConfirm: (e: React.MouseEvent) => void;
  handleCancel: (e: React.MouseEvent) => void;
}
