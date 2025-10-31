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
export const renderValue = (value: any, depth: number = 0): string | JSX.Element => {
  if (value === null || value === undefined) return 'N/A';
  
  // Handle arrays
  if (Array.isArray(value)) {
    // Array of objects - render as formatted list
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      return (
        <ul style={{ 
          margin: '0.5rem 0', 
          paddingLeft: '1.5rem',
          listStyle: 'none'
        }}>
          {value.map((item, i) => (
            <li key={i} style={{ 
              marginBottom: '0.75rem',
              paddingLeft: '1rem',
              borderLeft: '2px solid var(--color-border, #ccc)'
            }}>
              {Object.entries(item).map(([k, v], idx) => (
                <div key={idx} style={{ marginBottom: '0.25rem' }}>
                  <strong>{formatFieldName(k)}:</strong>{' '}
                  {typeof v === 'object' && v !== null ? renderValue(v, depth + 1) : String(v)}
                </div>
              ))}
            </li>
          ))}
        </ul>
      );
    }
    // Array of primitives
    return value.join(', ');
  }
  
  // Handle plain objects - render nested structure
  if (typeof value === 'object') {
    return (
      <div style={{ 
        marginLeft: depth > 0 ? '0.5rem' : '1rem',
        paddingLeft: '0.5rem',
        borderLeft: depth > 0 ? '1px solid var(--color-border-light, #e0e0e0)' : 'none'
      }}>
        {Object.entries(value).map(([key, val], idx) => (
          <div key={idx} style={{ marginBottom: '0.25rem' }}>
            <strong>{formatFieldName(key)}:</strong>{' '}
            {typeof val === 'object' && val !== null ? renderValue(val, depth + 1) : String(val)}
          </div>
        ))}
      </div>
    );
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
          <div className={styles.value}>{renderValue(value)}</div>
        </div>
      );
    })
    .filter((element): element is JSX.Element => element !== null);
};

/**
 * Generic section renderer - displays all fields in any node section
 * Handles nested objects by creating subsections
 */
export const renderSection = (section: any, styles: any): JSX.Element[] | null => {
  if (!section || typeof section !== 'object') return null;
  
  const elements: JSX.Element[] = [];
  
  Object.entries(section).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    
    // Handle nested objects (but not arrays) as subsections
    if (typeof value === 'object' && !Array.isArray(value)) {
      elements.push(
        <div className={styles.subsection} key={key}>
          <h4 className={styles.subsectionTitle}>{formatFieldName(key)}</h4>
          {renderDNA(value, styles)}
        </div>
      );
    } else {
      // Handle simple fields and arrays
      elements.push(
        <div className={styles.field} key={key}>
          <label className={styles.label}>{formatFieldName(key)}</label>
          <div className={styles.value}>{renderValue(value)}</div>
        </div>
      );
    }
  });
  
  return elements.length > 0 ? elements : null;
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
    
    // Map first niche if exists - normalize structure
    if (hierarchy.host?.regions?.[0]?.locations?.[0]?.niches?.[0]) {
      const niche = hierarchy.host.regions[0].locations[0].niches[0];
      
      // Normalize flat structure to nested format expected by UI
      // Backend outputs: { name, description, looks, ... }
      // UI expects: { meta: { name }, ... }
      convertedProfile.niche = {
        ...niche,
        meta: {
          name: niche.name || niche.meta?.name
        }
      };
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
