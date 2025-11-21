import React, { useState } from 'react';
import { IconChevronDown } from '@/icons';
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
}

interface TreeNodeProps {
  item: TreeItem;
  onSelect?: (item: TreeItem) => void;
  selectedId?: string;
  depth?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ item, onSelect, selectedId, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(item.isExpanded ?? false);
  const hasChildren = item.children && item.children.length > 0;
  const isSelected = selectedId === item.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(item);
    }
    // If it has children, we might want to toggle expansion on click?
    // Standard behavior is click label -> select, click arrow -> toggle.
    // Some UIs toggle on label click too. Let's stick to separate controls for precision.
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

export const TreeView: React.FC<TreeViewProps> = ({ data, onSelect, selectedId, className }) => {
  return (
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
  );
};
