import React, { useState, useEffect, useContext, createContext } from 'react';
import { IconChevronDown, IconTrash, IconArrowBadgeRight, IconLoader2 } from '@/icons';
import { InlineConfirm } from '@/components/ui/InlineConfirm';
import { useLocationsStore } from '@/store/slices/locations';
import { useStore } from '@/store';
import styles from './TreeView.module.css';

export interface TreeItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  image?: string; // URL for thumbnail
  children?: TreeItem[];
  data?: any; // Original data payload
  isExpanded?: boolean; // Initial expanded state (optional)
  /** True for pass-through regions that inherit all DNA from host */
  isPassThrough?: boolean;
  /** True for view nodes (camera angles within a space) - styled with italic text */
  isView?: boolean;
  /** True if the node has an upscaled image version */
  isUpscaled?: boolean;
}

interface TreeViewProps {
  data: TreeItem[];
  onSelect?: (item: TreeItem) => void;
  onDelete?: (item: TreeItem) => void;
  selectedId?: string;
  className?: string;
  persistenceKey?: string; // Key for localStorage persistence
}

interface TreeNodeProps {
  item: TreeItem;
  onSelect?: (item: TreeItem) => void;
  onDelete?: (item: TreeItem) => void;
  selectedId?: string;
  depth?: number;
}

interface TreeViewContextType {
  expandedIds: Set<string>;
  toggleExpansion: (id: string) => void;
  onDelete?: (item: TreeItem) => void;
}

const TreeViewContext = createContext<TreeViewContextType>({
  expandedIds: new Set(),
  toggleExpansion: () => {},
  onDelete: undefined,
});

const TreeNode: React.FC<TreeNodeProps> = ({ item, onSelect, selectedId, depth = 0 }) => {
  const { expandedIds, toggleExpansion, onDelete } = useContext(TreeViewContext);
  
  // Check if this node is being upscaled
  const upscalingEntityIds = useStore(state => state.upscalingEntityIds);
  const isUpscaling = upscalingEntityIds.has(item.id);
  
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
    // Block selection of pass-through nodes (but allow expand/collapse)
    if (item.isPassThrough) {
      return;
    }
    if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <div className={styles.itemContainer}>
      <div 
        className={`${styles.itemContent} ${isSelected ? styles.selected : ''} ${item.isPassThrough ? styles.passThrough : ''} ${item.isView ? styles.viewNode : ''}`}
        onClick={handleSelect}
        title={item.isPassThrough ? 'Pass-through region (inherits from host)' : item.isView ? 'View (camera angle)' : undefined}
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
          {/* Upscaling spinner overlay */}
          {isUpscaling && (
            <div className={styles.upscalingOverlay}>
              <IconLoader2 size={12} className={styles.upscalingSpinner} />
            </div>
          )}
          {/* HD badge for upscaled images */}
          {item.isUpscaled && !isUpscaling && (
            <div className={styles.hdBadge} title="Upscaled (4x)">
              HD
            </div>
          )}
        </div>

        <span className={styles.label} title={item.label}>
          {item.label}
        </span>

        {/* Pass-through indicator icon */}
        {item.isPassThrough && (
          <span className={styles.passThroughIndicator} title="Pass-through region (inherits from host)">
            <IconArrowBadgeRight size={14} />
          </span>
        )}

        {/* Delete button - NOT shown for pass-through nodes */}
        {onDelete && !item.isPassThrough && (
          <div className={styles.deleteContainer}>
            <InlineConfirm
              onConfirm={() => onDelete(item)}
              trigger={<IconTrash size={14} />}
              triggerTitle="Delete node"
              confirmTitle="Confirm delete"
              cancelTitle="Cancel"
              iconSize={14}
            />
          </div>
        )}
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

export const TreeView: React.FC<TreeViewProps> = ({ data, onSelect, onDelete, selectedId, className, persistenceKey }) => {
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
    // Use functional update to ensure we have the latest state
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      
      return next;
    });
  };

  // Sync local state changes to store (side effect, outside render phase)
  useEffect(() => {
    const locationsStore = useLocationsStore.getState();
    const currentStoreIds = new Set(locationsStore.expandedNodeIds || []);
    const localIds = Array.from(expandedIds);
    
    // Only update store if different to avoid loops
    if (currentStoreIds.size !== expandedIds.size || 
        localIds.some(id => !currentStoreIds.has(id))) {
      locationsStore.setExpandedNodes(localIds);
    }
  }, [expandedIds]);

  return (
    <TreeViewContext.Provider value={{ expandedIds, toggleExpansion, onDelete }}>
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
