import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store';
import type { ChatPanelProps, ChatPanelLogicReturn } from './types';

export function useChatPanel({ entityId }: Pick<ChatPanelProps, 'entityId'>): ChatPanelLogicReturn {
  const [inputValue, setInputValue] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);

  const entity = useStore(state => state.entities.get(entityId));
  const sendMessageToStore = useStore(state => state.sendMessage);
  const setError = useStore(state => state.setError);

  const messages = entity?.messages || [];
  const loading = entity?.loading || false;
  const error = entity?.error || null;

  // Filter out system messages for display
  const visibleMessages = messages.filter(msg => msg.role !== 'system');

  // Auto-scroll to bottom only when new messages are added
  useEffect(() => {
    const currentCount = visibleMessages.length;
    const prevCount = prevMessageCountRef.current;
    
    if (currentCount > prevCount && prevCount > 0 && messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
    
    prevMessageCountRef.current = currentCount;
  }, [visibleMessages.length]);

  const sendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const messageContent = inputValue;
    setInputValue('');
    
    await sendMessageToStore(entityId, messageContent);
  };

  const clearError = () => {
    setError(entityId, null);
  };

  return {
    messages: visibleMessages,
    inputValue,
    loading,
    error,
    setInputValue,
    sendMessage,
    clearError,
  };
}
