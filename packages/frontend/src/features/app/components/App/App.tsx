/**
 * App Component
 * Main application layout - pure JSX, logic in useAppLogic hook
 */

import { useCallback } from 'react';
import { ChatHistoryViewer } from '@/features/chat/components/ChatHistoryViewer';
import { ImagePromptPanel } from '@/features/chat/components/ImagePromptPanel';
import { ChatPanel } from '@/features/chat/components/ChatPanel';
import { CharacterInfoModal } from '@/features/chat/components/CharacterInfoModal';
import { LocationInfoModal } from '@/features/chat/components/LocationInfoModal';
import { SpawnInputBar } from '@/features/spawn-input/SpawnInputBar';
import { SavedEntitiesModal } from '@/features/saved-entities/SavedEntitiesModal';
import { EntityExplorerPanel } from '@/features/app/components/EntityExplorer/EntityExplorerPanel';
import { TopButtonRow } from '@/features/app/components/TopButtonRow';
import { WorldView } from '@/features/app/components/WorldView/WorldView';
import { useAppLogic } from './useAppLogic';
import { useImageDropLogic } from '@/features/spawn-input/SpawnInputBar/useImageDropLogic';
import { useStore } from '@/store';
import styles from './App.module.css';

export function App() {
  // Full-screen image drop zone
  const appendSpawnInputText = useStore(state => state.appendSpawnInputText);
  const handleDescriptionReceived = useCallback((description: string) => {
    appendSpawnInputText(description);
  }, [appendSpawnInputText]);
  const imageDrop = useImageDropLogic({ onDescriptionReceived: handleDescriptionReceived });

  const {
    // State
    isSavedEntitiesModalOpen,
    setIsSavedEntitiesModalOpen,
    isInfoModalOpen,
    displayMode,
    hasDepthMap,
    depthMapGenerating,
    depthMapDisabled,
    trainingSaving,
    trainingSaved,
    
    // Entity state
    activeEntity,
    entities,
    activeEntitySession,
    deepProfile,
    isCharacter,
    entityPanelOpen,
    entityExplorerPanelOpen,
    focusModeEnabled,
    
    // Handlers
    handleOpenInfo,
    handleCloseInfo,
    handleOpenChat,
    handleGenerateDepthMap,
    handleDisplayModeChange,
    handleSaveTrainingData,
    toggleEntityExplorerPanel,
    closeEntityPanel
  } = useAppLogic();

  return (
    <div 
      className={styles.container}
      onDragEnter={imageDrop.handlers.handleDragEnter}
      onDragLeave={imageDrop.handlers.handleDragLeave}
      onDragOver={imageDrop.handlers.handleDragOver}
      onDrop={imageDrop.handlers.handleDrop}
    >
      {/* Full-screen drop overlay */}
      {imageDrop.state.isDragging && (
        <div className={styles.dropOverlay}>
          <div className={styles.dropOverlayContent}>
            <div className={styles.dropOverlayText}>Drop image to analyze</div>
          </div>
        </div>
      )}
      
      {/* Analyzing overlay */}
      {imageDrop.state.isAnalyzing && (
        <div className={styles.analyzingOverlay}>
          <div className={styles.analyzingContent}>
            <div className={styles.spinner} />
            <div className={styles.analyzingText}>Analyzing image...</div>
          </div>
        </div>
      )}
      
      {/* Drop error message */}
      {imageDrop.state.error && (
        <div className={styles.dropError}>{imageDrop.state.error}</div>
      )}
      
      {/* Fullscreen World View (Background) */}
      <WorldView />
      
      {/* Focus mode hint */}
      {focusModeEnabled && (
        <div className={styles.focusModeHint}>
          Press spacebar to display UI
        </div>
      )}
      
      {/* UI Elements - Hidden in focus mode with CSS */}
      <>
        {/* Top Button Row */}
        <div className={focusModeEnabled ? styles.uiHidden : ''}>
          <TopButtonRow
            onToggleSidebar={toggleEntityExplorerPanel}
            onOpenInfo={handleOpenInfo}
            onOpenChat={handleOpenChat}
            onOpenSavedEntities={() => setIsSavedEntitiesModalOpen(true)}
            onGenerateDepthMap={handleGenerateDepthMap}
            onDisplayModeChange={handleDisplayModeChange}
            onSaveTrainingData={handleSaveTrainingData}
            isCharacter={isCharacter}
            infoDisabled={!deepProfile}
            chatDisabled={!deepProfile}
            depthMapDisabled={depthMapDisabled}
            depthMapGenerating={depthMapGenerating}
            displayMode={displayMode}
            hasDepthMap={hasDepthMap}
            trainingSaving={trainingSaving}
            trainingSaved={trainingSaved}
          />
        </div>
        
        {/* Spawn Input Bar */}
        <div className={`${styles.spawnInputContainer} ${focusModeEnabled ? styles.uiHidden : ''}`}>
          <SpawnInputBar onOpenSavedEntities={() => setIsSavedEntitiesModalOpen(true)} />
        </div>

        {/* Entity Explorer Panel */}
        {entityExplorerPanelOpen && (
          <div className={focusModeEnabled ? styles.uiHidden : ''}>
            <EntityExplorerPanel onClose={toggleEntityExplorerPanel} />
          </div>
        )}
        
        {/* Chat History / Image Prompt Panel */}
        {activeEntitySession && (
          <aside className={`${styles.historyPanel} ${focusModeEnabled ? styles.uiHidden : ''}`}>
            {activeEntitySession.entityType !== 'location' && (
              <ChatHistoryViewer messages={activeEntitySession.messages} />
            )}

            {activeEntitySession.imagePrompt && (
              <ImagePromptPanel imagePrompt={activeEntitySession.imagePrompt} />
            )}
          </aside>
        )}

        {/* Draggable Chat Panels */}
        {Array.from(entities.entries()).map(([entityId, entity]) => {
          const isPanelOpen = entityPanelOpen.get(entityId);
          if (!isPanelOpen || entity.entityType !== 'character') return null;
          
          return (
            <div key={entityId} className={focusModeEnabled ? styles.uiHidden : ''}>
              <ChatPanel
                entityId={entityId}
                entityName={entity.entityName}
                onClose={() => closeEntityPanel(entityId)}
              />
            </div>
          );
        })}
      </>

      {/* Character Info Modal */}
      {isCharacter && (
        <CharacterInfoModal 
          deepProfile={deepProfile as any}
          characterName={activeEntitySession?.entityName || 'Unknown'}
          isOpen={isInfoModalOpen}
          onClose={handleCloseInfo}
        />
      )}

      {/* Location Info Modal */}
      {!isCharacter && activeEntitySession && (
        <LocationInfoModal
          locationProfile={deepProfile as any}
          locationName={activeEntitySession?.entityName || 'Unknown'}
          locationId={activeEntity || undefined}
          isOpen={isInfoModalOpen}
          onClose={handleCloseInfo}
        />
      )}

      {/* Saved Entities Modal */}
      <SavedEntitiesModal 
        isOpen={isSavedEntitiesModalOpen}
        onClose={() => setIsSavedEntitiesModalOpen(false)}
        initialTab="characters"
      />
    </div>
  );
}
