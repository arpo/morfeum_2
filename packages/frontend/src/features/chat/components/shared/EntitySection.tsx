// EntitySection Component - PURE JSX ONLY
import styles from './EntityDetailShared.module.css';

export interface EntitySectionProps {
  title: string;
  children: React.ReactNode;
}

export function EntitySection({ title, children }: EntitySectionProps) {
  return (
    <div className={styles.subsection}>
      <h4 className={styles.subsectionTitle}>{title}</h4>
      {children}
    </div>
  );
}
