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
  const getNode = useLocationsStore(state => state.getNode);
  const worldTrees = useLocationsStore(state => state.worldTrees);
  const deleteWorldTree = useLocationsStore(state => state.deleteWorldTree);
  const removeNodeFromTree = useLocationsStore(state => state.removeNodeFromTree);
  const deleteNode = useLocationsStore(state => state.deleteNode);

  // Convert Map to array for rendering with location depth data
  const chatsArray = Array.from(chats.entries()).map(([spawnId, chat]) => {
    // Check if this is a saved location node to get depth info from tree
    const node = chat.entityType === 'location' ? getNode(spawnId) : null;
    
    // Calculate depth from tree structure
    let depthLevel = 0;
    let isSubLocation = false;
    
    if (node) {
      // Find which world tree this node belongs to
      const findDepth = (treeNode: any, targetId: string, currentDepth: number): number | null => {
        if (treeNode.id === targetId) {
          return currentDepth;
        }
        
        if (treeNode.children) {
          for (const child of treeNode.children) {
            const found = findDepth(child, targetId, currentDepth + 1);
            if (found !== null) return found;
          }
        }
        
        return null;
      };
      
      // Search all world trees for this node
      for (const tree of worldTrees) {
        const depth = findDepth(tree, spawnId, 0);
        if (depth !== null) {
          depthLevel = depth;
          isSubLocation = depth > 0; // Anything beyond the world root
          break;
        }
      }
    }
    
    return {
      ...chat,
      spawnId,
      depthLevel,
      isSubLocation
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
    
    // Check if this is a location node that should be deleted from tree
    const chat = chats.get(spawnId);
    if (chat?.entityType === 'location') {
      const node = getNode(spawnId);
      if (node) {
        // Find which world tree this node belongs to
        const findWorldId = (treeNode: any, targetId: string): string | null => {
          if (treeNode.id === targetId) {
            return treeNode.id; // This is the world root
          }
          
          if (treeNode.children) {
            for (const child of treeNode.children) {
              const found = findWorldId(child, targetId);
              if (found !== null) return treeNode.id; // Return the root ID
            }
          }
          
          return null;
        };
        
        // Search all world trees for this node
        for (const tree of worldTrees) {
          const worldId = findWorldId(tree, spawnId);
          if (worldId !== null) {
            // Check if this is the world root node
            if (node.type === 'world') {
              // Delete entire world tree
              deleteWorldTree(spawnId);
              console.log(`[ChatTabs] Deleted world tree: ${spawnId}`);
            } else {
              // Delete child node from tree and nodes map
              removeNodeFromTree(worldId, spawnId);
              deleteNode(spawnId);
              console.log(`[ChatTabs] Deleted node from tree: ${spawnId}`);
            }
            break;
          }
        }
      }
    }
    
    // Always close the chat session
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
