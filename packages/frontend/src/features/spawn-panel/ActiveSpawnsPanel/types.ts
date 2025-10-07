export interface ActiveSpawn {
  id: string;
  prompt: string;
  status: string;
  progress: number;
}

export interface ActiveSpawnsPanelProps {
  // Component can be standalone, reads from store
}
