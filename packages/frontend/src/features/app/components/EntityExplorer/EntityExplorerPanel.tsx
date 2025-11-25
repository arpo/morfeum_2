import { DraggablePanel } from '@/components/ui';
import { EntityExplorer } from './EntityExplorer';
import { useEntityExplorerPanel } from './useEntityExplorerPanel';

interface EntityExplorerPanelProps {
  onClose: () => void;
}

export function EntityExplorerPanel({ onClose }: EntityExplorerPanelProps) {
  const { position, size, setPosition, setSize } = useEntityExplorerPanel();

  return (
    <div data-component="entity-explorer-panel">
      <DraggablePanel
        title="Entity Explorer"
        onClose={onClose}
        initialPosition={position}
        initialSize={size}
        minWidth={300}
        minHeight={400}
        onPositionChange={setPosition}
        onSizeChange={setSize}
      >
        <div style={{ height: '100%', overflow: 'hidden' }}>
          <EntityExplorer />
        </div>
      </DraggablePanel>
    </div>
  );
}
