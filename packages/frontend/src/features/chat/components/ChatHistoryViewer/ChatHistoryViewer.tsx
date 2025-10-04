import { useChatHistoryLogic } from './useChatHistoryLogic';
import type { ChatHistoryViewerProps } from './types';
import styles from './ChatHistoryViewer.module.css';

export function ChatHistoryViewer({ messages }: ChatHistoryViewerProps) {
  const { expandedItems, toggleItem } = useChatHistoryLogic();

  const getRoleClassName = (role: string) => {
    switch (role) {
      case 'system': return styles.roleSystem;
      case 'user': return styles.roleUser;
      case 'assistant': return styles.roleAssistant;
      default: return '';
    }
  };

  if (messages.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.header}>Chat History</h3>
        <div className={styles.emptyState}>No messages yet</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.header}>
        Chat History <span className={styles.count}>[{messages.length}]</span>
      </h3>
      
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
    </div>
  );
}
