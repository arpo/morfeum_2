/**
 * Image Drop Logic Hook
 * Handles drag & drop functionality for image analysis
 */

import { useState, useCallback, DragEvent, ClipboardEvent } from 'react';

interface ImageDropState {
  isDragging: boolean;
  isAnalyzing: boolean;
  error: string | null;
}

interface ImageDropHandlers {
  handleDragEnter: (e: DragEvent) => void;
  handleDragLeave: (e: DragEvent) => void;
  handleDragOver: (e: DragEvent) => void;
  handleDrop: (e: DragEvent) => Promise<void>;
  handlePaste: (e: ClipboardEvent) => Promise<void>;
  clearError: () => void;
}

interface UseImageDropLogicReturn {
  state: ImageDropState;
  handlers: ImageDropHandlers;
}

interface UseImageDropLogicProps {
  onDescriptionReceived: (description: string) => void;
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get MIME type from file
 */
function getMimeType(file: File): string {
  return file.type || 'image/png';
}

/**
 * Analyze image using vision API
 */
async function analyzeImage(base64Image: string, mimeType: string): Promise<string> {
  const response = await fetch('/api/mzoo/vision', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64Image,
      mimeType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze image');
  }

  const result = await response.json();
  return result.data?.text || '';
}

export function useImageDropLogic({ onDescriptionReceived }: UseImageDropLogicProps): UseImageDropLogicReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if dragging files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set false if leaving the container (not entering a child)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please drop an image file');
      return;
    }

    try {
      setIsAnalyzing(true);
      
      const base64 = await fileToBase64(file);
      const mimeType = getMimeType(file);
      const description = await analyzeImage(base64, mimeType);
      
      onDescriptionReceived(description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onDescriptionReceived]);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Find image in clipboard
    let imageFile: File | null = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        imageFile = items[i].getAsFile();
        break;
      }
    }

    // If no image found, let normal paste behavior continue
    if (!imageFile) return;

    // Prevent default paste behavior for images
    e.preventDefault();
    setError(null);

    try {
      setIsAnalyzing(true);
      
      const base64 = await fileToBase64(imageFile);
      const mimeType = getMimeType(imageFile);
      const description = await analyzeImage(base64, mimeType);
      
      onDescriptionReceived(description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onDescriptionReceived]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    state: {
      isDragging,
      isAnalyzing,
      error,
    },
    handlers: {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handlePaste,
      clearError,
    },
  };
}
