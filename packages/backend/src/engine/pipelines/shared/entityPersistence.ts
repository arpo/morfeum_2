/**
 * Entity Persistence
 * Unified save and pin logic for all entity types
 */

import { storageService } from '../../../services/storage/storageService';

export interface EntityData {
  id: string;
  name: string;
  details: Record<string, any>;
  imagePath: string;
}

export type EntityType = 'character' | 'location';

/**
 * Save entity to backend storage and pin it
 * Works for both characters and locations (when storage is implemented)
 */
export async function saveAndPinEntity(
  entityType: EntityType,
  entity: EntityData
): Promise<void> {
  if (entityType === 'character') {
    // Load existing characters
    const existingData = await storageService.loadCharacters() || {
      characters: {},
      pinnedIds: []
    };

    // Save character
    existingData.characters[entity.id] = entity;

    // Pin if not already pinned
    if (!existingData.pinnedIds.includes(entity.id)) {
      existingData.pinnedIds.push(entity.id);
    }

    // Persist to backend
    await storageService.saveCharacters(existingData);
    
    console.log(`[EntityPersistence] Character saved and pinned: ${entity.id}`);
  } 
  // TODO: Add location storage when implemented
  // else if (entityType === 'location') {
  //   const existingData = await storageService.loadWorlds() || {
  //     worlds: {},
  //     pinnedIds: []
  //   };
  //   existingData.worlds[entity.id] = entity;
  //   if (!existingData.pinnedIds.includes(entity.id)) {
  //     existingData.pinnedIds.push(entity.id);
  //   }
  //   await storageService.saveWorlds(existingData);
  // }
}

/**
 * Build character entity from pipeline data
 */
export function buildCharacterEntity(
  spawnId: string,
  seed: any,
  visualAnalysis: any,
  deepProfile: any,
  imageUrl: string,
  imagePrompt: string
): EntityData {
  return {
    id: spawnId,
    name: seed.name,
    details: {
      name: seed.name,
      looks: seed.looks,
      wearing: seed.wearing || '',
      face: visualAnalysis.face || '',
      body: visualAnalysis.body || '',
      hair: visualAnalysis.hair || '',
      specificDetails: visualAnalysis.specificDetails || '',
      style: deepProfile.style || '',
      personality: seed.personality || deepProfile.personality || '',
      voice: deepProfile.voice || '',
      speechStyle: deepProfile.speechStyle || '',
      gender: deepProfile.gender || '',
      nationality: deepProfile.nationality || '',
      fictional: deepProfile.fictional || true,
      copyright: deepProfile.copyright || false,
      tags: deepProfile.tags || '',
      imageUrl,
      imagePrompt,
      seed,
      visualAnalysis
    },
    imagePath: imageUrl
  };
}

/**
 * Build location entity from pipeline data
 * TODO: Implement when location storage is ready
 */
export function buildLocationEntity(
  spawnId: string,
  worldTree: any,
  imageUrl: string
): EntityData {
  return {
    id: spawnId,
    name: worldTree.name || 'World',
    details: worldTree,
    imagePath: imageUrl
  };
}
