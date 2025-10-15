/**
 * ID Validation Processor
 * Validates and fixes node IDs from AI responses
 */

import { VALID_ID_PATTERN, ERROR_MESSAGES } from '../config/constants';
import { NavigationResult, WorldNode } from '../types';

/**
 * Check if a string matches the valid ID pattern
 */
export function isValidId(id: string): boolean {
  return VALID_ID_PATTERN.test(id);
}

/**
 * Find node by name in the nodes array
 */
export function findNodeByName(name: string, allNodes: WorldNode[]): WorldNode | undefined {
  return allNodes.find(n => n.name === name);
}

/**
 * Validate and fix targetNodeId if needed
 * Returns the corrected ID or throws an error if invalid
 */
export function validateTargetNodeId(
  targetNodeId: string | undefined | null,
  allNodes: WorldNode[]
): string | null | undefined {
  if (!targetNodeId) {
    return targetNodeId;
  }

  if (isValidId(targetNodeId)) {
    return targetNodeId;
  }

  // ID looks invalid, try to find node by name
  const matchedNode = findNodeByName(targetNodeId, allNodes);
  if (matchedNode) {
    return matchedNode.id;
  }

  throw new Error(ERROR_MESSAGES.INVALID_TARGET_NODE_ID(targetNodeId));
}

/**
 * Validate and fix parentNodeId if needed
 * Returns the corrected ID or uses fallback to currentNodeId
 */
export function validateParentNodeId(
  parentNodeId: string | undefined | null,
  currentNodeId: string,
  allNodes: WorldNode[]
): string | null | undefined {
  if (!parentNodeId) {
    return parentNodeId;
  }

  if (isValidId(parentNodeId)) {
    return parentNodeId;
  }

  // ID looks invalid, try to find node by name
  const matchedNode = findNodeByName(parentNodeId, allNodes);
  if (matchedNode) {
    return matchedNode.id;
  }

  // For parentNodeId, fallback to current location node ID
  return currentNodeId;
}

/**
 * Auto-fill targetNodeId for parent navigation
 * Returns the parent node ID or throws error if at top level
 */
export function resolveParentTarget(
  currentNodeId: string,
  allNodes: WorldNode[]
): string {
  const currentNode = allNodes.find(n => n.id === currentNodeId);
  
  if (currentNode?.parent_location_id) {
    return currentNode.parent_location_id;
  }

  throw new Error(ERROR_MESSAGES.NO_PARENT_AVAILABLE);
}

/**
 * Validate and fix all IDs in navigation result
 */
export function validateNavigationResult(
  result: NavigationResult,
  currentNodeId: string,
  allNodes: WorldNode[]
): NavigationResult {
  // Validate targetNodeId
  if (result.targetNodeId) {
    result.targetNodeId = validateTargetNodeId(result.targetNodeId, allNodes);
  }

  // Validate parentNodeId
  if (result.parentNodeId) {
    result.parentNodeId = validateParentNodeId(result.parentNodeId, currentNodeId, allNodes);
  }

  // Auto-fill targetNodeId for parent navigation
  if (result.relation === 'parent' && !result.targetNodeId) {
    result.targetNodeId = resolveParentTarget(currentNodeId, allNodes);
  }

  return result;
}
