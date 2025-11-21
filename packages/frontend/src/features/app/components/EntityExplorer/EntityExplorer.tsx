import React, { useMemo } from 'react';
import { useLocationsStore } from '@/store/slices/locations';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useStore } from '@/store';
import { Tabs, TreeView, TreeItem } from '@/components/ui';
import { IconWorld, IconMapPin, IconInfoCircle } from '@/icons';
import { TreeNode } from '@/store/slices/locations/types';

export const EntityExplorer: React.FC = () => {
  // Data Stores
  const worldTrees = useLocationsStore(state => state.worldTrees);
  const nodes = useLocationsStore(state => state.nodes);
  const charactersMap = useCharactersStore(state => state.characters);
  const characters = useMemo(() => Object.values(charactersMap), [charactersMap]);
  
  // Action Stores
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const createEntity = useStore(state => state.createEntity);
  const updateEntityImage = useStore(state => state.updateEntityImage);
  const updateEntityProfile = useStore(state => state.updateEntityProfile);
  
  // Helper: Activate or Create Session
  const handleSelect = React.useCallback((item: TreeItem, type: 'location' | 'character') => {
    const id = item.id;
    
    // Check if item requires session creation (simplified logic based on App.tsx)
    // We assume if it's in the store, we can just set it active.
    // However, useStore.entities might not have a session for it yet if it wasn't pinned.
    // So we should ensure a session exists.
    
    const state = useStore.getState();
    if (!state.entities.get(id)) {
      // Create session
      if (type === 'location') {
        // Fetch full node data to get seed/DNA
        // We can rely on useLocationsStore to get the node details
        const node = useLocationsStore.getState().getNode(id);
        if (node) {
           const seed = {
            name: node.name,
            // We might need cascaded DNA, but for now simple name is enough to start
            atmosphere: 'Loading...' 
          };
          createEntity(id, seed, 'location'); // Basic creation
          
          // If we have image, update it
          if ((node as any).imagePath) {
             updateEntityImage(id, (node as any).imagePath);
          }
          
          // We should probably trigger a full profile update/load here similar to App.tsx
          // But for navigation, setting active serves the immediate purpose if session exists
        }
      } else {
        // Character
        const char = useCharactersStore.getState().getCharacter(id);
        if (char) {
          const seed = {
            name: char.name,
            personality: char.details?.personality || 'Unknown'
          };
          createEntity(id, seed, 'character');
          if (char.imagePath) {
            updateEntityImage(id, char.imagePath);
          }
          updateEntityProfile(id, char.details as any);
        }
      }
    }
    
    setActiveEntity(id);
  }, [createEntity, setActiveEntity, updateEntityImage, updateEntityProfile]);

  // Memoized Data Mapping
  const locationTreeData = useMemo(() => {
    const mapNode = (treeNode: any): TreeItem => {
      // Look up full node data from nodes map using the ID from the tree
      const fullNode = nodes[treeNode.id];
      // Fallback to treeNode properties if fullNode is missing (safety)
      const label = fullNode?.name || treeNode.name || 'Unknown Location';
      const type = fullNode?.type || treeNode.type;
      // Try to get image from fullNode (root) or dna
      const image = fullNode?.imagePath || (fullNode as any)?.dna?.imagePath || treeNode.imagePath;

      return {
        id: treeNode.id,
        label: label,
        icon: type === 'host' ? <IconWorld size={16} /> : <IconMapPin size={16} />,
        image: image,
        children: treeNode.children?.map(mapNode)
      };
    };
    return worldTrees.map(mapNode);
  }, [worldTrees, nodes]);

  const characterTreeData = useMemo(() => {
    return characters.map(char => ({
      id: char.id,
      label: char.name,
      icon: <IconInfoCircle size={16} />,
      image: char.imagePath,
      // Flat list for characters
    }));
  }, [characters]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        defaultTabId="locations"
        items={[
          {
            id: 'locations',
            label: 'Locations',
            icon: <IconWorld size={16} />,
            content: (
              <TreeView 
                data={locationTreeData} 
                onSelect={(item) => handleSelect(item, 'location')} 
                className="p-2"
              />
            )
          },
          {
            id: 'characters',
            label: 'Characters',
            icon: <IconInfoCircle size={16} />, // Using Info as placeholder for User
            content: (
              <TreeView 
                data={characterTreeData} 
                onSelect={(item) => handleSelect(item, 'character')} 
                className="p-2"
              />
            )
          }
        ]}
      />
    </div>
  );
};
