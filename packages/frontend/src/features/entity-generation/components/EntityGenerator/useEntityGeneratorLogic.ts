import { useState, useCallback, useEffect } from 'react';
import type { EntityGeneratorLogicReturn, EntitySeed } from './types';

export function useEntityGeneratorLogic(): EntityGeneratorLogicReturn {
  const [textPrompt, setTextPrompt] = useState('');
  const [generatedSeed, setGeneratedSeed] = useState<EntitySeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [samplePrompts, setSamplePrompts] = useState<string[]>([]);

  // Fetch sample prompts on mount
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const response = await fetch('/api/mzoo/prompts/entity-samples');
        if (response.ok) {
          const result = await response.json();
          setSamplePrompts(result.data.samples);
        }
      } catch (err) {
        console.error('Failed to fetch sample prompts:', err);
      }
    };
    
    fetchSamples();
  }, []);

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

  const shufflePrompt = useCallback(() => {
    if (samplePrompts.length > 0) {
      const randomIndex = Math.floor(Math.random() * samplePrompts.length);
      setTextPrompt(samplePrompts[randomIndex]);
    }
  }, [samplePrompts]);

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
      shufflePrompt,
      clearError
    }
  };
}
