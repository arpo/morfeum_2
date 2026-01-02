/**
 * LocationPanel Component
 * Displays location details with multi-view image slider
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconInfoCircle, IconMaximize, IconX, IconDeviceFloppy } from '@/icons';
import { LocationInfoModal } from '../../../chat/components/LocationInfoModal';
import { ViewSlider } from '../shared/ViewSlider';
import { useLocationPanel } from './useLocationPanel';
import { useNodeViews } from '../../hooks/useNodeViews';
import styles from './LocationPanel.module.css';

export function LocationPanel() {
  const { state, handlers } = useLocationPanel();
  const [imageLoading, setImageLoading] = useState(true);

  // Get node ID from active chat (activeChat is the node ID)
  const nodeId = state.activeChat;
  
  // Use the multi-view hook (pass null for primaryMediaId - hook defaults to latest view)
  const { views, currentViewId, setCurrentView, refreshViews } = useNodeViews(nodeId, null);

  // Refresh views when entityImage URL changes (e.g., after /EDIT_IMAGE completes)
  // Use a ref to track the previous URL to avoid unnecessary refreshes on initial mount
  const prevEntityImageRef = useRef<string | null>(null);
  useEffect(() => {
    // Only refresh if entityImage actually changed (not on initial mount)
    if (state.entityImage && prevEntityImageRef.current !== null && state.entityImage !== prevEntityImageRef.current) {
      refreshViews();
    }
    prevEntityImageRef.current = state.entityImage;
  }, [state.entityImage, refreshViews]);

  // Get current image URL for fullscreen
  const currentImageUrl = useMemo(() => {
    if (views.length === 0) return state.entityImage;
    const currentView = views.find(v => v.id === currentViewId);
    return currentView?.url || state.entityImage;
  }, [views, currentViewId, state.entityImage]);

  // Reset loading state when image URL changes
  useEffect(() => {
    if (state.entityImage || views.length > 0) {
      setImageLoading(true);
    } else {
      setImageLoading(true);
    }
  }, [state.entityImage, views.length]);

  // Handle view change
  const handleViewChange = async (mediaId: string) => {
    await setCurrentView(mediaId);
  };

  return (
    <div className={styles.container} data-component="location-panel">
      <div className={styles.imageContainer}>
        {/* Show ViewSlider if we have views, otherwise show single image or skeleton */}
        {views.length > 0 ? (
          <ViewSlider
            views={views}
            currentViewId={currentViewId}
            onViewChange={handleViewChange}
            onLoad={() => setImageLoading(false)}
            alt={state.entityName || 'Location'}
          />
        ) : (
          <>
            {(!state.entityImage || imageLoading) && (
              <div className={styles.imageSkeleton}>
                <div className={styles.skeletonBreathing} />
              </div>
            )}
            {state.entityImage && (
              <img 
                src={state.entityImage} 
                alt={state.entityName || 'Location'}
                className={styles.locationHeaderImage}
                onLoad={() => setImageLoading(false)}
              />
            )}
          </>
        )}
        
        {/* Always show image buttons, positioned over skeleton or image */}
        <div className={styles.imageButtons}>
          {(state.entityImage || views.length > 0) && (
            <button 
              className={styles.imageButton}
              onClick={handlers.openFullscreen}
              title="View fullscreen"
            >
              <IconMaximize size={20} />
            </button>
          )}
          <button 
            className={styles.imageButton}
            onClick={handlers.openModal}
            disabled={!state.deepProfile}
            title={state.deepProfile ? 'View info' : 'Info not ready'}
          >
            <IconInfoCircle size={20} />
          </button>
          {(state.entityImage || views.length > 0) && (
            <button 
              className={styles.imageButton}
              onClick={handlers.saveLocation}
              disabled={!state.deepProfile || state.isSaved}
              title={state.isSaved ? 'Location saved' : state.deepProfile ? 'Save location' : 'Profile not ready'}
            >
              <IconDeviceFloppy size={20} />
            </button>
          )}
        </div>
      </div>
      
      {state.entityName && (
        <div className={styles.locationInfo}>
          <h2 className={styles.locationName}>{state.entityName}</h2>
          {state.entityPersonality && (
            <p className={styles.locationAtmosphere}>{state.entityPersonality}</p>
          )}
        </div>
      )}

      <LocationInfoModal
        locationProfile={state.deepProfile as any}
        locationName={state.entityName || 'Unknown'}
        locationId={state.activeChat || undefined}
        isOpen={state.isModalOpen}
        onClose={handlers.closeModal}
      />

      {state.isFullscreenOpen && currentImageUrl && createPortal(
        <div className={styles.fullscreenOverlay} onClick={handlers.closeFullscreen}>
          <button className={styles.fullscreenCloseButton} onClick={handlers.closeFullscreen}>
            <IconX size={32} />
          </button>
          <img 
            src={currentImageUrl} 
            alt={state.entityName || 'Location'}
            className={styles.fullscreenImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
