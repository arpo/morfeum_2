export interface LocationProfile {
  looks: string;
  atmosphere: string;
  vegetation: string;
  architecture: string;
  animals: string;
  mood: string;
  sounds: string;
  genre: string;
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
