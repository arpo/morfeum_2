/**
 * Migration Script: Move Images to Media System
 * 
 * This script migrates existing images from characters.json and worlds.json
 * to the new media.json system.
 */

import fs from 'fs';
import path from 'path';
import { mediaService } from './index';
import type { CreateMediaInput } from './types';

const CHARACTERS_FILE = path.join(__dirname, '../../../temp-db/characters.json');
const WORLDS_FILE = path.join(__dirname, '../../../temp-db/worlds.json');

interface OldCharacter {
  id: string;
  name: string;
  imagePath?: string;
  details?: {
    imageUrl?: string;
    imagePrompt?: string;
    seed?: any;
  };
}

interface OldWorld {
  id: string;
  name: string;
  imagePath?: string;
  imageUrl?: string;
  dna?: {
    imageUrl?: string;
    imagePrompt?: string;
    seed?: any;
  };
}

interface MigrationReport {
  totalCharacters: number;
  migratedCharacters: number;
  totalWorlds: number;
  migratedWorlds: number;
  mediaCreated: number;
  errors: string[];
}

/**
 * Extract image URL from character or world node
 */
function extractImageUrl(entity: OldCharacter | OldWorld): string | null {
  // Check multiple possible locations for image URL
  if ('imagePath' in entity && entity.imagePath) {
    return entity.imagePath;
  }
  
  if ('imageUrl' in entity && entity.imageUrl) {
    return entity.imageUrl;
  }
  
  if ('details' in entity && entity.details?.imageUrl) {
    return entity.details.imageUrl;
  }
  
  if ('dna' in entity && entity.dna?.imageUrl) {
    return entity.dna.imageUrl;
  }
  
  return null;
}

/**
 * Extract image prompt from character or world node
 */
function extractImagePrompt(entity: OldCharacter | OldWorld): string {
  if ('details' in entity && entity.details?.imagePrompt) {
    return entity.details.imagePrompt;
  }
  
  if ('dna' in entity && entity.dna?.imagePrompt) {
    return entity.dna.imagePrompt;
  }
  
  return 'Generated image';
}

/**
 * Extract seed/metadata from character or world node
 */
function extractSeedMetadata(entity: OldCharacter | OldWorld): any {
  if ('details' in entity && entity.details?.seed) {
    return entity.details.seed;
  }
  
  if ('dna' in entity && entity.dna?.seed) {
    return entity.dna.seed;
  }
  
  return null;
}

/**
 * Migrate characters to media system
 */
function migrateCharacters(report: MigrationReport): Map<string, string> {
  const entityToMediaMap = new Map<string, string>();
  
  try {
    const data = fs.readFileSync(CHARACTERS_FILE, 'utf-8');
    const charactersData = JSON.parse(data);
    const characters = charactersData.characters || {};
    
    report.totalCharacters = Object.keys(characters).length;
    
    for (const [charId, character] of Object.entries(characters)) {
      const char = character as OldCharacter;
      const imageUrl = extractImageUrl(char);
      
      if (!imageUrl) {
        continue; // Skip characters without images
      }
      
      try {
        const prompt = extractImagePrompt(char);
        const seed = extractSeedMetadata(char);
        
        const mediaInput: CreateMediaInput = {
          type: 'image',
          url: imageUrl,
          metadata: {
            prompt: prompt,
            model: 'FLUX', // Default, can be updated later
            ...(seed?.originalPrompt && { originalPrompt: seed.originalPrompt })
          },
          entityRefs: [charId]
        };
        
        const newMedia = mediaService.createMedia(mediaInput);
        entityToMediaMap.set(charId, newMedia.id);
        
        report.migratedCharacters++;
        report.mediaCreated++;
      } catch (error) {
        report.errors.push(`Failed to migrate character ${charId}: ${error}`);
      }
    }
  } catch (error) {
    report.errors.push(`Failed to read characters.json: ${error}`);
  }
  
  return entityToMediaMap;
}

/**
 * Recursively process world tree nodes
 */
function processWorldNode(node: any, entityToMediaMap: Map<string, string>, report: MigrationReport): void {
  const imageUrl = extractImageUrl(node);
  
  if (imageUrl && node.id) {
    try {
      const prompt = extractImagePrompt(node);
      const seed = extractSeedMetadata(node);
      
      const mediaInput: CreateMediaInput = {
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: prompt,
          model: 'FLUX',
          ...(seed?.originalPrompt && { originalPrompt: seed.originalPrompt })
        },
        entityRefs: [node.id]
      };
      
      const newMedia = mediaService.createMedia(mediaInput);
      entityToMediaMap.set(node.id, newMedia.id);
      
      report.migratedWorlds++;
      report.mediaCreated++;
    } catch (error) {
      report.errors.push(`Failed to migrate world node ${node.id}: ${error}`);
    }
  }
  
  // Process children recursively
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      processWorldNode(child, entityToMediaMap, report);
    }
  }
}

/**
 * Migrate worlds to media system
 */
function migrateWorlds(report: MigrationReport): Map<string, string> {
  const entityToMediaMap = new Map<string, string>();
  
  try {
    const data = fs.readFileSync(WORLDS_FILE, 'utf-8');
    const worldsData = JSON.parse(data);
    
    // Process flat nodes structure
    const nodes = worldsData.nodes || {};
    report.totalWorlds = Object.keys(nodes).length;
    
    for (const [nodeId, node] of Object.entries(nodes)) {
      const imageUrl = extractImageUrl(node as OldWorld);
      
      if (!imageUrl) {
        continue;
      }
      
      try {
        const prompt = extractImagePrompt(node as OldWorld);
        const seed = extractSeedMetadata(node as OldWorld);
        
        const mediaInput: CreateMediaInput = {
          type: 'image',
          url: imageUrl,
          metadata: {
            prompt: prompt,
            model: 'FLUX',
            ...(seed?.originalPrompt && { originalPrompt: seed.originalPrompt })
          },
          entityRefs: [nodeId]
        };
        
        const newMedia = mediaService.createMedia(mediaInput);
        entityToMediaMap.set(nodeId, newMedia.id);
        
        report.migratedWorlds++;
        report.mediaCreated++;
      } catch (error) {
        report.errors.push(`Failed to migrate world node ${nodeId}: ${error}`);
      }
    }
    
    // Also process world trees if present
    if (worldsData.worldTrees && Array.isArray(worldsData.worldTrees)) {
      for (const tree of worldsData.worldTrees) {
        processWorldNode(tree, entityToMediaMap, report);
      }
    }
  } catch (error) {
    report.errors.push(`Failed to read worlds.json: ${error}`);
  }
  
  return entityToMediaMap;
}

/**
 * Main migration function
 */
export async function runMigration(dryRun: boolean = false): Promise<MigrationReport> {
  const report: MigrationReport = {
    totalCharacters: 0,
    migratedCharacters: 0,
    totalWorlds: 0,
    migratedWorlds: 0,
    mediaCreated: 0,
    errors: []
  };
  
  console.log('Starting media system migration...');
  console.log(`Dry run: ${dryRun}`);
  
  if (dryRun) {
    console.log('DRY RUN MODE - No changes will be made');
  }
  
  // Migrate characters
  console.log('\nMigrating characters...');
  const characterMediaMap = migrateCharacters(report);
  
  // Migrate worlds
  console.log('Migrating worlds...');
  const worldMediaMap = migrateWorlds(report);
  
  // Print report
  console.log('\n=== Migration Report ===');
  console.log(`Total Characters: ${report.totalCharacters}`);
  console.log(`Migrated Characters: ${report.migratedCharacters}`);
  console.log(`Total World Nodes: ${report.totalWorlds}`);
  console.log(`Migrated World Nodes: ${report.migratedWorlds}`);
  console.log(`Media Items Created: ${report.mediaCreated}`);
  
  if (report.errors.length > 0) {
    console.log(`\nErrors (${report.errors.length}):`);
    report.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('\n=== Entity to Media ID Mapping ===');
  console.log('Characters:');
  characterMediaMap.forEach((mediaId, entityId) => {
    console.log(`  ${entityId} -> ${mediaId}`);
  });
  
  console.log('\nWorlds:');
  worldMediaMap.forEach((mediaId, entityId) => {
    console.log(`  ${entityId} -> ${mediaId}`);
  });
  
  return report;
}

// If run directly
if (require.main === module) {
  runMigration(false)
    .then(report => {
      console.log('\nMigration completed!');
      process.exit(report.errors.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
