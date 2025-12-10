import { useState, useCallback } from 'react';
import type { UseInlineConfirmReturn } from './types';

export function useInlineConfirm(onConfirm: () => void): UseInlineConfirmReturn {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleTriggerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(true);
  }, []);

  const handleConfirm = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onConfirm();
    setIsConfirming(false);
  }, [onConfirm]);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(false);
  }, []);

  return {
    isConfirming,
    handleTriggerClick,
    handleConfirm,
    handleCancel,
  };
}
