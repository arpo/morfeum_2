import { useState, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const STORAGE_KEY = 'entityExplorerPanelPosition';
const DEFAULT_POSITION: Position = { x: 20, y: 80 };
const DEFAULT_SIZE: Size = { width: 350, height: 600 };

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
