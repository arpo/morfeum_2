// CharacterInfoModal Component - PURE JSX ONLY
import { Modal, ModalContent, ModalSection } from '@/components/ui';
import { useCharacterInfoLogic } from './useCharacterInfoLogic';
import type { CharacterInfoModalProps } from './types';
import styles from './CharacterInfoModal.module.css';

export function CharacterInfoModal({ deepProfile, characterName, isOpen, onClose }: CharacterInfoModalProps) {
  const logic = useCharacterInfoLogic({ isOpen, onClose });

  if (!deepProfile) return null;

  return (
    <Modal isOpen={logic.state.isOpen} onClose={logic.handlers.close} title={characterName} maxWidth="md">
      <ModalContent>
        <ModalSection title="Identity">
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
        </ModalSection>

        <ModalSection title="Physical Appearance">
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
        </ModalSection>

        <ModalSection title="Style & Presence">
          <div className={styles.field}>
            <span className={styles.label}>Wearing:</span>
            <span className={styles.value}>{deepProfile.wearing}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Style:</span>
            <span className={styles.value}>{deepProfile.style}</span>
          </div>
        </ModalSection>

        <ModalSection title="Personality & Communication">
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
        </ModalSection>

        <ModalSection title="Metadata">
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
        </ModalSection>
      </ModalContent>
    </Modal>
  );
}
