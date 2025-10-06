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

  // Auto-initialize chat when entity is generated (with both seed and image)
  useEffect(() => {
    const { generatedSeed } = entityLogic.state;
    
    if (generatedSeed && generatedSeed.imageUrl) {
      // Check if we've already initialized with this entity
      const entityKey = `${generatedSeed.name}-${generatedSeed.imageUrl}`;
      
      if (lastInitializedEntity.current !== entityKey) {
        lastInitializedEntity.current = entityKey;
        
        // Entity generation complete (seed + image), initialize chat
        chatLogic.handlers.initializeWithEntity({
          name: generatedSeed.name,
          looks: generatedSeed.looks,
          wearing: generatedSeed.wearing,
          personality: generatedSeed.personality,
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
