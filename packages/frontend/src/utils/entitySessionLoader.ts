/**
 * Entity Session Loader - Centralized entity session creation for location trees
 * 
 * This utility handles the creation of entity sessions for location nodes,
 * ensuring consistency across all loading paths (new generation, manual load, auto-load).
 */

import { useLocationsStore, Node } from '@/store/slices/locations';

export interface EntitySessionCallbacks {
  createEntity: (id: string, seed: any, type: 'location' | 'character') => void;
  updateEntityImage: (id: string, imagePath: string) => void;
  updateEntityProfile: (id: string, profile: any) => void;
}

/**
 * Creates entity sessions for all nodes in a location tree
 * 
 * @param nodeIds Array of node IDs to create sessions for
 * @param callbacks Entity management callbacks from Zustand store
 * @param options Optional configuration
 * @returns Number of entity sessions created
 * 
 * @example
 * ```typescript
 * import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';
 * import { useStore } from '@/store';
 * 
 * const createEntity = useStore(state => state.createEntity);
 * const updateEntityImage = useStore(state => state.updateEntityImage);
 * const updateEntityProfile = useStore(state => state.updateEntityProfile);
 * 
 * const count = createEntitySessionsForNodes(
 *   ['node-1', 'node-2', 'node-3'],
 *   { createEntity, updateEntityImage, updateEntityProfile }
 * );
 * ```
 */
export function createEntitySessionsForNodes(
  nodeIds: string[],
  callbacks: EntitySessionCallbacks,
  options?: {
    logProgress?: boolean;
    logPrefix?: string;
  }
): number {
  const { createEntity, updateEntityImage, updateEntityProfile } = callbacks;
  const { logProgress = false, logPrefix = '[EntityLoader]' } = options || {};
  
  const getNode = useLocationsStore.getState().getNode;
  const getCascadedDNA = useLocationsStore.getState().getCascadedDNA;
  
  let successCount = 0;
  
  nodeIds.forEach(nodeId => {
    const node = getNode(nodeId);
    
    if (!node) {
      if (logProgress) {
        console.warn(`${logPrefix} Node not found:`, nodeId);
      }
      return;
    }
    
    if (logProgress) {
      console.log(`${logPrefix} Creating entity for:`, nodeId, node.name, node.type);
    }
    
    // Get cascaded DNA for this node
    const cascadedDNA = getCascadedDNA(nodeId);
    
    // node.dna now contains the FULL backend object (after simplification)
    const dna = node.dna as any;
    
    // Create seed from node data
    const seed = {
      name: node.name,
      looks: dna?.looks || dna?.profile?.looks || dna?.description || node.name,
      atmosphere: dna?.atmosphere || dna?.profile?.atmosphere || dna?.semantic?.atmosphere || '',
      mood: dna?.mood || dna?.profile?.mood || dna?.semantic?.mood || ''
    };
    
    // Create entity session
    createEntity(nodeId, seed, 'location');
    
    // Update with image if available
    if (node.imagePath) {
      updateEntityImage(nodeId, node.imagePath);
    }
    
    // Just pass through the node's DNA directly - it already has everything
    // cascadedDNA provides hierarchy (world/region/location structure)
    // node.dna provides the raw data fields
    const enrichedProfile = {
      ...cascadedDNA,
      location: {
        ...(cascadedDNA as any).location,
        ...dna  // Spread ALL fields from node.dna
      }
    };
    
    // Update with enriched profile
    updateEntityProfile(nodeId, enrichedProfile as any);

    
    successCount++;
  });
  
  if (logProgress) {
    console.log(`${logPrefix} Created ${successCount} entity sessions`);
  }
  
  return successCount;
}

/**
 * Creates entity sessions for an entire location tree
 * 
 * @param tree TreeNode structure containing all nodes
 * @param callbacks Entity management callbacks from Zustand store
 * @param options Optional configuration
 * @returns Number of entity sessions created
 * 
 * @example
 * ```typescript
 * import { createEntitySessionsForTree } from '@/utils/entitySessionLoader';
 * import { collectAllNodeIds } from '@/utils/treeUtils';
 * 
 * const worldTree = findTreeContainingNode(worldTrees, nodeId);
 * if (worldTree) {
 *   createEntitySessionsForTree(
 *     worldTree,
 *     { createEntity, updateEntityImage, updateEntityProfile }
 *   );
 * }
 * ```
 */
export function createEntitySessionsForTree(
  tree: { id: string; children?: any[] },
  callbacks: EntitySessionCallbacks,
  options?: {
    logProgress?: boolean;
    logPrefix?: string;
  }
): number {
  // Collect all node IDs in tree
  const collectIds = (node: any): string[] => {
    const ids = [node.id];
    if (node.children) {
      node.children.forEach((child: any) => {
        ids.push(...collectIds(child));
      });
    }
    return ids;
  };
  
  const nodeIds = collectIds(tree);
  
  return createEntitySessionsForNodes(nodeIds, callbacks, options);
}
