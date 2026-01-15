/**
 * Navigation Assistant Panel Types
 */

export interface NavigationAssistantPanelProps {
  onClose: () => void;
  onCommandSuggested?: (command: string) => void;
}

export interface NavigationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface NavigationAssistantLogicReturn {
  messages: NavigationMessage[];
  inputValue: string;
  loading: boolean;
  error: string | null;
  setInputValue: (value: string) => void;
  sendMessage: () => Promise<void>;
  clearError: () => void;
  clearHistory: () => void;
}
