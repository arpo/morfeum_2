import React, { useState, useEffect, useContext, createContext } from 'react';
import { IconChevronDown } from '@/icons';
import { useLocationsStore } from '@/store/slices/locations';
import styles from './TreeView.module.css';

export interface TreeItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  image?: string; // URL for thumbnail
  children?: TreeItem[];
  data?: any; // Original data payload
  isExpanded?: boolean; // Initial expanded state (optional)
}

interface TreeViewProps {
  data: TreeItem[];
  onSelect?: (item: TreeItem) => void;
  selectedId?: string;
  className?: string;
  persistenceKey?: string; // Key for localStorage persistence
}

interface TreeNodeProps {
  item: TreeItem;
  onSelect?: (item: TreeItem) => void;
  selectedId?: string;
  depth?: number;
}

interface TreeViewContextType {
  expandedIds: Set<string>;
  toggleExpansion: (id: string) => void;
}

const TreeViewContext = createContext<TreeViewContextType>({
  expandedIds: new Set(),
  toggleExpansion: () => {},
});

const TreeNode: React.FC<TreeNodeProps> = ({ item, onSelect, selectedId, depth = 0 }) => {
  const { expandedIds, toggleExpansion } = useContext(TreeViewContext);
  
  // Use context state if available (persistence), otherwise fallback to local prop or default
  const isExpanded = expandedIds.has(item.id) || (item.isExpanded && !expandedIds.size && !window.localStorage.getItem('tree_expanded'));  
  
  const hasChildren = item.children && item.children.length > 0;
  const isSelected = selectedId === item.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpansion(item.id);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <div className={styles.itemContainer}>
      <div 
        className={`${styles.itemContent} ${isSelected ? styles.selected : ''}`}
        onClick={handleSelect}
      >
        {hasChildren ? (
          <div 
            className={`${styles.toggleButton} ${!isExpanded ? styles.collapsed : ''}`}
            onClick={handleToggle}
          >
            <IconChevronDown size={16} />
          </div>
        ) : (
          <div className={styles.placeholderToggle} />
        )}

        <div className={styles.mediaContainer}>
          {item.image ? (
            <img src={item.image} alt={item.label} className={styles.thumbnail} />
          ) : (
            <span className={styles.icon}>{item.icon}</span>
          )}
        </div>

        <span className={styles.label} title={item.label}>
          {item.label}
        </span>
      </div>

      {hasChildren && isExpanded && (
        <div className={styles.children}>
          {item.children!.map((child) => (
            <TreeNode 
              key={child.id} 
              item={child} 
              onSelect={onSelect} 
              selectedId={selectedId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Helper to find path to a node
function findPathToNode(items: TreeItem[], targetId: string, currentPath: string[] = []): string[] | null {
  for (const item of items) {
    if (item.id === targetId) {
      return currentPath; // Return ancestors (not including self usually, or verify if self needed)
      // Self doesn't need expanding, but its parents do.
    }
    if (item.children) {
      const path = findPathToNode(item.children, targetId, [...currentPath, item.id]);
      if (path) return path;
    }
  }
  return null;
}

export const TreeView: React.FC<TreeViewProps> = ({ data, onSelect, selectedId, className, persistenceKey }) => {
  // Get expansion state from locations store
  const storeExpandedIds = useLocationsStore((state) => state.expandedNodeIds || []);
  
  // Initialize state from store or local storage
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Prefer store state
    if (storeExpandedIds.length > 0) {
      return new Set(storeExpandedIds);
    }
    // Fallback to localStorage
    if (persistenceKey) {
      try {
        const stored = localStorage.getItem(persistenceKey);
        if (stored) {
          return new Set(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Failed to load tree expansion state:', e);
      }
    }
    return new Set();
  });

  // Sync with store changes
  useEffect(() => {
    if (storeExpandedIds.length > 0) {
      setExpandedIds(new Set(storeExpandedIds));
    }
  }, [storeExpandedIds]);

  // Save to local storage whenever state changes
  useEffect(() => {
    if (persistenceKey) {
      try {
        localStorage.setItem(persistenceKey, JSON.stringify(Array.from(expandedIds)));
      } catch (e) {
        console.warn('Failed to save tree expansion state:', e);
      }
    }
  }, [expandedIds, persistenceKey]);

  // Auto-expand to select node
  useEffect(() => {
    if (selectedId && data.length > 0) {
      const ancestors = findPathToNode(data, selectedId);
      if (ancestors && ancestors.length > 0) {
        setExpandedIds(prev => {
          const next = new Set(prev);
          let changed = false;
          ancestors.forEach(id => {
            if (!next.has(id)) {
              next.add(id);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }
    }
  }, [selectedId, data]);

  const toggleExpansion = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      
      // Also update store
      const locationsStore = useLocationsStore.getState();
      locationsStore.setExpandedNodes(Array.from(next));
      
      return next;
    });
  };

  return (
    <TreeViewContext.Provider value={{ expandedIds, toggleExpansion }}>
      <div className={`${styles.tree} ${className || ''}`}>
        {data.map((item) => (
          <TreeNode 
            key={item.id} 
            item={item} 
            onSelect={onSelect} 
            selectedId={selectedId} 
          />
        ))}
      </div>
    </TreeViewContext.Provider>
  );
};
