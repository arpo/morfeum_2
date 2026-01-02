/**
 * useNodeViews Hook
 * Fetches all media/views for a node and handles view switching
 */

import { useState, useEffect, useCallback } from 'react';
import { getEntityMedia, clearMediaItem, clearEntityMediaCache } from '@/services/mediaService';

interface MediaItem {
  id: string;
  url: string;
  createdAt: string;
  type: string;
  metadata?: {
    prompt?: string;
    [key: string]: any;
  };
}

interface UseNodeViewsResult {
  views: MediaItem[];
  isLoading: boolean;
  currentViewId: string | null;
  setCurrentView: (mediaId: string) => Promise<void>;
  refreshViews: () => Promise<void>;
}

/**
 * Hook to manage multiple views for a node
 * @param nodeId - The node ID to fetch views for
 * @param primaryMediaId - The current primaryMedia ID of the node
 */
export function useNodeViews(nodeId: string | null, primaryMediaId: string | null): UseNodeViewsResult {
  const [views, setViews] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentViewId, setCurrentViewId] = useState<string | null>(primaryMediaId);

  // Fetch all media for the node
  const fetchViews = useCallback(async () => {
    if (!nodeId) {
      setViews([]);
      return;
    }

    setIsLoading(true);
    try {
      // Always clear cache before fetching to ensure fresh data
      clearEntityMediaCache(nodeId);
      const allMedia = await getEntityMedia(nodeId);
      // Filter to only images (not depth-maps, videos, etc.)
      const imageViews = allMedia.filter(m => m.type === 'image');
      setViews(imageViews);
    } catch (error) {
      console.error('[useNodeViews] Error fetching views:', error);
      setViews([]);
    } finally {
      setIsLoading(false);
    }
  }, [nodeId]);

  // Fetch views when nodeId changes
  useEffect(() => {
    fetchViews();
  }, [fetchViews]);

  // Force refresh when nodeId first becomes available (handles initial mount race condition)
  useEffect(() => {
    if (nodeId && views.length === 0 && !isLoading) {
      // Small delay to ensure store state is settled
      const timer = setTimeout(() => {
        fetchViews();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [nodeId, views.length, isLoading, fetchViews]);

  // Update currentViewId when primaryMediaId changes
  useEffect(() => {
    setCurrentViewId(primaryMediaId);
  }, [primaryMediaId]);

  // Set current view and persist to backend
  const setCurrentView = useCallback(async (mediaId: string) => {
    if (!nodeId) return;

    // Optimistically update local state
    setCurrentViewId(mediaId);

    try {
      // Call backend to update node's primaryMedia
      const response = await fetch('/api/storage/worlds/node/primary-media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, mediaId })
      });

      if (!response.ok) {
        console.error('[useNodeViews] Failed to update primaryMedia');
        // Revert on failure
        setCurrentViewId(primaryMediaId);
      } else {
        // Clear media cache to force refresh
        clearMediaItem(mediaId);
      }
    } catch (error) {
      console.error('[useNodeViews] Error updating primaryMedia:', error);
      setCurrentViewId(primaryMediaId);
    }
  }, [nodeId, primaryMediaId]);

  // Refresh views (call after generating new images)
  const refreshViews = useCallback(async () => {
    // Clear cache to force fresh fetch from API
    if (nodeId) {
      clearEntityMediaCache(nodeId);
    }
    await fetchViews();
  }, [fetchViews, nodeId]);

  return {
    views,
    isLoading,
    currentViewId,
    setCurrentView,
    refreshViews
  };
}
