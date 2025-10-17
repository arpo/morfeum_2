import type { EntityPanelBaseState, EntityPanelBaseHandlers } from '../../types';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface CharacterPanelState extends EntityPanelBaseState {
  messages: Message[];
  inputValue: string;
  loading: boolean;
  error: string | null;
}

export interface CharacterPanelHandlers extends EntityPanelBaseHandlers {
  setInputValue: (value: string) => void;
  sendMessage: () => Promise<void>;
  clearError: () => void;
  saveCharacter: () => void;
  openChat: () => void;
}

export interface CharacterPanelLogicReturn {
  state: CharacterPanelState;
  handlers: CharacterPanelHandlers;
}
