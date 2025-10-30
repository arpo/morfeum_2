import { IconSquare, IconSquareCheckFilled } from '@/icons';
import type { CheckboxProps } from './types';
import styles from './Checkbox.module.css';

export function Checkbox({ 
  checked, 
  onChange, 
  label, 
  disabled = false,
  className = ''
}: CheckboxProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <label 
      className={`${styles.checkboxLabel} ${disabled ? styles.disabled : ''} ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
    >
      <span className={styles.iconWrapper}>
        {checked ? (
          <IconSquareCheckFilled size={20} className={styles.icon} />
        ) : (
          <IconSquare size={20} className={styles.icon} />
        )}
      </span>
      {label && <span className={styles.labelText}>{label}</span>}
      {/* Hidden native checkbox for form compatibility */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={styles.hiddenInput}
        tabIndex={-1}
        aria-hidden="true"
      />
    </label>
  );
}
