/**
 * Hierarchy Parser Utility
 * Converts nested hierarchy JSON into flat nodes + tree structure
 */

import { v4 as uuidv4 } from 'uuid';
import type { Node, NodeType, TreeNode } from '@/store/slices/locations';
import { extractCleanDNA } from './nodeDNAExtractor';

export interface ParsedHierarchy {
  nodes: Node[];
  tree: TreeNode;
  deepestNodeId: string;
}

/**
 * Parse nested hierarchy into flat nodes and tree structure
 */
export function parseNestedHierarchy(hierarchy: any, spawnId: string, imageUrl?: string): ParsedHierarchy {
  const nodes: Node[] = [];
  const host = hierarchy.host;
  
  if (!host) {
    throw new Error('Hierarchy must have a host node');
  }

  // Create host/world node
  // Backend sends: { type, name, description, dna, navigableElements, imageUrl, etc. }
  // We extract: name at root, dna as separate object, imageUrl for display, structural fields
  const hostNode: Node = {
    id: spawnId,
    type: 'host',
    name: host.name,
    spaceType: 'exterior',
    dna: extractHostDNA(host), // Returns just host.dna
    imagePath: host.imageUrl || '',
    // Copy structural fields from backend
    navigableElements: host.navigableElements,
    dominantElements: host.dominantElements,
    uniqueIdentifiers: host.uniqueIdentifiers,
    slug: host.slug,
    searchDesc: host.searchDesc
  } as Node;
  nodes.push(hostNode);

  const tree: TreeNode = {
    id: spawnId,
    type: 'host',
    children: []
  };

  let deepestNodeId = spawnId;

  // Parse regions
  if (host.regions && host.regions.length > 0) {
    host.regions.forEach((region: any) => {
      const regionId = uuidv4();
      const regionNode: Node = {
        id: regionId,
        type: 'region',
        name: region.name,
        spaceType: 'exterior',
        dna: extractRegionDNA(region), // Returns just region.dna
        imagePath: region.imageUrl || '',
        // Copy structural fields from backend
        navigableElements: region.navigableElements,
        dominantElements: region.dominantElements,
        uniqueIdentifiers: region.uniqueIdentifiers,
        slug: region.slug,
        searchDesc: region.searchDesc
      } as Node;
      nodes.push(regionNode);

      const regionTree: TreeNode = {
        id: regionId,
        type: 'region',
        children: []
      };
      tree.children.push(regionTree);
      deepestNodeId = regionId;

      // Parse locations
      if (region.locations && region.locations.length > 0) {
        region.locations.forEach((location: any) => {
          const locationId = uuidv4();
          const locationNode: Node = {
            id: locationId,
            type: 'location',
            name: location.name,
            spaceType: 'exterior',
            dna: extractLocationDNA(location), // Returns just location.dna
            imagePath: location.imageUrl || '',
            // Copy structural fields from backend
            navigableElements: location.navigableElements,
            dominantElements: location.dominantElements,
            uniqueIdentifiers: location.uniqueIdentifiers,
            slug: location.slug,
            searchDesc: location.searchDesc
          } as Node;
          nodes.push(locationNode);

          const locationTree: TreeNode = {
            id: locationId,
            type: 'location',
            children: []
          };
          regionTree.children.push(locationTree);
          deepestNodeId = locationId;

          // Parse niches (sublocations)
          if (location.niches && location.niches.length > 0) {
            location.niches.forEach((niche: any) => {
              const nicheId = uuidv4();
              const nicheNode: Node = {
                id: nicheId,
                type: 'niche',
                name: niche.name,
                spaceType: 'interior',
                dna: extractNicheDNA(niche), // Returns just niche.dna
                imagePath: niche.imageUrl || '',
                // Copy structural fields from backend
                navigableElements: niche.navigableElements,
                dominantElements: niche.dominantElements,
                uniqueIdentifiers: niche.uniqueIdentifiers,
                slug: niche.slug,
                searchDesc: niche.searchDesc
              } as Node;
              nodes.push(nicheNode);

              const nicheTree: TreeNode = {
                id: nicheId,
                type: 'niche',
                children: []
              };
              locationTree.children.push(nicheTree);
              deepestNodeId = nicheId;
            });
          }
        });
      }
    });
  }

  return {
    nodes,
    tree,
    deepestNodeId
  };
}

/**
 * Extract host DNA using shared utility
 * Strips nested 'regions' array
 */
function extractHostDNA(host: any): any {
  return extractCleanDNA(host, 'host');
}

/**
 * Extract region DNA using shared utility
 * Strips nested 'locations' array
 */
function extractRegionDNA(region: any): any {
  return extractCleanDNA(region, 'region');
}

/**
 * Extract location DNA using shared utility
 * Strips nested 'niches' array
 */
function extractLocationDNA(location: any): any {
  return extractCleanDNA(location, 'location');
}

/**
 * Extract niche DNA using shared utility
 * No nested arrays to strip
 */
function extractNicheDNA(niche: any): any {
  return extractCleanDNA(niche, 'niche');
}
