/**
 * Hierarchy Normalizer
 * 
 * Fixes LLM output by inserting missing layers as passthrough nodes
 * Ensures proper nesting: Host → Region → Location → Niche
 */

import type { HierarchyStructure } from './types';

/**
 * Normalizes hierarchy by inserting missing layers as passthrough nodes
 * Ensures proper nesting: Host → Region → Location → Niche
 * 
 * Passthrough nodes inherit parent's name and have empty description
 */
export function normalizeHierarchy(hierarchy: HierarchyStructure): void {
  
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
 * Wraps a raw location in a host structure
 * Used when LLM returns location without host wrapper
 */
export function wrapLocationInHost(parsedHierarchy: any): HierarchyStructure {
  const location = parsedHierarchy.location;
  
  console.log('[Hierarchy] LLM returned location without host, creating host wrapper');
  
  // Create host from location name
  const wrapped = {
    host: {
      type: 'host',
      name: location.name,
      description: location.description
    }
  } as any;
  
  // Store location for normalization
  wrapped.location = location;
  
  return wrapped as HierarchyStructure;
}
