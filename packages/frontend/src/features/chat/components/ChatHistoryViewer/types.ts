import type { Message } from '@/features/entity-panel/components/CharacterPanel/types';

// Re-export as ChatMessage for backwards compatibility
export type ChatMessage = Message;

export interface ChatHistoryViewerProps {
  messages: ChatMessage[];
}

export interface HistoryItemState {
  [key: string]: boolean;
}

export interface ChatHistoryLogicReturn {
  expandedItems: HistoryItemState;
  toggleItem: (id: string) => void;
}
