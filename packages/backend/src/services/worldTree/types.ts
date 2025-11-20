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
  imagePath?: string;
  spaceType: 'exterior' | 'interior';
  children: TreeNode[];
}

export interface WorldTree {
  id: string;
  name: string;
  type: 'world';
  createdAt: string;
  imageUrl?: string;
  rootNode: TreeNode;
}
