import { useCallback } from 'react';
import { useEntityPanelBase } from '../../hooks/useEntityPanelBase';
import { useLocationsStore } from '@/store/slices/locations';
import type { LocationPanelLogicReturn } from './types';

/**
 * Location-specific panel logic - extends base entity panel with travel functionality
 */
export function useLocationPanel(): LocationPanelLogicReturn {
  const base = useEntityPanelBase();

  const saveLocation = useCallback(async () => {
    if (!base.activeChatSession || !base.activeChat) {
      console.warn('[useLocationPanel] Cannot save: no active chat session');
      return;
    }
    
    const deepProfile = base.activeChatSession.deepProfile;
    if (!deepProfile) {
      console.warn('[useLocationPanel] Cannot save: no deep profile data');
      return;
    }
    
    const saveToBackend = useLocationsStore.getState().saveToBackend;
    const success = await saveToBackend();
    
    if (success) {
      base.setIsSaved(true);
    } else {
      console.error('[useLocationPanel] Failed to save to backend');
    }
  }, [base]);

  return {
    state: {
      ...base
    },
    handlers: {
      openModal: base.openModal,
      closeModal: base.closeModal,
      openFullscreen: base.openFullscreen,
      closeFullscreen: base.closeFullscreen,
      saveLocation
    }
  };
}
