/**
 * Hierarchy Analyzer Service
 * 
 * Calls LLM to analyze user input and extract hierarchical structure
 */

import { generateText } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { parseJSON } from '../utils/parseJSON';
import { en } from '../../prompts/languages/en';
import { generateHostAndRegions, generateLocationsAndNiches } from './nodeDNAGenerator';
import { mergeDNA } from './dnaMerge';
import { eventEmitter } from '../../services/eventEmitter';
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
 * Normalizes hierarchy by inserting missing layers as passthrough nodes
 * Ensures proper nesting: Host → Region → Location → Niche
 * 
 * Passthrough nodes inherit parent's name and have empty description
 */
function normalizeHierarchy(hierarchy: HierarchyStructure): void {
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
 * @returns Structured hierarchy with metadata
 */
export async function analyzeHierarchy(
  userPrompt: string, 
  apiKey: string
): Promise<HierarchyAnalysisResult> {
  // Build prompt from centralized prompts
  const prompt = en.hierarchyCategorization(userPrompt);
  
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

  // Normalize hierarchy (insert missing layers as passthrough nodes)
  normalizeHierarchy(parsedHierarchy);

  // Emit classification complete event
  eventEmitter.emit({
    type: 'hierarchy:classification-complete',
    data: { hierarchy: parsedHierarchy }
  });

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
 * Enriches hierarchy with DNA using batched generation
 * - Batch 1: Host + All Regions (1 LLM call)
 * - Batch 2-N: Locations + Niches per region (1 call per region)
 */
async function enrichHierarchyWithDNA(
  hierarchy: HierarchyStructure,
  userPrompt: string,
  apiKey: string
): Promise<void> {
  // Step 1: Generate Host + All Regions in one call
  try {
    const regions = (hierarchy.host.regions || []).map(r => ({
      name: r.name,
      description: r.description
    }));

    const { hostDNA, regionDNAs } = await generateHostAndRegions(
      apiKey,
      userPrompt,
      hierarchy.host.name,
      hierarchy.host.description,
      regions
    );

    // Assign Host DNA
    hierarchy.host.dna = hostDNA;

    // Emit Host DNA complete event
    eventEmitter.emit({
      type: 'hierarchy:host-dna-complete',
      data: {
        nodeName: hierarchy.host.name,
        dna: hostDNA
      }
    });

    // Assign Region DNAs (sparse) and emit individual events
    regionDNAs.forEach((regionDNA, index) => {
      if (hierarchy.host.regions && hierarchy.host.regions[index]) {
        hierarchy.host.regions[index].dna = regionDNA.dna as any;
        
        // Emit individual region DNA complete event
        eventEmitter.emit({
          type: 'hierarchy:region-dna-complete',
          data: {
            nodeName: regionDNA.name,
            dna: regionDNA.dna
          }
        });
      }
    });
  } catch (error) {
    console.error(`[DNA Generation] Failed for Host + Regions:`, error);
    return;
  }

  // Step 2: For each region, generate Locations + Niches
  if (hierarchy.host.regions && hierarchy.host.dna) {
    for (const region of hierarchy.host.regions) {
      if (!region.locations || region.locations.length === 0) {
        continue;
      }

      try {
        // Merge Host + Region DNA for context
        const mergedParentDNA = mergeDNA(hierarchy.host.dna, region.dna);

        // Prepare locations data
        const locations = region.locations.map(loc => ({
          name: loc.name,
          description: loc.description,
          niches: (loc.niches || []).map(n => ({
            name: n.name,
            description: n.description
          }))
        }));

        // Generate all locations + niches for this region
        const locationResults = await generateLocationsAndNiches(
          apiKey,
          userPrompt,
          region.name,
          mergedParentDNA,
          locations
        );

        // Assign Location and Niche DNAs + emit individual events
        locationResults.forEach((locResult, locIndex) => {
          if (!region.locations || !region.locations[locIndex]) return;
          
          const location = region.locations[locIndex];
          location.dna = locResult.dna as any;

          // Emit individual location DNA complete event
          eventEmitter.emit({
            type: 'hierarchy:location-dna-complete',
            data: {
              nodeName: locResult.name,
              dna: locResult.dna
            }
          });

          // Assign Niche DNAs + emit individual events
          if (locResult.niches && location.niches) {
            locResult.niches.forEach((nicheResult, nicheIndex) => {
              if (location.niches && location.niches[nicheIndex]) {
                location.niches[nicheIndex].dna = nicheResult.dna as any;
                
                // Emit individual niche DNA complete event
                eventEmitter.emit({
                  type: 'hierarchy:niche-dna-complete',
                  data: {
                    nodeName: nicheResult.name,
                    dna: nicheResult.dna
                  }
                });
              }
            });
          }
        });
      } catch (error) {
        console.error(`[DNA Generation] Failed for Region "${region.name}" locations:`, error);
        // Continue with next region
      }
    }
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
