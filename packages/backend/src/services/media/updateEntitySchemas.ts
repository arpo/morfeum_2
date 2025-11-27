/**
 * Update Entity Schemas Script
 * 
 * Updates characters.json and worlds.json to use primaryMedia field
 * instead of direct image URLs.
 */

import fs from 'fs';
import path from 'path';

const CHARACTERS_FILE = path.join(__dirname, '../../../temp-db/characters.json');
const WORLDS_FILE = path.join(__dirname, '../../../temp-db/worlds.json');
const MEDIA_FILE = path.join(__dirname, '../../../temp-db/media.json');

interface UpdateReport {
  charactersUpdated: number;
  worldNodesUpdated: number;
  errors: string[];
}

/**
 * Build entity-to-media mapping from media.json
 */
function buildEntityToMediaMap(): Map<string, string> {
  const map = new Map<string, string>();
  
  try {
    const mediaData = JSON.parse(fs.readFileSync(MEDIA_FILE, 'utf-8'));
    const media = mediaData.media || {};
    
    for (const [mediaId, mediaItem] of Object.entries(media)) {
      const item = mediaItem as any;
      if (item.entityRefs && Array.isArray(item.entityRefs)) {
        for (const entityId of item.entityRefs) {
          map.set(entityId, mediaId);
        }
      }
    }
  } catch (error) {
    console.error('Failed to read media.json:', error);
  }
  
  return map;
}

/**
 * Update characters.json
 */
function updateCharacters(entityToMediaMap: Map<string, string>, report: UpdateReport): void {
  try {
    const data = fs.readFileSync(CHARACTERS_FILE, 'utf-8');
    const charactersData = JSON.parse(data);
    const characters = charactersData.characters || {};
    
    for (const [charId, character] of Object.entries(characters)) {
      const char = character as any;
      const mediaId = entityToMediaMap.get(charId);
      
      if (mediaId) {
        // Add primaryMedia field
        char.primaryMedia = mediaId;
        
        // Remove old fields
        delete char.imagePath;
        
        if (char.details) {
          delete char.details.imageUrl;
          delete char.details.imagePrompt;
        }
        
        report.charactersUpdated++;
      }
    }
    
    // Write updated data back
    fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(charactersData, null, 2), 'utf-8');
    console.log(`Updated ${report.charactersUpdated} characters`);
  } catch (error) {
    report.errors.push(`Failed to update characters: ${error}`);
  }
}

/**
 * Recursively update world tree nodes
 */
function updateWorldNode(node: any, entityToMediaMap: Map<string, string>): number {
  let updated = 0;
  
  if (node.id) {
    const mediaId = entityToMediaMap.get(node.id);
    
    if (mediaId) {
      // Add primaryMedia field
      node.primaryMedia = mediaId;
      
      // Remove old fields
      delete node.imagePath;
      delete node.imageUrl;
      
      if (node.dna) {
        delete node.dna.imageUrl;
        delete node.dna.imagePrompt;
      }
      
      updated++;
    }
  }
  
  // Process children recursively
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      updated += updateWorldNode(child, entityToMediaMap);
    }
  }
  
  return updated;
}

/**
 * Update worlds.json
 */
function updateWorlds(entityToMediaMap: Map<string, string>, report: UpdateReport): void {
  try {
    const data = fs.readFileSync(WORLDS_FILE, 'utf-8');
    const worldsData = JSON.parse(data);
    
    // Update flat nodes structure
    const nodes = worldsData.nodes || {};
    
    for (const [nodeId, node] of Object.entries(nodes)) {
      const n = node as any;
      const mediaId = entityToMediaMap.get(nodeId);
      
      if (mediaId) {
        // Add primaryMedia field
        n.primaryMedia = mediaId;
        
        // Remove old fields
        delete n.imagePath;
        delete n.imageUrl;
        
        if (n.dna) {
          delete n.dna.imageUrl;
          delete n.dna.imagePrompt;
        }
        
        report.worldNodesUpdated++;
      }
    }
    
    // Update world trees if present
    if (worldsData.worldTrees && Array.isArray(worldsData.worldTrees)) {
      for (const tree of worldsData.worldTrees) {
        report.worldNodesUpdated += updateWorldNode(tree, entityToMediaMap);
      }
    }
    
    // Write updated data back
    fs.writeFileSync(WORLDS_FILE, JSON.stringify(worldsData, null, 2), 'utf-8');
    console.log(`Updated ${report.worldNodesUpdated} world nodes`);
  } catch (error) {
    report.errors.push(`Failed to update worlds: ${error}`);
  }
}

/**
 * Main update function
 */
export async function runSchemaUpdate(): Promise<UpdateReport> {
  const report: UpdateReport = {
    charactersUpdated: 0,
    worldNodesUpdated: 0,
    errors: []
  };
  
  console.log('Starting entity schema update...');
  
  // Build mapping from media.json
  console.log('Building entity-to-media mapping...');
  const entityToMediaMap = buildEntityToMediaMap();
  console.log(`Found ${entityToMediaMap.size} entity-to-media mappings`);
  
  // Update characters
  console.log('\nUpdating characters.json...');
  updateCharacters(entityToMediaMap, report);
  
  // Update worlds
  console.log('Updating worlds.json...');
  updateWorlds(entityToMediaMap, report);
  
  // Print report
  console.log('\n=== Schema Update Report ===');
  console.log(`Characters Updated: ${report.charactersUpdated}`);
  console.log(`World Nodes Updated: ${report.worldNodesUpdated}`);
  
  if (report.errors.length > 0) {
    console.log(`\nErrors (${report.errors.length}):`);
    report.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  return report;
}

// If run directly
if (require.main === module) {
  runSchemaUpdate()
    .then(report => {
      console.log('\nSchema update completed!');
      process.exit(report.errors.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Schema update failed:', error);
      process.exit(1);
    });
}
