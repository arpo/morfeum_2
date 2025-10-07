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
  
  // Initialize chat logic for the active session (temporary backward compatibility)
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
            <div style={{ padding: '1rem' }}>
              <h3>Chatting with {activeChatSession.entityName}</h3>
              {activeChatSession.entityImage && (
                <img 
                  src={activeChatSession.entityImage} 
                  alt={activeChatSession.entityName}
                  style={{ width: '200px', height: 'auto', borderRadius: '8px', marginBottom: '1rem' }}
                />
              )}
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Messages: {activeChatSession.messages.length}
              </p>
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
                <strong>System Prompt:</strong>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{activeChatSession.systemPrompt}</p>
              </div>
              <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Chat functionality coming soon - active session is working!
              </p>
            </div>
          </Card>
        </section>
      )}
      
      {/* Chat History Section */}
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
