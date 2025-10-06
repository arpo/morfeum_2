import { useState, useCallback } from 'react';
import type { EntityGeneratorLogicReturn, EntitySeed } from './types';

export function useEntityGeneratorLogic(): EntityGeneratorLogicReturn {
  const [textPrompt, setTextPrompt] = useState('');
  const [generatedSeed, setGeneratedSeed] = useState<EntitySeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSeed = useCallback(async () => {
    if (!textPrompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mzoo/entity/generate-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          textPrompt: textPrompt.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setGeneratedSeed(result.data);
    } catch (err) {
      const errorMessage = 'Error: Could not generate entity seed.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [textPrompt]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    state: {
      textPrompt,
      generatedSeed,
      loading,
      error
    },
    handlers: {
      setTextPrompt,
      generateSeed,
      clearError
    }
  };
}
