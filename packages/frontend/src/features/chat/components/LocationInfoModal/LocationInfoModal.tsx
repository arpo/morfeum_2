import { IconX } from '@/icons';
import { useLocationInfoLogic } from './useLocationInfoLogic';
import type { LocationInfoModalProps } from './types';
import styles from './LocationInfoModal.module.css';

export function LocationInfoModal(props: LocationInfoModalProps) {
  const { locationProfile, locationName, isOpen } = props;
  const { handleClose } = useLocationInfoLogic(props);

  if (!isOpen || !locationProfile) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{locationName}</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <IconX size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Overview Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Overview</h3>
            
            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <p className={styles.value}>{locationProfile.looks}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Atmosphere</label>
              <p className={styles.value}>{locationProfile.atmosphere}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Mood</label>
              <p className={styles.value}>{locationProfile.mood}</p>
            </div>
          </section>

          {/* Environment Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Environment</h3>

            {locationProfile.vegetation && (
              <div className={styles.field}>
                <label className={styles.label}>Vegetation</label>
                <p className={styles.value}>{locationProfile.vegetation}</p>
              </div>
            )}

            {locationProfile.architecture && (
              <div className={styles.field}>
                <label className={styles.label}>Architecture</label>
                <p className={styles.value}>{locationProfile.architecture}</p>
              </div>
            )}

            {locationProfile.animals && (
              <div className={styles.field}>
                <label className={styles.label}>Wildlife</label>
                <p className={styles.value}>{locationProfile.animals}</p>
              </div>
            )}
          </section>

          {/* Ambiance Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Ambiance</h3>

            <div className={styles.field}>
              <label className={styles.label}>Sounds</label>
              <p className={styles.value}>{locationProfile.sounds}</p>
            </div>
          </section>

          {/* Metadata Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Metadata</h3>

            <div className={styles.field}>
              <label className={styles.label}>Genre</label>
              <p className={styles.value}>{locationProfile.genre}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Fictional</label>
              <p className={styles.value}>{locationProfile.fictional ? 'Yes' : 'No'}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Copyrighted</label>
              <p className={styles.value}>{locationProfile.copyright ? 'Yes' : 'No'}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
