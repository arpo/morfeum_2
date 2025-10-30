import { useState } from 'react';
import { useChatHistoryLogic } from './useChatHistoryLogic';
import type { ChatHistoryViewerProps } from './types';
import styles from './ChatHistoryViewer.module.css';

export function ChatHistoryViewer({ messages }: ChatHistoryViewerProps) {
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const { expandedItems, toggleItem } = useChatHistoryLogic();

  const getRoleClassName = (role: string) => {
    switch (role) {
      case 'system': return styles.roleSystem;
      case 'user': return styles.roleUser;
      case 'assistant': return styles.roleAssistant;
      default: return '';
    }
  };

  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded);
  };

  return (
    <div className={styles.container} data-component="chat-history-viewer">
      <div className={styles.panelHeader} onClick={togglePanel}>
        <div>
          <span className={styles.panelTitle}>Chat History</span>
          <span className={styles.panelBadge}>{messages.length}</span>
        </div>
        <span className={`${styles.toggleIcon} ${!isPanelExpanded ? styles.collapsed : ''}`}>
          ▼
        </span>
      </div>
      {isPanelExpanded && messages.length === 0 && (
        <div className={styles.emptyState}>No messages yet</div>
      )}
      
      {isPanelExpanded && messages.length > 0 && (
        <div className={styles.listContainer}>
        {messages.map((message, index) => {
          const isExpanded = expandedItems[message.id];
          
          return (
            <div key={message.id} className={styles.messageItem}>
              <div 
                className={styles.messageHeader}
                onClick={() => toggleItem(message.id)}
              >
                <div className={styles.messageTitle}>
                  <span>[{index}]</span>
                  <span className={`${styles.roleTag} ${getRoleClassName(message.role)}`}>
                    {message.role}
                  </span>
                </div>
                <span className={`${styles.expandIcon} ${isExpanded ? styles.expandIconExpanded : ''}`}>
                  ▶
                </span>
              </div>
              
              {isExpanded && (
                <div className={styles.messageDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>id:</span>
                    <span className={styles.detailValue}>"{message.id}"</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>role:</span>
                    <span className={styles.detailValue}>"{message.role}"</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>content:</span>
                    <span className={styles.detailValue}>"{message.content}"</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>timestamp:</span>
                    <span className={styles.detailValue}>"{message.timestamp}"</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
