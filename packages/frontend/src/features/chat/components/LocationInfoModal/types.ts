export interface LocationProfile {
  name: string;
  looks: string;
  colorsAndLighting: string;
  atmosphere: string;
  flora: string;
  fauna: string;
  architecture: string;
  materials: string;
  mood: string;
  sounds: string;
  genre: string;
  symbolicThemes: string;
  airParticles: string;
  fictional: boolean;
  copyright: boolean;
}

export interface FocusState {
  node_id: string;
  perspective: 'exterior' | 'interior' | 'aerial' | 'ground-level' | 'elevated' | 'distant';
  viewpoint: string;
  distance: 'close' | 'medium' | 'far';
}

export interface LocationInfoModalProps {
  locationProfile: LocationProfile | null;
  locationName: string;
  locationId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface LocationInfoLogicReturn {
  handleClose: () => void;
}
