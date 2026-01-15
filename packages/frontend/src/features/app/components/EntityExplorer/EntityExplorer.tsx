import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useLocationsStore } from '@/store/slices/locations';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useStore } from '@/store';
import { Tabs, TreeView, TreeItem } from '@/components/ui';
import { IconWorld, IconMapPin, IconInfoCircle, IconEye } from '@/icons';
import { findNodeInTree } from '@/utils/treeUtils';
import { useEntityImages } from '@/hooks';
import { getPrimaryMediaUrl, getEntityMedia } from '@/services/mediaService';

export const EntityExplorer: React.FC = () => {
  // Data Stores - Locations
  const worldTrees = useLocationsStore(state => state.worldTrees);
  const locationNodes = useLocationsStore(state => state.nodes);
  const locationPinnedIds = useLocationsStore(state => state.pinnedIds);
  
  // Data Stores - Characters
  const characterMap = useCharactersStore(state => state.characters);
  const characterPinnedIds = useCharactersStore(state => state.pinnedIds);
  
  // Track view counts and current indices for all entities
  const [viewInfo, setViewInfo] = useState<Map<string, { current: number; total: number }>>(new Map());
  const [, forceUpdate] = useState(0);
  
  // Helper to recursively collect all tree nodes
  const collectAllTreeNodes = (trees: any[], nodes: Record<string, any>): any[] => {
    const result: any[] = [];
    const traverse = (node: any) => {
      const fullNode = nodes[node.id] || node;
      result.push(fullNode);
      if (node.children) node.children.forEach(traverse);
    };
    trees.forEach(traverse);
    return result;
  };

  // Collect ALL entities for image preloading (including nested tree nodes)
  const allEntities = useMemo(() => {
    const treeNodes = collectAllTreeNodes(worldTrees || [], locationNodes);
    const characters = characterPinnedIds.map(id => characterMap[id]).filter(Boolean);
    return [...treeNodes, ...characters];
  }, [worldTrees, locationNodes, characterPinnedIds, characterMap]);
  
  // Preload all images using the new media system
  const imageMap = useEntityImages(allEntities);
  
  // Fetch view counts for all entities
  useEffect(() => {
    const fetchViewCounts = async () => {
      const newViewInfo = new Map<string, { current: number; total: number }>();
      
      for (const entity of allEntities) {
        try {
          const media = await getEntityMedia(entity.id);
          const imageCount = media.filter(m => m.type === 'image').length;
          
          if (imageCount > 1) {
            // Default to showing last (newest) view
            newViewInfo.set(entity.id, { current: imageCount, total: imageCount });
          }
        } catch (error) {
          // Ignore errors
        }
      }
      
      setViewInfo(newViewInfo);
    };
    
    fetchViewCounts();
  }, [allEntities]);
  
  // Listen for view index changes
  useEffect(() => {
    const handleViewIndexChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ entityId: string; currentIndex: number; totalViews: number }>;
      const { entityId, currentIndex, totalViews } = customEvent.detail;
      
      setViewInfo(prev => {
        const newMap = new Map(prev);
        newMap.set(entityId, { current: currentIndex + 1, total: totalViews }); // +1 for 1-based display
        return newMap;
      });
      
      forceUpdate(v => v + 1);
    };
    
    window.addEventListener('viewIndexChanged', handleViewIndexChanged);
    return () => window.removeEventListener('viewIndexChanged', handleViewIndexChanged);
  }, []);
  
  // Resolve pinned locations to their tree structures (if available) or flat nodes
  const locationTreeData = useMemo(() => {
    if (!worldTrees || worldTrees.length === 0) return [];

    // Internal Recursive Mapper
    const mapNode = (treeNode: any): TreeItem => {
      // Look up full node data from nodes map using the ID from the tree
      const fullNode = locationNodes[treeNode.id];
      // Fallback to treeNode properties if fullNode is missing (safety)
      const baseName = fullNode?.name || 'Unknown Location';
      const type = fullNode?.type || treeNode.type;
      // Check if this is a pass-through region
      const isPassThrough = fullNode?.isPassThrough || false;
      // Get image from preloaded imageMap
      const image = imageMap.get(treeNode.id) || undefined;
      
      // Add view counter if entity has multiple views
      const info = viewInfo.get(treeNode.id);
      const label = info ? `${baseName} (${info.current}/${info.total})` : baseName;

      // Determine icon based on node type (cast to string for type safety)
      const typeStr = String(type);
      const getNodeIcon = (nodeType: string) => {
        switch (nodeType) {
          case 'host': return <IconWorld size={16} />;
          case 'view': return <IconEye size={16} />;
          default: return <IconMapPin size={16} />;
        }
      };

      return {
        id: treeNode.id,
        label: label,
        icon: getNodeIcon(typeStr),
        image: image,
        isPassThrough: isPassThrough,
        isView: typeStr === 'view',
        children: treeNode.children?.map(mapNode)
      };
    };

    return locationPinnedIds
      .map(id => {
        // 1. Try to find the node in the hierarchy (to get children)
        let treeNode: any = null;
        
        // Search each root tree
        for (const root of worldTrees) {
          const found = findNodeInTree(root, id);
          if (found) {
            treeNode = found;
            break;
          }
        }

        // 2. If found in tree, use the tree structure (recursive)
        if (treeNode) {
          return mapNode(treeNode);
        }

        // 3. If not found in tree (orphaned or flat), use data directly from nodes map
        const node = locationNodes[id];
        if (!node) return null;

        // Add view counter if entity has multiple views
        const info = viewInfo.get(node.id);
        const label = info ? `${node.name} (${info.current}/${info.total})` : node.name;
        
        return {
          id: node.id,
          label: label,
          icon: node.type === 'host' ? <IconWorld size={16} /> : <IconMapPin size={16} />,
          image: imageMap.get(node.id) || undefined,
          children: undefined // No children known
        };
      })
      .filter(Boolean) as TreeItem[];
  }, [worldTrees, locationNodes, locationPinnedIds, imageMap, viewInfo]);

  const characterTreeData = useMemo(() => {
    return characterPinnedIds
      .map(id => characterMap[id])
      .filter(Boolean)
      .map(char => {
        // Add view counter if character has multiple views
        const info = viewInfo.get(char.id);
        const label = info ? `${char.name} (${info.current}/${info.total})` : char.name;
        
        return {
          id: char.id,
          label: label,
          icon: <IconInfoCircle size={16} />,
          image: imageMap.get(char.id) || undefined,
        };
      });
  }, [characterMap, characterPinnedIds, imageMap, viewInfo]);
  
  // Delete action
  const deleteNodeWithChildren = useLocationsStore(state => state.deleteNodeWithChildren);
  
  // Action Stores
  const activeEntity = useStore(state => state.activeEntity);
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const createEntity = useStore(state => state.createEntity);
  const updateEntityImage = useStore(state => state.updateEntityImage);
  const updateEntityProfile = useStore(state => state.updateEntityProfile);
  
  // Handle delete for locations (with media cleanup)
  const handleDeleteLocation = useCallback((item: TreeItem) => {
    deleteNodeWithChildren(item.id);
  }, [deleteNodeWithChildren]);

  // Helper: Activate or Create Session
  const handleSelect = React.useCallback((item: TreeItem, type: 'location' | 'character') => {
    const id = item.id;
    
    const state = useStore.getState();
    if (!state.entities.get(id)) {
      // Create session
      if (type === 'location') {
        // Fetch full node data
        const node = useLocationsStore.getState().getNode(id);
        if (node) {
           const seed = {
            name: node.name,
            atmosphere: 'Loading...' 
          };
          createEntity(id, seed, 'location'); 
          
          // Resolve via media system (handles primaryMedia)
          getPrimaryMediaUrl(node).then(url => {
            if (url) {
              updateEntityImage(id, url);
            }
          });
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
          
          // Resolve via media system (handles primaryMedia)
          getPrimaryMediaUrl(char).then(url => {
            if (url) {
              updateEntityImage(id, url);
            }
          });
          
          updateEntityProfile(id, char.details as any);
        }
      }
    }
    
    setActiveEntity(id);
    localStorage.setItem('lastActiveEntityId', id);
  }, [createEntity, setActiveEntity, updateEntityImage, updateEntityProfile]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        defaultTabId="locations"
        items={[
          {
            id: 'locations',
            label: 'Host',
            icon: <IconWorld size={16} />,
            content: (
              <TreeView 
                data={locationTreeData} 
                onSelect={(item) => handleSelect(item, 'location')} 
                onDelete={handleDeleteLocation}
                selectedId={activeEntity || undefined}
                className="p-2"
                persistenceKey="entity-explorer-locations"
              />
            )
          },
          {
            id: 'characters',
            label: 'Characters',
            icon: <IconInfoCircle size={16} />, 
            content: (
              <TreeView 
                data={characterTreeData} 
                onSelect={(item) => handleSelect(item, 'character')} 
                selectedId={activeEntity || undefined}
                className="p-2"
                persistenceKey="entity-explorer-characters"
              />
            )
          }
        ]}
      />
    </div>
  );
};
