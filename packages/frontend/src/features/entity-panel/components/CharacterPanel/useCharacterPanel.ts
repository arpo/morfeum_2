import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useEntityPanelBase } from '../../hooks/useEntityPanelBase';
import { CharacterPanelLogicReturn } from './types';


/**
 * Character-specific panel logic - extends base entity panel with chat functionality
 */
export function useCharacterPanel(): CharacterPanelLogicReturn {
  const base = useEntityPanelBase();
  const [inputValue, setInputValue] = useState('');
  
  const sendMessageToStore = useStore(state => state.sendMessage);
  const setError = useStore(state => state.setError);
  const openEntityPanel = useStore(state => state.openEntityPanel);
  
  const createCharacter = useCharactersStore(state => state.createCharacter);
  const getCharacter = useCharactersStore(state => state.getCharacter);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || !base.activeChat) return;

    await sendMessageToStore(base.activeChat, inputValue);
    setInputValue('');
  }, [inputValue, base.activeChat, sendMessageToStore]);

  const clearError = useCallback(() => {
    if (base.activeChat) {
      setError(base.activeChat, null);
    }
  }, [base.activeChat, setError]);

  const saveCharacter = useCallback(async () => {
    if (!base.activeChatSession || !base.activeChat) {
      console.warn('[useCharacterPanel] Cannot save: no active chat session');
      return;
    }
    
    const deepProfile = base.activeChatSession.deepProfile;
    if (!deepProfile) {
      console.warn('[useCharacterPanel] Cannot save: no deep profile data');
      return;
    }
    
    // Create character in storage
    createCharacter({
      id: base.activeChat,
      name: base.activeChatSession.entityName || 'Unnamed Character',
      details: deepProfile as Record<string, any>,
      imagePath: base.activeChatSession.entityImage || ''
    });
    
    // Save to backend file
    const saveToBackend = useCharactersStore.getState().saveToBackend;
    const success = await saveToBackend();
    
    if (success) {
      console.log('[useCharacterPanel] Saved to backend successfully');
      base.setIsSaved(true);
    } else {
      console.error('[useCharacterPanel] Failed to save to backend');
    }
  }, [base, createCharacter]);

  const openChat = useCallback(() => {
    if (base.activeChat) {
      openEntityPanel(base.activeChat);
    }
  }, [base.activeChat, openEntityPanel]);

  // Check if character is already saved when active chat changes
  useEffect(() => {
    if (base.activeChat && base.activeChatSession) {
      const existingCharacter = getCharacter(base.activeChat);
      base.setIsSaved(!!existingCharacter);
    } else {
      base.setIsSaved(false);
    }
  }, [base.activeChat, base.activeChatSession, getCharacter, base.setIsSaved]);

  return {
    state: {
      // Base state
      ...base,
      // Character-specific state
      messages: base.activeChatSession?.messages || [],
      inputValue,
      loading: base.activeChatSession?.loading || false,
      error: base.activeChatSession?.error || null
    },
    handlers: {
      // Base handlers
      openModal: base.openModal,
      closeModal: base.closeModal,
      openFullscreen: base.openFullscreen,
      closeFullscreen: base.closeFullscreen,
      // Character-specific handlers
      setInputValue,
      sendMessage,
      clearError,
      saveCharacter,
      openChat
    }
  };
}
