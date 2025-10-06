import { useEffect, useRef } from 'react';
import { Chat, useChatLogic } from '@/features/chat/components/Chat';
import { EntityGenerator, useEntityGeneratorLogic } from '@/features/entity-generation/components/EntityGenerator';
import { ChatHistoryViewer } from '@/features/chat/components/ChatHistoryViewer';
import { Card } from '@/components/ui';
import styles from './App.module.css';

export function App() {
  const chatLogic = useChatLogic();
  const entityLogic = useEntityGeneratorLogic();
  const lastInitializedEntity = useRef<string | null>(null);

  // Auto-initialize chat when entity generation is complete (with deep profile)
  useEffect(() => {
    const { generatedSeed } = entityLogic.state;
    
    if (generatedSeed && generatedSeed.deepProfile) {
      // Check if we've already initialized with this entity
      const entityKey = `${generatedSeed.name}-${generatedSeed.imageUrl}-profile`;
      
      if (lastInitializedEntity.current !== entityKey) {
        lastInitializedEntity.current = entityKey;
        
        // Format deep profile for chat initialization
        const profile = generatedSeed.deepProfile;
        const formattedProfile = `Name: ${profile.name}

Appearance: ${profile.looks}

Wearing: ${profile.wearing}

Face: ${profile.face}

Hair: ${profile.hair}

Body: ${profile.body}

Specific Details: ${profile.specificDetails}

Style: ${profile.style}

Personality: ${profile.personality}

Voice: ${profile.voice}

Speech Style: ${profile.speechStyle}

Gender: ${profile.gender}

Nationality: ${profile.nationality}

Tags: ${profile.tags}`;
        
        // Initialize chat with enriched profile
        chatLogic.handlers.initializeWithEntity({
          name: generatedSeed.name,
          looks: formattedProfile,
          wearing: '',
          personality: '',
          imageUrl: generatedSeed.imageUrl
        });
      }
    }
  }, [entityLogic.state.generatedSeed, chatLogic.handlers]);

  return (
    <div className={styles.container}>
      
      <section className={styles.entitySection}>
        <Card>
          <EntityGenerator entityLogic={entityLogic} />
        </Card>
      </section>
      
      <section className={styles.chatSection}>
        <Chat chatLogic={chatLogic} />
      </section>
      
      <section className={styles.contentSection}>
        <Card>
          <ChatHistoryViewer messages={chatLogic.state.messages} />
        </Card>
      </section>
    </div>
  );
}
