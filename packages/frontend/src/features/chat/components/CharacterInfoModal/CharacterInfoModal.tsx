import { useCharacterInfoLogic } from './useCharacterInfoLogic';
import { IconX } from '@/icons';
import type { CharacterInfoModalProps } from './types';
import styles from './CharacterInfoModal.module.css';

export function CharacterInfoModal({ deepProfile, characterName, isOpen, onClose }: CharacterInfoModalProps) {
  const logic = useCharacterInfoLogic({ isOpen, onClose });

  if (!logic.state.isOpen || !deepProfile) return null;

  return (
    <div className={styles.overlay} onClick={logic.handlers.close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Character Information</h2>
          <button className={styles.closeButton} onClick={logic.handlers.close}>
            <IconX size={24} />
          </button>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Identity</h3>
            <div className={styles.field}>
              <span className={styles.label}>Name:</span>
              <span className={styles.value}>{characterName}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Gender:</span>
              <span className={styles.value}>{deepProfile.gender}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Nationality:</span>
              <span className={styles.value}>{deepProfile.nationality}</span>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Physical Appearance</h3>
            <div className={styles.field}>
              <span className={styles.label}>Overall Looks:</span>
              <span className={styles.value}>{deepProfile.looks}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Face:</span>
              <span className={styles.value}>{deepProfile.face}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Body:</span>
              <span className={styles.value}>{deepProfile.body}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Hair:</span>
              <span className={styles.value}>{deepProfile.hair}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Specific Details:</span>
              <span className={styles.value}>{deepProfile.specificDetails}</span>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Style & Presence</h3>
            <div className={styles.field}>
              <span className={styles.label}>Wearing:</span>
              <span className={styles.value}>{deepProfile.wearing}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Style:</span>
              <span className={styles.value}>{deepProfile.style}</span>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Personality & Communication</h3>
            <div className={styles.field}>
              <span className={styles.label}>Personality:</span>
              <span className={styles.value}>{deepProfile.personality}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Voice:</span>
              <span className={styles.value}>{deepProfile.voice}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Speech Style:</span>
              <span className={styles.value}>{deepProfile.speechStyle}</span>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Metadata</h3>
            <div className={styles.field}>
              <span className={styles.label}>Fictional:</span>
              <span className={styles.value}>{deepProfile.fictional}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Copyright:</span>
              <span className={styles.value}>{deepProfile.copyright}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Tags:</span>
              <span className={styles.value}>{deepProfile.tags}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
