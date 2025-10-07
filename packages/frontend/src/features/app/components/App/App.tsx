import { useStore } from '@/store';
import { Chat, useChatLogic } from '@/features/chat/components/Chat';
import { ChatHistoryViewer } from '@/features/chat/components/ChatHistoryViewer';
import { SpawnInputBar } from '@/features/spawn-input/SpawnInputBar';
import { ActiveSpawnsPanel } from '@/features/spawn-panel/ActiveSpawnsPanel';
import { ChatTabs } from '@/features/chat-tabs/ChatTabs';
import { Card } from '@/components/ui';
import { useSpawnEvents } from '@/hooks/useSpawnEvents';
import styles from './App.module.css';

export function App() {
  // Initialize SSE connection for spawn events
  useSpawnEvents();
  
  const activeChat = useStore(state => state.activeChat);
  const chats = useStore(state => state.chats);
  
  // Get active chat session
  const activeChatSession = activeChat ? chats.get(activeChat) : null;
  
  // Initialize chat logic
  const chatLogic = useChatLogic();

  return (
    <div className={styles.container}>
      
      {/* Column 1 - Left Sidebar (Controls) */}
      <aside className={styles.sidebar}>
        <SpawnInputBar />
        <ActiveSpawnsPanel />
        <ChatTabs />
      </aside>
      
      {/* Column 2 - Active Chat */}
      {activeChatSession && (
        <section className={styles.chatSection}>
          <Card>
            <Chat chatLogic={chatLogic} />
          </Card>
        </section>
      )}
      
      {/* Column 3 - Reserved for Future Panels */}
      <aside className={styles.extraPanel}>
        {/* Future panel space */}
      </aside>
      
      {/* Column 4 - Chat History (Collapsible) */}
      {activeChatSession && (
        <aside className={styles.historyPanel}>
          <ChatHistoryViewer messages={activeChatSession.messages} />
        </aside>
      )}
    </div>
  );
}
