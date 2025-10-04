import { Chat, useChatLogic } from '@/features/chat/components/Chat';
import { ChatHistoryViewer } from '@/features/chat/components/ChatHistoryViewer';
import { Card } from '@/components/ui';
import styles from './App.module.css';

export function App() {
  const chatLogic = useChatLogic();

  return (
    <div className={styles.container}>
      
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
