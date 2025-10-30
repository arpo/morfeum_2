/**
 * Entity Tabs Component
 * Shows tabs for all active entity sessions
 */

import { useState } from 'react';
import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { IconInfoCircle, IconBookmark } from '@/icons';
import { LocationInfoModal } from '@/features/chat/components/LocationInfoModal';
import { CharacterInfoModal } from '@/features/chat/components/CharacterInfoModal';
import styles from './EntityTabs.module.css';

interface EntityTabsProps {
  onOpenSavedEntities: () => void;
}

export function EntityTabs({ onOpenSavedEntities }: EntityTabsProps) {
  const entities = useStore(state => state.entities);
  const activeEntity = useStore(state => state.activeEntity);
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const closeEntity = useStore(state => state.closeEntity);
  const getNode = useLocationsStore(state => state.getNode);
  const worldTrees = useLocationsStore(state => state.worldTrees);
  const deleteWorldTree = useLocationsStore(state => state.deleteWorldTree);
  const removeNodeFromTree = useLocationsStore(state => state.removeNodeFromTree);
  const deleteNode = useLocationsStore(state => state.deleteNode);

  // Modal state
  const [infoModalOpen, setInfoModalOpen] = useState<string | null>(null);

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
              console.log(`[EntityTabs] Deleted node from tree: ${spawnId}`);
            }
            break;
          }
        }
      }
    }
    
    // Always close the entity session
    closeEntity(spawnId);
  };

  const handleOpenInfo = (e: React.MouseEvent, spawnId: string) => {
    e.stopPropagation();
    setInfoModalOpen(spawnId);
  };

  const handleCloseInfo = () => {
    setInfoModalOpen(null);
  };

  return (
    <div className={styles.container} data-component="entity-tabs">
      <div className={styles.header}>
        <span className={styles.headerTitle}>Entities</span>
        <button
          className={styles.headerButton}
          onClick={onOpenSavedEntities}
          title="Browse saved locations"
        >
          <IconBookmark size={18} />
        </button>
      </div>
      <div className={styles.entityList}>
        {entitiesArray.map(entity => (
          <div
            key={entity.spawnId}
            className={`${styles.entityButton} ${activeEntity === entity.spawnId ? styles.active : ''}`}
            onClick={() => handleTabClick(entity.spawnId)}
            data-component="entity-tab"
            data-entity-id={entity.spawnId}
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
            <div className={styles.entityInfo}>
              <span className={styles.entityName}>{entity.entityName}</span>
            </div>
            <button
              className={styles.infoButton}
              onClick={(e) => handleOpenInfo(e, entity.spawnId)}
              title="View details"
              disabled={!entity.deepProfile}
            >
              <IconInfoCircle size={16} />
            </button>
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

      {/* Render modals for entities with info open */}
      {infoModalOpen && (() => {
        const entity = entities.get(infoModalOpen);
        if (!entity) return null;

        if (entity.entityType === 'location') {
          return (
            <LocationInfoModal
              locationProfile={entity.deepProfile as any}
              locationName={entity.entityName}
              locationId={infoModalOpen}
              isOpen={true}
              onClose={handleCloseInfo}
            />
          );
        } else {
          return (
            <CharacterInfoModal
              deepProfile={entity.deepProfile as any}
              characterName={entity.entityName}
              isOpen={true}
              onClose={handleCloseInfo}
            />
          );
        }
      })()}
    </div>
  );
}
