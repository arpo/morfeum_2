import { randomUUID } from 'crypto';
import type { WorldTree, TreeNode, NodeDNA } from './types';

export class WorldTreeBuilder {
  static build(spawnId: string, hierarchy: any, imageUrl?: string): WorldTree {
    const host = hierarchy.host;
    if (!host) {
      throw new Error('Hierarchy must have a host node');
    }

    // Build the tree recursively
    const rootNode = this.buildNode(host, 'host', spawnId); // Host uses spawnId as ID
    
    // Set the world image on the root node if provided
    if (imageUrl) {
      rootNode.imagePath = imageUrl;
    }

    return {
      id: spawnId,
      name: host.name,
      type: 'world',
      createdAt: new Date().toISOString(),
      imageUrl,
      rootNode
    };
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
      imagePath: data.imageUrl, // Data might already have imageUrl if populated during hierarchy processing
      spaceType: type === 'niche' ? 'interior' : 'exterior',
      children
    };
  }
}
