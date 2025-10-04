import type { ChatMessage } from '../Chat/types';

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
