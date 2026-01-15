/**
 * Navigation Assistant Panel Component
 * Chat interface for the Morfeum Navigation Expert
 */

import { useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button, LoadingSpinner, DraggablePanel } from '@/components/ui';
import { IconCompass, IconTrash, IconArrowBadgeRight, IconCopy, IconCheck } from '@/icons';
import { useNavigationAssistant } from './useNavigationAssistant';
import styles from './NavigationAssistantPanel.module.css';
import type { NavigationAssistantPanelProps } from './types';

export function NavigationAssistantPanel({ onClose, onCommandSuggested }: NavigationAssistantPanelProps) {
  const {
    messages,
    inputValue,
    loading,
    error,
    setInputValue,
    sendMessage,
    clearError,
    clearHistory,
  } = useNavigationAssistant({ onCommandSuggested });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  /**
   * Copy text to clipboard
   */
  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Handle inserting a command into the navigation input
   */
  const handleInsertCommand = useCallback((command: string) => {
    if (onCommandSuggested) {
      onCommandSuggested(command);
    }
  }, [onCommandSuggested]);

  /**
   * Custom code renderer that adds insert button for commands
   */
  const renderCode = useCallback(({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const content = String(children || '').trim();
    const isCommand = content.startsWith('/');
    
    if (isCommand) {
      return (
        <div className={styles.commandBlock}>
          <code className={styles.commandCode}>{content}</code>
          <button
            className={styles.insertButton}
            onClick={() => handleInsertCommand(content)}
            title="Insert command into navigation input"
          >
            <IconArrowBadgeRight size={16} />
          </button>
        </div>
      );
    }
    
    return <code className={className}>{children}</code>;
  }, [handleInsertCommand]);

  /**
   * Custom pre renderer that adds copy button for developer reports
   */
  const renderPre = useCallback(({ children, node }: { children?: React.ReactNode; node?: any }) => {
    // Extract the text content from children
    const getTextContent = (children: React.ReactNode): string => {
      if (typeof children === 'string') return children;
      if (Array.isArray(children)) return children.map(getTextContent).join('');
      if (children && typeof children === 'object' && 'props' in children) {
        return getTextContent((children as any).props.children);
      }
      return '';
    };
    
    const content = getTextContent(children);
    const isReport = content.includes('## Navigation Fine-Tuning Request') || 
                     content.includes('**User Goal:**') ||
                     content.startsWith('markdown');
    
    if (isReport) {
      // Extract the actual report content (remove 'markdown' language tag if present)
      const reportContent = content.replace(/^markdown\n?/, '').trim();
      const reportId = `report-${Date.now()}`;
      const isCopied = copiedId === reportId;
      
      return (
        <div className={styles.reportBlock}>
          <div className={styles.reportHeader}>
            <span className={styles.reportTitle}>Developer Report</span>
            <button
              className={`${styles.copyButton} ${isCopied ? styles.copied : ''}`}
              onClick={() => copyToClipboard(reportContent, reportId)}
              title={isCopied ? 'Copied!' : 'Copy report to clipboard'}
            >
              {isCopied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              <span>{isCopied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <pre className={styles.reportContent}>{children}</pre>
        </div>
      );
    }
    
    return <pre>{children}</pre>;
  }, [copiedId, copyToClipboard]);

  return (
    <DraggablePanel
      title="Navigation Assistant"
      onClose={onClose}
      initialPosition={{ x: 100, y: 100 }}
      initialSize={{ width: 420, height: 520 }}
      minWidth={320}
      minHeight={400}
    >
      <div className={styles.container} data-component="navigation-assistant-panel">
        {/* Clear history button */}
        {messages.length > 0 && (
          <div className={styles.headerActions}>
            <button
              className={styles.clearButton}
              onClick={clearHistory}
              title="Clear chat history"
            >
              <IconTrash size={14} />
              <span>Clear</span>
            </button>
          </div>
        )}
        
        <div className={styles.messagesContainer}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <IconCompass size={48} className={styles.emptyStateIcon} />
              <div className={styles.emptyStateTitle}>
                Navigation Expert
              </div>
              <div className={styles.emptyStateHint}>
                Ask me how to navigate your world!<br />
                Try: "How do I look through a window?" or "I want to enter the tower"
              </div>
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
                  {message.role === 'user' ? 'You' : 'Navigator'}
                </div>
                <div className={styles.messageContent}>
                  <ReactMarkdown
                    components={{
                      code: renderCode,
                      pre: renderPre,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className={styles.loadingWrapper}>
              <LoadingSpinner message="Thinking..." />
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
            placeholder="Ask about navigation..."
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
