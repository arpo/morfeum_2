/**
 * Training Data Hook
 * Handles training data save functionality
 */

import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';
import { saveTrainingData } from '@/services/trainingDataService';

export function useTrainingData() {
  const [trainingSaving, setTrainingSaving] = useState(false);
  const [trainingSavedEntityId, setTrainingSavedEntityId] = useState<string | null>(null);
  
  const activeEntity = useStore(state => state.activeEntity);
  const entities = useStore(state => state.entities);
  const activeEntitySession = activeEntity ? entities.get(activeEntity) : null;
  const isCharacter = activeEntitySession?.entityType === 'character';

  const handleSaveTrainingData = useCallback(async () => {
    if (!activeEntity || !activeEntitySession?.entityImage || trainingSaving) return;
    
    let text = '';
    let name = activeEntitySession.entityName || 'entity';
    
    if (isCharacter) {
      // Get character's details.looks with "A portrait of " prefix
      const character = useCharactersStore.getState().getCharacter(activeEntity);
      const looks = character?.details?.looks || '';
      text = looks ? `A portrait of ${looks}` : '';
    } else {
      // Get location's description with "A scene of " prefix
      const node = useLocationsStore.getState().getNode(activeEntity);
      const description = (node as any)?.description || '';
      text = description ? `A scene of ${description}` : '';
    }
    
    if (!text) {
      return;
    }
    
    setTrainingSaving(true);
    
    try {
      const result = await saveTrainingData({
        imageUrl: activeEntitySession.entityImage,
        text,
        name,
        entityId: activeEntity
      });
      
      if (result.success) {
        setTrainingSavedEntityId(activeEntity);
      }
    } finally {
      setTrainingSaving(false);
    }
  }, [activeEntity, activeEntitySession, isCharacter, trainingSaving]);

  // Reset trainingSaved when entity changes
  const trainingSaved = trainingSavedEntityId === activeEntity;

  return {
    trainingSaving,
    trainingSaved,
    handleSaveTrainingData,
  };
}
