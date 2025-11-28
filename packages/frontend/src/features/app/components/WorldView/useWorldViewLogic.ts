import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/store';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';
import { getDepthMapForMedia, clearMediaCache } from '@/services/mediaService';
import { WorldViewRenderer } from './WorldViewRenderer';

interface DisplayImage {
  src: string;
  depthSrc: string | null;
  alt: string;
  mediaId: string | null;
}

export function useWorldViewLogic() {
  const activeEntity = useStore(state => state.activeEntity);
  const entities = useStore(state => state.entities);
  const activeSpawns = useStore(state => state.activeSpawns);
  
  // Get stores for primaryMedia lookup
  const getCharacter = useCharactersStore(state => state.getCharacter);
  const getNode = useLocationsStore(state => state.getNode);
  
  const rendererRef = useRef<WorldViewRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentImageRef = useRef<string | null>(null);
  const currentDepthRef = useRef<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasImage, setHasImage] = useState(false);

  // Get active entity session
  const activeEntitySession = activeEntity ? entities.get(activeEntity) : null;
  
  // Get primaryMedia from character or location store
  const getPrimaryMediaId = useCallback((): string | null => {
    if (!activeEntity) return null;
    
    // Check if it's a character
    const character = getCharacter(activeEntity);
    if (character?.primaryMedia) return character.primaryMedia;
    
    // Check if it's a location node
    const node = getNode(activeEntity);
    if (node?.primaryMedia) return node.primaryMedia;
    
    return null;
  }, [activeEntity, getCharacter, getNode]);

  // Find display image and associated depth map
  const getDisplayImage = useCallback(async (): Promise<DisplayImage | null> => {
    // Check for active spawns with images first
    const spawnWithImage = [...activeSpawns]
      .reverse()
      .find(spawn => spawn.status === 'processing' && spawn.imageUrl);
      
    if (spawnWithImage) {
      return {
        src: spawnWithImage.imageUrl!,
        depthSrc: null, // No depth map during generation
        alt: `Generating ${spawnWithImage.prompt}...`,
        mediaId: null
      };
    }
    
    // Fallback to active entity
    if (activeEntitySession?.entityImage) {
      const primaryMediaId = getPrimaryMediaId();
      let depthSrc: string | null = null;
      
      // Try to find depth map for this media
      if (primaryMediaId) {
        const depthMap = await getDepthMapForMedia(primaryMediaId);
        if (depthMap?.url) {
          depthSrc = depthMap.url;
        }
      }
      
      return {
        src: activeEntitySession.entityImage,
        depthSrc,
        alt: activeEntitySession.entityName || 'Entity',
        mediaId: primaryMediaId
      };
    }
    
    return null;
  }, [activeSpawns, activeEntitySession, getPrimaryMediaId]);

  // Initialize renderer when container is available
  const initRenderer = useCallback((container: HTMLDivElement) => {
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    
    rendererRef.current = new WorldViewRenderer({ container });
    containerRef.current = container;
  }, []);

  // Check for new depth map (called after depth map generation)
  const checkForDepthMap = useCallback(async () => {
    const primaryMediaId = getPrimaryMediaId();
    if (!primaryMediaId || !rendererRef.current) return;
    
    // Clear cache to get fresh data
    clearMediaCache();
    
    const depthMap = await getDepthMapForMedia(primaryMediaId);
    
    if (depthMap?.url && depthMap.url !== currentDepthRef.current) {
      currentDepthRef.current = depthMap.url;
      await rendererRef.current.updateDepthMap(depthMap.url);
    }
  }, [getPrimaryMediaId]);

  // Load image into renderer
  useEffect(() => {
    let cancelled = false;
    
    async function loadImage() {
      const displayImage = await getDisplayImage();
      
      if (cancelled) return;
      
      if (!displayImage) {
        setHasImage(false);
        setIsLoading(false);
        return;
      }
      
      setHasImage(true);
      
      // Only reload if image changed
      if (displayImage.src !== currentImageRef.current) {
        setIsLoading(true);
        currentImageRef.current = displayImage.src;
        currentDepthRef.current = displayImage.depthSrc;
        
        if (rendererRef.current) {
          try {
            await rendererRef.current.load(displayImage.src, displayImage.depthSrc);
          } catch (error) {
            // Image load failed - silently ignore
          }
        }
        
        setIsLoading(false);
      } else if (displayImage.depthSrc !== currentDepthRef.current && displayImage.depthSrc) {
        // Same image but new depth map
        currentDepthRef.current = displayImage.depthSrc;
        
        if (rendererRef.current) {
          await rendererRef.current.updateDepthMap(displayImage.depthSrc);
        }
      }
    }
    
    loadImage();
    
    return () => {
      cancelled = true;
    };
  }, [getDisplayImage]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      rendererRef.current?.resize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for depth map generation events
  useEffect(() => {
    const handleDepthMapGenerated = () => {
      checkForDepthMap();
    };
    
    window.addEventListener('depthMapGenerated', handleDepthMapGenerated);
    return () => window.removeEventListener('depthMapGenerated', handleDepthMapGenerated);
  }, [checkForDepthMap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  return {
    initRenderer,
    checkForDepthMap,
    isLoading,
    hasImage,
    rendererRef
  };
}
