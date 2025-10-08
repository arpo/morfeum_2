import type { DeepProfile } from '@/store/slices/chatManagerSlice';

export interface CharacterInfoModalProps {
  deepProfile: DeepProfile | null;
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
