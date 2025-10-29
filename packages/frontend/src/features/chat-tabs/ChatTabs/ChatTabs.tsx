/**
 * Chat Tabs Component
 * Shows tabs for all active chat sessions
 */

import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locationsSlice';
import styles from './ChatTabs.module.css';

export function ChatTabs() {
  const entities = useStore(state => state.entities);
  const activeEntity = useStore(state => state.activeEntity);
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const closeEntity = useStore(state => state.closeEntity);
  const getNode = useLocationsStore(state => state.getNode);
  const worldTrees = useLocationsStore(state => state.worldTrees);
  const deleteWorldTree = useLocationsStore(state => state.deleteWorldTree);
  const removeNodeFromTree = useLocationsStore(state => state.removeNodeFromTree);
  const deleteNode = useLocationsStore(state => state.deleteNode);

  // Convert Map to array for rendering with location depth data
  const entitiesArray = Array.from(entities.entries()).map(([spawnId, entity]) => {
    // Check if this is a saved location node to get depth info from tree
    const node = entity.entityType === 'location' ? getNode(spawnId) : null;
    
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
      ...entity,
      spawnId,
      depthLevel,
      isSubLocation
    };
  });

  // Don't render if no entities
  if (entitiesArray.length === 0) {
    return null;
  }

  const handleTabClick = (spawnId: string) => {
    setActiveEntity(spawnId);
  };

  const handleCloseTab = (e: React.MouseEvent, spawnId: string) => {
    e.stopPropagation();
    
    // Check if this is a location node that should be deleted from tree
    const entity = entities.get(spawnId);
    if (entity?.entityType === 'location') {
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
            // Check if this is the host root node
            if (node.type === 'host') {
              // Delete entire host tree
              deleteWorldTree(spawnId);
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
    
    // Always close the entity session
    closeEntity(spawnId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>Entities</div>
      <div className={styles.chatList}>
        {entitiesArray.map(entity => (
          <div
            key={entity.spawnId}
            className={`${styles.chatButton} ${activeEntity === entity.spawnId ? styles.active : ''}`}
            onClick={() => handleTabClick(entity.spawnId)}
            data-entity-type={entity.entityType || 'character'}
            style={{
              paddingLeft: `calc(var(--spacing-md) + ${entity.depthLevel * 20}px)`
            }}
          >
            {entity.isSubLocation && (
              <span className={styles.hierarchyIndicator}>└─</span>
            )}
            {entity.entityImage && (
              <img 
                src={entity.entityImage} 
                alt={entity.entityName}
                className={styles.entityImage}
              />
            )}
            {!entity.entityImage && (
              <div className={styles.imagePlaceholder}>
                {entity.entityName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.chatInfo}>
              <span className={styles.entityName}>{entity.entityName}</span>
            </div>
            <button
              className={styles.closeButton}
              onClick={(e) => handleCloseTab(e, entity.spawnId)}
              title="Close entity"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
