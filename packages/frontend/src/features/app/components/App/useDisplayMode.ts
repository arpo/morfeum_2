/**
 * Display Mode Hook
 * Handles display mode state, depth map checking, and generation
 */

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';
import { useDepthMapLogic } from '@/features/app/components/TopButtonRow/useDepthMapLogic';
import { getDepthMapForMedia, clearMediaCache } from '@/services/mediaService';
import type { DisplayMode } from '@/features/app/components/TopButtonRow/TopButtonRow';

// BroadcastChannel for syncing external display windows
const externalViewChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('morfeum-external-view') 
  : null;

export function useDisplayMode() {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    return (localStorage.getItem('displayMode') as DisplayMode) || 'full';
  });
  const [hasDepthMap, setHasDepthMap] = useState(false);
  
  const activeEntity = useStore(state => state.activeEntity);
  const entities = useStore(state => state.entities);
  const activeEntitySession = activeEntity ? entities.get(activeEntity) : null;
  const isCharacter = activeEntitySession?.entityType === 'character';
  
  const { generateDepthMap, isGenerating: depthMapGenerating } = useDepthMapLogic();

  // Get primary media ID for current entity
  const getPrimaryMediaId = useCallback(() => {
    if (!activeEntity) return null;
    
    if (isCharacter) {
      const character = useCharactersStore.getState().getCharacter(activeEntity);
      return character?.primaryMedia || null;
    } else {
      const node = useLocationsStore.getState().getNode(activeEntity);
      return node?.primaryMedia || null;
    }
  }, [activeEntity, isCharacter]);

  const handleGenerateDepthMap = useCallback(async () => {
    if (!activeEntity) return;
    
    const primaryMediaId = getPrimaryMediaId();
    if (!primaryMediaId) {
      console.warn('No primary media found for entity:', activeEntity);
      return;
    }
    
    await generateDepthMap(activeEntity, primaryMediaId);
    
    window.dispatchEvent(new CustomEvent('depthMapGenerated'));
    setHasDepthMap(true);
    setDisplayMode('full');
    localStorage.setItem('displayMode', 'full');
    window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: 'full' } }));
  }, [activeEntity, getPrimaryMediaId, generateDepthMap]);

  const handleDisplayModeChange = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode);
    localStorage.setItem('displayMode', mode);
    window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode } }));
    externalViewChannel?.postMessage({ type: 'displayModeChanged', mode });
  }, []);

  // Check for existing depth map when active entity changes
  useEffect(() => {
    const checkDepthMap = async () => {
      const primaryMediaId = getPrimaryMediaId();
      if (!primaryMediaId) {
        setHasDepthMap(false);
        if (displayMode !== '2d') {
          setDisplayMode('2d');
          localStorage.setItem('displayMode', '2d');
          window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: '2d' } }));
        }
        return;
      }
      
      clearMediaCache();
      
      const depthMap = await getDepthMapForMedia(primaryMediaId);
      const hasDepth = !!depthMap;
      setHasDepthMap(hasDepth);
      
      if (!hasDepth && displayMode !== '2d') {
        setDisplayMode('2d');
        localStorage.setItem('displayMode', '2d');
        window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: '2d' } }));
      }
      
      if (hasDepth && displayMode === '2d') {
        setDisplayMode('full');
        localStorage.setItem('displayMode', 'full');
        window.dispatchEvent(new CustomEvent('displayModeChanged', { detail: { mode: 'full' } }));
      }
    };
    
    checkDepthMap();
  }, [activeEntity, getPrimaryMediaId, displayMode]);

  const depthMapDisabled = !activeEntity || !getPrimaryMediaId();

  return {
    displayMode,
    hasDepthMap,
    depthMapGenerating,
    depthMapDisabled,
    handleGenerateDepthMap,
    handleDisplayModeChange,
  };
}
