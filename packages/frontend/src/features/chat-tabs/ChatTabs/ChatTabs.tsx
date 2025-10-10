/**
 * Chat Tabs Component
 * Shows tabs for all active chat sessions
 */

import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locationsSlice';
import styles from './ChatTabs.module.css';

export function ChatTabs() {
  const chats = useStore(state => state.chats);
  const activeChat = useStore(state => state.activeChat);
  const setActiveChat = useStore(state => state.setActiveChat);
  const closeChat = useStore(state => state.closeChat);
  const getLocation = useLocationsStore(state => state.getLocation);

  // Convert Map to array for rendering with location depth data
  const chatsArray = Array.from(chats.entries()).map(([spawnId, chat]) => {
    // Check if this is a saved location to get depth info
    const locationData = chat.entityType === 'location' ? getLocation(spawnId) : null;
    
    return {
      ...chat,
      spawnId,
      depthLevel: locationData?.depth_level ?? 0,
      isSubLocation: locationData?.parent_location_id !== null && locationData?.parent_location_id !== undefined
    };
  });

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
      <div className={styles.header}>Entities</div>
      <div className={styles.chatList}>
        {chatsArray.map(chat => (
          <div
            key={chat.spawnId}
            className={`${styles.chatButton} ${activeChat === chat.spawnId ? styles.active : ''}`}
            onClick={() => handleTabClick(chat.spawnId)}
            data-entity-type={chat.entityType || 'character'}
            style={{
              paddingLeft: `calc(var(--spacing-md) + ${chat.depthLevel * 20}px)`
            }}
          >
            {chat.isSubLocation && (
              <span className={styles.hierarchyIndicator}>└─</span>
            )}
            {chat.entityImage && (
              <img 
                src={chat.entityImage} 
                alt={chat.entityName}
                className={styles.entityImage}
              />
            )}
            {!chat.entityImage && (
              <div className={styles.imagePlaceholder}>
                {chat.entityName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.chatInfo}>
              <span className={styles.entityName}>{chat.entityName}</span>
            </div>
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
    </div>
  );
}
