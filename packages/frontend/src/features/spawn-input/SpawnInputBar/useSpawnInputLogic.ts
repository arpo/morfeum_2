/**
 * Spawn Input Bar Logic
 * Simplified input for triggering spawn processes
 */

import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store';
import type { SpawnInputBarLogicReturn } from './types';

export function useSpawnInputLogic(): SpawnInputBarLogicReturn {
  const [textPrompt, setTextPrompt] = useState('');
  const [entityType, setEntityType] = useState<'character' | 'location'>('location');
  const [error, setError] = useState<string | null>(null);
  const [samplePrompts, setSamplePrompts] = useState<string[]>([]);

  const startSpawn = useStore(state => state.startSpawn);

  // Fetch sample prompts based on entity type
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const endpoint = entityType === 'location' 
          ? '/api/mzoo/prompts/location-samples' 
          : '/api/mzoo/prompts/entity-samples';
        const response = await fetch(endpoint);
        if (response.ok) {
          const result = await response.json();
          setSamplePrompts(result.data.samples);
        }
      } catch (err) {
        // Silent fail - sample prompts are optional
      }
    };
    
    fetchSamples();
  }, [entityType]);

  const handleGenerate = useCallback(async () => {
    if (!textPrompt.trim()) return;

    try {
      await startSpawn(textPrompt.trim(), entityType);
      
      // Clear input after starting spawn
      setTextPrompt('');
      setError(null);
    } catch (err) {
      const errorMessage = 'Error: Could not start entity spawn.';
      setError(errorMessage);
      console.error('[SpawnInputBar] Failed to start spawn:', err);
    }
  }, [textPrompt, entityType, startSpawn]);

  const handleShuffle = useCallback(() => {
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
      entityType,
      error
    },
    handlers: {
      setTextPrompt,
      setEntityType,
      handleGenerate,
      handleShuffle,
      clearError
    }
  };
}
