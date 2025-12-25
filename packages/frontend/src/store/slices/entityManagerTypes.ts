/**
 * Entity Manager Types
 * Type definitions for entity sessions (characters and locations)
 */

import type { CharacterDetails, EnvironmentContext } from '../../utils/entity/buildCharacterSystemPrompt';

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DeepProfile {
  name: string;
  looks: string;
  wearing: string;
  face: string;
  body: string;
  hair: string;
  specificDetails: string;
  style: string;
  personality: string;
  voice: string;
  speechStyle: string;
  gender: string;
  nationality: string;
  fictional: string;
  copyright: string;
  tags: string;
}

export interface EntityData {
  spawnId: string;
  entityName: string;
  entityType?: 'character' | 'location';
  entityPersonality?: string;
  entityImage?: string;
  imagePrompt?: string;
  systemPrompt: string;
  messages: ChatMessage[];
  loading?: boolean;
  error?: string | null;
  deepProfile?: DeepProfile;
}

export interface EntityManagerSlice {
  entities: Map<string, EntityData>;
  activeEntity: string | null;

  createEntity: (
    spawnId: string, 
    seed: any, 
    entityType?: 'character' | 'location',
    characterDetails?: CharacterDetails,
    environment?: EnvironmentContext
  ) => void;
  updateEntityImage: (spawnId: string, imageUrl: string) => void;
  updateEntityImagePrompt: (spawnId: string, imagePrompt: string) => void;
  updateEntitySystemPrompt: (spawnId: string, systemPrompt: string) => void;
  updateEntityProfile: (spawnId: string, deepProfile: DeepProfile) => void;
  setActiveEntity: (spawnId: string) => void;
  closeEntity: (spawnId: string) => void;
  sendMessage: (spawnId: string, content: string) => Promise<void>;
  setLoading: (spawnId: string, loading: boolean) => void;
  setError: (spawnId: string, error: string | null) => void;
}

// Re-export CharacterDetails and EnvironmentContext for convenience
export type { CharacterDetails, EnvironmentContext };
