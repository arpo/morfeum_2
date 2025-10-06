import { useState, useCallback, useEffect } from 'react';
import type { ChatLogicReturn, ChatMessage } from './types';

export function useChatLogic(): ChatLogicReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch system message from backend on mount
  useEffect(() => {
    const fetchSystemMessage = async () => {
      try {
        const response = await fetch('/api/mzoo/prompts/chat-system');
        if (response.ok) {
          const result = await response.json();
          const systemMessage: ChatMessage = {
            id: 'system-001',
            role: 'system',
            content: result.data.content,
            timestamp: new Date().toISOString()
          };
          setMessages([systemMessage]);
        }
      } catch (err) {
        // Fallback to default if fetch fails
        const systemMessage: ChatMessage = {
          id: 'system-001',
          role: 'system',
          content: 'You are a helpful AI assistant.',
          timestamp: new Date().toISOString()
        };
        setMessages([systemMessage]);
      }
    };
    
    fetchSystemMessage();
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          model: 'gemini-2.5-flash-lite'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.data.text,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = 'Error: Could not generate response from AI.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [inputValue, messages]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    state: {
      messages,
      inputValue,
      loading,
      error
    },
    handlers: {
      setInputValue,
      sendMessage,
      clearError
    }
  };
}
