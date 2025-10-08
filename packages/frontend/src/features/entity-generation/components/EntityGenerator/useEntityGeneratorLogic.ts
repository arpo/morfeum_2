import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store';
import type { EntityGeneratorLogicReturn, EntitySeed } from './types';

export function useEntityGeneratorLogic(): EntityGeneratorLogicReturn {
  const [textPrompt, setTextPrompt] = useState('');
  const [entityType, setEntityType] = useState<'character' | 'location'>('location');
  const [generatedSeed, setGeneratedSeed] = useState<EntitySeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [samplePrompts, setSamplePrompts] = useState<string[]>([]);
  
  // Get spawn manager from store
  const startSpawn = useStore(state => state.startSpawn);
  const cancelSpawn = useStore(state => state.cancelSpawn);
  const activeSpawns = useStore(state => state.activeSpawns);

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
        console.error('Failed to fetch sample prompts:', err);
      }
    };
    
    fetchSamples();
  }, [entityType]);

  const generateSeed = useCallback(async () => {
    if (!textPrompt.trim()) return;

    try {
      // Start spawn via server-side manager
      console.log('[EntityGenerator] Starting spawn with prompt:', textPrompt.trim(), 'type:', entityType);
      await startSpawn(textPrompt.trim(), entityType);
      
      // Clear the input after starting spawn
      setTextPrompt('');
      setError(null);
    } catch (err) {
      const errorMessage = 'Error: Could not start entity spawn.';
      setError(errorMessage);
      console.error('[EntityGenerator] Failed to start spawn:', err);
    }
  }, [textPrompt, entityType, startSpawn]);

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
      entityType,
      generatedSeed,
      loading,
      imageLoading,
      analysisLoading,
      profileLoading,
      error
    },
    handlers: {
      setTextPrompt,
      setEntityType,
      generateSeed,
      shufflePrompt,
      clearError
    }
  };
}
