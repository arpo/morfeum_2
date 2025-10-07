/**
 * Theme Toggle Logic
 * Pure business logic for theme management
 */

import { useCallback } from 'react';
import { useThemeStore, type Theme } from '@/store/slices/themeSlice';

export function useThemeToggleLogic() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useThemeStore();

  const handleToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, [setTheme]);

  return {
    currentTheme: theme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
    toggle: handleToggle,
    setTheme: handleThemeChange,
  };
}

export type ThemeToggleLogicReturn = ReturnType<typeof useThemeToggleLogic>;
