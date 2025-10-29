/**
 * Hierarchy Parser Utility
 * Converts nested hierarchy JSON into flat nodes + tree structure
 */

import { v4 as uuidv4 } from 'uuid';
import type { Node, NodeType, TreeNode } from '@/store/slices/locationsSlice';
import { initFocus } from './locationFocus';

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
  const hostNode: Node = {
    id: spawnId,
    type: 'host',
    name: host.name,
    dna: extractHostDNA(host),
    imagePath: host.imageUrl || '',
    focus: initFocus({ name: host.name, dna: host.dna || host } as any)
  };
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
        dna: extractRegionDNA(region),
        imagePath: region.imageUrl || '',
        focus: initFocus({ name: region.name, dna: region.dna || region } as any)
      };
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
            dna: extractLocationDNA(location),
            imagePath: location.imageUrl || '',
            focus: initFocus({ name: location.name, dna: location.dna || location } as any)
          };
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
                dna: extractNicheDNA(niche),
                imagePath: niche.imageUrl || '',
                focus: initFocus({ name: niche.name, dna: niche.dna || niche } as any)
              };
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
 * Preserve host/world data from backend
 * Simply store everything - let backend structure win
 */
function extractHostDNA(host: any): any {
  return {
    ...host,  // Preserve ALL fields from backend
    slug: host.slug || generateSlug(host.name)  // Add slug if missing
  };
}

/**
 * Preserve region data from backend
 * Simply store everything - let backend structure win
 */
function extractRegionDNA(region: any): any {
  return {
    ...region,  // Preserve ALL fields from backend
    slug: region.slug || generateSlug(region.name)  // Add slug if missing
  };
}

/**
 * Preserve location data from backend
 * Simply store everything - let backend structure win
 */
function extractLocationDNA(location: any): any {
  return {
    ...location,  // Preserve ALL fields from backend
    slug: location.slug || generateSlug(location.name)  // Add slug if missing
  };
}

/**
 * Preserve niche/sublocation data from backend
 * Simply store everything - let backend structure win
 */
function extractNicheDNA(niche: any): any {
  return {
    ...niche,  // Preserve ALL fields from backend
    slug: niche.slug || generateSlug(niche.name)  // Add slug if missing
  };
}

/**
 * Ensure a value is an array
 */
function ensureArray(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
