import React, { useState, useEffect } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultTabId?: string;
  activeTabId?: string; // Controlled mode
  onChange?: (tabId: string) => void;
  className?: string;
  contentClassName?: string;
}

export const Tabs: React.FC<TabsProps> = ({ 
  items, 
  defaultTabId, 
  activeTabId: controlledActiveTabId,
  onChange,
  className,
  contentClassName
}) => {
  const [internalActiveTabId, setInternalActiveTabId] = useState<string>(
    defaultTabId || (items.length > 0 ? items[0].id : '')
  );

  const isControlled = controlledActiveTabId !== undefined;
  const activeId = isControlled ? controlledActiveTabId : internalActiveTabId;

  const handleTabClick = (id: string) => {
    if (!isControlled) {
      setInternalActiveTabId(id);
    }
    if (onChange) {
      onChange(id);
    }
  };

  // Find active content
  const activeItem = items.find(item => item.id === activeId) || items[0];

  if (!items.length) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.tabList} role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={activeId === item.id}
            aria-controls={`panel-${item.id}`}
            className={`${styles.tab} ${activeId === item.id ? styles.active : ''}`}
            onClick={() => !item.disabled && handleTabClick(item.id)}
            disabled={item.disabled}
          >
            {item.icon && <span className={styles.tabIcon}>{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>
      
      <div className={`${styles.content} ${contentClassName || ''}`}>
        {activeItem && (
          <div 
            key={activeItem.id}
            role="tabpanel"
            id={`panel-${activeItem.id}`}
            className={styles.contentPanel}
          >
            {activeItem.content}
          </div>
        )}
      </div>
    </div>
  );
};
