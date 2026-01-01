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

import { generateText, generateCachedText } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { parseJSON } from '../../utils/parseJSON';
import type { HierarchySpec } from '../types';

/**
 * Static content for caching (~3,000 tokens)
 * Contains all rules, examples, and format specifications
 */
export const PARSE_HIERARCHY_STATIC = `You are a world-building assistant. Analyze the user's location description and create a SINGLE-BRANCH hierarchy.

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

## ⚠️ PASS-THROUGH REGIONS (IMPORTANT):
Pass-through regions are for GENERIC/UNDEFINED places where no specific known location is referenced.
- Set "regionIsPassThrough": true
- Region name should be just "Region"
- Region description should be empty ""
- Pass-through regions inherit ALL DNA from host (no unique styling)

**When to use pass-through region (for generic/undefined settings):**
- "A steampunk factory" → regionIsPassThrough: true (generic setting, no known place)
- "A medieval castle" → regionIsPassThrough: true (generic setting, undefined location)
- "A Victorian pub" → regionIsPassThrough: true (generic Victorian era, no specific city)
- "A cozy cottage" → regionIsPassThrough: true (undefined location)
- "An alien building on an alien planet" → regionIsPassThrough: true (abstract sci-fi)
- "A crystal tower in a dream realm" → regionIsPassThrough: true (abstract fantasy)

**When to use REAL region (regionIsPassThrough: false) - for KNOWN places:**
- "A pub in London" → LLM creates a district like "Soho" or "Whitechapel" (known real city)
- "A restaurant in Tokyo" → LLM creates a district like "Shibuya" (known real city)
- "A pub in Camden" → real region "Camden" (explicitly named)
- "The Shire in Middle-earth" → real region "The Shire" (known fictional universe)
- "A hobbit hole in Middle-earth" → LLM creates "The Shire" (known fictional universe)
- "Bag End" → uses "The Shire" in "Middle-earth" (known fictional location)
- "Financial District tower" → real region "Financial District" (explicitly named)

**Key question to determine: Is this a KNOWN place (real or established fictional)?**
- YES (London, Tokyo, Middle-earth, Gotham City, etc.) → LLM creates/uses a region
- NO (generic "a castle", "a factory", "an alien planet") → pass-through region

## ⚠️ NICHE RESTRICTION (VERY IMPORTANT):
- DO NOT create a niche just because a building has interior spaces
- DO NOT create a niche for "a pub", "a house", "a shop" - these show EXTERIOR
- DO NOT create a niche when describing what's visible through windows
- ONLY create niche when user explicitly wants to BE INSIDE the space

## Depth Detection:
- City/world only → stop at HOST (depth 1)
- District/area EXPLICITLY mentioned → stop at REGION (depth 2)
- Building/site mentioned → stop at LOCATION (depth 3) - EXTERIOR VIEW
- User explicitly says "inside/interior/within" → include NICHE (depth 4)

## Output JSON Format:
{
  "host": { "name": "...", "description": "..." },
  "region": { "name": "...", "description": "..." },  // Use name "Region" and description "" for pass-through
  "regionIsPassThrough": true/false,                  // TRUE if no explicit district/area mentioned
  "location": { "name": "...", "description": "..." }, // omit if not needed
  "niche": { "name": "...", "description": "..." },    // ONLY if user explicitly requests interior
  "depth": 1-4,
  "isInterior": true/false
}

## Examples - WITH PASS-THROUGH REGION (for generic/undefined settings):

Input: "A steampunk factory with giant gears"
Output: { "host": { "name": "Steampunk Metropolis", "description": "A city of brass, steam, and Victorian innovation" }, "region": { "name": "Region", "description": "" }, "regionIsPassThrough": true, "location": { "name": "The Cog Works", "description": "A massive factory with giant exposed gears and billowing steam. EXTERIOR VIEW." }, "depth": 3, "isInterior": false }

Input: "A medieval castle"
Output: { "host": { "name": "Medieval Kingdom", "description": "A realm of knights and nobility" }, "region": { "name": "Region", "description": "" }, "regionIsPassThrough": true, "location": { "name": "Dragonstone Keep", "description": "An imposing medieval castle with high stone walls and battlements. EXTERIOR VIEW." }, "depth": 3, "isInterior": false }

Input: "A Victorian pub with ornate brass fittings"
Output: { "host": { "name": "Victorian Era", "description": "The Victorian period with gaslit streets and ornate architecture" }, "region": { "name": "Region", "description": "" }, "regionIsPassThrough": true, "location": { "name": "The Crown & Anchor", "description": "A traditional Victorian pub with ornate brass fittings and etched glass windows. EXTERIOR VIEW." }, "depth": 3, "isInterior": false }

Input: "A cozy cottage with a roaring fireplace"
Output: { "host": { "name": "Countryside", "description": "Rolling hills and pastoral landscapes" }, "region": { "name": "Region", "description": "" }, "regionIsPassThrough": true, "location": { "name": "Rose Cottage", "description": "A cozy stone cottage with climbing roses and smoke curling from the chimney. EXTERIOR VIEW." }, "depth": 3, "isInterior": false }

Input: "An alien building on an alien planet"
Output: { "host": { "name": "Xyloth Prime", "description": "A distant alien world with bizarre geometry and otherworldly physics" }, "region": { "name": "Region", "description": "" }, "regionIsPassThrough": true, "location": { "name": "The Resonance Spire", "description": "A towering alien structure with non-Euclidean architecture. EXTERIOR VIEW." }, "depth": 3, "isInterior": false }

Input: "A crystal tower in a dream realm"
Output: { "host": { "name": "The Dreamscape", "description": "An ethereal dimension of shifting reality" }, "region": { "name": "Region", "description": "" }, "regionIsPassThrough": true, "location": { "name": "The Prism Spire", "description": "A tower of pure crystal refracting impossible colors. EXTERIOR VIEW." }, "depth": 3, "isInterior": false }

## Examples - WITH REAL REGION (for KNOWN places - real or established fictional):

Input: "A pub in London"
Output: { "host": { "name": "London", "description": "The historic capital of England" }, "region": { "name": "Soho", "description": "A vibrant district known for its entertainment and traditional pubs" }, "regionIsPassThrough": false, "location": { "name": "The Dog and Duck", "description": "A classic London pub with Victorian character. EXTERIOR VIEW." }, "depth": 3, "isInterior": false }

Input: "A restaurant in Tokyo"
Output: { "host": { "name": "Tokyo", "description": "Japan's bustling capital of tradition and modernity" }, "region": { "name": "Shibuya", "description": "A lively district of youth culture and dining" }, "regionIsPassThrough": false, "location": { "name": "Ichiran Ramen", "description": "A traditional ramen restaurant with private booths. EXTERIOR VIEW." }, "depth": 3, "isInterior": false }

Input: "A hobbit hole in Middle-earth"
Output: { "host": { "name": "Middle-earth", "description": "Tolkien's fantasy realm of hobbits, elves, and ancient magic" }, "region": { "name": "The Shire", "description": "A peaceful pastoral region of rolling green hills and hobbit holes" }, "regionIsPassThrough": false, "location": { "name": "Hillside Burrow", "description": "A cozy hobbit hole with a round green door. EXTERIOR VIEW." }, "depth": 3, "isInterior": false }

Input: "A building in Gotham City"
Output: { "host": { "name": "Gotham City", "description": "A dark, crime-ridden metropolis of gothic architecture" }, "region": { "name": "The Narrows", "description": "A dangerous district of decay and shadows" }, "regionIsPassThrough": false, "location": { "name": "Falcone Tower", "description": "A towering gothic building looming over the streets. EXTERIOR VIEW." }, "depth": 3, "isInterior": false }

## Examples - WITH REAL REGION (when district/area is explicitly mentioned):

Input: "Go to London"
Output: { "host": { "name": "London", "description": "The historic capital of England, a sprawling metropolis of history and modernity." }, "depth": 1, "isInterior": false }

Input: "Camden in London"
Output: { "host": { "name": "London", "description": "The historic capital of England" }, "region": { "name": "Camden", "description": "A vibrant, eclectic neighborhood known for its markets and alternative culture" }, "regionIsPassThrough": false, "depth": 2, "isInterior": false }

Input: "A pub in Camden, London"
Output: { "host": { "name": "London", "description": "The historic capital of England" }, "region": { "name": "Camden", "description": "A vibrant, eclectic neighborhood known for its markets and alternative culture" }, "regionIsPassThrough": false, "location": { "name": "The Lock Tavern", "description": "A traditional Camden pub with eclectic decor. EXTERIOR VIEW." }, "depth": 3, "isInterior": false }

Input: "The Shire in Middle-earth"
Output: { "host": { "name": "Middle-earth", "description": "Tolkien's fantasy realm of hobbits, elves, and ancient magic" }, "region": { "name": "The Shire", "description": "A peaceful pastoral region of rolling green hills and hobbit holes" }, "regionIsPassThrough": false, "depth": 2, "isInterior": false }

## Examples - WITH NICHE (rare - only when explicitly interior):

Input: "Inside a cozy Victorian pub with a roaring fireplace"
Output: { "host": { "name": "Victorian Era", "description": "The Victorian period" }, "region": { "name": "Region", "description": "" }, "regionIsPassThrough": true, "location": { "name": "The Hearthstone Pub", "description": "A cozy Victorian pub known for its warm atmosphere" }, "niche": { "name": "The Fireside Nook", "description": "A cozy interior space dominated by a roaring fireplace, with plush seating and warm amber lighting" }, "depth": 4, "isInterior": true }

Input: "The kitchen of a farmhouse"
Output: { "host": { "name": "Countryside", "description": "Pastoral farmland" }, "region": { "name": "Region", "description": "" }, "regionIsPassThrough": true, "location": { "name": "Oakwood Farmhouse", "description": "A traditional farmhouse" }, "niche": { "name": "The Kitchen", "description": "A rustic farmhouse kitchen with a wood-burning stove and copper pots" }, "depth": 4, "isInterior": true }

Input: "Inside a pub in London"
Output: { "host": { "name": "London", "description": "The historic capital of England" }, "region": { "name": "Camden", "description": "An eclectic district of markets and music venues" }, "regionIsPassThrough": false, "location": { "name": "The Roundhouse Tavern", "description": "A classic London pub" }, "niche": { "name": "The Main Bar", "description": "A warm interior with brass fittings and wooden beams" }, "depth": 4, "isInterior": true }

Now analyze this prompt:`;

/**
 * Dynamic function - adds the user prompt
 */
export function parseHierarchyDynamic(userPrompt: string): string {
  return `"${userPrompt}"`;
}

/**
 * Legacy function - builds the full classification prompt for non-cached usage
 */
function buildClassificationPrompt(userPrompt: string): string {
  return `${PARSE_HIERARCHY_STATIC}\n${parseHierarchyDynamic(userPrompt)}`;
}

export interface ParsedHierarchy {
  spec: HierarchySpec;
  depth: number;
  isInterior: boolean;
  /** True if region is a pass-through (inherits all DNA from host) */
  regionIsPassThrough: boolean;
  rawResponse: any;
}

/**
 * Parse a user prompt into a HierarchySpec
 * 
 * @param prompt - User's location description
 * @param apiKey - API key for LLM
 * @param useCaching - Whether to use cached generation (default: true)
 * @returns Parsed hierarchy specification
 */
export async function parsePromptToHierarchy(
  prompt: string,
  apiKey: string,
  useCaching: boolean = true
): Promise<ParsedHierarchy> {
  console.log(`[ParseHierarchy] ===== parsePromptToHierarchy START =====`);
  console.log(`[ParseHierarchy] useCaching: ${useCaching}`);
  console.log(`[ParseHierarchy] prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);
  
  let responseText: string;
  
  if (useCaching) {
    console.log(`[ParseHierarchy] 🔄 Attempting CACHED generation...`);
    try {
      const dynamicPrompt = parseHierarchyDynamic(prompt);
      console.log(`[ParseHierarchy] Dynamic prompt: ${dynamicPrompt}`);
      
      const cachedResult = await generateCachedText(
        apiKey,
        'morfeum-world-creation',
        dynamicPrompt
        // No thinking mode - faster responses
      );
      
      console.log(`[ParseHierarchy] ✅ Cached generation completed, cacheHit: ${cachedResult.cacheHit}`);
      console.log(`[ParseHierarchy] Usage: cachedTokens=${cachedResult.usage?.cachedTokens || 0}, promptTokens=${cachedResult.usage?.promptTokens || 0}`);
      
      responseText = cachedResult.text;
    } catch (cacheError) {
      console.warn('[ParseHierarchy] ❌ Cached generation failed, using FALLBACK:', cacheError);
      // Fall back to non-cached generation
      const classificationPrompt = buildClassificationPrompt(prompt);
      const messages = [{ role: 'user', content: classificationPrompt }];
      const result = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to parse prompt into hierarchy');
      }
      responseText = result.data.text;
    }
  } else {
    console.log(`[ParseHierarchy] ⏭️ Caching DISABLED, using standard generation`);
    const classificationPrompt = buildClassificationPrompt(prompt);
    const messages = [{ role: 'user', content: classificationPrompt }];
    const result = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);
    
    if (result.error || !result.data) {
      throw new Error(result.error || 'Failed to parse prompt into hierarchy');
    }
    responseText = result.data.text;
  }

  const parsed = parseJSON<any>(responseText);
  
  if (!parsed || !parsed.host) {
    console.error('[ParseHierarchy] Invalid hierarchy response - missing host');
    console.error('[ParseHierarchy] Raw response:', responseText.substring(0, 500));
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

  console.log(`[ParseHierarchy] ===== parsePromptToHierarchy COMPLETE =====`);

  return {
    spec,
    depth: parsed.depth || countSpecDepth(spec),
    isInterior: parsed.isInterior || false,
    regionIsPassThrough: parsed.regionIsPassThrough || false,
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
