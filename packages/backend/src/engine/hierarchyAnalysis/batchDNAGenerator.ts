/**
 * Batch DNA Generator
 * Generates DNA for all nodes in a hierarchy using batch LLM calls
 */

import type { HierarchyStructure, NodeDNA, HostNode, RegionNode, LocationNode, NicheNode } from './types';
import { mergeDNA } from './dnaMerge';
import { parseJSON } from '../utils/parseJSON';
import { generateText } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { completeDNAGeneration } from '../generation/prompts/completeDNAGeneration';

/**
 * Generate DNA for all nodes in the hierarchy using batch calls
 * 
 * @param hierarchy - The hierarchy structure from classification
 * @param visualAnalysis - Visual analysis data from the deepest node
 * @param originalPrompt - Original user input
 * @param apiKey - MZOO API key
 * @returns Complete hierarchy with all DNA populated
 */
export async function generateBatchDNA(
  hierarchy: HierarchyStructure,
  visualAnalysis: any,
  originalPrompt: string,
  apiKey: string
): Promise<HierarchyStructure> {
  const host = hierarchy.host;
  
  // Prepare hierarchy data for single prompt
  const regions = (host.regions || []).map(region => ({
    name: region.name,
    description: region.description,
    locations: (region.locations || []).map(location => ({
      name: location.name,
      description: location.description,
      niches: (location.niches || []).map(niche => ({
        name: niche.name,
        description: niche.description
      }))
    }))
  }));
  
  // Single LLM call to generate ALL DNA
  const prompt = completeDNAGeneration(
    originalPrompt,
    host.name,
    host.description,
    regions
  );
  
  const messages = [{ role: 'user', content: prompt }];
  const result = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);
  
  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to generate complete DNA');
  }
  
  const dnaResult = parseJSON<{
    host: NodeDNA;
    regions: Array<{ name: string; dna: Partial<NodeDNA> }>;
    locations: Array<{ regionName: string; name: string; dna: Partial<NodeDNA> }>;
    niches: Array<{ locationName: string; name: string; dna: Partial<NodeDNA> }>;
  }>(result.data.text);
  
  // Apply Host DNA
  host.dna = dnaResult.host;
  
  // Apply Region DNA (sparse)
  if (host.regions && dnaResult.regions) {
    host.regions.forEach(region => {
      const regionDNA = dnaResult.regions.find(r => r.name === region.name);
      if (regionDNA) {
        region.dna = regionDNA.dna as any; // Sparse DNA - Partial<NodeDNA>
      }
    });
  }
  
  // Apply Location DNA (sparse)
  if (dnaResult.locations) {
    for (const locDNA of dnaResult.locations) {
      const region = host.regions?.find(r => r.name === locDNA.regionName);
      if (region && region.locations) {
        const location = region.locations.find(l => l.name === locDNA.name);
        if (location) {
          location.dna = locDNA.dna as any; // Sparse DNA - Partial<NodeDNA>
        }
      }
    }
  }
  
  // Apply Niche DNA (sparse)
  if (dnaResult.niches) {
    for (const nicheDNA of dnaResult.niches) {
      // Find niche by traversing hierarchy
      for (const region of host.regions || []) {
        for (const location of region.locations || []) {
          if (location.niches) {
            const niche = location.niches.find(n => n.name === nicheDNA.name);
            if (niche && location.name === nicheDNA.locationName) {
              niche.dna = nicheDNA.dna as any; // Sparse DNA - Partial<NodeDNA>
            }
          }
        }
      }
    }
  }
  
  // Merge visual analysis into deepest node
  const deepestNode = findDeepestNode(hierarchy);
  if (deepestNode && deepestNode.dna) {
    // Visual analysis overrides existing DNA fields
    Object.assign(deepestNode.dna, {
      looks: visualAnalysis.looks,
      colorsAndLighting: visualAnalysis.colorsAndLighting,
      atmosphere: visualAnalysis.atmosphere,
      mood: visualAnalysis.mood,
    });
    
    // Add visual anchors if present
    if (visualAnalysis.visualAnchors) {
      (deepestNode.dna as any).visualAnchors = visualAnalysis.visualAnchors;
    }
  }
  
  return hierarchy;
}

/**
 * Find the deepest node in the hierarchy
 */
function findDeepestNode(hierarchy: HierarchyStructure): HostNode | RegionNode | LocationNode | NicheNode | null {
  const host = hierarchy.host;
  
  if (!host.regions || host.regions.length === 0) {
    return host;
  }
  
  const region = host.regions[0]; // Take first region
  
  if (!region.locations || region.locations.length === 0) {
    return region;
  }
  
  const location = region.locations[0]; // Take first location
  
  if (!location.niches || location.niches.length === 0) {
    return location;
  }
  
  return location.niches[0]; // Take first niche
}
