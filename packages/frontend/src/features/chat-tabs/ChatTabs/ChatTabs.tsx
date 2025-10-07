/**
 * Chat Tabs Component
 * Shows tabs for all active chat sessions
 */

import { useStore } from '@/store';
import styles from './ChatTabs.module.css';

export function ChatTabs() {
  const chats = useStore(state => state.chats);
  const activeChat = useStore(state => state.activeChat);
  const setActiveChat = useStore(state => state.setActiveChat);
  const closeChat = useStore(state => state.closeChat);

  // Convert Map to array for rendering
  const chatsArray = Array.from(chats.entries()).map(([spawnId, chat]) => ({
    ...chat,
    spawnId
  }));

  // Don't render if no chats
  if (chatsArray.length === 0) {
    return null;
  }

  const handleTabClick = (spawnId: string) => {
    setActiveChat(spawnId);
  };

  const handleCloseTab = (e: React.MouseEvent, spawnId: string) => {
    e.stopPropagation();
    closeChat(spawnId);
  };

  return (
    <div className={styles.container}>
      {chatsArray.map(chat => (
        <div
          key={chat.spawnId}
          className={`${styles.tab} ${activeChat === chat.spawnId ? styles.active : ''}`}
          onClick={() => handleTabClick(chat.spawnId)}
        >
          <span className={styles.tabName}>{chat.entityName}</span>
          <button
            className={styles.closeButton}
            onClick={(e) => handleCloseTab(e, chat.spawnId)}
            title="Close chat"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
