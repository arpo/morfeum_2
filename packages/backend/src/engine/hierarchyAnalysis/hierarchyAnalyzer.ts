/**
 * Hierarchy Analyzer Service
 * 
 * Calls LLM to analyze user input and extract hierarchical structure
 */

import { generateText } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { parseJSON } from '../utils/parseJSON';
import { buildHierarchyCategorizerPrompt } from './hierarchyCategorizer';
import type { 
  HierarchyAnalysisResult, 
  HierarchyStructure, 
  HierarchyMetadata,
  LayerType,
  HostNode 
} from './types';

/**
 * Analyzes user input and returns structured hierarchy
 * 
 * @param userPrompt - User's description of place/scene
 * @param apiKey - MZOO API key
 * @returns Structured hierarchy with metadata
 */
export async function analyzeHierarchy(
  userPrompt: string, 
  apiKey: string
): Promise<HierarchyAnalysisResult> {
  // Build prompt
  const prompt = buildHierarchyCategorizerPrompt(userPrompt);
  
  // Call LLM (using fast model for quick categorization)
  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: userPrompt }
  ];
  
  const result = await generateText(
    apiKey,
    messages,
    AI_MODELS.SEED_GENERATION // Fast model for structure analysis
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'No hierarchy data returned from LLM');
  }

  // Parse JSON response
  const parsedHierarchy = parseJSON<HierarchyStructure>(result.data.text);
  
  if (!parsedHierarchy || !parsedHierarchy.host) {
    throw new Error('Failed to parse hierarchy from LLM response');
  }

  // Generate metadata
  const metadata = generateMetadata(parsedHierarchy);

  return {
    hierarchy: parsedHierarchy,
    metadata,
  };
}

/**
 * Generates metadata about the hierarchy structure
 */
function generateMetadata(hierarchy: HierarchyStructure): HierarchyMetadata {
  const layers: Set<LayerType> = new Set(['host']); // Host always exists
  let totalNodes = 1; // Start with host
  let hasMultipleRegions = false;
  let hasMultipleLocations = false;

  // Traverse hierarchy to collect metadata
  const host = hierarchy.host;

  if (host.regions && host.regions.length > 0) {
    layers.add('region');
    totalNodes += host.regions.length;
    hasMultipleRegions = host.regions.length > 1;

    // Check locations
    let locationCount = 0;
    for (const region of host.regions) {
      if (region.locations && region.locations.length > 0) {
        layers.add('location');
        totalNodes += region.locations.length;
        locationCount += region.locations.length;

        // Check niches
        for (const location of region.locations) {
          if (location.niches && location.niches.length > 0) {
            layers.add('niche');
            totalNodes += location.niches.length;

            // Check details
            for (const niche of location.niches) {
              if (niche.details && niche.details.length > 0) {
                layers.add('detail');
                totalNodes += niche.details.length;
              }
            }
          }
        }
      }
    }
    
    hasMultipleLocations = locationCount > 1;
  }

  return {
    layersDetected: Array.from(layers),
    totalNodes,
    hasMultipleRegions,
    hasMultipleLocations,
  };
}

/**
 * Validates that hierarchy has minimum required structure
 */
export function validateHierarchy(hierarchy: HierarchyStructure): boolean {
  if (!hierarchy.host) {
    return false;
  }

  if (!hierarchy.host.name || !hierarchy.host.description) {
    return false;
  }

  if (!hierarchy.host.type || hierarchy.host.type !== 'host') {
    return false;
  }

  return true;
}
