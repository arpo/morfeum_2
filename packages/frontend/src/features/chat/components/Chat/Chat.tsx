import { Button, LoadingSpinner } from '@/components/ui';
import type { ChatLogicReturn } from './types';
import styles from './Chat.module.css';

interface ChatProps {
  chatLogic: ChatLogicReturn;
}

export function Chat({ chatLogic }: ChatProps) {
  const { state, handlers } = chatLogic;

  const visibleMessages = state.messages.filter(msg => msg.role !== 'system');

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlers.sendMessage();
    }
  };

  return (
    <div className={styles.container}>
      {state.entityImage && state.entityName && (
        <div className={styles.entityBanner}>
          <img 
            src={state.entityImage} 
            alt={state.entityName}
            className={styles.entityImage}
          />
          <div className={styles.entityName}>Chatting with {state.entityName}</div>
        </div>
      )}
      
      <div className={styles.messagesContainer}>
        {visibleMessages.length === 0 && (
          <div className={styles.emptyState}>
            Start a conversation...
          </div>
        )}
        
        {visibleMessages.map((message) => (
          <div 
            key={message.id}
            className={`${styles.message} ${
              message.role === 'user' ? styles.messageUser : styles.messageAssistant
            }`}
          >
            <div className={styles.messageRole}>
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div 
              className={`${styles.messageContent} ${
                message.role === 'user' ? styles.contentUser : styles.contentAssistant
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        
        {state.loading && (
          <LoadingSpinner message="Thinking..." />
        )}
      </div>

      {state.error && (
        <div className={styles.errorMessage}>
          {state.error}
        </div>
      )}

      <div className={styles.inputContainer}>
        <input
          type="text"
          className={styles.input}
          value={state.inputValue}
          onChange={(e) => handlers.setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
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
