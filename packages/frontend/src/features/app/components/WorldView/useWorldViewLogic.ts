import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useStore } from '@/store';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';
import { getDepthMapForMedia, clearMediaCache, getEntityMedia, clearEntityMediaCache } from '@/services/mediaService';
import { WorldViewRenderer } from './WorldViewRenderer';

interface DisplayImage {
  src: string;
  depthSrc: string | null;
  alt: string;
  mediaId: string | null;
}

interface MediaView {
  id: string;
  url: string;
  createdAt: string;
  type: string;
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
  
  // Multi-view state
  const [views, setViews] = useState<MediaView[]>([]);
  const [currentViewIndex, setCurrentViewIndex] = useState(-1);

  // Get active entity session
  const activeEntitySession = activeEntity ? entities.get(activeEntity) : null;
  const canShowViews = !!activeEntitySession;
  
  // Get image model class for CSS styling (e.g., 'model-b' for saturation adjustments)
  const imageModelClass = activeEntitySession?.imageModelClass || null;

  // Fetch views for all entity types
  const fetchViews = useCallback(async () => {
    if (!activeEntity || !canShowViews) {
      setViews([]);
      setCurrentViewIndex(-1);
      return;
    }

    try {
      // Store previous count to detect new views
      const previousViewCount = views.length;
      
      clearEntityMediaCache(activeEntity);
      const allMedia = await getEntityMedia(activeEntity);
      const imageViews = allMedia.filter(m => m.type === 'image') as MediaView[];
      
      // Sort by createdAt (oldest first)
      const sortedViews = [...imageViews].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      setViews(sortedViews);
      
      // If new views were added, crossfade to the newest one
      if (sortedViews.length > previousViewCount && sortedViews.length > 0) {
        const newIndex = sortedViews.length - 1;
        const newestView = sortedViews[newIndex];
        
        setCurrentViewIndex(newIndex);
        
        // Crossfade to new view
        if (rendererRef.current && newestView) {
          const depthMap = await getDepthMapForMedia(newestView.id);
          await rendererRef.current.crossfadeTo(newestView.url, depthMap?.url || null, 1.5);
        }
      } else if (sortedViews.length > 0 && currentViewIndex < 0) {
        // Initial load - default to newest view without crossfade
        setCurrentViewIndex(sortedViews.length - 1);
      }
    } catch (error) {
      setViews([]);
      setCurrentViewIndex(-1);
    }
  }, [activeEntity, canShowViews, views.length, currentViewIndex]);

  // Fetch views when active entity changes
  useEffect(() => {
    fetchViews();
  }, [fetchViews]);

  // Navigate to previous view (older) - wraps to last view if at first
  const goToPreviousView = useCallback(async () => {
    if (views.length === 0) return;
    
    // Wrap around: if at first view (0), go to last view
    const newIndex = currentViewIndex <= 0 ? views.length - 1 : currentViewIndex - 1;
    const view = views[newIndex];
    
    setCurrentViewIndex(newIndex);
    
    // Dispatch event for view index change
    window.dispatchEvent(new CustomEvent('viewIndexChanged', {
      detail: { entityId: activeEntity, currentIndex: newIndex, totalViews: views.length }
    }));
    
    // Crossfade to new view
    if (rendererRef.current && view) {
      const depthMap = await getDepthMapForMedia(view.id);
      await rendererRef.current.crossfadeTo(view.url, depthMap?.url || null, 1.5);
    }
  }, [currentViewIndex, views, activeEntity]);

  // Navigate to next view (newer) - wraps to first view if at last
  const goToNextView = useCallback(async () => {
    if (views.length === 0) return;
    
    // Wrap around: if at last view, go to first view (0)
    const newIndex = currentViewIndex >= views.length - 1 ? 0 : currentViewIndex + 1;
    const view = views[newIndex];
    
    setCurrentViewIndex(newIndex);
    
    // Dispatch event for view index change
    window.dispatchEvent(new CustomEvent('viewIndexChanged', {
      detail: { entityId: activeEntity, currentIndex: newIndex, totalViews: views.length }
    }));
    
    // Crossfade to new view
    if (rendererRef.current && view) {
      const depthMap = await getDepthMapForMedia(view.id);
      await rendererRef.current.crossfadeTo(view.url, depthMap?.url || null, 1.5);
    }
  }, [currentViewIndex, views, activeEntity]);

  // Navigate to specific view
  const goToView = useCallback(async (index: number) => {
    if (index < 0 || index >= views.length) return;
    
    const view = views[index];
    setCurrentViewIndex(index);
    
    // Dispatch event for view index change
    window.dispatchEvent(new CustomEvent('viewIndexChanged', {
      detail: { entityId: activeEntity, currentIndex: index, totalViews: views.length }
    }));
    
    // Crossfade to new view
    if (rendererRef.current && view) {
      const depthMap = await getDepthMapForMedia(view.id);
      await rendererRef.current.crossfadeTo(view.url, depthMap?.url || null, 1.5);
    }
  }, [views, activeEntity]);
  
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
      
      // If new entity has no image, preserve the previous image
      // Don't update hasImage or clear the current image
      if (!displayImage) {
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

  // Listen for display mode changes
  useEffect(() => {
    const handleDisplayModeChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode: string }>;
      if (rendererRef.current && customEvent.detail?.mode) {
        rendererRef.current.setDisplayMode(customEvent.detail.mode as any);
      }
    };
    
    window.addEventListener('displayModeChanged', handleDisplayModeChanged);
    return () => window.removeEventListener('displayModeChanged', handleDisplayModeChanged);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Handle keyboard navigation for views
  useEffect(() => {
    if (!canShowViews || views.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        goToPreviousView();
      } else if (e.key === 'ArrowRight') {
        goToNextView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canShowViews, views.length, goToPreviousView, goToNextView]);

  // Listen for new image generation events to refresh views
  useEffect(() => {
    if (!activeEntity || !canShowViews) return;

    const handleImageGenerated = (event: Event) => {
      const customEvent = event as CustomEvent<{ entityId?: string }>;
      // Refresh views if the event is for our entity or no specific entity
      if (!customEvent.detail?.entityId || customEvent.detail.entityId === activeEntity) {
        fetchViews();
      }
    };

    // Listen for various image generation completion events
    window.addEventListener('imageGenerated', handleImageGenerated);
    window.addEventListener('spawnComplete', handleImageGenerated);
    window.addEventListener('editImageComplete', handleImageGenerated);
    window.addEventListener('imageUpscaled', handleImageGenerated);
    
    return () => {
      window.removeEventListener('imageGenerated', handleImageGenerated);
      window.removeEventListener('spawnComplete', handleImageGenerated);
      window.removeEventListener('editImageComplete', handleImageGenerated);
      window.removeEventListener('imageUpscaled', handleImageGenerated);
    };
  }, [activeEntity, canShowViews, fetchViews]);

  return {
    initRenderer,
    checkForDepthMap,
    isLoading,
    hasImage,
    rendererRef,
    // Multi-view navigation
    views,
    currentViewIndex,
    goToPreviousView,
    goToNextView,
    goToView,
    refreshViews: fetchViews,
    // Model-specific styling
    imageModelClass
  };
}
