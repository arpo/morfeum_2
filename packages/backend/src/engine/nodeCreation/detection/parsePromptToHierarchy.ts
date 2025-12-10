/**
 * Parse Prompt to Hierarchy
 * 
 * Interprets a single user prompt and creates a HierarchySpec.
 * Creates a SINGLE branch, not multiple regions/locations.
 * 
 * Depth rules:
 * - "Go to London" → Host only
 * - "Camden in London" → Host/Region
 * - "A pub in Camden" → Host/Region/Location (EXTERIOR - default)
 * - "Inside a Victorian pub" → Host/Region/Location/Niche (INTERIOR)
 */

import { generateText } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { parseJSON } from '../../utils/parseJSON';
import type { HierarchySpec } from '../types';

/**
 * Prompt for hierarchy classification
 * Creates a SINGLE branch with appropriate depth
 * 
 * IMPORTANT: Niches should be RARE - only when user explicitly requests interior
 */
function buildClassificationPrompt(userPrompt: string): string {
  return `You are a world-building assistant. Analyze the user's location description and create a SINGLE-BRANCH hierarchy.

## Hierarchy Levels (from broadest to most specific):
1. **host** - A city, world, or major setting (e.g., "London", "Steampunk Metropolis")
2. **region** - A district, neighborhood, or area within the host (e.g., "Camden", "The Industrial Quarter")
3. **location** - A specific building, site, or landmark (e.g., "The Anchor Pub", "Clockwork Factory")
4. **niche** - RARE: An interior space ONLY when explicitly requested (e.g., "Inside the pub", "The kitchen")

## CRITICAL RULES:
1. Create ONLY ONE of each level (no arrays, no multiple regions/locations)
2. Always work top-down: if you have a location, you MUST have host and region
3. **STOP AT LOCATION by default** - Show the EXTERIOR of buildings/sites
4. **NICHE IS RARE** - ONLY create niche when user EXPLICITLY says: "inside", "interior", "within", "in the room", "indoors", "enter"

## ⚠️ NICHE RESTRICTION (VERY IMPORTANT):
- DO NOT create a niche just because a building has interior spaces
- DO NOT create a niche for "a pub", "a house", "a shop" - these show EXTERIOR
- DO NOT create a niche when describing what's visible through windows
- ONLY create niche when user explicitly wants to BE INSIDE the space

## Depth Detection:
- City/world only → stop at HOST (depth 1)
- District/area mentioned → stop at REGION (depth 2)
- Building/site mentioned → stop at LOCATION (depth 3) - EXTERIOR VIEW
- User explicitly says "inside/interior/within" → include NICHE (depth 4)

## Output JSON Format:
{
  "host": { "name": "...", "description": "..." },
  "region": { "name": "...", "description": "..." },  // omit if not needed
  "location": { "name": "...", "description": "..." }, // omit if not needed
  "niche": { "name": "...", "description": "..." },    // ONLY if user explicitly requests interior
  "depth": 1-4,
  "isInterior": true/false
}

## Examples - NO NICHE (most common):

Input: "Go to London"
Output: { "host": { "name": "London", "description": "The historic capital of England, a sprawling metropolis of history and modernity." }, "depth": 1, "isInterior": false }

Input: "Camden in London"
Output: { "host": { "name": "London", "description": "The historic capital of England" }, "region": { "name": "Camden", "description": "A vibrant, eclectic neighborhood known for its markets and alternative culture" }, "depth": 2, "isInterior": false }

Input: "A Victorian pub with ornate brass fittings"
Output: { "host": { "name": "Victorian London", "description": "London during the Victorian era, gaslit streets and ornate architecture" }, "region": { "name": "Historic District", "description": "An area of preserved Victorian architecture and traditional establishments" }, "location": { "name": "The Crown & Anchor", "description": "A traditional Victorian pub with ornate brass fittings, etched glass windows, and warm wooden interior glimpsed through the windows. EXTERIOR VIEW showing the building facade." }, "depth": 3, "isInterior": false }

Input: "A cozy cottage with a roaring fireplace"
Output: { "host": { "name": "English Countryside", "description": "Rolling hills and pastoral landscapes" }, "region": { "name": "Cotswolds Village", "description": "A quaint village with honey-colored stone buildings" }, "location": { "name": "Rose Cottage", "description": "A cozy stone cottage with climbing roses and smoke curling from the chimney. EXTERIOR VIEW showing the charming facade." }, "depth": 3, "isInterior": false }

Input: "A medieval castle"
Output: { "host": { "name": "Medieval Kingdom", "description": "A realm of knights and nobility" }, "region": { "name": "Highland Province", "description": "Mountainous terrain with strategic fortifications" }, "location": { "name": "Dragonstone Keep", "description": "An imposing medieval castle with high stone walls and battlements. EXTERIOR VIEW." }, "depth": 3, "isInterior": false }

## Examples - WITH NICHE (rare - only when explicitly interior):

Input: "Inside a cozy Victorian pub with a roaring fireplace"
Output: { "host": { "name": "Victorian London", "description": "London during the Victorian era" }, "region": { "name": "Historic District", "description": "An area of traditional establishments" }, "location": { "name": "The Hearthstone Pub", "description": "A cozy Victorian pub known for its warm atmosphere" }, "niche": { "name": "The Fireside Nook", "description": "A cozy interior space dominated by a roaring fireplace, with plush seating and warm amber lighting" }, "depth": 4, "isInterior": true }

Input: "The kitchen of a farmhouse"
Output: { "host": { "name": "Rural Countryside", "description": "Pastoral farmland" }, "region": { "name": "Valley Farm District", "description": "Fertile agricultural area" }, "location": { "name": "Oakwood Farmhouse", "description": "A traditional farmhouse" }, "niche": { "name": "The Kitchen", "description": "A rustic farmhouse kitchen with a wood-burning stove and copper pots" }, "depth": 4, "isInterior": true }

Now analyze this prompt:
"${userPrompt}"`;
}

export interface ParsedHierarchy {
  spec: HierarchySpec;
  depth: number;
  isInterior: boolean;
  rawResponse: any;
}

/**
 * Parse a user prompt into a HierarchySpec
 * 
 * @param prompt - User's location description
 * @param apiKey - API key for LLM
 * @returns Parsed hierarchy specification
 */
export async function parsePromptToHierarchy(
  prompt: string,
  apiKey: string
): Promise<ParsedHierarchy> {
  const classificationPrompt = buildClassificationPrompt(prompt);
  
  const messages = [
    { role: 'user', content: classificationPrompt }
  ];
  
  const result = await generateText(
    apiKey,
    messages,
    AI_MODELS.SEED_GENERATION // Fast model for structure analysis
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to parse prompt into hierarchy');
  }

  const parsed = parseJSON<any>(result.data.text);
  
  if (!parsed || !parsed.host) {
    throw new Error('Invalid hierarchy response - missing host');
  }

  // Build HierarchySpec from parsed response
  const spec: HierarchySpec = {};
  
  if (parsed.host) {
    spec.host = `${parsed.host.name}: ${parsed.host.description}`;
  }
  
  if (parsed.region) {
    spec.region = `${parsed.region.name}: ${parsed.region.description}`;
  }
  
  if (parsed.location) {
    spec.location = `${parsed.location.name}: ${parsed.location.description}`;
  }
  
  if (parsed.niche) {
    spec.niche = `${parsed.niche.name}: ${parsed.niche.description}`;
  }

  return {
    spec,
    depth: parsed.depth || countSpecDepth(spec),
    isInterior: parsed.isInterior || false,
    rawResponse: parsed,
  };
}

/**
 * Count depth from spec
 */
function countSpecDepth(spec: HierarchySpec): number {
  let depth = 0;
  if (spec.host) depth++;
  if (spec.region) depth++;
  if (spec.location) depth++;
  if (spec.niche) depth++;
  return depth;
}
