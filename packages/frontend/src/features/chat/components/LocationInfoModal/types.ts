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

export interface LocationInfoModalProps {
  locationProfile: LocationProfile | null;
  locationName: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface LocationInfoLogicReturn {
  handleClose: () => void;
}
