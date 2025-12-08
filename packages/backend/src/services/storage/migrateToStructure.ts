/**
 * Migration Script: Separate Structure from DNA
 * 
 * This script migrates existing world data to the new structure:
 * - Moves `dna.structure` → `node.structure`
 * - Moves `node.navigableElements` → `node.structure.navigableElements`
 * - Moves `node.dominantElements` → `node.structure.dominantElements`
 * - Moves `node.uniqueIdentifiers` → `node.structure.uniqueIdentifiers`
 * - Moves `dna.spatialLayout` → `node.structure.spatialLayout`
 * 
 * Run with: npx ts-node packages/backend/src/services/storage/migrateToStructure.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface MigrationStats {
  totalNodes: number;
  migratedNodes: number;
  nodesWithDnaStructure: number;
  nodesWithNavigableElements: number;
  nodesWithDominantElements: number;
  nodesWithUniqueIdentifiers: number;
  nodesWithSpatialLayout: number;
}

function migrateNode(node: any): { node: any; migrated: boolean; details: string[] } {
  const details: string[] = [];
  let migrated = false;

  // Initialize structure if it doesn't exist at node level
  if (!node.structure) {
    node.structure = {};
  }

  // 1. Move dna.structure → node.structure (merge with existing)
  if (node.dna?.structure) {
    node.structure = {
      ...node.structure,
      ...node.dna.structure
    };
    delete node.dna.structure;
    details.push('moved dna.structure');
    migrated = true;
  }

  // 2. Move dna.spatialLayout → node.structure.spatialLayout
  if (node.dna?.spatialLayout && !node.structure.spatialLayout) {
    node.structure.spatialLayout = node.dna.spatialLayout;
    delete node.dna.spatialLayout;
    details.push('moved spatialLayout from DNA');
    migrated = true;
  }

  // 3. Move node.navigableElements → node.structure.navigableElements
  if (node.navigableElements && !node.structure.navigableElements) {
    node.structure.navigableElements = node.navigableElements;
    delete node.navigableElements;
    details.push('moved navigableElements');
    migrated = true;
  }

  // 4. Move node.dominantElements → node.structure.dominantElements
  if (node.dominantElements && !node.structure.dominantElements) {
    node.structure.dominantElements = node.dominantElements;
    delete node.dominantElements;
    details.push('moved dominantElements');
    migrated = true;
  }

  // 5. Move node.uniqueIdentifiers → node.structure.uniqueIdentifiers
  if (node.uniqueIdentifiers && !node.structure.uniqueIdentifiers) {
    node.structure.uniqueIdentifiers = node.uniqueIdentifiers;
    delete node.uniqueIdentifiers;
    details.push('moved uniqueIdentifiers');
    migrated = true;
  }

  // Clean up empty structure object
  if (Object.keys(node.structure).length === 0) {
    delete node.structure;
  }

  return { node, migrated, details };
}

function migrateWorldsData(worldsData: any): { data: any; stats: MigrationStats } {
  const stats: MigrationStats = {
    totalNodes: 0,
    migratedNodes: 0,
    nodesWithDnaStructure: 0,
    nodesWithNavigableElements: 0,
    nodesWithDominantElements: 0,
    nodesWithUniqueIdentifiers: 0,
    nodesWithSpatialLayout: 0
  };

  if (!worldsData.nodes) {
    console.log('No nodes found in worlds data');
    return { data: worldsData, stats };
  }

  // Pre-count for stats
  for (const nodeId of Object.keys(worldsData.nodes)) {
    const node = worldsData.nodes[nodeId];
    stats.totalNodes++;
    if (node.dna?.structure) stats.nodesWithDnaStructure++;
    if (node.navigableElements) stats.nodesWithNavigableElements++;
    if (node.dominantElements) stats.nodesWithDominantElements++;
    if (node.uniqueIdentifiers) stats.nodesWithUniqueIdentifiers++;
    if (node.dna?.spatialLayout) stats.nodesWithSpatialLayout++;
  }

  // Migrate each node
  for (const nodeId of Object.keys(worldsData.nodes)) {
    const result = migrateNode(worldsData.nodes[nodeId]);
    worldsData.nodes[nodeId] = result.node;
    
    if (result.migrated) {
      stats.migratedNodes++;
      console.log(`  ✓ ${result.node.name} (${result.node.type}): ${result.details.join(', ')}`);
    }
  }

  return { data: worldsData, stats };
}

async function main() {
  const worldsPath = path.join(__dirname, '../../../temp-db/worlds.json');
  const backupPath = path.join(__dirname, '../../../temp-db/worlds.backup-before-structure-migration.json');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔄 STRUCTURE MIGRATION SCRIPT');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Source: ${worldsPath}`);
  console.log(`Backup: ${backupPath}`);
  console.log('');

  // Check if file exists
  if (!fs.existsSync(worldsPath)) {
    console.log('❌ worlds.json not found');
    return;
  }

  // Read current data
  const rawData = fs.readFileSync(worldsPath, 'utf-8');
  const worldsData = JSON.parse(rawData);

  // Create backup
  fs.writeFileSync(backupPath, rawData, 'utf-8');
  console.log('✓ Backup created');
  console.log('');

  // Pre-migration stats
  console.log('PRE-MIGRATION ANALYSIS:');
  console.log('───────────────────────────────────────────────────────────');
  
  // Run migration
  console.log('');
  console.log('MIGRATING NODES:');
  console.log('───────────────────────────────────────────────────────────');
  
  const { data: migratedData, stats } = migrateWorldsData(worldsData);

  // Save migrated data
  fs.writeFileSync(worldsPath, JSON.stringify(migratedData, null, 2), 'utf-8');

  // Print summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('MIGRATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total nodes:              ${stats.totalNodes}`);
  console.log(`Nodes migrated:           ${stats.migratedNodes}`);
  console.log('');
  console.log('Fields migrated:');
  console.log(`  - dna.structure:        ${stats.nodesWithDnaStructure}`);
  console.log(`  - dna.spatialLayout:    ${stats.nodesWithSpatialLayout}`);
  console.log(`  - navigableElements:    ${stats.nodesWithNavigableElements}`);
  console.log(`  - dominantElements:     ${stats.nodesWithDominantElements}`);
  console.log(`  - uniqueIdentifiers:    ${stats.nodesWithUniqueIdentifiers}`);
  console.log('');
  console.log('✅ Migration successful!');
  console.log('   Backup saved to: worlds.backup-before-structure-migration.json');
}

// Run if executed directly
main().catch(console.error);

export { migrateNode, migrateWorldsData };
