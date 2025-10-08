import type { DeepProfile } from '@/store/slices/chatManagerSlice';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatState {
  messages: ChatMessage[];
  inputValue: string;
  loading: boolean;
  error: string | null;
  entityImage: string | null;
  entityName: string | null;
  entityPersonality: string | null;
  deepProfile: DeepProfile | undefined;
  isModalOpen: boolean;
  isFullscreenOpen: boolean;
}

export interface ChatHandlers {
  setInputValue: (value: string) => void;
  sendMessage: () => Promise<void>;
  clearError: () => void;
  initializeWithEntity: (entityData: { name: string; looks: string; wearing: string; personality: string; imageUrl?: string }) => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  openFullscreen: () => void;
  closeFullscreen: () => void;
}

export interface ChatLogicReturn {
  state: ChatState;
  handlers: ChatHandlers;
}
