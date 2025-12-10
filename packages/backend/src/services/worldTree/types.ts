export interface NodeDNA {
  semantic: {
    atmosphere: string;
    mood: string;
    [key: string]: any;
  };
  visual: {
    prompt: string;
    style: string;
    [key: string]: any;
  };
  profile: {
    name: string;
    looks: string;
    atmosphere: string;
    mood: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface NodeStructure {
  spatialLayout?: string;
  navigableElements?: Array<{
    type: string;
    position: string;
    description: string;
  }>;
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
}

export interface TreeNode {
  id: string;
  type: 'host' | 'region' | 'location' | 'niche';
  name: string;
  description: string;
  dna: NodeDNA;
  primaryMedia?: string;
  spaceType: 'exterior' | 'interior';
  children: TreeNode[];
  // NEW: Structure object containing structural/navigational data
  structure?: NodeStructure;
  searchDesc?: string;
  slug?: string;
  /** True for pass-through regions that inherit all DNA from host */
  isPassThrough?: boolean;
  // Legacy fields (also in structure) for backward compatibility
  navigableElements?: Array<{
    type: string;
    position: string;
    description: string;
  }>;
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
}

export interface WorldTree {
  id: string;
  name: string;
  type: 'world';
  createdAt: string;
  rootNode: TreeNode;
}
