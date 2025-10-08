import { useCallback, useEffect } from 'react';
import type { CharacterInfoLogicReturn } from './types';

interface UseCharacterInfoLogicProps {
  isOpen: boolean;
  onClose: () => void;
}

export function useCharacterInfoLogic({ 
  isOpen, 
  onClose 
}: UseCharacterInfoLogicProps): CharacterInfoLogicReturn {
  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  return {
    state: {
      isOpen
    },
    handlers: {
      close
    }
  };
}
