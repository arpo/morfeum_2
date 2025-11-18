/**
 * World Tree Pipeline
 * Generates DNA for all nodes in a hierarchy using batch LLM calls
 * Creates complete world tree with host → regions → locations → niches
 */

import type { HierarchyStructure, NodeDNA, HostNode, RegionNode, LocationNode, NicheNode } from '../hierarchyAnalysis/types';
import { mergeDNA } from '../hierarchyAnalysis/dnaMerge';
import { parseJSON } from '../utils/parseJSON';
import { generateText } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { completeDNAGeneration } from '../generation/prompts/locations/completeDNAGeneration';

/**
 * Generate DNA for all nodes in the hierarchy using batch calls
 * 
 * @param hierarchy - The hierarchy structure from classification
 * @param visualAnalysis - Visual analysis data from the deepest node
 * @param originalPrompt - Original user input
 * @param apiKey - MZOO API key
 * @returns Complete hierarchy with all DNA populated
 */
export async function generateBatchDNA(
  hierarchy: HierarchyStructure,
  visualAnalysis: any,
  originalPrompt: string,
  apiKey: string
): Promise<HierarchyStructure> {
  const host = hierarchy.host;
  
  // Prepare hierarchy data for single prompt
  const regions = (host.regions || []).map(region => ({
    name: region.name,
    description: region.description,
    locations: (region.locations || []).map(location => ({
      name: location.name,
      description: location.description,
      niches: (location.niches || []).map(niche => ({
        name: niche.name,
        description: niche.description
      }))
    }))
  }));
  
  // Single LLM call to generate ALL DNA
  const prompt = completeDNAGeneration(
    originalPrompt,
    host.name,
    host.description,
    regions,
    visualAnalysis
  );
  
  const messages = [{ role: 'user', content: prompt }];
  const result = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);
  
  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to generate complete DNA');
  }
  
  const dnaResult = parseJSON<{
    host: {
      name: string;
      description: string;
      navigableElements?: any[];
      dominantElements?: string[];
      uniqueIdentifiers?: string[];
      searchDesc?: string;
      slug?: string;
      dna: NodeDNA;
    };
    regions: Array<{
      name: string;
      description: string;
      navigableElements?: any[];
      dominantElements?: string[];
      uniqueIdentifiers?: string[];
      searchDesc?: string;
      slug?: string;
      dna: Partial<NodeDNA>;
    }>;
    locations: Array<{
      regionName: string;
      name: string;
      description: string;
      navigableElements?: any[];
      dominantElements?: string[];
      uniqueIdentifiers?: string[];
      searchDesc?: string;
      slug?: string;
      dna: Partial<NodeDNA>;
    }>;
    niches?: Array<{
      locationName: string;
      name: string;
      description: string;
      navigableElements?: any[];
      dominantElements?: string[];
      uniqueIdentifiers?: string[];
      searchDesc?: string;
      slug?: string;
      dna: Partial<NodeDNA>;
    }>;
  }>(result.data.text);
  
  // Apply Host data (DNA + structural fields)
  host.name = dnaResult.host.name;
  host.description = dnaResult.host.description;
  host.dna = dnaResult.host.dna;
  host.navigableElements = dnaResult.host.navigableElements;
  host.dominantElements = dnaResult.host.dominantElements;
  host.uniqueIdentifiers = dnaResult.host.uniqueIdentifiers;
  host.searchDesc = dnaResult.host.searchDesc;
  host.slug = dnaResult.host.slug;
  
  // Apply Region data (DNA + structural fields)
  if (host.regions && dnaResult.regions) {
    host.regions.forEach(region => {
      const regionData = dnaResult.regions.find(r => r.name === region.name);
      if (regionData) {
        region.name = regionData.name;
        region.description = regionData.description;
        region.dna = regionData.dna as any;
        region.navigableElements = regionData.navigableElements;
        region.dominantElements = regionData.dominantElements;
        region.uniqueIdentifiers = regionData.uniqueIdentifiers;
        region.searchDesc = regionData.searchDesc;
        region.slug = regionData.slug;
      }
    });
  }
  
  // Apply Location data (DNA + structural fields)
  if (dnaResult.locations) {
    for (const locData of dnaResult.locations) {
      const region = host.regions?.find(r => r.name === locData.regionName);
      if (region && region.locations) {
        const location = region.locations.find(l => l.name === locData.name);
        if (location) {
          location.name = locData.name;
          location.description = locData.description;
          location.dna = locData.dna as any;
          location.navigableElements = locData.navigableElements;
          location.dominantElements = locData.dominantElements;
          location.uniqueIdentifiers = locData.uniqueIdentifiers;
          location.searchDesc = locData.searchDesc;
          location.slug = locData.slug;
        }
      }
    }
  }
  
  // Apply Niche data (DNA + structural fields)
  if (dnaResult.niches) {
    for (const nicheData of dnaResult.niches) {
      // Find niche by traversing hierarchy
      for (const region of host.regions || []) {
        for (const location of region.locations || []) {
          if (location.niches) {
            const niche = location.niches.find(n => n.name === nicheData.name);
            if (niche && location.name === nicheData.locationName) {
              niche.name = nicheData.name;
              niche.description = nicheData.description;
              niche.dna = nicheData.dna as any;
              niche.navigableElements = nicheData.navigableElements;
              niche.dominantElements = nicheData.dominantElements;
              niche.uniqueIdentifiers = nicheData.uniqueIdentifiers;
              niche.searchDesc = nicheData.searchDesc;
              niche.slug = nicheData.slug;
            }
          }
        }
      }
    }
  }
  
  // Merge visual analysis into deepest node (if provided)
  // This adds scene-specific fields from the generated image
  if (visualAnalysis) {
    // Find the deepest node in the hierarchy
    let targetNode: any = null;
    
    if (host.regions && host.regions.length > 0) {
      const region = host.regions[0];
      if (region.locations && region.locations.length > 0) {
        const location = region.locations[0];
        if (location.niches && location.niches.length > 0) {
          targetNode = location.niches[0]; // Deepest: niche
        } else {
          targetNode = location; // Deepest: location
        }
      } else {
        targetNode = region; // Deepest: region
      }
    } else {
      targetNode = host; // Deepest: host
    }
    
    // Merge visual analysis into target node
    if (targetNode && targetNode.dna) {
      // Scene fields go in DNA
      if (visualAnalysis.looks) targetNode.dna.looks = visualAnalysis.looks;
      if (visualAnalysis.atmosphere) targetNode.dna.atmosphere = visualAnalysis.atmosphere;
      if (visualAnalysis.mood) targetNode.dna.mood = visualAnalysis.mood;
      if (visualAnalysis.spatialLayout) targetNode.dna.spatialLayout = visualAnalysis.spatialLayout;
      
      // Map lighting to colorsAndLighting (field name conversion)
      if (visualAnalysis.lighting) {
        targetNode.dna.colorsAndLighting = visualAnalysis.lighting;
      }
      
      // Map materials fields (field name conversion)
      if (visualAnalysis.materials_primary) {
        targetNode.dna.primary_surfaces = visualAnalysis.materials_primary;
      }
      if (visualAnalysis.materials_secondary) {
        targetNode.dna.secondary_surfaces = visualAnalysis.materials_secondary;
      }
      if (visualAnalysis.materials_accents) {
        targetNode.dna.accent_features = visualAnalysis.materials_accents;
      }
      
      // Map color fields (field name conversion)
      if (visualAnalysis.colors_dominant) {
        targetNode.dna.dominant = visualAnalysis.colors_dominant;
      }
      if (visualAnalysis.colors_secondary) {
        targetNode.dna.secondary = visualAnalysis.colors_secondary;
      }
      if (visualAnalysis.colors_accents) {
        targetNode.dna.accent = visualAnalysis.colors_accents;
      }
      if (visualAnalysis.colors_ambient) {
        targetNode.dna.ambient = visualAnalysis.colors_ambient;
      }
      
      // Structural fields go at node root (NOT in DNA)
      if (visualAnalysis.navigableElements) {
        targetNode.navigableElements = visualAnalysis.navigableElements;
      }
      if (visualAnalysis.dominantElements) {
        targetNode.dominantElements = visualAnalysis.dominantElements;
      }
      if (visualAnalysis.uniqueIdentifiers) {
        targetNode.uniqueIdentifiers = visualAnalysis.uniqueIdentifiers;
      }
      if (visualAnalysis.searchDesc) {
        targetNode.searchDesc = visualAnalysis.searchDesc;
      }
    }
  }
  
  return hierarchy;
}
