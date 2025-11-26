import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconInfoCircle, IconMaximize, IconX, IconDeviceFloppy } from '@/icons';
import { LocationInfoModal } from '../../../chat/components/LocationInfoModal';
import { useLocationPanel } from './useLocationPanel';
import styles from './LocationPanel.module.css';

export function LocationPanel() {
  const { state, handlers } = useLocationPanel();
  const [imageLoading, setImageLoading] = useState(true);

  // Reset loading state when image URL changes
  useEffect(() => {
    if (state.entityImage) {
      setImageLoading(true);
    } else {
      // If no image, keep showing skeleton
      setImageLoading(true);
    }
  }, [state.entityImage]);

  return (
    <div className={styles.container} data-component="location-panel">
      <div className={styles.imageContainer}>
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
        {/* Always show image buttons, positioned over skeleton or image */}
        <div className={styles.imageButtons}>
          {state.entityImage && (
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
          {state.entityImage && (
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

      {state.isFullscreenOpen && state.entityImage && createPortal(
        <div className={styles.fullscreenOverlay} onClick={handlers.closeFullscreen}>
          <button className={styles.fullscreenCloseButton} onClick={handlers.closeFullscreen}>
            <IconX size={32} />
          </button>
          <img 
            src={state.entityImage} 
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
