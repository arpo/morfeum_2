/**
 * Location Spawn Utility
 * Handles sublocation generation and spawn parameter building
 */

interface SpawnOptions {
  sublocationName: string;
  parentNodeId: string;
  cascadedContext: any;
  createImage: boolean;
  scaleHint: string;
}

/**
 * Start sublocation spawn with proper parameters
 */
export async function startSublocationSpawn(
  navigationName: string,
  parentNodeId: string,
  cascadedContext: any,
  createImage: boolean,
  scaleHint: string,
  startSpawn: (prompt: string, entityType?: 'location' | 'character' | 'sublocation', metadata?: any) => Promise<string>
): Promise<void> {
  console.log('[Sublocation Generation] 🎯 Passing to spawn API:', {
    sublocationName: navigationName,
    scaleHint: scaleHint || 'interior',
    hasScaleHint: !!scaleHint
  });
  
  try {
    const spawnId = await startSpawn(
      navigationName,
      'sublocation',
      {
        sublocationName: navigationName,
        parentNodeId,
        cascadedContext,
        createImage,
        scaleHint: scaleHint || 'interior'
      }
    );
    
    console.log('[Sublocation Generation] ✅ Spawn started:', spawnId);
  } catch (genError) {
    console.error('[Sublocation Generation] ❌ Failed to start spawn:', genError);
    throw genError;
  }
}
