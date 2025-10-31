// LocationInfoModal Component - PURE JSX ONLY
import { Modal, ModalContent, ModalSection } from '@/components/ui';
import { useLocationsStore } from '@/store/slices/locations';
import { useLocationInfoLogic } from './useLocationInfoLogic';
import { transformProfile, isFlatDNA, renderSection } from './helpers';
import type { LocationInfoModalProps } from './types';
import styles from './LocationInfoModal.module.css';

export function LocationInfoModal(props: LocationInfoModalProps) {
  const { locationProfile, locationName, locationId, isOpen } = props;
  const { handleClose } = useLocationInfoLogic(props);
  const getNodeFocus = useLocationsStore(state => state.getNodeFocus);

  if (!locationProfile) return null;

  // Transform profile using helper
  const profile = transformProfile(locationProfile);
  
  // Check if flat DNA structure
  const isFlat = isFlatDNA(profile);
  
  // Get focus state
  const focus = locationId ? getNodeFocus(locationId) : null;

  // Render flat NodeDNA structure
  if (isFlat) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={`${locationName} - DNA`} maxWidth="lg">
        <ModalContent>
          <ModalSection title="Location Profile" description="Complete DNA structure">
            {renderSection(profile, styles)}
          </ModalSection>
        </ModalContent>
      </Modal>
    );
  }

  // Render hierarchical structure
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`${locationName} - DNA Structure`} maxWidth="lg">
      <ModalContent>
        {/* NICHE NODE - Interior/nested space */}
        {profile.niche && (
          <ModalSection title="🔷 Niche" description="Interior/nested space details">
            {renderSection(profile.niche, styles)}
          </ModalSection>
        )}

        {/* LOCATION NODE - Specific site */}
        {profile.location && (
          <ModalSection title="Location" description="Specific site details">
            {renderSection(profile.location, styles)}
          </ModalSection>
        )}

        {/* REGION NODE - Broad area */}
        {profile.region && (
          <ModalSection title="Region" description="Broad area characteristics">
            {renderSection(profile.region, styles)}
          </ModalSection>
        )}

        {/* WORLD NODE - Global constants */}
        {profile.world && (
          <ModalSection title="World" description="Global environmental constants">
            {renderSection(profile.world, styles)}
          </ModalSection>
        )}
      </ModalContent>
    </Modal>
  );
}
