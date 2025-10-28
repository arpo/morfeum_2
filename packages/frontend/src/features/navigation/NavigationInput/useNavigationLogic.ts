/**
 * Navigation Input Logic
 * Handles travel command submission and navigation decisions
 */

import { useState } from 'react';
import { useLocationsStore } from '@/store/slices/locationsSlice';

interface NavigationDecision {
  action: 'move' | 'generate' | 'look';
  targetNodeId?: string;
  parentNodeId?: string;
  name?: string;
  scale_hint?: 'macro' | 'area' | 'site' | 'interior' | 'detail';
  relation?: 'child' | 'sibling' | 'parent' | 'distant';
  viewpoint?: string;
  perspective?: string;
  reason: string;
}

interface UseNavigationLogicReturn {
  command: string;
  isLoading: boolean;
  error: string | null;
  handleCommandChange: (value: string) => void;
  handleSubmit: () => Promise<void>;
  handleSuggestionClick: (suggestion: string) => void;
}

export function useNavigationLogic(currentNodeId: string): UseNavigationLogicReturn {
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getNode, getAllNodes, getNodeFocus } = useLocationsStore();

  const handleCommandChange = (value: string) => {
    setCommand(value);
    setError(null);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCommand(suggestion);
  };

  const handleSubmit = async () => {
    if (!command.trim()) {
      setError('Please enter a travel command');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentNode = getNode(currentNodeId);
      if (!currentNode) {
        throw new Error('Current node not found');
      }

      const currentFocus = getNodeFocus(currentNodeId);
      if (!currentFocus) {
        throw new Error('Current focus not found');
      }

      // Get all nodes for context
      const allNodes = getAllNodes().map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        searchDesc: (node.dna as any)?.profile?.searchDesc
      }));

      // Extract navigableElements if they exist
      const navigableElements = (currentNode.dna as any)?.navigableElements;

      // Build request payload
      const requestPayload = {
        userCommand: command,
        currentFocus: {
          node_id: currentFocus.node_id,
          perspective: currentFocus.perspective,
          viewpoint: currentFocus.viewpoint,
          distance: currentFocus.distance,
          currentViewId: currentFocus.currentViewId
        },
        currentNode: {
          id: currentNode.id,
          name: currentNode.name,
          type: currentNode.type,
          searchDesc: (currentNode.dna as any)?.profile?.searchDesc,
          navigableElements: navigableElements || [],
          profile: {
            looks: (currentNode.dna as any)?.profile?.looks,
            atmosphere: (currentNode.dna as any)?.profile?.atmosphere,
            searchDesc: (currentNode.dna as any)?.profile?.searchDesc
          }
        },
        allNodes
      };

      // Call navigation API
      const response = await fetch('/api/mzoo/navigation/decide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Navigation request failed');
      }

      const result = await response.json();
      const decision: NavigationDecision = result.data;

      // Log decision to console for now
      console.log('[NavigationInput] Decision:', decision);
      console.log('[NavigationInput] Full response:', result);

      // TODO: Handle different actions
      // - move: Update focus to target node
      // - generate: Trigger spawn pipeline
      // - look: Create new view

      // Clear command on success
      setCommand('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[NavigationInput] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    command,
    isLoading,
    error,
    handleCommandChange,
    handleSubmit,
    handleSuggestionClick,
  };
}
