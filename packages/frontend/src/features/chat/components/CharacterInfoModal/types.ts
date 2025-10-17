import type { DeepProfile } from '@/store/slices/entityManagerSlice';

export interface CharacterInfoModalProps {
  deepProfile: DeepProfile | null;
  characterName: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface CharacterInfoLogicReturn {
  state: {
    isOpen: boolean;
  };
  handlers: {
    close: () => void;
  };
}
