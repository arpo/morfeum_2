/**
 * LocationInfoModal Helper Functions
 * Utility functions for rendering and formatting location data
 */

import React from 'react';

// Helper to render array values
export const renderArray = (arr: any[] | undefined): string => {
  if (!arr || arr.length === 0) return 'None';
  return arr.join(', ');
};

// Helper to render any value (string, number, object, etc.)
export const renderValue = (value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value)
      .map(([key, val]) => `${key}: ${val}`)
      .join(' | ');
  }
  return String(value);
};

// Helper to format field names nicely
export const formatFieldName = (key: string): string => {
  return key
    .replace(/_/g, ' ')  // Replace underscores with spaces
    .replace(/\b\w/g, char => char.toUpperCase());  // Capitalize each word
};

// Generic DNA renderer - displays all fields in a DNA object
export const renderDNA = (dna: any, styles: any): JSX.Element[] | null => {
  if (!dna || typeof dna !== 'object') return null;
  
  return Object.entries(dna)
    .map(([key, value]) => {
      // Skip nested objects and arrays for now, or handle them specially
      if (value === null || value === undefined) return null;
      
      return (
        <div className={styles.field} key={key}>
          <label className={styles.label}>{formatFieldName(key)}</label>
          <p className={styles.value}>{renderValue(value)}</p>
        </div>
      );
    })
    .filter((element): element is JSX.Element => element !== null);
};

/**
 * Transform profile data structures to standardized format
 */
export function transformProfile(locationProfile: any): any {
  let profile = locationProfile as any;
  
  // Handle new hierarchy structure from hierarchy:complete event
  if (profile.hierarchy) {
    // Convert hierarchy structure to expected format
    const hierarchy = profile.hierarchy;
    const convertedProfile: any = {};
    
    // Map host -> world
    if (hierarchy.host) {
      convertedProfile.world = hierarchy.host;
    }
    
    // Map first region if exists
    if (hierarchy.host?.regions?.[0]) {
      convertedProfile.region = hierarchy.host.regions[0];
    }
    
    // Map first location if exists
    if (hierarchy.host?.regions?.[0]?.locations?.[0]) {
      convertedProfile.location = hierarchy.host.regions[0].locations[0];
    }
    
    // Map first niche if exists
    if (hierarchy.host?.regions?.[0]?.locations?.[0]?.niches?.[0]) {
      convertedProfile.sublocation = hierarchy.host.regions[0].locations[0].niches[0];
    }
    
    profile = convertedProfile;
  }
  
  // Detect if this is a bare WorldNode (has meta.name + semantic but no 'world' wrapper)
  const isBareWorldNode = profile.meta?.name && profile.semantic && !profile.world && !profile.location && !profile.looks;
  
  // Wrap bare WorldNode in expected hierarchical format
  if (isBareWorldNode) {
    profile = { world: profile };
  }
  
  return profile;
}

/**
 * Check if profile uses flat DNA structure
 */
export function isFlatDNA(profile: any): boolean {
  return !profile.world && !profile.region && !profile.location && profile.looks;
}
