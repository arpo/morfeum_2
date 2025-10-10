import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button, LoadingSpinner } from '@/components/ui';
import { IconInfoCircle, IconMaximize, IconX, IconDeviceFloppy } from '@/icons';
import { CharacterInfoModal } from '../../../chat/components/CharacterInfoModal';
import { useCharacterPanel } from './useCharacterPanel';
import type { Message } from './types';
import styles from './CharacterPanel.module.css';

export function CharacterPanel() {
  const { state, handlers } = useCharacterPanel();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);

  // Filter out system messages for display
  const visibleMessages = state.messages.filter((msg: Message) => msg.role !== 'system');

  // Auto-scroll to bottom only when new messages are added (not when switching chats)
  useEffect(() => {
    const currentCount = visibleMessages.length;
    const prevCount = prevMessageCountRef.current;
    
    // Only scroll if message count increased (new message added)
    if (currentCount > prevCount && prevCount > 0 && messagesContainerRef.current) {
      // Use setTimeout to ensure DOM has updated before scrolling
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
    
    // Update the ref for next comparison
    prevMessageCountRef.current = currentCount;
  }, [visibleMessages.length]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlers.sendMessage();
    }
  };

  return (
    <div className={styles.container}>
      {state.entityImage && (
        <div className={styles.imageContainer}>
          <img 
            src={state.entityImage} 
            alt={state.entityName || 'Character'}
            className={styles.characterHeaderImage}
          />
          <div className={styles.imageButtons}>
            <button 
              className={styles.imageButton}
              onClick={handlers.openFullscreen}
              title="View fullscreen"
            >
              <IconMaximize size={20} />
            </button>
            <button 
              className={styles.imageButton}
              onClick={handlers.openModal}
              disabled={!state.deepProfile}
              title={state.deepProfile ? 'View info' : 'Info not ready'}
            >
              <IconInfoCircle size={20} />
            </button>
            <button 
              className={styles.imageButton}
              onClick={handlers.saveCharacter}
              disabled={!state.deepProfile || state.isSaved}
              title={state.isSaved ? 'Character saved' : state.deepProfile ? 'Save character' : 'Profile not ready'}
            >
              <IconDeviceFloppy size={20} />
            </button>
          </div>
        </div>
      )}
      
      {state.entityName && (
        <div className={styles.characterInfo}>
          <h2 className={styles.characterName}>{state.entityName}</h2>
          {state.entityPersonality && (
            <p className={styles.characterPersonality}>{state.entityPersonality}</p>
          )}
        </div>
      )}
      
      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        {visibleMessages.length === 0 && (
          <div className={styles.emptyState}>
            Start a conversation with {state.entityName}...
          </div>
        )}
        
        {visibleMessages.map((message: Message) => (
          <div 
            key={message.id}
            className={`${styles.messageWrapper} ${
              message.role === 'user' ? styles.userWrapper : styles.assistantWrapper
            }`}
          >
            <div className={styles.messageBubble}>
              <div className={styles.messageRole}>
                {message.role === 'user' ? 'You' : state.entityName}
              </div>
              <div className={styles.messageContent}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {state.loading && (
          <div className={styles.loadingWrapper}>
            <LoadingSpinner message={`${state.entityName} is thinking...`} />
          </div>
        )}
      </div>

      {state.error && (
        <div className={styles.errorMessage}>
          {state.error}
          <button 
            className={styles.errorDismiss}
            onClick={handlers.clearError}
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.inputContainer}>
        <input
          type="text"
          className={styles.input}
          value={state.inputValue}
          onChange={(e) => handlers.setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Message ${state.entityName}...`}
          disabled={state.loading}
        />
        <Button
          onClick={handlers.sendMessage}
          disabled={state.loading || !state.inputValue.trim()}
          loading={state.loading}
        >
          Send
        </Button>
      </div>

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
