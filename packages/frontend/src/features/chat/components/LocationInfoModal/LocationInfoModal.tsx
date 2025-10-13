// LocationInfoModal Component - PURE JSX ONLY
import { Modal, ModalContent, ModalSection } from '@/components/ui';
import { useLocationInfoLogic } from './useLocationInfoLogic';
import type { LocationInfoModalProps } from './types';
import styles from './LocationInfoModal.module.css';

export function LocationInfoModal(props: LocationInfoModalProps) {
  const { locationProfile, locationName, isOpen } = props;
  const { handleClose } = useLocationInfoLogic(props);

  if (!locationProfile) return null;

  // Cast to hierarchical structure
  const profile = locationProfile as any;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={locationName} maxWidth="md">
      <ModalContent>
        {/* World Node - Always Present */}
        {profile.world && (
          <ModalSection title="🌐 World DNA" description="Global environmental constants">
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <p className={styles.value}>{profile.world.meta?.name}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Environment</label>
              <p className={styles.value}>{profile.world.semantic?.environment}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Genre</label>
              <p className={styles.value}>{profile.world.semantic?.genre}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Architectural Tone</label>
              <p className={styles.value}>{profile.world.semantic?.architectural_tone}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Colors & Lighting</label>
              <p className={styles.value}>{profile.world.profile?.colorsAndLighting}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Symbolic Themes</label>
              <p className={styles.value}>{profile.world.profile?.symbolicThemes}</p>
            </div>
          </ModalSection>
        )}

        {/* Region Node - Optional */}
        {profile.region && (
          <ModalSection title="🗺️ Region" description="Broad area characteristics">
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <p className={styles.value}>{profile.region.meta?.name}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Environment</label>
              <p className={styles.value}>{profile.region.semantic?.environment}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Climate</label>
              <p className={styles.value}>{profile.region.semantic?.climate}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Architecture Style</label>
              <p className={styles.value}>{profile.region.semantic?.architecture_style}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Mood</label>
              <p className={styles.value}>{profile.region.semantic?.mood}</p>
            </div>
          </ModalSection>
        )}

        {/* Location Node - Optional */}
        {profile.location && (
          <ModalSection title="📍 Location" description="Specific site details">
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <p className={styles.value}>{profile.location.meta?.name}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Looks</label>
              <p className={styles.value}>{profile.location.profile?.looks}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Atmosphere</label>
              <p className={styles.value}>{profile.location.profile?.atmosphere}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Materials</label>
              <p className={styles.value}>{profile.location.profile?.materials}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Mood</label>
              <p className={styles.value}>{profile.location.profile?.mood}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Sounds</label>
              <p className={styles.value}>{profile.location.profile?.sounds}</p>
            </div>

            {profile.location.profile?.airParticles && profile.location.profile.airParticles !== 'None' && (
              <div className={styles.field}>
                <label className={styles.label}>Air Particles</label>
                <p className={styles.value}>{profile.location.profile.airParticles}</p>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Fictional</label>
              <p className={styles.value}>{profile.location.profile?.fictional ? 'Yes' : 'No'}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Copyrighted</label>
              <p className={styles.value}>{profile.location.profile?.copyright ? 'Yes' : 'No'}</p>
            </div>
          </ModalSection>
        )}

        {/* Sublocation Node - Optional */}
        {profile.sublocation && (
          <ModalSection title="🚪 Sublocation" description="Interior/tight space details">
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <p className={styles.value}>{profile.sublocation.meta?.name}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Looks</label>
              <p className={styles.value}>{profile.sublocation.profile?.looks}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Atmosphere</label>
              <p className={styles.value}>{profile.sublocation.profile?.atmosphere}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Materials</label>
              <p className={styles.value}>{profile.sublocation.profile?.materials}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Mood</label>
              <p className={styles.value}>{profile.sublocation.profile?.mood}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Sounds</label>
              <p className={styles.value}>{profile.sublocation.profile?.sounds}</p>
            </div>

            {profile.sublocation.profile?.airParticles && profile.sublocation.profile.airParticles !== 'None' && (
              <div className={styles.field}>
                <label className={styles.label}>Air Particles</label>
                <p className={styles.value}>{profile.sublocation.profile.airParticles}</p>
              </div>
            )}
          </ModalSection>
        )}
      </ModalContent>
    </Modal>
  );
}
