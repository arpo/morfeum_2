/**
 * Hierarchy Analyzer Service
 * 
 * Calls LLM to analyze user input and extract hierarchical structure
 */

import { AI_MODELS } from '../../config/constants';
import { eventEmitter } from '../../services/eventEmitter';
import { generateText } from '../../services/mzoo';
import { hierarchyCategorization } from '../generation/prompts/locations/hierarchyCategorization';
import { parseJSON } from '../utils/parseJSON';
import type {
  HierarchyAnalysisResult,
  HierarchyMetadata,
  HierarchyStructure,
  LayerType
} from './types';

/**
 * Normalizes hierarchy by inserting missing layers as passthrough nodes
 * Ensures proper nesting: Host → Region → Location → Niche
 * 
 * Passthrough nodes inherit parent's name and have empty description
 */
function normalizeHierarchy(hierarchy: HierarchyStructure): void {
  
  // Fix: Regions at root level instead of inside host (LLM mistake)
  if ((hierarchy as any).regions && Array.isArray((hierarchy as any).regions)) {
    console.log('[Hierarchy] Found regions at root level, moving to host');
    hierarchy.host.regions = (hierarchy as any).regions;
    delete (hierarchy as any).regions;
  }

  // Fix: Locations at root level (should be inside region inside host)
  if ((hierarchy as any).locations && Array.isArray((hierarchy as any).locations)) {
    const locations = (hierarchy as any).locations;
    
    // Create passthrough region with locations
    hierarchy.host.regions = [{
      type: 'region',
      name: hierarchy.host.name,  // Inherit host name
      description: '',  // Empty description
      locations: locations
    }];
    
    delete (hierarchy as any).locations;
  }

  // Fix: Singular location at root level (should be inside region inside host)
  if ((hierarchy as any).location && typeof (hierarchy as any).location === 'object') {
    const location = (hierarchy as any).location;
    
    console.log('[Hierarchy] Normalizing singular location at root:', location.name);
    
    // Ensure location has type field
    if (!location.type) {
      location.type = 'location';
    }
    
    // Create passthrough region with single location
    hierarchy.host.regions = [{
      type: 'region',
      name: hierarchy.host.name,  // Inherit host name
      description: '',  // Empty description
      locations: [location]  // Wrap in array
    }];
    
    console.log('[Hierarchy] Created region with location. regions:', hierarchy.host.regions.length);
    
    delete (hierarchy as any).location;
  }

  // Fix: Niches at root level (should be inside location inside region inside host)
  if ((hierarchy as any).niches && Array.isArray((hierarchy as any).niches)) {
    const niches = (hierarchy as any).niches;
    
    // Create passthrough region → passthrough location → niches
    hierarchy.host.regions = [{
      type: 'region',
      name: hierarchy.host.name,  // Inherit host name
      description: '',  // Empty description
      locations: [{
        type: 'location',
        name: hierarchy.host.name,  // Inherit host name
        description: '',  // Empty description
        niches: niches
      }]
    }];
    
    delete (hierarchy as any).niches;
  }

  const host = hierarchy.host;

  // Fix: Host → Locations (missing Region)
  if ((host as any).locations && (host as any).locations.length > 0) {
    const locations = (host as any).locations;
    
    // Create passthrough region
    host.regions = [{
      type: 'region',
      name: host.name,  // Inherit parent name
      description: '',  // Empty description
      locations: locations
    }];
    
    // Remove locations from host
    delete (host as any).locations;
  }

  // Fix each region: Region → Niches (missing Location)
  if (host.regions) {
    for (const region of host.regions) {
      if ((region as any).niches && (region as any).niches.length > 0) {
        const niches = (region as any).niches;
        
        // Create passthrough location
        region.locations = [{
          type: 'location',
          name: region.name,  // Inherit parent name
          description: '',  // Empty description
          niches: niches
        }];
        
        // Remove niches from region
        delete (region as any).niches;
      }

      // Fix each location: Location → Details (missing Niche)
      // Skip for now as requested by user
    }
  }
}

/**
 * Analyzes user input and returns structured hierarchy
 * 
 * @param userPrompt - User's description of place/scene
 * @param apiKey - MZOO API key
 * @returns Structured hierarchy with metadata and imageUrl
 */
export async function analyzeHierarchy(
  userPrompt: string, 
  apiKey: string
): Promise<HierarchyAnalysisResult> {
  // Build prompt from centralized prompts
  const prompt = hierarchyCategorization(userPrompt);
  
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
  let parsedHierarchy;
  try {
    parsedHierarchy = parseJSON<HierarchyStructure>(result.data.text);
  } catch (parseError) {
    console.error('[Hierarchy] Failed to parse JSON from LLM response:');
    console.error('Raw response:', result.data.text.substring(0, 500));
    throw new Error(`Failed to parse JSON: ${parseError}`);
  }
  
  // Fix: If LLM returns only location without host, create host wrapper
  if (parsedHierarchy && !parsedHierarchy.host && (parsedHierarchy as any).location) {
    console.log('[Hierarchy] LLM returned location without host, creating host wrapper');
    const location = (parsedHierarchy as any).location;
    
    // Create host from location name
    parsedHierarchy = {
      host: {
        type: 'host',
        name: location.name,
        description: location.description
      }
    } as any;
    
    // Store location for normalization
    (parsedHierarchy as any).location = location;
  }
  
  if (!parsedHierarchy || !parsedHierarchy.host) {
    console.error('[Hierarchy] Invalid hierarchy structure returned:');
    console.error('Parsed result:', JSON.stringify(parsedHierarchy, null, 2));
    throw new Error('Failed to parse hierarchy from LLM response - missing host property');
  }

  // Normalize hierarchy (insert missing layers as passthrough nodes)
  normalizeHierarchy(parsedHierarchy);

  // Emit classification complete event
  eventEmitter.emit({
    type: 'hierarchy:classification-complete',
    data: { hierarchy: parsedHierarchy }
  });

  // Generate metadata
  const metadata = generateMetadata(parsedHierarchy);

  return {
    hierarchy: parsedHierarchy,
    metadata,
    imageUrl: undefined,  // No image generation yet - stopped after classification
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
