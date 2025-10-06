import { Chat, useChatLogic } from '@/features/chat/components/Chat';
import { EntityGenerator, useEntityGeneratorLogic } from '@/features/entity-generation/components/EntityGenerator';
import { ChatHistoryViewer } from '@/features/chat/components/ChatHistoryViewer';
import { Card } from '@/components/ui';
import styles from './App.module.css';

export function App() {
  const chatLogic = useChatLogic();
  const entityLogic = useEntityGeneratorLogic();

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
