import { useState, useEffect } from 'react';
import { PANEL_CONFIG } from '@/config';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const STORAGE_KEY = 'entityExplorerPanelPosition';
const DEFAULT_POSITION: Position = PANEL_CONFIG.ENTITY_EXPLORER.DEFAULT_POSITION;
const DEFAULT_SIZE: Size = PANEL_CONFIG.ENTITY_EXPLORER.DEFAULT_SIZE;

export function useEntityExplorerPanel() {
  const [position, setPosition] = useState<Position>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_POSITION;
      }
    }
    return DEFAULT_POSITION;
  });

  const [size, setSize] = useState<Size>(DEFAULT_SIZE);

  // Save position to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  return {
    position,
    size,
    setPosition,
    setSize,
  };
}
