/**
 * Navigation Assistant Logic Hook
 * Handles chat with the navigation expert LLM
 */

import { useState, useCallback, useRef } from 'react';
import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { useMediaCacheStore } from '@/store/slices/mediaCacheSlice';
import type { NavigationMessage, NavigationAssistantLogicReturn } from './types';

/**
 * Generate unique ID for messages
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

interface UseNavigationAssistantProps {
  onCommandSuggested?: (command: string) => void;
}

export function useNavigationAssistant({ onCommandSuggested }: UseNavigationAssistantProps = {}): NavigationAssistantLogicReturn {
  const [messages, setMessages] = useState<NavigationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of conversation history for context
  const conversationRef = useRef<{ role: string; content: string }[]>([]);
  
  // Get current node context
  const activeEntityId = useStore(state => state.activeEntity);
  const getNode = useLocationsStore(state => state.getNode);
  const getMediaData = useMediaCacheStore(state => state.getMediaData);
  const currentNode = activeEntityId ? getNode(activeEntityId) : null;

  /**
   * Extract command from assistant response
   */
  const extractCommand = useCallback((content: string): string | null => {
    // Look for command in code block
    const codeBlockMatch = content.match(/```\s*(\/[A-Z_]+2?\s+[^\n`]+)/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // Look for inline command
    const inlineMatch = content.match(/`(\/[A-Z_]+2?\s+[^`]+)`/);
    if (inlineMatch) {
      return inlineMatch[1].trim();
    }
    
    return null;
  }, []);

  /**
   * Send message to the navigation assistant
   */
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: NavigationMessage = {
      id: generateMessageId(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    // Add user message to UI
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setError(null);

    // Add to conversation history
    conversationRef.current.push({
      role: 'user',
      content: userMessage.content,
    });

    try {
      // Build context about current node
      const context: Record<string, string> = {};
      if (activeEntityId) {
        context.nodeId = activeEntityId;
      }
      if (currentNode) {
        context.currentNodeName = currentNode.name;
        context.currentNodeType = currentNode.type;
        // Extract description from DNA if available
        const dna = currentNode.dna as any;
        const searchDesc = dna?.profile?.searchDesc;
        if (searchDesc) {
          context.currentNodeDescription = searchDesc;
        }
        
        // Get image prompt from media metadata
        if (currentNode.primaryMedia) {
          const mediaData = getMediaData(currentNode.primaryMedia);
          const imagePrompt = mediaData?.metadata?.prompt || mediaData?.metadata?.imagePrompt;
          if (imagePrompt) {
            context.imagePrompt = imagePrompt;
          }
        }
      }

      const response = await fetch(`/api/v2/navigation-assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationRef.current,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantContent = data.data?.message || data.message || 'I apologize, I could not generate a response.';

      const assistantMessage: NavigationMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      // Add assistant message to UI
      setMessages(prev => [...prev, assistantMessage]);

      // Add to conversation history
      conversationRef.current.push({
        role: 'assistant',
        content: assistantContent,
      });

      // Extract and suggest command if callback provided
      if (onCommandSuggested) {
        const command = extractCommand(assistantContent);
        if (command) {
          onCommandSuggested(command);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, currentNode, activeEntityId, getMediaData, onCommandSuggested, extractCommand]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear chat history
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    conversationRef.current = [];
  }, []);

  return {
    messages,
    inputValue,
    loading,
    error,
    setInputValue,
    sendMessage,
    clearError,
    clearHistory,
  };
}
