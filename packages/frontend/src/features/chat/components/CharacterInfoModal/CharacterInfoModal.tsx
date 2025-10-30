// CharacterInfoModal Component - PURE JSX ONLY
import { Modal, ModalContent, ModalSection } from '@/components/ui';
import { useCharacterInfoLogic } from './useCharacterInfoLogic';
import { EntityField } from '../shared';
import type { CharacterInfoModalProps } from './types';

export function CharacterInfoModal({ deepProfile, characterName, isOpen, onClose }: CharacterInfoModalProps) {
  const logic = useCharacterInfoLogic({ isOpen, onClose });

  if (!deepProfile) return null;

  return (
    <Modal isOpen={logic.state.isOpen} onClose={logic.handlers.close} title={characterName} maxWidth="lg">
      <ModalContent>
        <ModalSection title="Identity">
          <EntityField label="Name" value={characterName} />
          <EntityField label="Gender" value={deepProfile.gender} />
          <EntityField label="Nationality" value={deepProfile.nationality} />
        </ModalSection>

        <ModalSection title="Physical Appearance">
          <EntityField label="Overall Looks" value={deepProfile.looks} />
          <EntityField label="Face" value={deepProfile.face} />
          <EntityField label="Body" value={deepProfile.body} />
          <EntityField label="Hair" value={deepProfile.hair} />
          <EntityField label="Specific Details" value={deepProfile.specificDetails} />
        </ModalSection>

        <ModalSection title="Style & Presence">
          <EntityField label="Wearing" value={deepProfile.wearing} />
          <EntityField label="Style" value={deepProfile.style} />
        </ModalSection>

        <ModalSection title="Personality & Communication">
          <EntityField label="Personality" value={deepProfile.personality} />
          <EntityField label="Voice" value={deepProfile.voice} />
          <EntityField label="Speech Style" value={deepProfile.speechStyle} />
        </ModalSection>

        <ModalSection title="Metadata">
          <EntityField label="Fictional" value={deepProfile.fictional} />
          <EntityField label="Copyright" value={deepProfile.copyright} />
          <EntityField label="Tags" value={deepProfile.tags} />
        </ModalSection>
      </ModalContent>
    </Modal>
  );
}
