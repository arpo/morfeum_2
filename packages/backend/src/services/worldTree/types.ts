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

export interface TreeNode {
  id: string;
  type: 'host' | 'region' | 'location' | 'niche';
  name: string;
  description: string;
  dna: NodeDNA;
  primaryMedia?: string;
  spaceType: 'exterior' | 'interior';
  children: TreeNode[];
  // Structural fields for navigation and search
  navigableElements?: Array<{
    type: string;
    position: string;
    description: string;
  }>;
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
  searchDesc?: string;
  slug?: string;
}

export interface WorldTree {
  id: string;
  name: string;
  type: 'world';
  createdAt: string;
  rootNode: TreeNode;
}
