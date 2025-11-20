import { Node } from '@/store/slices/locations';

export interface WorldTreesPanelProps {
  className?: string;
  onOpenSavedWorlds?: () => void;
}

export interface TreeNode {
  id: string;
  node: Node;
  children: TreeNode[];
  isExpanded: boolean;
  depth: number;
}

export interface WorldTreesLogicReturn {
  pinnedWorldTrees: TreeNode[];
  toggleExpanded: (nodeId: string) => void;
  handleNodeClick: (nodeId: string) => void;
  handleUnpinWorld: (worldId: string) => void;
  activeNodeId: string | null;
}
