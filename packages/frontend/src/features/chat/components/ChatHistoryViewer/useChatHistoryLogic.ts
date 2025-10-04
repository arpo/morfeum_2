import { useState, useCallback } from 'react';
import type { ChatHistoryLogicReturn } from './types';

export function useChatHistoryLogic(): ChatHistoryLogicReturn {
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

  const toggleItem = useCallback((id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  return {
    expandedItems,
    toggleItem
  };
}
