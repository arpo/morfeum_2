import type { Location } from '@/store/slices/locationsSlice';
import type { Character } from '@/store/slices/charactersSlice';

export type EntityTab = 'characters' | 'locations';

export interface SavedEntitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SavedEntitiesLogicReturn {
  activeTab: EntityTab;
  setActiveTab: (tab: EntityTab) => void;
  locations: Location[];
  characters: Character[];
  pinnedLocationIds: string[];
  pinnedCharacterIds: string[];
  handleLoadLocation: (location: Location) => void;
  handleLoadCharacter: (character: Character) => void;
  handleDeleteLocation: (locationId: string) => void;
  handleDeleteCharacter: (characterId: string) => void;
  handlePinLocation: (locationId: string) => void;
  handlePinCharacter: (characterId: string) => void;
  handleCopyWorldInfo: (location: Location) => void;
}
