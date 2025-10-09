import type { Location } from '@/store/slices/locationsSlice';

export interface SavedLocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SavedLocationsLogicReturn {
  locations: Location[];
  handleLoadLocation: (location: Location) => void;
  handleDeleteLocation: (locationId: string) => void;
}
