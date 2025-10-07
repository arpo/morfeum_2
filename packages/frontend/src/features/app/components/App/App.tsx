import { useEffect, useRef } from 'react';
import { Chat, useChatLogic } from '@/features/chat/components/Chat';
import { EntityGenerator, useEntityGeneratorLogic } from '@/features/entity-generation/components/EntityGenerator';
import { ChatHistoryViewer } from '@/features/chat/components/ChatHistoryViewer';
import { Card } from '@/components/ui';
import { useSpawnEvents } from '@/hooks/useSpawnEvents';
import styles from './App.module.css';

export function App() {
  // Initialize SSE connection for spawn events
  useSpawnEvents();
  
  const chatLogic = useChatLogic();
  const entityLogic = useEntityGeneratorLogic();
  const lastInitializedEntity = useRef<string | null>(null);

  // Initialize chat immediately with seed data (for backward compatibility)
  useEffect(() => {
    const { generatedSeed } = entityLogic.state;
    
    if (generatedSeed && !lastInitializedEntity.current) {
      lastInitializedEntity.current = generatedSeed.name;
      
      // Initialize with basic seed data immediately
      chatLogic.handlers.initializeWithEntity({
        name: generatedSeed.name,
        looks: generatedSeed.looks,
        wearing: generatedSeed.wearing,
        personality: generatedSeed.personality,
        imageUrl: generatedSeed.imageUrl
      });
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
