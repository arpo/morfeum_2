import { useEffect } from 'react';
import type { LocationInfoModalProps, LocationInfoLogicReturn } from './types';

export function useLocationInfoLogic(props: LocationInfoModalProps): LocationInfoLogicReturn {
  const { isOpen, onClose } = props;

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleClose = () => {
    onClose();
  };

  return {
    handleClose
  };
}
