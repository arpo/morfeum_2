import { Button } from '@/components/ui';
import { IconLayoutSidebar, IconInfoCircle, IconMessageCircle, IconStack2, IconLoader2, Icon3dCubeSphere, IconExternalLink, IconCamera, IconCheck, IconBookmark, IconMaximize } from '@/icons';
import styles from './TopButtonRow.module.css';

export type DisplayMode = '2d' | 'full' | 'hsbs';

const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  '2d': '2D',
  full: '3D',
  hsbs: 'SBS'
};

interface TopButtonRowProps {
  onToggleSidebar: () => void;
  onOpenInfo: () => void;
  onOpenChat: () => void;
  onOpenSavedEntities: () => void;
  onGenerateDepthMap: () => void;
  onUpscaleImage: () => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onSaveTrainingData: () => void;
  isCharacter: boolean;
  infoDisabled: boolean;
  chatDisabled: boolean;
  depthMapDisabled: boolean;
  depthMapGenerating: boolean;
  isUpscaling: boolean;
  displayMode: DisplayMode;
  hasDepthMap: boolean;
  trainingSaving: boolean;
  trainingSaved: boolean;
}

export function TopButtonRow({
  onToggleSidebar,
  onOpenInfo,
  onOpenChat,
  onOpenSavedEntities,
  onGenerateDepthMap,
  onUpscaleImage,
  onDisplayModeChange,
  onSaveTrainingData,
  isCharacter,
  infoDisabled,
  chatDisabled,
  depthMapDisabled,
  depthMapGenerating,
  isUpscaling,
  displayMode,
  hasDepthMap,
  trainingSaving,
  trainingSaved,
}: TopButtonRowProps) {
  const cycleDisplayMode = () => {
    const modes: DisplayMode[] = ['2d', 'full', 'hsbs'];
    const currentIndex = modes.indexOf(displayMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onDisplayModeChange(modes[nextIndex]);
  };

  return (
    <div className={styles.buttonRow} data-component="top-button-row">
      <Button
        onClick={onToggleSidebar}
        className={styles.button}
        aria-label="Toggle Entity Explorer"
      >
        <IconLayoutSidebar size={20} />
      </Button>
      
      <Button
        onClick={onOpenSavedEntities}
        className={styles.button}
        aria-label="Saved Entities"
      >
        <IconBookmark size={20} />
      </Button>
      
      <Button
        onClick={onOpenInfo}
        className={styles.button}
        disabled={infoDisabled}
        aria-label="View info"
      >
        <IconInfoCircle size={20} />
      </Button>
      
      {isCharacter && (
        <Button
          onClick={onOpenChat}
          className={styles.button}
          disabled={chatDisabled}
          aria-label="Open chat"
        >
          <IconMessageCircle size={20} />
        </Button>
      )}

      {/* Show generate depth map button only when no depth map exists */}
      {!hasDepthMap && (
        <Button
          onClick={onGenerateDepthMap}
          className={styles.button}
          disabled={depthMapDisabled || depthMapGenerating}
          aria-label="Generate depth map"
        >
          {depthMapGenerating ? (
            <IconLoader2 size={20} className={styles.spinner} />
          ) : (
            <IconStack2 size={20} />
          )}
        </Button>
      )}

      {/* Upscale image button */}
      <Button
        onClick={onUpscaleImage}
        className={styles.button}
        disabled={depthMapDisabled || isUpscaling}
        aria-label="Upscale image (4x)"
      >
        {isUpscaling ? (
          <IconLoader2 size={20} className={styles.spinner} />
        ) : (
          <IconMaximize size={20} />
        )}
      </Button>

      {/* Show display mode button only when depth map exists */}
      {hasDepthMap && (
        <Button
          onClick={cycleDisplayMode}
          className={`${styles.button} ${styles.displayModeButton}`}
          aria-label={`Display mode: ${DISPLAY_MODE_LABELS[displayMode]}`}
        >
          <Icon3dCubeSphere size={20} />
          <span className={styles.displayModeLabel}>{DISPLAY_MODE_LABELS[displayMode]}</span>
        </Button>
      )}

      {/* Open external display window (WorldView only, no UI) */}
      <Button
        onClick={() => {
          const url = `${window.location.origin}${window.location.pathname}#view`;
          window.open(url, 'external-view', 'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no');
        }}
        className={styles.button}
        aria-label="Open external display"
      >
        <IconExternalLink size={20} />
      </Button>

      {/* Save training data (image + description) */}
      <Button
        onClick={onSaveTrainingData}
        className={styles.button}
        disabled={trainingSaving}
        aria-label={trainingSaved ? "Training data saved" : "Save training data"}
      >
        {trainingSaving ? (
          <IconLoader2 size={20} className={styles.spinner} />
        ) : trainingSaved ? (
          <IconCheck size={20} />
        ) : (
          <IconCamera size={20} />
        )}
      </Button>
    </div>
  );
}
