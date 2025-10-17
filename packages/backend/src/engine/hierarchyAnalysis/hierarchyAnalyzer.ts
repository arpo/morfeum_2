/**
 * Hierarchy Analyzer Service
 * 
 * Calls LLM to analyze user input and extract hierarchical structure
 */

import { generateText } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { parseJSON } from '../utils/parseJSON';
import { buildHierarchyCategorizerPrompt } from './hierarchyCategorizer';
import { generateNodeDNA, extractParentContext } from './nodeDNAGenerator';
import type { 
  HierarchyAnalysisResult, 
  HierarchyStructure, 
  HierarchyMetadata,
  LayerType,
  HostNode,
  RegionNode,
  LocationNode,
  NicheNode,
  DetailNode
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

  // Enrich hierarchy with DNA (top-down approach)
  await enrichHierarchyWithDNA(parsedHierarchy, userPrompt, apiKey);

  // Generate metadata
  const metadata = generateMetadata(parsedHierarchy);

  return {
    hierarchy: parsedHierarchy,
    metadata,
  };
}

/**
 * Enriches hierarchy with DNA for each node (top-down recursive approach)
 * Generates DNA for Host, then cascades context to child nodes
 */
async function enrichHierarchyWithDNA(
  hierarchy: HierarchyStructure,
  userPrompt: string,
  apiKey: string
): Promise<void> {
  // 1. Generate Host DNA (no parent context)
  try {
    hierarchy.host.dna = await generateNodeDNA(
      apiKey,
      userPrompt,
      hierarchy.host.name,
      'host',
      hierarchy.host.description
    );
  } catch (error) {
    console.error(`[DNA Generation] Failed for Host "${hierarchy.host.name}":`, error);
    // Continue without DNA for this node
  }

  // 2. Generate Region DNA (with Host context)
  if (hierarchy.host.regions) {
    for (const region of hierarchy.host.regions) {
      await enrichRegionWithDNA(region, userPrompt, apiKey, hierarchy.host);
    }
  }
}

/**
 * Enriches a region node and its children with DNA
 */
async function enrichRegionWithDNA(
  region: RegionNode,
  userPrompt: string,
  apiKey: string,
  parent: HostNode
): Promise<void> {
  // Generate Region DNA
  try {
    region.dna = await generateNodeDNA(
      apiKey,
      userPrompt,
      region.name,
      'region',
      region.description,
      extractParentContext(parent.dna)
    );
  } catch (error) {
    console.error(`[DNA Generation] Failed for Region "${region.name}":`, error);
    // Continue without DNA for this node
  }

  // Generate Location DNA (with Region context)
  if (region.locations) {
    for (const location of region.locations) {
      await enrichLocationWithDNA(location, userPrompt, apiKey, region);
    }
  }
}

/**
 * Enriches a location node and its children with DNA
 */
async function enrichLocationWithDNA(
  location: LocationNode,
  userPrompt: string,
  apiKey: string,
  parent: RegionNode
): Promise<void> {
  // Generate Location DNA
  try {
    location.dna = await generateNodeDNA(
      apiKey,
      userPrompt,
      location.name,
      'location',
      location.description,
      extractParentContext(parent.dna)
    );
  } catch (error) {
    console.error(`[DNA Generation] Failed for Location "${location.name}":`, error);
    // Continue without DNA for this node
  }

  // Generate Niche DNA (with Location context)
  if (location.niches) {
    for (const niche of location.niches) {
      await enrichNicheWithDNA(niche, userPrompt, apiKey, location);
    }
  }
}

/**
 * Enriches a niche node and its children with DNA
 */
async function enrichNicheWithDNA(
  niche: NicheNode,
  userPrompt: string,
  apiKey: string,
  parent: LocationNode
): Promise<void> {
  // Generate Niche DNA
  try {
    niche.dna = await generateNodeDNA(
      apiKey,
      userPrompt,
      niche.name,
      'niche',
      niche.description,
      extractParentContext(parent.dna)
    );
  } catch (error) {
    console.error(`[DNA Generation] Failed for Niche "${niche.name}":`, error);
    // Continue without DNA for this node
  }

  // Generate Detail DNA (with Niche context)
  if (niche.details) {
    for (const detail of niche.details) {
      await enrichDetailWithDNA(detail, userPrompt, apiKey, niche);
    }
  }
}

/**
 * Enriches a detail node with DNA
 */
async function enrichDetailWithDNA(
  detail: DetailNode,
  userPrompt: string,
  apiKey: string,
  parent: NicheNode
): Promise<void> {
  // Generate Detail DNA
  try {
    detail.dna = await generateNodeDNA(
      apiKey,
      userPrompt,
      detail.name,
      'detail',
      detail.description,
      extractParentContext(parent.dna)
    );
  } catch (error) {
    console.error(`[DNA Generation] Failed for Detail "${detail.name}":`, error);
    // Continue without DNA for this node
  }
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
