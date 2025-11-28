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

    // Extract Clean DNA (remove children arrays)
    const dna: NodeDNA = { ...data };
    delete dna.regions;
    delete dna.locations;
    delete dna.niches;
    
    // Ensure standard fields exist
    if (!dna.semantic) dna.semantic = { atmosphere: '', mood: '' };
    if (!dna.visual) dna.visual = { prompt: '', style: '' };
    if (!dna.profile) dna.profile = { 
      name: data.name, 
      looks: data.description || '', 
      atmosphere: '', 
      mood: '' 
    };

    return {
      id,
      type,
      name: data.name,
      description: data.description || '',
      dna,
      // primaryMedia: data.primaryMedia, // If data already has it
      spaceType: type === 'niche' ? 'interior' : 'exterior',
      children
    };
  }
}
