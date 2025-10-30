/**
 * Location Cascading DNA Utility
 * Handles DNA extraction and cascading context building
 */

import { Node } from '@/store/slices/locations';

interface CascadedContext {
  parentLocationName: string;
  atmosphere: string;
  mood: string;
  colorsAndLighting: string;
  materials: string;
  lighting: string;
  architectural_tone: string;
  palette: string[];
  dominant_materials: string[];
  soundscape: string[];
  environment: string;
  genre: string;
  structures: string[];
  climate?: string;
  weather?: string;
  architecture?: string;
  mood_baseline?: string;
  palette_bias?: string[];
}

/**
 * Build cascaded visual context from parent node DNA
 * Handles both flat NodeDNA and hierarchical structures
 */
export function buildCascadedContext(
  parentNode: Node,
  getCascadedDNA: (nodeId: string) => any
): CascadedContext {
  const parentDNA = parentNode.dna as any;
  
  // Detect structure: flat NodeDNA vs hierarchical
  const isFlatDNA = !parentDNA.world && !parentDNA.region && !parentDNA.location && parentDNA.looks;
  
  console.log('[Sublocation Generation] Parent node:', {
    id: parentNode.id,
    name: parentNode.name,
    type: parentNode.type,
    structure: isFlatDNA ? 'Flat NodeDNA' : 'Hierarchical'
  });
  console.log('[Sublocation Generation] Parent DNA:', parentDNA);
  
  const cascadedContext: any = {};
  
  if (isFlatDNA) {
    extractFromFlatDNA(parentDNA, parentNode, cascadedContext);
  } else {
    extractFromHierarchicalDNA(parentNode, parentDNA, getCascadedDNA, cascadedContext);
  }
  
  // Ensure required array properties have defaults
  cascadedContext.palette = cascadedContext.palette || [];
  cascadedContext.soundscape = cascadedContext.soundscape || [];
  cascadedContext.dominant_materials = cascadedContext.dominant_materials || [];
  cascadedContext.structures = cascadedContext.structures || [];
  
  console.log('[Sublocation Generation] 🎨 Cascaded Visual Context:', cascadedContext);
  
  return cascadedContext as CascadedContext;
}

/**
 * Extract context from flat NodeDNA structure
 */
function extractFromFlatDNA(
  parentDNA: any,
  parentNode: Node,
  cascadedContext: any
): void {
  console.log('[Sublocation Generation] Extracting context from flat NodeDNA');
  
  cascadedContext.parentLocationName = parentNode.name;
  cascadedContext.atmosphere = parentDNA.atmosphere || '';
  cascadedContext.mood = parentDNA.mood || '';
  cascadedContext.colorsAndLighting = parentDNA.colorsAndLighting || '';
  cascadedContext.materials = parentDNA.materials || '';
  cascadedContext.lighting = parentDNA.colorsAndLighting || '';
  cascadedContext.architectural_tone = parentDNA.architectural_tone || '';
  
  // Extract from visualAnchors if available
  if (parentDNA.visualAnchors) {
    if (parentDNA.visualAnchors.colorMapping) {
      cascadedContext.palette = [
        parentDNA.visualAnchors.colorMapping.dominant,
        parentDNA.visualAnchors.colorMapping.secondary,
        parentDNA.visualAnchors.colorMapping.accent
      ].filter(Boolean);
    }
    
    if (parentDNA.visualAnchors.surfaceMaterialMap) {
      const mats = parentDNA.visualAnchors.surfaceMaterialMap;
      cascadedContext.dominant_materials = [
        mats.primary_surfaces,
        mats.secondary_surfaces
      ].filter(Boolean);
    }
  }
  
  // Parse sounds into soundscape array
  if (parentDNA.sounds) {
    cascadedContext.soundscape = parentDNA.sounds.split(',').map((s: string) => s.trim());
  }
  
  // Set empty defaults for missing fields
  cascadedContext.environment = '';
  cascadedContext.genre = '';
  cascadedContext.structures = [];
}

/**
 * Extract context from hierarchical DNA structure
 */
function extractFromHierarchicalDNA(
  parentNode: Node,
  parentDNA: any,
  getCascadedDNA: (nodeId: string) => any,
  cascadedContext: any
): void {
  console.log('[Sublocation Generation] Extracting context from hierarchical structure');
  
  const parentCascadedDNA = getCascadedDNA(parentNode.id);
  
  // Extract world context
  if (parentCascadedDNA.world) {
    cascadedContext.environment = parentCascadedDNA.world.semantic?.environment || '';
    cascadedContext.dominant_materials = parentCascadedDNA.world.semantic?.dominant_materials || [];
    cascadedContext.atmosphere = parentCascadedDNA.world.semantic?.atmosphere || '';
    cascadedContext.architectural_tone = parentCascadedDNA.world.semantic?.architectural_tone || '';
    cascadedContext.genre = parentCascadedDNA.world.semantic?.genre || '';
    cascadedContext.mood_baseline = parentCascadedDNA.world.semantic?.mood_baseline || '';
    cascadedContext.palette_bias = parentCascadedDNA.world.semantic?.palette_bias || [];
    cascadedContext.colorsAndLighting = parentCascadedDNA.world.profile?.colorsAndLighting || '';
  }
  
  // Override with region context if exists
  if (parentCascadedDNA.region) {
    cascadedContext.environment = parentCascadedDNA.region.semantic?.environment || cascadedContext.environment;
    cascadedContext.climate = parentCascadedDNA.region.semantic?.climate;
    cascadedContext.weather = parentCascadedDNA.region.semantic?.weather_pattern;
    cascadedContext.architecture = parentCascadedDNA.region.semantic?.architecture_style;
    cascadedContext.mood = parentCascadedDNA.region.semantic?.mood || cascadedContext.mood_baseline;
    cascadedContext.palette = parentCascadedDNA.region.semantic?.palette_shift || cascadedContext.palette_bias;
    cascadedContext.colorsAndLighting = parentCascadedDNA.region.profile?.colorsAndLighting || cascadedContext.colorsAndLighting;
  } else {
    cascadedContext.mood = cascadedContext.mood_baseline;
    cascadedContext.palette = cascadedContext.palette_bias;
  }
  
  // Get immediate parent DNA (location or sublocation)
  const immediateParentDNA = parentCascadedDNA.sublocation || parentCascadedDNA.location;
  
  // Final override with immediate parent context
  if (immediateParentDNA) {
    cascadedContext.parentLocationName = immediateParentDNA.meta?.name || 'Unknown';
    cascadedContext.structures = immediateParentDNA.semantic?.structures || [];
    cascadedContext.lighting = immediateParentDNA.semantic?.lighting || '';
    cascadedContext.weather = immediateParentDNA.semantic?.weather_or_air || '';
    cascadedContext.atmosphere = immediateParentDNA.semantic?.atmosphere || '';
    cascadedContext.mood = immediateParentDNA.semantic?.mood || cascadedContext.mood;
    cascadedContext.palette = immediateParentDNA.semantic?.color_palette || cascadedContext.palette;
    cascadedContext.soundscape = immediateParentDNA.semantic?.soundscape || [];
    cascadedContext.materials = immediateParentDNA.profile?.materials || '';
    cascadedContext.colorsAndLighting = immediateParentDNA.profile?.colorsAndLighting || cascadedContext.colorsAndLighting;
  }
}

/**
 * Validate parent node is in same world tree
 */
export function validateParentNode(
  parentNodeId: string,
  currentNode: Node,
  cascadedDNA: any,
  getCascadedDNA: (nodeId: string) => any
): string {
  const parentCascaded = getCascadedDNA(parentNodeId);
  
  // Add null check for parentCascaded
  if (!parentCascaded || !parentCascaded.world) {
    console.error('[NavigatorAI] ❌ Could not get cascaded DNA for parent:', parentNodeId);
    console.error('[NavigatorAI] Using current node as parent instead');
    return currentNode.id;
  }
  
  // Both current and parent must have world DNA
  if (!cascadedDNA.world) {
    console.error('[NavigatorAI] ❌ Current node missing world DNA');
    return currentNode.id;
  }
  
  // Validate they're in the same world
  if (cascadedDNA.world.meta?.name !== parentCascaded.world.meta?.name) {
    console.error('[NavigatorAI] ❌ Parent node is in different world tree, using current node as parent');
    console.log('[NavigatorAI] Current world:', cascadedDNA.world.meta.name);
    console.log('[NavigatorAI] Parent world:', parentCascaded.world.meta.name);
    return currentNode.id;
  }
  
  return parentNodeId;
}
