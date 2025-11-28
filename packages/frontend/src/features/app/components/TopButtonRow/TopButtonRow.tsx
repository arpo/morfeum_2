import { Button } from '@/components/ui';
import { IconLayoutSidebar, IconInfoCircle, IconMessageCircle, IconStack2, IconLoader2, Icon3dCubeSphere } from '@/icons';
import styles from './TopButtonRow.module.css';

export type DisplayMode = 'full' | 'hsbs' | 'fsbs' | 'anaglyph';

const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  full: '2D',
  hsbs: 'SBS',
  fsbs: 'VR',
  anaglyph: '3D'
};

interface TopButtonRowProps {
  onToggleSidebar: () => void;
  onOpenInfo: () => void;
  onOpenChat: () => void;
  onGenerateDepthMap: () => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  isCharacter: boolean;
  infoDisabled: boolean;
  chatDisabled: boolean;
  depthMapDisabled: boolean;
  depthMapGenerating: boolean;
  displayMode: DisplayMode;
  hasDepthMap: boolean;
}

export function TopButtonRow({
  onToggleSidebar,
  onOpenInfo,
  onOpenChat,
  onGenerateDepthMap,
  onDisplayModeChange,
  isCharacter,
  infoDisabled,
  chatDisabled,
  depthMapDisabled,
  depthMapGenerating,
  displayMode,
  hasDepthMap,
}: TopButtonRowProps) {
  const cycleDisplayMode = () => {
    const modes: DisplayMode[] = ['full', 'hsbs', 'fsbs', 'anaglyph'];
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
    </div>
  );
}
