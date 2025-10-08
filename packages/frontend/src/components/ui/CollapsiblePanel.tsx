import { useState, ReactNode } from 'react';
import styles from './CollapsiblePanel.module.css';

export interface CollapsiblePanelProps {
  title: string;
  badge?: number | string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export function CollapsiblePanel({ 
  title, 
  badge, 
  defaultExpanded = false, 
  children 
}: CollapsiblePanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={toggleExpanded}>
        <div>
          <span className={styles.title}>{title}</span>
          {badge !== undefined && (
            <span className={styles.badge}>{badge}</span>
          )}
        </div>
        <span className={`${styles.toggleIcon} ${!isExpanded ? styles.collapsed : ''}`}>
          ▼
        </span>
      </div>
      
      {isExpanded && (
        <div className={styles.content}>
          {children}
        </div>
      )}
    </div>
  );
}
