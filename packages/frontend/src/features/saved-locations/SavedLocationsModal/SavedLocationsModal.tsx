import { Modal, ModalHeader, ModalContent } from '@/components/ui/Modal';
import { IconTrash } from '@/icons';
import { useSavedLocationsLogic } from './useSavedLocationsLogic';
import type { SavedLocationsModalProps } from './types';
import styles from './SavedLocationsModal.module.css';

export function SavedLocationsModal({ isOpen, onClose }: SavedLocationsModalProps) {
  const { locations, handleLoadLocation, handleDeleteLocation } = useSavedLocationsLogic(onClose);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <ModalHeader title="Saved Locations" onClose={onClose} />
      <ModalContent>
        {locations.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No saved locations yet.</p>
            <p className={styles.emptyHint}>Generate and save locations to see them here.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {locations.map((location) => (
              <div key={location.id} className={styles.card}>
                <div 
                  className={styles.imageContainer}
                  onClick={() => handleLoadLocation(location)}
                  title="Click to load location"
                >
                  {location.imagePath ? (
                    <img 
                      src={location.imagePath} 
                      alt={location.name}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.placeholder}>
                      <span className={styles.placeholderText}>No Image</span>
                    </div>
                  )}
                </div>
                <div className={styles.info}>
                  <h3 className={styles.name}>{location.name}</h3>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLocation(location.id);
                    }}
                    title="Delete location"
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
