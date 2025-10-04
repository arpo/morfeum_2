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
}

export interface ChatHandlers {
  setInputValue: (value: string) => void;
  sendMessage: () => Promise<void>;
  clearError: () => void;
}

export interface ChatLogicReturn {
  state: ChatState;
  handlers: ChatHandlers;
}
