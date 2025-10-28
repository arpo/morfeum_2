/**
 * Location Tree Panel Component
 * Displays hierarchical world tree structure
 */

import { useLocationTreeLogic } from './useLocationTreeLogic';
import styles from './LocationTreePanel.module.css';

interface LocationTreePanelProps {
  currentNodeId: string;
}

interface TreeNodeProps {
  node: {
    id: string;
    name: string;
    type: string;
    children: any[];
    isCurrentNode: boolean;
  };
  onNodeClick: (nodeId: string) => void;
  depth: number;
}

function TreeNode({ node, onNodeClick, depth }: TreeNodeProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'world':
        return '🌍';
      case 'region':
        return '📍';
      case 'location':
        return '🏛️';
      case 'sublocation':
        return '🚪';
      default:
        return '●';
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'world':
        return 'host';
      case 'sublocation':
        return 'niche';
      default:
        return type;
    }
  };

  return (
    <div className={styles.treeNode} style={{ paddingLeft: `${depth * 16}px` }}>
      <button
        onClick={() => onNodeClick(node.id)}
        className={`${styles.nodeButton} ${node.isCurrentNode ? styles.currentNode : ''}`}
      >
        <span className={styles.nodeIcon}>{getTypeIcon(node.type)}</span>
        <span className={styles.nodeName}>{node.name}</span>
        <span className={styles.nodeType}>({getTypeLabel(node.type)})</span>
      </button>
      {node.children.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          onNodeClick={onNodeClick}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function LocationTreePanel({ currentNodeId }: LocationTreePanelProps) {
  const { worldTrees, handleNodeClick } = useLocationTreeLogic(currentNodeId);

  if (worldTrees.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>World Tree</h3>
        </div>
        <div className={styles.emptyState}>
          No locations spawned yet
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>World Tree</h3>
        <p>Click a node to navigate</p>
      </div>
      <div className={styles.treeContainer}>
        {worldTrees.map((tree) => (
          <TreeNode
            key={tree.id}
            node={tree}
            onNodeClick={handleNodeClick}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}
