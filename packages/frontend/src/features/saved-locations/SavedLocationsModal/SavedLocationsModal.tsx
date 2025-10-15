import { Modal, ModalHeader, ModalContent } from '@/components/ui/Modal';
import { IconTrash, IconPin, IconPinFilled, IconCopy } from '@/icons';
import { useSavedEntitiesLogic } from './useSavedLocationsLogic';
import type { SavedEntitiesModalProps } from './types';
import styles from './SavedLocationsModal.module.css';

export function SavedEntitiesModal({ isOpen, onClose }: SavedEntitiesModalProps) {
  const { 
    activeTab, 
    setActiveTab, 
    locations, 
    characters, 
    pinnedLocationIds,
    pinnedCharacterIds,
    handleLoadLocation, 
    handleLoadCharacter,
    handleDeleteLocation,
    handleDeleteCharacter,
    handlePinLocation,
    handlePinCharacter,
    handleCopyWorldInfo,
    getWorldNodeCount
  } = useSavedEntitiesLogic(onClose);

  const entities = activeTab === 'characters' ? characters : locations;
  const handleLoadEntity = activeTab === 'characters' ? handleLoadCharacter : handleLoadLocation;
  const handleDeleteEntity = activeTab === 'characters' ? handleDeleteCharacter : handleDeleteLocation;
  const handlePinEntity = activeTab === 'characters' ? handlePinCharacter : handlePinLocation;
  const pinnedEntityIds = activeTab === 'characters' ? pinnedCharacterIds : pinnedLocationIds;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <ModalHeader title="Saved Entities" onClose={onClose} />
      <ModalContent>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'characters' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('characters')}
          >
            Characters ({characters.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'locations' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            Locations ({locations.length})
          </button>
        </div>

        {entities.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No saved {activeTab} yet.</p>
            <p className={styles.emptyHint}>Generate and save {activeTab} to see them here.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {entities.map((entity) => {
              // Get world node count for locations
              const nodeCount = activeTab === 'locations' ? getWorldNodeCount(entity.id) : 0;
              
              return (
              <div key={entity.id} className={styles.card}>
                <div 
                  className={styles.imageContainer}
                  onClick={() => handleLoadEntity(entity as any)}
                  title={`Click to load ${activeTab === 'characters' ? 'character' : 'world'}`}
                >
                  {entity.imagePath ? (
                    <img 
                      src={entity.imagePath} 
                      alt={entity.name}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.placeholder}>
                      <span className={styles.placeholderText}>No Image</span>
                    </div>
                  )}
                </div>
                <div className={styles.info}>
                  <h3 className={styles.name}>{entity.name}</h3>
                  {activeTab === 'locations' && (
                    <p className={styles.nodeCount}>Contains {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}</p>
                  )}
                  <div className={styles.actions}>
                    {activeTab === 'locations' && (
                      <button
                        className={styles.copyButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyWorldInfo(entity as any);
                        }}
                        title="Copy world info to clipboard"
                      >
                        <IconCopy size={18} />
                      </button>
                    )}
                    <button
                      className={`${styles.pinButton} ${pinnedEntityIds.includes(entity.id) ? styles.pinned : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinEntity(entity.id);
                      }}
                      title={pinnedEntityIds.includes(entity.id) ? 'Unpin (will not auto-load)' : 'Pin (auto-loads on startup)'}
                    >
                      {pinnedEntityIds.includes(entity.id) ? <IconPinFilled size={18} /> : <IconPin size={18} />}
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEntity(entity.id);
                      }}
                      title={`Delete ${activeTab === 'characters' ? 'character' : 'location'}`}
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
