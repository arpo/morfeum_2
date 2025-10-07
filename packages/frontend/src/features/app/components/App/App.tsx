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
      
      {/* Spawn Input Section */}
      <section className={styles.spawnInputSection}>
        <SpawnInputBar />
      </section>

      {/* Active Spawns Panel (only shows when spawns are active) */}
      <ActiveSpawnsPanel />

      {/* Chat Tabs Section */}
      <ChatTabs />
      
      {/* Chat Section */}
      {activeChatSession && (
        <section className={styles.chatSection}>
          <Card>
            <Chat chatLogic={chatLogic} />
          </Card>
        </section>
      )}
      
      {/* Chat History Section (Debug View) */}
      {activeChatSession && (
        <section className={styles.contentSection}>
          <Card>
            <ChatHistoryViewer messages={activeChatSession.messages} />
          </Card>
        </section>
      )}
    </div>
  );
}
