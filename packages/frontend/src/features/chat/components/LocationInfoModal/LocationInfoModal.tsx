// LocationInfoModal Component - PURE JSX ONLY
import { Modal, ModalContent, ModalSection } from '@/components/ui';
import { useLocationInfoLogic } from './useLocationInfoLogic';
import type { LocationInfoModalProps } from './types';
import styles from './LocationInfoModal.module.css';
import { splitWorldAndLocation } from '@/utils/locationProfile';

export function LocationInfoModal(props: LocationInfoModalProps) {
  const { locationProfile, locationName, isOpen } = props;
  const { handleClose } = useLocationInfoLogic(props);

  if (!locationProfile) return null;

  // Split the profile into location instance and world DNA
  const { location, world } = splitWorldAndLocation(locationProfile);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={locationName} maxWidth="md">
      <ModalContent>
        {/* Location Instance Section */}
        <ModalSection title="Location Instance" description="Scene-specific details">
          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <p className={styles.value}>{location.name}</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Looks</label>
            <p className={styles.value}>{location.looks}</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Mood</label>
            <p className={styles.value}>{location.mood}</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Sounds</label>
            <p className={styles.value}>{location.sounds}</p>
          </div>

          {location.airParticles && location.airParticles !== 'None' && (
            <div className={styles.field}>
              <label className={styles.label}>Air Particles</label>
              <p className={styles.value}>{location.airParticles}</p>
            </div>
          )}
        </ModalSection>

        {/* World DNA Section */}
        <ModalSection title="World DNA" description="Persistent environmental characteristics">
          <div className={styles.field}>
            <label className={styles.label}>Colors & Lighting</label>
            <p className={styles.value}>{world.colorsAndLighting}</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Atmosphere</label>
            <p className={styles.value}>{world.atmosphere}</p>
          </div>

          {world.flora && world.flora !== 'None' && (
            <div className={styles.field}>
              <label className={styles.label}>Flora</label>
              <p className={styles.value}>{world.flora}</p>
            </div>
          )}

          {world.fauna && world.fauna !== 'None' && (
            <div className={styles.field}>
              <label className={styles.label}>Fauna</label>
              <p className={styles.value}>{world.fauna}</p>
            </div>
          )}

          {world.architecture && world.architecture !== 'None' && (
            <div className={styles.field}>
              <label className={styles.label}>Architecture</label>
              <p className={styles.value}>{world.architecture}</p>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Materials</label>
            <p className={styles.value}>{world.materials}</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Genre</label>
            <p className={styles.value}>{world.genre}</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Symbolic Themes</label>
            <p className={styles.value}>{world.symbolicThemes}</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Fictional</label>
            <p className={styles.value}>{world.fictional ? 'Yes' : 'No'}</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Copyrighted</label>
            <p className={styles.value}>{world.copyright ? 'Yes' : 'No'}</p>
          </div>
        </ModalSection>
      </ModalContent>
    </Modal>
  );
}
