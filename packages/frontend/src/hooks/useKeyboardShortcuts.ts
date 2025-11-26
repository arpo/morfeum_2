/**
 * Centralized keyboard shortcuts hook
 * Handles global shorthand keyboard shortcuts
 */

import { useEffect } from 'react';
import { useStore } from '@/store';
import { KEYBOARD_SHORTCUTS } from '@/config';

export function useKeyboardShortcuts() {
  const toggleSpawnInput = useStore(state => state.toggleSpawnInput);
  const toggleEntityExplorerPanel = useStore(state => state.toggleEntityExplorerPanel);
  const toggleFocusMode = useStore(state => state.toggleFocusMode);
  const focusModeEnabled = useStore(state => state.focusModeEnabled);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      const isTyping = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isTyping) return;

      // Don't trigger if modifier keys are pressed
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Handle shortcuts
      if (e.key === KEYBOARD_SHORTCUTS.TOGGLE_FOCUS_MODE) {
        e.preventDefault();
        toggleFocusMode();
      } else if (e.key === KEYBOARD_SHORTCUTS.TOGGLE_SPAWN_INPUT) {
        e.preventDefault();
        // Exit focus mode if active, then toggle spawn input
        if (focusModeEnabled) {
          toggleFocusMode();
        }
        toggleSpawnInput();
      } else if (e.key === KEYBOARD_SHORTCUTS.TOGGLE_ENTITY_EXPLORER) {
        e.preventDefault();
        // Exit focus mode if active, then toggle entity explorer
        if (focusModeEnabled) {
          toggleFocusMode();
        }
        toggleEntityExplorerPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSpawnInput, toggleEntityExplorerPanel, toggleFocusMode, focusModeEnabled]);
}
