import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/store';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';
import { getDepthMapForMedia, clearMediaCache, getMediaWithUrls } from '@/services/mediaService';
import { WorldViewRenderer } from './WorldViewRenderer';
import { IMAGE_LOADING_CONFIG } from '@/config';

interface DisplayImage {
  src: string;
  originalSrc: string | null;
  upscaledSrc: string | null;
  depthSrc: string | null;
  videoSrc: string | null;
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
  const currentVideoRef = useRef<string | null>(null);
  const upscaledPreloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const upscaledCrossfadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasImage, setHasImage] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Get active entity session
  const activeEntitySession = activeEntity ? entities.get(activeEntity) : null;
  
  // Get image model class for CSS styling (e.g., 'model-b' for saturation adjustments)
  const imageModelClass = activeEntitySession?.imageModelClass || null;

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
        originalSrc: null,
        upscaledSrc: null,
        depthSrc: null, // No depth map during generation
        videoSrc: null,
        alt: `Generating ${spawnWithImage.prompt}...`,
        mediaId: null
      };
    }
    
    // Fallback to active entity
    if (activeEntitySession?.entityImage) {
      const primaryMediaId = getPrimaryMediaId();
      let depthSrc: string | null = null;
      let originalSrc: string | null = null;
      let upscaledSrc: string | null = null;
      
      let videoSrc: string | null = null;
      
      // Get all URL variants for progressive loading
      if (primaryMediaId) {
        const mediaUrls = await getMediaWithUrls(primaryMediaId);
        if (mediaUrls) {
          originalSrc = mediaUrls.originalUrl;
          upscaledSrc = mediaUrls.upscaledUrl;
          depthSrc = mediaUrls.depthMapUrl;
          videoSrc = mediaUrls.videoUrl;
        }
      }
      
      return {
        src: activeEntitySession.entityImage,
        originalSrc,
        upscaledSrc,
        depthSrc,
        videoSrc,
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

  // Load image into renderer with progressive loading (original → upscaled)
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
      
      // Determine which image to load first (prefer original for faster initial display)
      const initialSrc = displayImage.originalSrc || displayImage.src;
      
      // Skip upscaled image loading if video exists - video covers the image anyway
      // This reduces concurrent loading overhead during node transitions
      const hasVideo = !!displayImage.videoSrc;
      const hasUpscaled = !hasVideo && displayImage.upscaledSrc && displayImage.upscaledSrc !== initialSrc;
      
      // DEBUG: Trace upscaled image loading decision
      console.log('[WorldView] Image loading decision:', {
        hasVideo,
        hasUpscaled,
        videoSrc: displayImage.videoSrc,
        upscaledSrc: displayImage.upscaledSrc,
        initialSrc,
        upscaledDifferent: displayImage.upscaledSrc !== initialSrc
      });
      
      // Only reload if image changed
      if (initialSrc !== currentImageRef.current) {
        setIsLoading(true);
        currentImageRef.current = initialSrc;
        currentDepthRef.current = displayImage.depthSrc;
        
        if (rendererRef.current) {
          try {
            // Pause particles during load for better performance
            rendererRef.current.setParticlesEnabled(false);
            
            // Load original/initial image first
            await rendererRef.current.load(initialSrc, displayImage.depthSrc);
            setIsLoading(false);
            
            // Re-enable particles only for still images (no video)
            if (!hasVideo) {
              rendererRef.current.setParticlesEnabled(true);
              // Signal that content is ready for transition overlay to fade out
              window.dispatchEvent(new CustomEvent('worldViewContentReady'));
            }
            // For nodes with video, don't signal ready yet - wait for videoLoopReady event
            
            if (cancelled) return;
            
            // If upscaled version exists, delay preload to allow node transition to complete
            if (hasUpscaled && displayImage.upscaledSrc) {
              const upscaledUrl = displayImage.upscaledSrc;
              
              // Clear any existing timeout before setting a new one
              if (upscaledPreloadTimeoutRef.current) {
                clearTimeout(upscaledPreloadTimeoutRef.current);
              }
              
              // Delay upscaled preload to reduce load during node transitions
              upscaledPreloadTimeoutRef.current = setTimeout(() => {
                if (cancelled || !rendererRef.current) return;
                
                // Only start preload if we're still showing the same original image
                if (currentImageRef.current !== initialSrc) return;
                
                // Preload upscaled image in background
                const preloadImage = new Image();
                preloadImage.onload = () => {
                  if (cancelled || !rendererRef.current) return;
                  
                  // Only crossfade if we're still showing the same original image
                  if (currentImageRef.current !== initialSrc) return;
                  
                  // Clear any existing crossfade timeout
                  if (upscaledCrossfadeTimeoutRef.current) {
                    clearTimeout(upscaledCrossfadeTimeoutRef.current);
                    upscaledCrossfadeTimeoutRef.current = null;
                  }
                  
                  // Wait before starting crossfade to let system settle
                  upscaledCrossfadeTimeoutRef.current = setTimeout(async () => {
                    if (cancelled || !rendererRef.current) return;
                    if (currentImageRef.current !== initialSrc) return;
                    
                    try {
                      // Smooth crossfade from original to upscaled (slower duration)
                      await rendererRef.current.crossfadeTo(
                        upscaledUrl, 
                        displayImage.depthSrc, 
                        IMAGE_LOADING_CONFIG.UPSCALED_CROSSFADE_DURATION_S
                      );
                      currentImageRef.current = upscaledUrl;
                      console.log('[WorldView] High-res image crossfade complete:', upscaledUrl);
                    } catch {
                      // Crossfade failed - silently ignore, original is still displayed
                    }
                  }, IMAGE_LOADING_CONFIG.UPSCALED_CROSSFADE_DELAY_MS);
                };
                preloadImage.src = upscaledUrl;
              }, IMAGE_LOADING_CONFIG.UPSCALED_PRELOAD_DELAY_MS);
            }
          } catch {
            // Image load failed - silently ignore
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } else if (displayImage.depthSrc !== currentDepthRef.current && displayImage.depthSrc) {
        // Same image but new depth map
        currentDepthRef.current = displayImage.depthSrc;
        
        if (rendererRef.current) {
          await rendererRef.current.updateDepthMap(displayImage.depthSrc);
        }
      }
      
      // Update video URL for overlay component
      if (displayImage.videoSrc !== currentVideoRef.current) {
        currentVideoRef.current = displayImage.videoSrc;
        setVideoUrl(displayImage.videoSrc);
      }
    }
    
    loadImage();
    
    return () => {
      cancelled = true;
      // Clear all upscaled-related timeouts on node change
      if (upscaledPreloadTimeoutRef.current) {
        clearTimeout(upscaledPreloadTimeoutRef.current);
        upscaledPreloadTimeoutRef.current = null;
      }
      if (upscaledCrossfadeTimeoutRef.current) {
        clearTimeout(upscaledCrossfadeTimeoutRef.current);
        upscaledCrossfadeTimeoutRef.current = null;
      }
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

  // Listen for image upscaled events - crossfade to upscaled image
  useEffect(() => {
    let crossfadeTimeout: NodeJS.Timeout | null = null;
    
    const handleImageUpscaled = (event: Event) => {
      const customEvent = event as CustomEvent<{ entityId: string; newUrl: string; primaryMediaId: string }>;
      const entityId = customEvent.detail?.entityId;
      const newUrl = customEvent.detail?.newUrl;
      
      // Only react if this is the active entity
      if (!entityId || entityId !== activeEntity || !rendererRef.current || !newUrl) return;
      
      // Preload the upscaled image before crossfading
      const preloadImage = new Image();
      preloadImage.onload = () => {
        if (!rendererRef.current) return;
        
        // Clear any existing crossfade timeout
        if (crossfadeTimeout) {
          clearTimeout(crossfadeTimeout);
        }
        
        // Wait briefly before starting crossfade to let system settle
        crossfadeTimeout = setTimeout(async () => {
          if (!rendererRef.current) return;
          
          try {
            // Smooth crossfade to upscaled image (use configurable duration)
            await rendererRef.current.crossfadeTo(
              newUrl, 
              currentDepthRef.current, 
              IMAGE_LOADING_CONFIG.UPSCALED_CROSSFADE_DURATION_S
            );
            currentImageRef.current = newUrl;
          } catch {
            // Crossfade failed - silently ignore
          }
        }, IMAGE_LOADING_CONFIG.UPSCALED_CROSSFADE_DELAY_MS);
      };
      preloadImage.src = newUrl;
    };
    
    window.addEventListener('imageUpscaled', handleImageUpscaled);
    return () => {
      window.removeEventListener('imageUpscaled', handleImageUpscaled);
      if (crossfadeTimeout) {
        clearTimeout(crossfadeTimeout);
      }
    };
  }, [activeEntity]);

  // Listen for video generated events - update video URL for overlay
  useEffect(() => {
    const handleVideoGenerated = (event: Event) => {
      const customEvent = event as CustomEvent<{ entityId: string; videoUrl: string; primaryMediaId: string }>;
      const entityId = customEvent.detail?.entityId;
      const newVideoUrl = customEvent.detail?.videoUrl;
      
      // Only react if this is the active entity
      if (!entityId || entityId !== activeEntity || !newVideoUrl) return;
      
      // Cancel any pending upscaled preload/crossfade - video covers the image
      if (upscaledPreloadTimeoutRef.current) {
        clearTimeout(upscaledPreloadTimeoutRef.current);
        upscaledPreloadTimeoutRef.current = null;
      }
      if (upscaledCrossfadeTimeoutRef.current) {
        clearTimeout(upscaledCrossfadeTimeoutRef.current);
        upscaledCrossfadeTimeoutRef.current = null;
      }
      
      // Disable particles when video starts (video has its own motion)
      rendererRef.current?.setParticlesEnabled(false);
      
      currentVideoRef.current = newVideoUrl;
      setVideoUrl(newVideoUrl);
    };
    
    window.addEventListener('videoGenerated', handleVideoGenerated);
    return () => window.removeEventListener('videoGenerated', handleVideoGenerated);
  }, [activeEntity]);

  // Listen for video loop ready - signal content ready for overlay fade-out
  useEffect(() => {
    const handleVideoLoopReady = () => {
      // Forward to transition overlay system
      window.dispatchEvent(new CustomEvent('worldViewContentReady'));
    };
    
    window.addEventListener('videoLoopReady', handleVideoLoopReady);
    return () => window.removeEventListener('videoLoopReady', handleVideoLoopReady);
  }, []);

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

  return {
    initRenderer,
    checkForDepthMap,
    isLoading,
    hasImage,
    videoUrl,
    rendererRef,
    // Model-specific styling
    imageModelClass
  };
}
