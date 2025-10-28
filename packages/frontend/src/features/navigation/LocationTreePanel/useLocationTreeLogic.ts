/**
 * Location Tree Panel Logic
 * Handles tree navigation and node selection
 */

import { useLocationsStore } from '@/store/slices/locationsSlice';

interface TreeNodeDisplay {
  id: string;
  name: string;
  type: string;
  children: TreeNodeDisplay[];
  isCurrentNode: boolean;
}

interface UseLocationTreeLogicReturn {
  worldTrees: TreeNodeDisplay[];
  handleNodeClick: (nodeId: string) => void;
}

export function useLocationTreeLogic(currentNodeId: string): UseLocationTreeLogicReturn {
  const { worldTrees, getNode, updateNodeFocus } = useLocationsStore();

  // Convert tree structure to display structure
  const buildDisplayTree = (treeNode: any, currentId: string): TreeNodeDisplay => {
    const node = getNode(treeNode.id);
    
    return {
      id: treeNode.id,
      name: node?.name || 'Unknown',
      type: treeNode.type,
      children: treeNode.children.map((child: any) => buildDisplayTree(child, currentId)),
      isCurrentNode: treeNode.id === currentId,
    };
  };

  const displayTrees = worldTrees.map(tree => buildDisplayTree(tree, currentNodeId));

  const handleNodeClick = (nodeId: string) => {
    console.log('[LocationTreePanel] Node clicked:', nodeId);
    
    // For now, just log. In the future, this will update focus
    const node = getNode(nodeId);
    if (node) {
      console.log('[LocationTreePanel] Node details:', {
        id: node.id,
        name: node.name,
        type: node.type,
      });
    }
    
    // TODO: Update focus state to navigate to this node
    // This would trigger the app to show the node's image and details
  };

  return {
    worldTrees: displayTrees,
    handleNodeClick,
  };
}
