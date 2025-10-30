import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { IconInfoCircle, IconMaximize, IconX, IconDeviceFloppy } from '@/icons';
import { CharacterInfoModal } from '../../../chat/components/CharacterInfoModal';
import { useCharacterPanel } from './useCharacterPanel';
import styles from './CharacterPanel.module.css';

export function CharacterPanel() {
  const { state, handlers } = useCharacterPanel();
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
    <div className={styles.container}>
      <div className={styles.imageContainer}>
        {(!state.entityImage || imageLoading) && (
          <div className={styles.imageSkeleton}>
            <div className={styles.skeletonBreathing} />
          </div>
        )}
        {state.entityImage && (
          <img 
            src={state.entityImage} 
            alt={state.entityName || 'Character'}
            className={styles.characterHeaderImage}
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
              onClick={handlers.saveCharacter}
              disabled={!state.deepProfile || state.isSaved}
              title={state.isSaved ? 'Character saved' : state.deepProfile ? 'Save character' : 'Profile not ready'}
            >
              <IconDeviceFloppy size={20} />
            </button>
          )}
        </div>
      </div>
      
      {state.entityName && (
        <div className={styles.characterInfo}>
          <h2 className={styles.characterName}>{state.entityName}</h2>
          {state.entityPersonality && (
            <p className={styles.characterPersonality}>{state.entityPersonality}</p>
          )}
          <Button
            onClick={handlers.openChat}
            className={styles.chatButton}
          >
            Chat
          </Button>
        </div>
      )}

      <CharacterInfoModal 
        deepProfile={state.deepProfile as any}
        characterName={state.entityName || 'Unknown'}
        isOpen={state.isModalOpen}
        onClose={handlers.closeModal}
      />

      {state.isFullscreenOpen && state.entityImage && (
        <div className={styles.fullscreenOverlay} onClick={handlers.closeFullscreen}>
          <button className={styles.fullscreenCloseButton} onClick={handlers.closeFullscreen}>
            <IconX size={32} />
          </button>
          <img 
            src={state.entityImage} 
            alt={state.entityName || 'Character'}
            className={styles.fullscreenImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
