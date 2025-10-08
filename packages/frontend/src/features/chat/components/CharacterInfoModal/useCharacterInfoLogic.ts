import { useCallback } from 'react';
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

  return {
    state: {
      isOpen
    },
    handlers: {
      close
    }
  };
}
