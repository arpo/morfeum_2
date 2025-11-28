/**
 * Entity Persistence
 * Unified save and pin logic for all entity types
 */

import { storageService } from '../../../services/storage/storageService';
import mediaService from '../../../services/media/mediaService';

export interface EntityData {
  id: string;
  name: string;
  details: Record<string, any>;
  primaryMedia?: string;
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
  } else if (entityType === 'location') {
    // Load existing worlds
    const existingData = await storageService.loadWorlds() || {
      nodes: {},
      views: {},
      worldTrees: [],
      pinnedIds: []
    };

    // Save world tree
    // Note: We're storing the whole tree structure as a "node" for now to match frontend expectations
    // In the future, this should be properly split into nodes and trees
    existingData.nodes[entity.id] = entity;

    // Pin if not already pinned
    if (!existingData.pinnedIds.includes(entity.id)) {
      existingData.pinnedIds.push(entity.id);
    }

    // Persist to backend
    await storageService.saveWorlds(existingData);
    
    console.log(`[EntityPersistence] Location saved and pinned: ${entity.id}`);
  }
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
  // Create media entry for the character image
  const media = mediaService.createMedia({
    type: 'image',
    url: imageUrl,
    metadata: {
      prompt: imagePrompt,
      model: 'FLUX', // Assuming FLUX as per README example, or could be generic
      width: 1024,
      height: 1024
    },
    entityRefs: [spawnId]
  });

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
      seed,
      visualAnalysis
    },
    primaryMedia: media.id
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
  // Create media entry for the location image
  const media = mediaService.createMedia({
    type: 'image',
    url: imageUrl,
    metadata: {
      prompt: worldTree.imagePrompt || 'Location image',
      model: 'FLUX',
      width: 1024,
      height: 1024
    },
    entityRefs: [spawnId]
  });

  return {
    id: spawnId,
    name: worldTree.name || 'World',
    details: worldTree,
    primaryMedia: media.id
  };
}
