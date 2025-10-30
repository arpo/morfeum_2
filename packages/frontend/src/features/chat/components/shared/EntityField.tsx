// EntityField Component - PURE JSX ONLY
import styles from './EntityDetailShared.module.css';

export interface EntityFieldProps {
  label: string;
  value?: string | number | null;
  children?: React.ReactNode;
}

export function EntityField({ label, value, children }: EntityFieldProps) {
  // If children provided, use that instead of value
  if (children) {
    return (
      <div className={styles.field}>
        <label className={styles.label}>{label}</label>
        <div className={styles.value}>{children}</div>
      </div>
    );
  }

  // Handle empty/null values
  const displayValue = value ?? 'N/A';

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <p className={styles.value}>{displayValue}</p>
    </div>
  );
}
