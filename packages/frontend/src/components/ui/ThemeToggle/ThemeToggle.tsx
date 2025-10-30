/**
 * Theme Toggle Component
 * Pure JSX markup for theme switching interface
 */

import { IconSun, IconMoon, IconSettings } from '@/icons';
import { useThemeToggleLogic } from './useThemeToggleLogic';
import { type ThemeToggleProps } from './types';
import styles from './ThemeToggle.module.css';

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { resolvedTheme, isDark, isSystem, toggle } = useThemeToggleLogic();

  const getIcon = () => {
    if (isSystem) {
      return <IconSettings className={`${styles.icon} ${styles.system}`} />;
    }
    return isDark ? (
      <IconSun className={`${styles.icon} ${styles.sun}`} />
    ) : (
      <IconMoon className={`${styles.icon} ${styles.moon}`} />
    );
  };

  const getLabel = () => {
    if (isSystem) return 'System';
    return isDark ? 'Light' : 'Dark';
  };

  return (
    <button
      className={`${styles.toggle} ${className}`}
      onClick={toggle}
      type="button"
      aria-label={`Switch to ${getLabel()} theme`}
      title={`Current theme: ${resolvedTheme}. Click to switch to ${getLabel()} theme`}
      data-component="theme-toggle"
    >
      {getIcon()}
      <span className={styles.label}>{getLabel()}</span>
    </button>
  );
}
