/**
 * Node DNA Generator
 * 
 * Generates simplified, flat DNA structure for each node in the hierarchy
 * Uses LLM to create visual and atmospheric profiles
 * 
 * Supports batched generation:
 * - Host + All Regions (1 call)
 * - Locations + Niches per region (1 call per region)
 */

import { generateText } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { parseJSON } from '../utils/parseJSON';
import { formatDNAForContext } from './dnaMerge';
import { nodeDNAGeneration } from '../generation/prompts/nodeDNAGeneration';
import { hostAndRegionsDNA } from '../generation/prompts/hostAndRegionsDNA';
import { locationsAndNichesDNA } from '../generation/prompts/locationsAndNichesDNA';
import type { NodeDNA, LayerType, ParentContext, RegionNode, LocationNode, NicheNode } from './types';

/**
 * Generate DNA for a single node
 */
export async function generateNodeDNA(
  apiKey: string,
  originalPrompt: string,
  nodeName: string,
  nodeType: LayerType,
  nodeDescription: string,
  parentContext?: ParentContext
): Promise<NodeDNA> {
  // Build prompt from centralized prompts
  const prompt = nodeDNAGeneration(
    originalPrompt,
    nodeName,
    nodeType,
    nodeDescription,
    parentContext
  );

  // Call LLM (using fast model for text generation)
  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: `Generate DNA for: ${nodeName}` }
  ];

  const result = await generateText(
    apiKey,
    messages,
    AI_MODELS.SEED_GENERATION // Fast model for text-only generation
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'No DNA data returned from LLM');
  }

  // Parse JSON response
  const parsedDNA = parseJSON<NodeDNA>(result.data.text);

  if (!parsedDNA) {
    throw new Error('Failed to parse DNA from LLM response');
  }

  return parsedDNA;
}

/**
 * Extract parent context from parent node DNA
 */
export function extractParentContext(parentDNA?: NodeDNA): ParentContext {
  if (!parentDNA) {
    return {};
  }

  return {
    architectural_tone: parentDNA.architectural_tone,
    cultural_tone: parentDNA.cultural_tone,
    dominant: parentDNA.dominant,
    mood: parentDNA.mood
  };
}

/**
 * Generate Host + All Regions in a single LLM call
 * Returns full DNA for Host and sparse DNA for Regions
 */
export async function generateHostAndRegions(
  apiKey: string,
  originalPrompt: string,
  hostName: string,
  hostDescription: string,
  regions: Array<{ name: string; description: string }>
): Promise<{ hostDNA: NodeDNA; regionDNAs: Array<{ name: string; dna: Partial<NodeDNA> }> }> {
  // Build prompt from centralized prompts
  const prompt = hostAndRegionsDNA(
    originalPrompt,
    hostName,
    hostDescription,
    regions
  );

  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: `Generate Host DNA for "${hostName}" and Region DNAs for: ${regions.map(r => r.name).join(', ')}` }
  ];

  const result = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);

  if (result.error || !result.data) {
    throw new Error(result.error || 'No DNA data returned from LLM');
  }

  const parsed = parseJSON<{ host: NodeDNA; regions: Array<{ name: string; dna: Partial<NodeDNA> }> }>(result.data.text);

  if (!parsed || !parsed.host) {
    throw new Error('Failed to parse batched DNA from LLM response');
  }

  return {
    hostDNA: parsed.host,
    regionDNAs: parsed.regions || []
  };
}

/**
 * Generate Locations + Niches for a region in a single LLM call
 * Takes merged parent DNA (Host + Region) as context
 * Returns sparse DNA for Locations and Niches
 */
export async function generateLocationsAndNiches(
  apiKey: string,
  originalPrompt: string,
  regionName: string,
  mergedParentDNA: NodeDNA,
  locations: Array<{ 
    name: string; 
    description: string; 
    niches?: Array<{ name: string; description: string }> 
  }>
): Promise<Array<{ 
  name: string; 
  dna: Partial<NodeDNA>; 
  niches: Array<{ name: string; dna: Partial<NodeDNA> }> 
}>> {
  // Build prompt from centralized prompts
  const prompt = locationsAndNichesDNA(
    originalPrompt,
    regionName,
    formatDNAForContext(mergedParentDNA),
    locations
  );

  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: `Generate Location DNAs for: ${locations.map(l => l.name).join(', ')}` }
  ];

  const result = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);

  if (result.error || !result.data) {
    throw new Error(result.error || 'No DNA data returned from LLM');
  }

  const parsed = parseJSON<{ locations: Array<{ name: string; dna: Partial<NodeDNA>; niches: Array<{ name: string; dna: Partial<NodeDNA> }> }> }>(result.data.text);

  if (!parsed || !parsed.locations) {
    throw new Error('Failed to parse batched location DNA from LLM response');
  }

  return parsed.locations;
}
