import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button, LoadingSpinner, DraggablePanel } from '@/components/ui';
import { IconMicrophone, IconPlayerStop, IconLoader2 } from '@/icons';
import { useChatPanel } from './useChatPanel';
import { useVoiceInput } from '@/hooks';
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

  const inputRef = useRef<HTMLInputElement>(null);
  const inputValueRef = useRef(inputValue);
  
  // Keep ref in sync with inputValue
  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  // Voice input integration
  const {
    isListening,
    startListening,
    stopListening,
    error: voiceError,
    clearError: clearVoiceError,
    isSupported: voiceSupported,
  } = useVoiceInput({
    onTranscript: (text) => {
      const currentValue = inputValueRef.current;
      const newValue = currentValue ? `${currentValue} ${text}` : text;
      setInputValue(newValue);
      inputRef.current?.focus();
    },
  });

  // Handle Shift key hold-to-record (only when not in text input)
  useEffect(() => {
    let isShiftHeld = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isTyping) return;

      if (e.key === 'Shift' && !isShiftHeld && !isListening) {
        isShiftHeld = true;
        startListening();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && isShiftHeld) {
        isShiftHeld = false;
        if (isListening) {
          stopListening();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isListening, startListening, stopListening]);

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

        {voiceError && (
          <div className={styles.errorMessage}>
            {voiceError}
            <button 
              className={styles.errorDismiss}
              onClick={clearVoiceError}
            >
              ✕
            </button>
          </div>
        )}

        <div className={styles.inputContainer}>
          {voiceSupported && (
            <button
              className={`${styles.micButton} ${isListening ? styles.recording : ''}`}
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
              title={isListening ? 'Stop recording (release Shift)' : 'Start recording (hold Shift)'}
            >
              {isListening ? (
                <IconPlayerStop size={18} />
              ) : (
                <IconMicrophone size={18} />
              )}
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? 'Listening... (release Shift)' : `Message ${entityName}...`}
            disabled={loading || isListening}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !inputValue.trim() || isListening}
            loading={loading}
          >
            Send
          </Button>
        </div>
      </div>
    </DraggablePanel>
  );
}
