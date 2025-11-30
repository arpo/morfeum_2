/**
 * Location Navigation Utility
 * Handles NavigatorAI API calls and spatial navigation logic
 */

import { Node } from '@/store/slices/locations';
import { getMergedDNA } from '@/utils/nodeDNAExtractor';
import { useStore } from '@/store';
import { 
  buildCurrentLocationDetails, 
  buildSpatialNodes, 
  buildNavigationContext,
  type SpatialNode 
} from './navigationContext';

// Re-export for backward compatibility
export { buildCurrentLocationDetails, buildSpatialNodes };
export type { SpatialNode };

interface NavigationResult {
  action: 'move' | 'generate';
  targetNodeId?: string;
  parentNodeId?: string;
  name?: string;
  scale_hint?: string;
  relation?: string;
  reason: string;
  imageUrl?: string;
  imagePrompt?: string;
  node?: any;
}

/**
 * Call new Navigation Analysis API
 * Uses LLM for intent classification + deterministic routing
 */
export async function findDestination(
  userCommand: string,
  currentNode: Node,
  spatialNodes: SpatialNode[],
  getCascadedDNA: (nodeId: string) => any
): Promise<NavigationResult> {
  // Build context using extracted utility
  const context = buildNavigationContext(
    currentNode,
    spatialNodes,
    getCascadedDNA,
    getMergedDNA
  );
  
  // Call new navigation analysis endpoint
  const response = await fetch('/api/mzoo/navigation/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userCommand: userCommand.trim(),
      context
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Navigation API Error:', error);
    throw new Error(`Navigation API failed: ${error.error || 'Unknown error'}`);
  }
  
  const result = await response.json();
  
  // Log navigation analysis
  logNavigationAnalysis(result.data);
  
  // If eventsUrl is provided, establish SSE connection for pipeline progress
  if (result.data.eventsUrl && result.data.navigationId) {
    return handlePipelineNavigation(result.data, userCommand);
  }
  
  // Convert to legacy format for compatibility (non-pipeline actions)
  return convertToNavigationResult(result.data);
}

/**
 * Log navigation analysis to browser console
 */
function logNavigationAnalysis(data: any): void {
  console.log(' ═══════════════════════════════════════════════════');
  console.log(' NAVIGATION ANALYSIS');
  console.log(' ═══════════════════════════════════════════════════');
  console.log(' User Command:', data.userCommand);
  console.log('');
  console.log(' Intent Classification:');
  console.log('  Intent:', data.intent.intent);
  console.log('  Target:', data.intent.target || 'none');
  console.log('  Direction:', data.intent.direction || 'none');
  console.log('  Space Type:', data.intent.spaceType || 'not classified');
  console.log('  Confidence:', data.intent.confidence);
  console.log('');
  console.log(' Navigation Decision:');
  console.log('  Action:', data.decision.action);
  console.log('  New Node Type:', data.decision.newNodeType || 'N/A');
  console.log('  New Node Name:', data.decision.newNodeName || 'N/A');
  console.log('  Parent Node ID:', data.decision.parentNodeId || 'N/A');
  console.log('  Target Node ID:', data.decision.targetNodeId || 'N/A');
  console.log('  Metadata:', JSON.stringify(data.decision.metadata) || {});
  console.log('  Reasoning:', data.decision.reasoning);
  console.log('');
  console.log(' Context Used:');
  console.log('  Current Node:', data.context.currentNode.name);
  console.log('  Node Type:', data.context.currentNode.type);
  console.log('  Dominant Elements:', data.context.currentNode.data.dominantElements);
  console.log(' ═══════════════════════════════════════════════════');
}

/**
 * Handle navigation that requires pipeline processing
 */
function handlePipelineNavigation(
  data: any,
  userCommand: string
): Promise<NavigationResult> {
  console.log('');
  console.log('[Navigation SSE] Handing off to SpawnSlice...');
  console.log('   Navigation ID:', data.navigationId);
  
  return new Promise<NavigationResult>((resolve, reject) => {
    useStore.getState().registerExternalSpawn(
      data.navigationId!,
      data.eventsUrl!,
      userCommand,
      'location',
      (completionData) => {
        console.log('[Navigation] Pipeline completed via SpawnSlice');
        
        setTimeout(() => {
          useStore.getState().removeSpawn(data.navigationId!);
        }, 2000);
        
        resolve({
          action: 'generate',
          targetNodeId: data.decision.targetNodeId,
          parentNodeId: data.decision.parentNodeId,
          name: data.decision.newNodeName,
          scale_hint: data.decision.newNodeType,
          relation: data.decision.metadata?.relation,
          reason: data.decision.reasoning,
          imageUrl: completionData.imageUrl,
          imagePrompt: completionData.imagePrompt,
          node: completionData.node
        });
      },
      (error) => {
        console.error('[Navigation] Pipeline failed via SpawnSlice:', error);
         
        setTimeout(() => {
          useStore.getState().removeSpawn(data.navigationId!);
        }, 5000);
        
        reject(new Error(error.message || 'Pipeline failed'));
      }
    );
  });
}

/**
 * Convert API response to NavigationResult format
 */
function convertToNavigationResult(data: any): NavigationResult {
  return {
    action: data.decision.action === 'create_niche' || 
            data.decision.action === 'create_detail' ||
            data.decision.action === 'teleport' ? 'generate' : 
            data.decision.action,
    targetNodeId: data.decision.targetNodeId,
    parentNodeId: data.decision.parentNodeId,
    name: data.decision.newNodeName,
    scale_hint: data.decision.newNodeType,
    relation: data.decision.metadata?.relation,
    reason: data.decision.reasoning,
    imageUrl: data.imageUrl,
    imagePrompt: data.imagePrompt,
    node: data.node
  };
}
