import { randomUUID } from 'crypto';
import type { TreeNode, NodeDNA } from './types';

export class WorldTreeBuilder {
  static build(spawnId: string, hierarchy: any): TreeNode {
    const host = hierarchy.host;
    if (!host) {
      throw new Error('Hierarchy must have a host node');
    }

    // Build the tree recursively
    const rootNode = this.buildNode(host, 'host', spawnId); // Host uses spawnId as ID
    
    // Note: Image handling is now done in entityPersistence via mediaService

    // Ensure creation metadata is preserved if needed (can be in DNA or extra prop if types allow)
    // For now, sticking to TreeNode structure which is clean.

    return rootNode;
  }

  private static buildNode(
    data: any, 
    type: 'host' | 'region' | 'location' | 'niche',
    id: string = randomUUID()
  ): TreeNode {
    const children: TreeNode[] = [];

    // Process regions
    if (data.regions && Array.isArray(data.regions)) {
      data.regions.forEach((region: any) => {
        children.push(this.buildNode(region, 'region'));
      });
    }

    // Process locations
    if (data.locations && Array.isArray(data.locations)) {
      data.locations.forEach((location: any) => {
        children.push(this.buildNode(location, 'location'));
      });
    }

    // Process niches
    if (data.niches && Array.isArray(data.niches)) {
      data.niches.forEach((niche: any) => {
        children.push(this.buildNode(niche, 'niche'));
      });
    }

    // Use DNA object directly (don't spread entire data object to avoid nested dna.dna)
    const dna: NodeDNA = data.dna || {};
    
    // Note: semantic, visual, profile fields removed - they were old schema leftovers

    const node: TreeNode = {
      id,
      type,
      name: data.name,
      description: data.description || '',
      dna,
      spaceType: type === 'niche' ? 'interior' : 'exterior',
      children,
      // Structural fields from data (not from DNA)
      navigableElements: data.navigableElements || [],
      dominantElements: data.dominantElements || [],
      uniqueIdentifiers: data.uniqueIdentifiers || [],
      searchDesc: data.searchDesc || '',
      slug: data.slug || ''
    };

    // Add primaryMedia if present in data
    if (data.primaryMedia) {
      node.primaryMedia = data.primaryMedia;
    }

    return node;
  }
}
