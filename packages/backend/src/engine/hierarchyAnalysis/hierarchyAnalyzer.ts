/**
 * Hierarchy Analyzer Service
 * 
 * Calls LLM to analyze user input and extract hierarchical structure
 */

import { generateText, generateImage } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { parseJSON } from '../utils/parseJSON';
import { hierarchyCategorization } from '../generation/prompts/hierarchyCategorization';
import { nodeImageGeneration } from '../generation/prompts/nodeImageGeneration';
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
  // Debug: Log structure before normalization
  // console.log('[Hierarchy] Structure before normalization:');
  // console.log('  - host:', hierarchy.host.name);
  // console.log('  - host.regions:', hierarchy.host.regions ? hierarchy.host.regions.length : 'undefined');
  // console.log('  - root keys:', Object.keys(hierarchy));
  
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

  // ⚠️ PIPELINE STOPPED HERE FOR REFACTORING
  // TODO: Refactor DNA generation and image generation
  // const imageUrl = await enrichHierarchyWithDNA(parsedHierarchy, userPrompt, apiKey);

  // Generate metadata
  const metadata = generateMetadata(parsedHierarchy);

  return {
    hierarchy: parsedHierarchy,
    metadata,
    imageUrl: undefined,  // No image generation yet - stopped after classification
  };
}

// ============================================================================
// COMMENTED OUT - Pipeline stopped after classification
// TODO: Refactor these functions when rebuilding DNA + image generation pipeline
// ============================================================================

/*
/**
 * Generate image for the FIRST deepest node in the hierarchy using cascaded DNA
 * Returns the image URL
 *\/
async function generateImageForDeepestNode(
  hierarchy: HierarchyStructure,
  userPrompt: string,
  apiKey: string
): Promise<string | null> {
  // Find the FIRST deepest node (Niche > Location > Region > Host)
  if (hierarchy.host.regions) {
    for (const region of hierarchy.host.regions) {
      if (region.locations) {
        for (const location of region.locations) {
          // Check if this location has niches - deepest level
          if (location.niches && location.niches.length > 0) {
            const niche = location.niches[0]; // Take first niche
            if (niche.dna && hierarchy.host.dna && region.dna && location.dna) {
              // Cascade DNA: Host → Region → Location → Niche
              const hostRegionDNA = mergeDNA(hierarchy.host.dna, region.dna);
              const hostRegionLocationDNA = mergeDNA(hostRegionDNA, location.dna);
              const fullCascadedDNA = mergeDNA(hostRegionLocationDNA, niche.dna);
              
              const nodeWithCascadedDNA = {
                ...niche,
                dna: fullCascadedDNA
              };
              
              // Generate prompt and image
              const imagePrompt = nodeImageGeneration(nodeWithCascadedDNA, userPrompt);
              
              eventEmitter.emit({
                type: 'hierarchy:image-generation-started',
                data: {
                  nodeType: 'niche',
                  nodeName: niche.name,
                  prompt: imagePrompt
                }
              });
              
              const result = await generateImage(apiKey, imagePrompt, 1, 'landscape_16_9', 'none');
              
              if (result.error || !result.data?.images?.[0]?.url) {
                throw new Error(result.error || 'Image URL not found in response');
              }
              
              const imageUrl = result.data.images[0].url;
              
              eventEmitter.emit({
                type: 'hierarchy:image-complete',
                data: {
                  nodeType: 'niche',
                  nodeName: niche.name,
                  imageUrl,
                  imagePrompt
                }
              });
              
              return imageUrl;
            }
          } else if (location.dna && hierarchy.host.dna && region.dna) {
            // Location is the deepest - generate image
            const hostRegionDNA = mergeDNA(hierarchy.host.dna, region.dna);
            const fullCascadedDNA = mergeDNA(hostRegionDNA, location.dna);
            
            const nodeWithCascadedDNA = {
              ...location,
              dna: fullCascadedDNA
            };
            
            const imagePrompt = nodeImageGeneration(nodeWithCascadedDNA, userPrompt);
            
            eventEmitter.emit({
              type: 'hierarchy:image-generation-started',
              data: {
                nodeType: 'location',
                nodeName: location.name,
                prompt: imagePrompt
              }
            });
            
            const result = await generateImage(apiKey, imagePrompt, 1, 'landscape_16_9', 'none');
            
            if (result.error || !result.data?.images?.[0]?.url) {
              throw new Error(result.error || 'Image URL not found in response');
            }
            
            const imageUrl = result.data.images[0].url;
            
            eventEmitter.emit({
              type: 'hierarchy:image-complete',
              data: {
                nodeType: 'location',
                nodeName: location.name,
                imageUrl,
                imagePrompt
              }
            });
            
            return imageUrl;
          }
        }
      } else if (region.dna && hierarchy.host.dna) {
        // Region is the deepest - generate image
        const fullCascadedDNA = mergeDNA(hierarchy.host.dna, region.dna);
        
        const nodeWithCascadedDNA = {
          ...region,
          dna: fullCascadedDNA
        };
        
        const imagePrompt = nodeImageGeneration(nodeWithCascadedDNA, userPrompt);
        
        eventEmitter.emit({
          type: 'hierarchy:image-generation-started',
          data: {
            nodeType: 'region',
            nodeName: region.name,
            prompt: imagePrompt
          }
        });
        
        const result = await generateImage(apiKey, imagePrompt, 1, 'landscape_16_9', 'none');
        
        if (result.error || !result.data?.images?.[0]?.url) {
          throw new Error(result.error || 'Image URL not found in response');
        }
        
        const imageUrl = result.data.images[0].url;
        
        eventEmitter.emit({
          type: 'hierarchy:image-complete',
          data: {
            nodeType: 'region',
            nodeName: region.name,
            imageUrl,
            imagePrompt
          }
        });
        
        return imageUrl;
      }
    }
  } else if (hierarchy.host.dna) {
    // Host is the only node - generate image
    const imagePrompt = nodeImageGeneration(hierarchy.host, userPrompt);
    
    eventEmitter.emit({
      type: 'hierarchy:image-generation-started',
      data: {
        nodeType: 'host',
        nodeName: hierarchy.host.name,
        prompt: imagePrompt
      }
    });
    
    const result = await generateImage(apiKey, imagePrompt, 1, 'landscape_16_9', 'none');
    
    if (result.error || !result.data?.images?.[0]?.url) {
      throw new Error(result.error || 'Image URL not found in response');
    }
    
    const imageUrl = result.data.images[0].url;
    
    eventEmitter.emit({
      type: 'hierarchy:image-complete',
      data: {
        nodeType: 'host',
        nodeName: hierarchy.host.name,
        imageUrl,
        imagePrompt
      }
    });
    
    return imageUrl;
  }
  
  return null;
}

/**
 * Count nodes with DNA in hierarchy
 *\/
function countNodesWithDNA(hierarchy: HierarchyStructure): number {
  let count = hierarchy.host.dna ? 1 : 0;
  
  if (hierarchy.host.regions) {
    for (const region of hierarchy.host.regions) {
      if (region.dna) count++;
      if (region.locations) {
        for (const location of region.locations) {
          if (location.dna) count++;
          if (location.niches) {
            for (const niche of location.niches) {
              if (niche.dna) count++;
            }
          }
        }
      }
    }
  }
  
  return count;
}

/**
 * Enriches hierarchy with DNA using batched generation
 * - Batch 1: Host + All Regions (1 LLM call)
 * - Batch 2-N: Locations + Niches per region (1 call per region)
 * - Returns imageUrl from deepest node
 *\/
async function enrichHierarchyWithDNA(
  hierarchy: HierarchyStructure,
  userPrompt: string,
  apiKey: string
): Promise<string | null> {
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
    return null;
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

  // Generate image for deepest node after all DNA is complete
  const imageUrl = await generateImageForDeepestNode(hierarchy, userPrompt, apiKey);
  return imageUrl;
}
*/

// ============================================================================
// END COMMENTED OUT SECTION
// ============================================================================

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
