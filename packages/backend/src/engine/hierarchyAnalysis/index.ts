/**
 * Hierarchy Analysis Module
 * Exports all hierarchy analysis functionality
 */

export * from './types';
export * from './hierarchyAnalyzer';
export { generateNodeDNA, extractParentContext } from './nodeDNAGenerator';
export { 
  mergeDNA, 
  formatDNAForContext, 
  findAncestryChain, 
  resolveAncestryDNA, 
  getResolvedNodeDNA,
  resolveAncestryDNASkippingPassThrough,
  enforceDNAInheritance
} from './dnaMerge';
