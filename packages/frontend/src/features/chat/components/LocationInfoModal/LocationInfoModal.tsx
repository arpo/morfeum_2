// LocationInfoModal Component - PURE JSX ONLY
import { Modal, ModalContent, ModalSection, CollapsiblePanel } from '@/components/ui';
import { useLocationsStore } from '@/store/slices/locations';
import { useLocationInfoLogic, determineCurrentNode } from './useLocationInfoLogic';
import { EntityField, EntitySection } from '../shared';
import type { LocationInfoModalProps } from './types';
import styles from './LocationInfoModal.module.css';

// Helper to render array values
const renderArray = (arr: any[] | undefined) => {
  if (!arr || arr.length === 0) return 'None';
  return arr.join(', ');
};

// Helper to render any value (string, number, object, etc.)
const renderValue = (value: any) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value)
      .map(([key, val]) => `${key}: ${val}`)
      .join(' | ');
  }
  return String(value);
};

// Helper to format field names nicely
const formatFieldName = (key: string): string => {
  return key
    .replace(/_/g, ' ')  // Replace underscores with spaces
    .replace(/\b\w/g, char => char.toUpperCase());  // Capitalize each word
};

// Generic DNA renderer - displays all fields in a DNA object
const renderDNA = (dna: any, styles: any) => {
  if (!dna || typeof dna !== 'object') return null;
  
  return Object.entries(dna).map(([key, value]) => {
    // Skip nested objects and arrays for now, or handle them specially
    if (value === null || value === undefined) return null;
    
    return (
      <div className={styles.field} key={key}>
        <label className={styles.label}>{formatFieldName(key)}</label>
        <p className={styles.value}>{renderValue(value)}</p>
      </div>
    );
  });
};

export function LocationInfoModal(props: LocationInfoModalProps) {
  const { locationProfile, locationName, locationId, isOpen } = props;
  const { handleClose } = useLocationInfoLogic(props);
  const getNodeFocus = useLocationsStore(state => state.getNodeFocus);

  if (!locationProfile) return null;

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
  
  // Detect structure type: flat NodeDNA vs hierarchical
  const isFlat = !profile.world && !profile.region && !profile.location && profile.looks;
  
  // Get focus state
  let focus = locationId ? getNodeFocus(locationId) : null;
  
  // Focus is managed separately by the locations store

  // Render flat NodeDNA structure
  if (isFlat) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={`${locationName} - Simplified DNA`} maxWidth="lg">
        <ModalContent>
          {/* Focus State */}
          {focus && (
            <ModalSection title="🎯 Current Focus" description="Where you are viewing from">
              <div className={styles.subsection}>
                <div className={styles.field}>
                  <label className={styles.label}>Perspective</label>
                  <p className={styles.value}>{focus?.perspective ?? 'N/A'}</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Viewpoint</label>
                  <p className={styles.value}>{focus?.viewpoint ?? 'N/A'}</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Distance</label>
                  <p className={styles.value}>{focus?.distance ?? 'N/A'}</p>
                </div>
              </div>
            </ModalSection>
          )}

          {/* Simplified Profile */}
          <ModalSection title="🌍 Location Profile" description="Flat DNA structure">
            <div className={styles.subsection}>
              <div className={styles.field}>
                <label className={styles.label}>Looks</label>
                <p className={styles.value}>{profile.looks || 'N/A'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Colors & Lighting</label>
                <p className={styles.value}>{profile.colorsAndLighting || 'N/A'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Atmosphere</label>
                <p className={styles.value}>{profile.atmosphere || 'N/A'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Materials</label>
                <p className={styles.value}>{profile.materials || 'N/A'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Mood</label>
                <p className={styles.value}>{profile.mood || 'N/A'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Sounds</label>
                <p className={styles.value}>{profile.sounds || 'N/A'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Search Description</label>
                <p className={styles.value}>{profile.searchDesc || 'N/A'}</p>
              </div>
            </div>

            {/* Visual Anchors */}
            {profile.visualAnchors && (
              <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>🎯 Visual Anchors</h4>
                
                {profile.visualAnchors.dominantElements && profile.visualAnchors.dominantElements.length > 0 && (
                  <div className={styles.field}>
                    <label className={styles.label}>Dominant Elements</label>
                    <ul className={styles.list}>
                      {profile.visualAnchors.dominantElements.map((elem: string, i: number) => (
                        <li key={i}>{elem}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {profile.visualAnchors.spatialLayout && (
                  <div className={styles.field}>
                    <label className={styles.label}>Spatial Layout</label>
                    <p className={styles.value}>{profile.visualAnchors.spatialLayout}</p>
                  </div>
                )}
                
                {profile.visualAnchors.surfaceMaterialMap && (
                  <div className={styles.field}>
                    <label className={styles.label}>Surface Materials</label>
                    <p className={styles.value}>
                      <strong>Primary:</strong> {profile.visualAnchors.surfaceMaterialMap.primary_surfaces || 'N/A'}<br/>
                      <strong>Secondary:</strong> {profile.visualAnchors.surfaceMaterialMap.secondary_surfaces || 'N/A'}<br/>
                      <strong>Accents:</strong> {profile.visualAnchors.surfaceMaterialMap.accent_features || 'N/A'}
                    </p>
                  </div>
                )}
                
                {profile.visualAnchors.colorMapping && (
                  <div className={styles.field}>
                    <label className={styles.label}>Color Mapping</label>
                    <p className={styles.value}>
                      <strong>Dominant:</strong> {profile.visualAnchors.colorMapping.dominant || 'N/A'}<br/>
                      <strong>Secondary:</strong> {profile.visualAnchors.colorMapping.secondary || 'N/A'}<br/>
                      <strong>Accent:</strong> {profile.visualAnchors.colorMapping.accent || 'N/A'}<br/>
                      <strong>Ambient:</strong> {profile.visualAnchors.colorMapping.ambient || 'N/A'}
                    </p>
                  </div>
                )}
                
                {profile.visualAnchors.uniqueIdentifiers && profile.visualAnchors.uniqueIdentifiers.length > 0 && (
                  <div className={styles.field}>
                    <label className={styles.label}>Unique Identifiers</label>
                    <ul className={styles.list}>
                      {profile.visualAnchors.uniqueIdentifiers.map((id: string, i: number) => (
                        <li key={i}>{id}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>Metadata</h4>
              <div className={styles.field}>
                <label className={styles.label}>Fictional</label>
                <p className={styles.value}>{profile.fictional ? 'Yes' : 'No'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Copyrighted</label>
                <p className={styles.value}>{profile.copyright ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </ModalSection>
        </ModalContent>
      </Modal>
    );
  }

  // Determine which node is currently in focus
  const currentNodeType = determineCurrentNode(focus || null, profile);

  // Render hierarchical structure with current node first, parents as collapsible
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`${locationName} - DNA Structure`} maxWidth="lg">
      <ModalContent>
        {/* ============================================
            FOCUS STATE - Hidden by default (for debugging only)
        ============================================ */}
        {/* {false && focus ? (
          <ModalSection title="🎯 Current Focus" description="Where you are viewing from">
            <div className={styles.subsection}>
              <div className={styles.field}>
                <label className={styles.label}>Current Node</label>
                <p className={styles.value}>{focus.node_id} ({currentNodeType || 'unknown'})</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Perspective</label>
                <p className={styles.value}>{focus.perspective}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Viewpoint</label>
                <p className={styles.value}>{focus.viewpoint}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Distance</label>
                <p className={styles.value}>{focus.distance}</p>
              </div>
            </div>
          </ModalSection>
        ) : null} */}

        {/* ============================================
            SUBLOCATION NODE - Interior/nested space details
        ============================================ */}
        {profile.sublocation && (
          <>
            <ModalSection title="🔷 Sublocation" description="Interior/nested space details">
              {/* Meta */}
              <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Meta</h4>
                <div className={styles.field}>
                  <label className={styles.label}>Name</label>
                  <p className={styles.value}>{profile.sublocation.meta?.name || 'N/A'}</p>
                </div>
              </div>

              {/* Semantic */}
              {profile.sublocation.semantic && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Semantic</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Environment</label>
                    <p className={styles.value}>{profile.sublocation.semantic.environment || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Terrain/Interior</label>
                    <p className={styles.value}>{profile.sublocation.semantic.terrain_or_interior || 'N/A'}</p>
                  </div>
                  {profile.sublocation.semantic.structures && profile.sublocation.semantic.structures.length > 0 && (
                    <div className={styles.field}>
                      <label className={styles.label}>Structures</label>
                      <p className={styles.value}>
                        {profile.sublocation.semantic.structures.map((s: any, i: number) => (
                          <span key={i}>{`${s.type} (${s.material}, ${s.color}, ${s.condition})`}{i < profile.sublocation.semantic.structures.length - 1 ? '; ' : ''}</span>
                        ))}
                      </p>
                    </div>
                  )}
                  <div className={styles.field}>
                    <label className={styles.label}>Lighting</label>
                    <p className={styles.value}>{profile.sublocation.semantic.lighting || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Weather/Air</label>
                    <p className={styles.value}>{profile.sublocation.semantic.weather_or_air || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Atmosphere</label>
                    <p className={styles.value}>{profile.sublocation.semantic.atmosphere || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Mood</label>
                    <p className={styles.value}>{profile.sublocation.semantic.mood || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Color Palette</label>
                    <p className={styles.value}>{renderArray(profile.sublocation.semantic.color_palette)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Soundscape</label>
                    <p className={styles.value}>{renderArray(profile.sublocation.semantic.soundscape)}</p>
                  </div>
                </div>
              )}

              {/* Spatial */}
              {profile.sublocation.spatial && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Spatial</h4>
                  {profile.sublocation.spatial.scale && (
                    <>
                      <div className={styles.field}>
                        <label className={styles.label}>Ceiling Height (m)</label>
                        <p className={styles.value}>{profile.sublocation.spatial.scale.ceiling_height_m ?? 'N/A'}</p>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Room Width (m)</label>
                        <p className={styles.value}>{profile.sublocation.spatial.scale.room_width_m ?? 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {profile.sublocation.spatial.placement && (
                    <>
                      <div className={styles.field}>
                        <label className={styles.label}>Key Subject Position</label>
                        <p className={styles.value}>{profile.sublocation.spatial.placement.key_subject_position || 'N/A'}</p>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Camera Anchor</label>
                        <p className={styles.value}>{profile.sublocation.spatial.placement.camera_anchor || 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {profile.sublocation.spatial.connectivity && (
                    <div className={styles.field}>
                      <label className={styles.label}>Links To</label>
                      <p className={styles.value}>{renderArray(profile.sublocation.spatial.connectivity.links_to)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Profile */}
              {profile.sublocation.profile && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Profile</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Looks</label>
                    <p className={styles.value}>{profile.sublocation.profile.looks || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Colors & Lighting</label>
                    <p className={styles.value}>{profile.sublocation.profile.colorsAndLighting || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Atmosphere</label>
                    <p className={styles.value}>{profile.sublocation.profile.atmosphere || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Materials</label>
                    <p className={styles.value}>{profile.sublocation.profile.materials || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Mood</label>
                    <p className={styles.value}>{profile.sublocation.profile.mood || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Sounds</label>
                    <p className={styles.value}>{profile.sublocation.profile.sounds || 'N/A'}</p>
                  </div>

                  {/* Visual Anchors */}
                  {profile.sublocation.profile.visualAnchors && (
                    <>
                      <div className={styles.field}>
                        <label className={styles.label}>🎯 Dominant Elements</label>
                        <ul className={styles.list}>
                          {profile.sublocation.profile.visualAnchors.dominantElements?.map((elem: string, i: number) => (
                            <li key={i}>{elem}</li>
                          ))}
                        </ul>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>📐 Spatial Layout</label>
                        <p className={styles.value}>{profile.sublocation.profile.visualAnchors.spatialLayout}</p>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>🧱 Surface Materials</label>
                        <p className={styles.value}>
                          <strong>Primary:</strong> {profile.sublocation.profile.visualAnchors.surfaceMaterialMap?.primary_surfaces}<br/>
                          <strong>Secondary:</strong> {profile.sublocation.profile.visualAnchors.surfaceMaterialMap?.secondary_surfaces}<br/>
                          <strong>Accents:</strong> {profile.sublocation.profile.visualAnchors.surfaceMaterialMap?.accent_features}
                        </p>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>🎨 Color Mapping</label>
                        <p className={styles.value}>
                          <strong>Dominant:</strong> {profile.sublocation.profile.visualAnchors.colorMapping?.dominant}<br/>
                          <strong>Secondary:</strong> {profile.sublocation.profile.visualAnchors.colorMapping?.secondary}<br/>
                          <strong>Accent:</strong> {profile.sublocation.profile.visualAnchors.colorMapping?.accent}<br/>
                          <strong>Ambient:</strong> {profile.sublocation.profile.visualAnchors.colorMapping?.ambient}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </ModalSection>
          </>
        )}

        {/* ============================================
            LOCATION NODE - Specific site details
        ============================================ */}
        {profile.location && (
          <>
            <ModalSection title="📍 Location" description="Specific site details">
              {/* Meta */}
              <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Meta</h4>
                <div className={styles.field}>
                  <label className={styles.label}>Name</label>
                  <p className={styles.value}>{profile.location.name || profile.location.meta?.name || 'N/A'}</p>
                </div>
                {profile.location.description && (
                  <div className={styles.field}>
                    <label className={styles.label}>Description</label>
                    <p className={styles.value}>{profile.location.description}</p>
                  </div>
                )}
              </div>

              {/* Semantic */}
              {profile.location.semantic && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Semantic</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Environment</label>
                    <p className={styles.value}>{profile.location.semantic.environment || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Terrain/Interior</label>
                    <p className={styles.value}>{profile.location.semantic.terrain_or_interior || 'N/A'}</p>
                  </div>
                  {profile.location.semantic.structures && profile.location.semantic.structures.length > 0 && (
                    <div className={styles.field}>
                      <label className={styles.label}>Structures</label>
                      <p className={styles.value}>
                        {profile.location.semantic.structures.map((s: any, i: number) => (
                          <span key={i}>{`${s.type} (${s.material}, ${s.color}, ${s.condition})`}{i < profile.location.semantic.structures.length - 1 ? '; ' : ''}</span>
                        ))}
                      </p>
                    </div>
                  )}
                  {profile.location.semantic.vegetation && (
                    <div className={styles.field}>
                      <label className={styles.label}>Vegetation</label>
                      <p className={styles.value}>{`${renderArray(profile.location.semantic.vegetation.types)} (${profile.location.semantic.vegetation.density || 'unknown'})`}</p>
                    </div>
                  )}
                  {profile.location.semantic.fauna && (
                    <div className={styles.field}>
                      <label className={styles.label}>Fauna</label>
                      <p className={styles.value}>{`${renderArray(profile.location.semantic.fauna.types)} (${profile.location.semantic.fauna.presence || 'unknown'})`}</p>
                    </div>
                  )}
                  <div className={styles.field}>
                    <label className={styles.label}>Lighting</label>
                    <p className={styles.value}>{profile.location.semantic.lighting || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Weather/Air</label>
                    <p className={styles.value}>{profile.location.semantic.weather_or_air || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Atmosphere</label>
                    <p className={styles.value}>{profile.location.semantic.atmosphere || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Mood</label>
                    <p className={styles.value}>{profile.location.semantic.mood || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Color Palette</label>
                    <p className={styles.value}>{renderArray(profile.location.semantic.color_palette)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Soundscape</label>
                    <p className={styles.value}>{renderArray(profile.location.semantic.soundscape)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Genre</label>
                    <p className={styles.value}>{profile.location.semantic.genre || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Spatial */}
              {profile.location.spatial && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Spatial</h4>
                  {profile.location.spatial.scale && (
                    <>
                      <div className={styles.field}>
                        <label className={styles.label}>Primary Height (m)</label>
                        <p className={styles.value}>{profile.location.spatial.scale.primary_height_m ?? 'N/A'}</p>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Scene Width (m)</label>
                        <p className={styles.value}>{profile.location.spatial.scale.scene_width_m ?? 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {profile.location.spatial.placement && (
                    <>
                      <div className={styles.field}>
                        <label className={styles.label}>Key Subject Position</label>
                        <p className={styles.value}>{profile.location.spatial.placement.key_subject_position || 'N/A'}</p>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Camera Anchor</label>
                        <p className={styles.value}>{profile.location.spatial.placement.camera_anchor || 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {profile.location.spatial.orientation && (
                    <>
                      <div className={styles.field}>
                        <label className={styles.label}>Light Source Direction</label>
                        <p className={styles.value}>{profile.location.spatial.orientation.light_source_direction || 'N/A'}</p>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Prevailing Wind/Flow</label>
                        <p className={styles.value}>{profile.location.spatial.orientation.prevailing_wind_or_flow || 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {profile.location.spatial.connectivity && (
                    <div className={styles.field}>
                      <label className={styles.label}>Links To</label>
                      <p className={styles.value}>{renderArray(profile.location.spatial.connectivity.links_to)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Profile - Check both flat and nested structures */}
              <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Profile</h4>
                <div className={styles.field}>
                  <label className={styles.label}>Looks</label>
                  <p className={styles.value}>{profile.location.looks || profile.location.profile?.looks || 'N/A'}</p>
                </div>
                {(profile.location.lighting || profile.location.profile?.colorsAndLighting) && (
                  <div className={styles.field}>
                    <label className={styles.label}>Lighting</label>
                    <p className={styles.value}>{profile.location.lighting || profile.location.profile?.colorsAndLighting || 'N/A'}</p>
                  </div>
                )}
                <div className={styles.field}>
                  <label className={styles.label}>Atmosphere</label>
                  <p className={styles.value}>{profile.location.atmosphere || profile.location.profile?.atmosphere || 'N/A'}</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Mood</label>
                  <p className={styles.value}>{profile.location.mood || profile.location.profile?.mood || 'N/A'}</p>
                </div>
                
                {/* Visual Analysis Fields */}
                {profile.location.dominantElements && profile.location.dominantElements.length > 0 && (
                  <div className={styles.field}>
                    <label className={styles.label}>🎯 Dominant Elements</label>
                    <ul className={styles.list}>
                      {profile.location.dominantElements.map((elem: string, i: number) => (
                        <li key={i}>{elem}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {profile.location.spatialLayout && (
                  <div className={styles.field}>
                    <label className={styles.label}>📐 Spatial Layout</label>
                    <p className={styles.value}>{profile.location.spatialLayout}</p>
                  </div>
                )}
                
                {profile.location.uniqueIdentifiers && profile.location.uniqueIdentifiers.length > 0 && (
                  <div className={styles.field}>
                    <label className={styles.label}>✨ Unique Identifiers</label>
                    <ul className={styles.list}>
                      {profile.location.uniqueIdentifiers.map((id: string, i: number) => (
                        <li key={i}>{id}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Materials breakdown */}
                {(profile.location.materials_primary || profile.location.materials_secondary || profile.location.materials_accents) && (
                  <div className={styles.field}>
                    <label className={styles.label}>🧱 Materials</label>
                    <p className={styles.value}>
                      {profile.location.materials_primary && <><strong>Primary:</strong> {profile.location.materials_primary}<br/></>}
                      {profile.location.materials_secondary && <><strong>Secondary:</strong> {profile.location.materials_secondary}<br/></>}
                      {profile.location.materials_accents && <><strong>Accents:</strong> {profile.location.materials_accents}</>}
                    </p>
                  </div>
                )}
                
                {/* Colors breakdown */}
                {(profile.location.colors_dominant || profile.location.colors_secondary || profile.location.colors_accents || profile.location.colors_ambient) && (
                  <div className={styles.field}>
                    <label className={styles.label}>🎨 Colors</label>
                    <p className={styles.value}>
                      {profile.location.colors_dominant && <><strong>Dominant:</strong> {profile.location.colors_dominant}<br/></>}
                      {profile.location.colors_secondary && <><strong>Secondary:</strong> {profile.location.colors_secondary}<br/></>}
                      {profile.location.colors_accents && <><strong>Accents:</strong> {profile.location.colors_accents}<br/></>}
                      {profile.location.colors_ambient && <><strong>Ambient:</strong> {profile.location.colors_ambient}</>}
                    </p>
                  </div>
                )}
                
                {/* Navigable Elements */}
                {profile.location.navigableElements && profile.location.navigableElements.length > 0 && (
                  <div className={styles.field}>
                    <label className={styles.label}>🚪 Navigable Elements</label>
                    <ul className={styles.list}>
                      {profile.location.navigableElements.map((elem: any, i: number) => (
                        <li key={i}>{elem.type} ({elem.position}): {elem.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* DNA subsection - Generic renderer */}
                {profile.location.dna && (
                  <>
                    <h4 className={styles.subsectionTitle}>DNA</h4>
                    {renderDNA(profile.location.dna, styles)}
                  </>
                )}
              </div>
            </ModalSection>
          </>
        )}

        {/* ============================================
            REGION NODE - Optional
        ============================================ */}
        {profile.region && (
          <>
            <ModalSection title="🗺️ Region" description="Broad area characteristics">
              {/* Meta */}
              <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Meta</h4>
                <div className={styles.field}>
                  <label className={styles.label}>Name</label>
                  <p className={styles.value}>{profile.region.name || profile.region.meta?.name || 'N/A'}</p>
                </div>
                {profile.region.description && (
                  <div className={styles.field}>
                    <label className={styles.label}>Description</label>
                    <p className={styles.value}>{profile.region.description}</p>
                  </div>
                )}
              </div>

              {/* Semantic */}
              {profile.region.semantic && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Semantic</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Environment</label>
                    <p className={styles.value}>{profile.region.semantic.environment || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Climate</label>
                    <p className={styles.value}>{profile.region.semantic.climate || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Weather Pattern</label>
                    <p className={styles.value}>{profile.region.semantic.weather_pattern || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Architecture Style</label>
                    <p className={styles.value}>{profile.region.semantic.architecture_style || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Mood</label>
                    <p className={styles.value}>{profile.region.semantic.mood || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Palette Shift</label>
                    <p className={styles.value}>{renderArray(profile.region.semantic.palette_shift)}</p>
                  </div>
                </div>
              )}

              {/* Spatial */}
              {profile.region.spatial && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Spatial</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Dominant View Axis</label>
                    <p className={styles.value}>{profile.region.spatial.orientation?.dominant_view_axis || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Profile */}
              {profile.region.profile && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Profile</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Colors & Lighting</label>
                    <p className={styles.value}>{profile.region.profile.colorsAndLighting || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Symbolic Themes</label>
                    <p className={styles.value}>{profile.region.profile.symbolicThemes || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* DNA subsection - Generic renderer */}
              {profile.region.dna && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>DNA</h4>
                  {renderDNA(profile.region.dna, styles)}
                </div>
              )}
            </ModalSection>
          </>
        )}

        {/* ============================================
            WORLD NODE - Always Present
        ============================================ */}
        {profile.world && (
          <>
            <ModalSection title="🌐 World DNA" description="Global environmental constants">
              {/* Meta */}
              <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Meta</h4>
                <div className={styles.field}>
                  <label className={styles.label}>Name</label>
                  <p className={styles.value}>{profile.world.name || profile.world.meta?.name || 'N/A'}</p>
                </div>
                {profile.world.description && (
                  <div className={styles.field}>
                    <label className={styles.label}>Description</label>
                    <p className={styles.value}>{profile.world.description}</p>
                  </div>
                )}
              </div>

              {/* Semantic */}
              {profile.world.semantic && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Semantic</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Environment</label>
                    <p className={styles.value}>{profile.world.semantic.environment || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Dominant Materials</label>
                    <p className={styles.value}>{renderArray(profile.world.semantic.dominant_materials)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Atmosphere</label>
                    <p className={styles.value}>{profile.world.semantic.atmosphere || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Architectural Tone</label>
                    <p className={styles.value}>{profile.world.semantic.architectural_tone || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Genre</label>
                    <p className={styles.value}>{profile.world.semantic.genre || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Mood Baseline</label>
                    <p className={styles.value}>{profile.world.semantic.mood_baseline || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Palette Bias</label>
                    <p className={styles.value}>{renderArray(profile.world.semantic.palette_bias)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Physics</label>
                    <p className={styles.value}>{profile.world.semantic.physics || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Spatial */}
              {profile.world.spatial && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Spatial</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Light Behavior</label>
                    <p className={styles.value}>{profile.world.spatial.orientation?.light_behavior || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Profile */}
              {profile.world.profile && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Profile</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Colors & Lighting</label>
                    <p className={styles.value}>{profile.world.profile.colorsAndLighting || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Symbolic Themes</label>
                    <p className={styles.value}>{profile.world.profile.symbolicThemes || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* DNA subsection - Generic renderer */}
              {profile.world.dna && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>DNA</h4>
                  {renderDNA(profile.world.dna, styles)}
                </div>
              )}
            </ModalSection>
          </>
        )}

      </ModalContent>
    </Modal>
  );
}
