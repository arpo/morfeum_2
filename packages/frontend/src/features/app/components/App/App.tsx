import { useStore } from '@/store';
import { useThemeStore } from '@/store/slices/themeSlice';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locationsSlice';
import { Chat, useChatLogic } from '@/features/chat/components/Chat';
import { ChatHistoryViewer } from '@/features/chat/components/ChatHistoryViewer';
import { ImagePromptPanel } from '@/features/chat/components/ImagePromptPanel';
import { SpawnInputBar } from '@/features/spawn-input/SpawnInputBar';
import { ActiveSpawnsPanel } from '@/features/spawn-panel/ActiveSpawnsPanel';
import { ChatTabs } from '@/features/chat-tabs/ChatTabs';
import { Card, ThemeToggle } from '@/components/ui';
import { useSpawnEvents } from '@/hooks/useSpawnEvents';
import { useEffect } from 'react';
import styles from './App.module.css';

export function App() {
  // Initialize SSE connection for spawn events
  useSpawnEvents();
  
  // Initialize theme on mount
  const { setTheme, theme } = useThemeStore();
  
  const activeChat = useStore(state => state.activeChat);
  const chats = useStore(state => state.chats);
  const createChatWithEntity = useStore(state => state.createChatWithEntity);
  const setActiveChat = useStore(state => state.setActiveChat);
  const updateChatImage = useStore(state => state.updateChatImage);
  const updateChatDeepProfile = useStore(state => state.updateChatDeepProfile);
  
  // Get active chat session
  const activeChatSession = activeChat ? chats.get(activeChat) : null;
  
  // Initialize chat logic
  const chatLogic = useChatLogic();

  // Initialize theme on component mount
  useEffect(() => {
    // Apply initial theme
    const resolvedTheme = theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [theme]);

  // Auto-load pinned entities on mount
  useEffect(() => {
    // Get pinned entities
    const pinnedCharacters = useCharactersStore.getState().getPinnedCharacters();
    const pinnedLocations = useLocationsStore.getState().getPinnedLocations();
    
    // console.log('[App] Auto-loading pinned entities...');
    let lastLoadedId: string | null = null;
    
    // Load all pinned characters
    pinnedCharacters.forEach((character) => {
      // console.log('[App] Auto-loading pinned character:', character.id);
      
      const seed = {
        name: character.name,
        personality: character.details.personality || 'Unknown personality'
      };
      
      createChatWithEntity(character.id, seed, 'character');
      
      if (character.imagePath) {
        updateChatImage(character.id, character.imagePath);
      }
      
      updateChatDeepProfile(character.id, character.details as any);
      lastLoadedId = character.id;
    });
    
    // Load all pinned locations
    pinnedLocations.forEach((location) => {
      // console.log('[App] Auto-loading pinned location:', location.id);
      
      const deepProfile = {
        ...location.locationInfo,
        ...location.worldInfo
      };
      
      const seed = {
        name: location.name,
        atmosphere: location.worldInfo.atmosphere || 'Unknown atmosphere'
      };
      
      createChatWithEntity(location.id, seed, 'location');
      
      if (location.imagePath) {
        updateChatImage(location.id, location.imagePath);
      }
      
      updateChatDeepProfile(location.id, deepProfile as any);
      lastLoadedId = location.id;
    });
    
    // Set the last loaded entity as active
    if (lastLoadedId) {
      setActiveChat(lastLoadedId);
    }
    
    console.log(`[App] Auto-loaded ${pinnedCharacters.length} characters and ${pinnedLocations.length} locations`);
  }, []); // Only run on mount

  return (
    <div className={styles.container}>
      
      {/* Column 1 - Left Sidebar (Controls) */}
      <aside className={styles.sidebar}>
        <SpawnInputBar />
        <ActiveSpawnsPanel />
        <ChatTabs />
      </aside>
      
      {/* Theme Toggle - Bottom Right Corner */}
      <div className={styles.themeToggleContainer}>
        <ThemeToggle className="compact" />
      </div>
      
      {/* Column 2 - Chat (handles both characters and locations) */}
      {activeChatSession && (
        <section className={styles.chatSection}>
          <Card>
            <Chat chatLogic={chatLogic} entityType={activeChatSession.entityType} />
          </Card>
        </section>
      )}
      
      {/* Column 3 - Reserved for Future Panels */}
      <aside className={styles.extraPanel}>
        {/* Future panel space */}
      </aside>
      
      {/* Column 4 - Chat History (Collapsible) / Image Prompt Panel */}
      {activeChatSession && (
        <aside className={styles.historyPanel}>
          {/* Hide chat history for locations */}
          {activeChatSession.entityType !== 'location' && (
            <ChatHistoryViewer messages={activeChatSession.messages} />
          )}
          {/* Always show image prompt panel */}
          {activeChatSession.imagePrompt && (
            <ImagePromptPanel imagePrompt={activeChatSession.imagePrompt} />
          )}
        </aside>
      )}
    </div>
  );
}
