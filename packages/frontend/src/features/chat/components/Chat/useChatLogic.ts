import { useState, useCallback } from 'react';
import type { ChatLogicReturn, ChatMessage } from './types';

const SYSTEM_MESSAGE: ChatMessage = {
  id: 'system-001',
  role: 'system',
  content: 'You are a helpful AI assistant.',
  timestamp: new Date().toISOString()
};

export function useChatLogic(): ChatLogicReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([SYSTEM_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          prompt: inputValue,
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
  }, [inputValue]);

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
