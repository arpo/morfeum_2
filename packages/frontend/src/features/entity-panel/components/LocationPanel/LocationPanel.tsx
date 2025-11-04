import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, Checkbox } from '@/components/ui';
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
        {((!state.entityImage && !state.previewImage) || imageLoading) && (
          <div className={styles.imageSkeleton}>
            <div className={styles.skeletonBreathing} />
          </div>
        )}
        {(state.previewImage || state.entityImage) && (
          <img 
            src={(state.previewImage || state.entityImage) || ''} 
            alt={state.entityName || 'Location'}
            className={styles.locationHeaderImage}
            onLoad={() => setImageLoading(false)}
            style={{ opacity: imageLoading ? 0 : 1, transition: 'opacity 0.3s ease-in' }}
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

      {/* Travel Section */}
      <div className={styles.travelSection}>
        <h3 className={styles.travelTitle}>Travel</h3>
        <p className={styles.travelDescription}>
          Where would you like to go from here?
        </p>
        <div className={styles.movementSection}>
          <input
            type="text"
            className={styles.movementInput}
            value={state.movementInput}
            onChange={(e) => handlers.setMovementInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !state.isMoving) {
                e.preventDefault();
                handlers.handleMove();
              }
            }}
            placeholder="Describe where you want to go..."
            disabled={state.isMoving}
          />
          <Button
            onClick={handlers.handleMove}
            disabled={state.isMoving || !state.movementInput.trim()}
            loading={state.isMoving}
          >
            Travel
          </Button>
        </div>
        <Checkbox
          checked={state.createImage}
          onChange={handlers.setCreateImage}
          disabled={state.isMoving}
          label="Create image"
        />
      </div>

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
