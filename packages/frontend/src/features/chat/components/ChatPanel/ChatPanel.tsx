import ReactMarkdown from 'react-markdown';
import { Button, LoadingSpinner, DraggablePanel } from '@/components/ui';
import { useChatPanel } from './useChatPanel';
import styles from './ChatPanel.module.css';
import type { ChatPanelProps } from './types';

export function ChatPanel({ entityId, entityName, onClose }: ChatPanelProps) {
  const {
    messages,
    inputValue,
    loading,
    error,
    setInputValue,
    sendMessage,
    clearError,
  } = useChatPanel({ entityId });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <DraggablePanel
      title={`Chat with ${entityName}`}
      onClose={onClose}
      initialPosition={{ x: 100, y: 100 }}
      initialSize={{ width: 400, height: 500 }}
      minWidth={300}
      minHeight={400}
    >
      <div className={styles.container}>
        <div className={styles.messagesContainer}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              Start a conversation with {entityName}...
            </div>
          )}
          
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`${styles.messageWrapper} ${
                message.role === 'user' ? styles.userWrapper : styles.assistantWrapper
              }`}
            >
              <div className={styles.messageBubble}>
                <div className={styles.messageRole}>
                  {message.role === 'user' ? 'You' : entityName}
                </div>
                <div className={styles.messageContent}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className={styles.loadingWrapper}>
              <LoadingSpinner message={`${entityName} is thinking...`} />
            </div>
          )}
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
            <button 
              className={styles.errorDismiss}
              onClick={clearError}
            >
              ✕
            </button>
          </div>
        )}

        <div className={styles.inputContainer}>
          <input
            type="text"
            className={styles.input}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${entityName}...`}
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !inputValue.trim()}
            loading={loading}
          >
            Send
          </Button>
        </div>
      </div>
    </DraggablePanel>
  );
}
