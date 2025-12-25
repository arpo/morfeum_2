/**
 * Create Node - Core Function
 * 
 * Creates a single node with DNA and optional image generation.
 * This is the foundational function used by all slash commands and LLM tools.
 */

import { v4 as uuidv4 } from 'uuid';
import { generateText, generateImage } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { parseJSON } from '../../utils/parseJSON';
import type { NodeDNA } from '../../hierarchyAnalysis/types';
import type {
  NodeType,
  Node,
  CreateNodeOptions,
  CreateNodeResult,
  ParentDNAContext,
  ScenePerspective,
} from '../types';
import { mergeDNAWithInheritance } from './dnaInheritance';
import { getNodeDNAPrompt } from '../prompts/dna';
import { getNodeImagePrompt } from '../prompts/image';
import { cleanDNAFields, generateSlug, detectPerspective } from './nodeUtils';

/**
 * Create a single node with DNA
 * 
 * @param nodeType - Type of node to create (host, region, location, niche)
 * @param description - User description of the node
 * @param options - Creation options
 * @returns Created node with optional image
 */
export async function createNode(
  nodeType: NodeType,
  description: string,
  options: CreateNodeOptions = {}
): Promise<CreateNodeResult> {
  const { apiKey, parentId, parentContext: passedContext, createImage = false, perspective } = options;

  if (!apiKey) {
    throw new Error('API key is required for node creation');
  }

  // Generate node ID
  const nodeId = uuidv4();

  // Use passed parent context for DNA inheritance, or empty for root nodes
  const parentContext: ParentDNAContext = passedContext || {};

  // Step 1: Generate DNA for the node
  const dnaResult = await generateNodeDNA(
    apiKey,
    description,
    nodeType,
    parentContext
  );

  // Step 2: Build the node
  const node = buildNodeFromDNA(nodeId, nodeType, dnaResult);

  // Step 3: Optionally generate image
  let imageUrl: string | undefined;
  let imagePrompt: string | undefined;

  if (createImage) {
    const imageResult = await generateNodeImage(
      apiKey,
      node,
      perspective || detectPerspective(description)
    );
    imageUrl = imageResult.imageUrl;
    imagePrompt = imageResult.imagePrompt;
    node.imageUrl = imageUrl;
  }

  return {
    node,
    imageUrl,
    imagePrompt,
  };
}

/**
 * Generate DNA for a node using LLM
 */
async function generateNodeDNA(
  apiKey: string,
  description: string,
  nodeType: NodeType,
  parentContext: ParentDNAContext,
  perspective?: ScenePerspective
): Promise<{
  name: string;
  description: string;
  dna: Partial<NodeDNA>;
  navigableElements?: any[];
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
  searchDesc?: string;
  slug?: string;
}> {
  // Build prompt based on node type using specialized prompts
  const prompt = getNodeDNAPrompt(nodeType, description, { parentContext, perspective });

  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: `Generate DNA for: ${description}` }
  ];

  const result = await generateText(
    apiKey,
    messages,
    AI_MODELS.SEED_GENERATION
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to generate node DNA');
  }

  const parsed = parseJSON<any>(result.data.text);

  if (!parsed || !parsed.dna) {
    throw new Error('Failed to parse DNA from LLM response');
  }

  // Clean up leftover/unwanted DNA fields that LLM sometimes adds
  const cleanedDNA = cleanDNAFields(parsed.dna);

  // Merge with parent DNA for inheritance
  const mergedDNA = mergeDNAWithInheritance(cleanedDNA, parentContext as any);

  return {
    name: parsed.name || description,
    description: parsed.description || description,
    dna: mergedDNA,
    navigableElements: parsed.navigableElements,
    dominantElements: parsed.dominantElements,
    uniqueIdentifiers: parsed.uniqueIdentifiers,
    searchDesc: parsed.searchDesc,
    slug: parsed.slug || generateSlug(parsed.name || description),
  };
}

/**
 * Build a node object from DNA result
 * NEW FORMAT: Uses spaceType and structure object (no legacy children arrays)
 * 
 * Note: navigableElements, dominantElements, uniqueIdentifiers only set for location/niche, not host/region
 * These are stored at ROOT level, not in structure object (to avoid duplication)
 */
function buildNodeFromDNA(
  nodeId: string,
  nodeType: NodeType,
  dnaResult: {
    name: string;
    description: string;
    dna: Partial<NodeDNA>;
    navigableElements?: any[];
    dominantElements?: string[];
    uniqueIdentifiers?: string[];
    searchDesc?: string;
    slug?: string;
  }
): Node {
  // Determine spaceType based on nodeType (niche = interior, others = exterior)
  const spaceType = nodeType === 'niche' ? 'interior' : 'exterior';
  
  // Build structure object for physical/spatial properties only
  const structure: any = {};
  
  // Move spatialLayout from DNA to structure if present
  if ((dnaResult.dna as any)?.spatialLayout) {
    structure.spatialLayout = (dnaResult.dna as any).spatialLayout;
    delete (dnaResult.dna as any).spatialLayout;
  }

  const baseNode: any = {
    id: nodeId,
    type: nodeType,
    name: dnaResult.name,
    spaceType,  // NEW: Add spaceType field
    description: dnaResult.description,
    dna: dnaResult.dna,
    searchDesc: dnaResult.searchDesc,
    slug: dnaResult.slug,
  };
  
  // Only add structural fields for location/niche, not host/region
  // Store at root level (not in structure) to avoid duplication
  if (nodeType === 'location' || nodeType === 'niche') {
    if (dnaResult.navigableElements && dnaResult.navigableElements.length > 0) {
      baseNode.navigableElements = dnaResult.navigableElements;
    }
    if (dnaResult.dominantElements && dnaResult.dominantElements.length > 0) {
      baseNode.dominantElements = dnaResult.dominantElements;
    }
    if (dnaResult.uniqueIdentifiers && dnaResult.uniqueIdentifiers.length > 0) {
      baseNode.uniqueIdentifiers = dnaResult.uniqueIdentifiers;
    }
  }
  
  // Add structure object if it has any fields
  if (Object.keys(structure).length > 0) {
    baseNode.structure = structure;
  }

  // Return node without legacy children arrays (worldTrees handles hierarchy now)
  return baseNode as Node;
}

/**
 * Generate image for a node
 */
async function generateNodeImage(
  apiKey: string,
  node: Node,
  perspective: ScenePerspective
): Promise<{ imageUrl: string; imagePrompt: string }> {
  // Use specialized image prompts based on node type
  const imagePrompt = getNodeImagePrompt(node, perspective);

  const result = await generateImage(
    apiKey,
    imagePrompt,
    1,
    'landscape_16_9',
    'none'
  );

  if (result.error || !result.data?.images?.[0]?.url) {
    throw new Error(result.error || 'Failed to generate image');
  }

  return {
    imageUrl: result.data.images[0].url,
    imagePrompt,
  };
}

// Note: buildDNAPrompt and buildImagePrompt have been replaced with 
// specialized prompts in ../prompts/dna and ../prompts/image
