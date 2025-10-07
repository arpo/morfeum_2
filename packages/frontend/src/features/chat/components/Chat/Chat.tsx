import { useEffect, useRef } from 'react';
import { Button, LoadingSpinner } from '@/components/ui';
import type { ChatLogicReturn } from './types';
import styles from './Chat.module.css';

interface ChatProps {
  chatLogic: ChatLogicReturn;
}

export function Chat({ chatLogic }: ChatProps) {
  const { state, handlers } = chatLogic;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter out system messages for display
  const visibleMessages = state.messages.filter(msg => msg.role !== 'system');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        <img 
          src={state.entityImage} 
          alt={state.entityName || 'Entity'}
          className={styles.entityHeaderImage}
        />
      )}
      
      {state.entityName && (
        <div className={styles.entityInfo}>
          <h2 className={styles.entityName}>{state.entityName}</h2>
          {state.entityPersonality && (
            <p className={styles.entityPersonality}>{state.entityPersonality}</p>
          )}
        </div>
      )}
      
      <div className={styles.messagesContainer}>
        {visibleMessages.length === 0 && (
          <div className={styles.emptyState}>
            Start a conversation with {state.entityName}...
          </div>
        )}
        
        {visibleMessages.map((message) => (
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
                {message.content}
              </div>
            </div>
          </div>
        ))}
        
        {state.loading && (
          <div className={styles.loadingWrapper}>
            <LoadingSpinner message={`${state.entityName} is thinking...`} />
          </div>
        )}
        
        <div ref={messagesEndRef} />
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
    </div>
  );
}
