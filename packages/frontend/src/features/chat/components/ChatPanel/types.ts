import type { ChatMessage } from '@/store/slices/entityManagerSlice';

export interface ChatPanelProps {
  entityId: string;
  entityName: string;
  onClose: () => void;
}

export interface ChatPanelLogicReturn {
  messages: ChatMessage[];
  inputValue: string;
  loading: boolean;
  error: string | null;
  setInputValue: (value: string) => void;
  sendMessage: () => void;
  clearError: () => void;
}
