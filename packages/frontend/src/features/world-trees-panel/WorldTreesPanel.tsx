import React from 'react';
import { IconWorld, IconMapPin, IconHome, IconChevronRight, IconChevronDown, IconPinFilled, IconBookmark } from '@/icons';
import { useWorldTreesLogic } from './useWorldTreesLogic';
import type { WorldTreesPanelProps, TreeNode } from './types';
import styles from './WorldTreesPanel.module.css';

export function WorldTreesPanel({ className, onOpenSavedWorlds }: WorldTreesPanelProps) {
  const { 
    pinnedWorldTrees, 
    toggleExpanded, 
    handleNodeClick, 
    handleUnpinWorld,
    activeNodeId
  } = useWorldTreesLogic();

  const getNodeIcon = (node: TreeNode['node']) => {
    if (node.type === 'host') return <IconWorld size={16} />;
    if (node.type === 'niche' || node.spaceType === 'interior') return <IconHome size={16} />;
    return <IconMapPin size={16} />;
  };

  const renderTree = (nodes: TreeNode[]) => {
    return nodes.map((treeNode) => (
      <React.Fragment key={treeNode.id}>
        <div 
          className={`${styles.node} ${activeNodeId === treeNode.id ? styles.active : ''}`}
          style={{ paddingLeft: `calc(var(--spacing-sm) + ${treeNode.depth * 16}px)` }}
          onClick={() => handleNodeClick(treeNode.id)}
        >
          <button 
            className={styles.expandButton}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(treeNode.id);
            }}
            style={{ visibility: treeNode.children.length > 0 ? 'visible' : 'hidden' }}
          >
            {treeNode.isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
          </button>
          
          <div className={styles.nodeIcon}>
            {getNodeIcon(treeNode.node)}
          </div>
          
          <span className={styles.nodeName} title={treeNode.node.name}>
            {treeNode.node.name}
          </span>
          
          {treeNode.depth === 0 && (
            <button
              className={styles.unpinButton}
              onClick={(e) => {
                e.stopPropagation();
                handleUnpinWorld(treeNode.id);
              }}
              title="Unpin world"
            >
              <IconPinFilled size={14} />
            </button>
          )}
        </div>
        
        {treeNode.isExpanded && treeNode.children.length > 0 && (
          <div className={styles.children}>
            {renderTree(treeNode.children)}
          </div>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className={`${styles.container} ${className || ''}`} data-component="world-trees-panel">
      <div className={styles.header}>
        <span className={styles.headerTitle}>Pinned Worlds</span>
        {onOpenSavedWorlds && (
          <button 
            className={styles.expandButton} // Reuse expand button style for now or create new one
            onClick={onOpenSavedWorlds}
            title="Browse all saved worlds"
          >
            <IconBookmark size={16} />
          </button>
        )}
      </div>
      
      {pinnedWorldTrees.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No pinned worlds</p>
          <p>Click bookmark to browse</p>
        </div>
      ) : (
        <div className={styles.treeList}>
          {renderTree(pinnedWorldTrees)}
        </div>
      )}
    </div>
  );
}
