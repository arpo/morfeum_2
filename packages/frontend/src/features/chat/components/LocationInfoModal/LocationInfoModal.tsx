// LocationInfoModal Component - PURE JSX ONLY
import { Modal, ModalContent, ModalSection } from '@/components/ui';
import { useLocationInfoLogic } from './useLocationInfoLogic';
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

export function LocationInfoModal(props: LocationInfoModalProps) {
  const { locationProfile, locationName, isOpen } = props;
  const { handleClose } = useLocationInfoLogic(props);

  if (!locationProfile) return null;

  // Cast to hierarchical structure
  const profile = locationProfile as any;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`${locationName} - DNA Structure`} maxWidth="lg">
      <ModalContent>
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
                  <p className={styles.value}>{profile.world.meta?.name || 'N/A'}</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Slug</label>
                  <p className={styles.value}>{profile.world.meta?.slug || 'N/A'}</p>
                </div>
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

              {/* Render */}
              {profile.world.render && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Render</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Style</label>
                    <p className={styles.value}>{profile.world.render.style || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Lighting Defaults</label>
                    <p className={styles.value}>{profile.world.render.lighting_defaults || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Camera Defaults</label>
                    <p className={styles.value}>{profile.world.render.camera_defaults || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Seed</label>
                    <p className={styles.value}>{profile.world.render.seed || 'N/A'}</p>
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
                  <p className={styles.value}>{profile.region.meta?.name || 'N/A'}</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Slug</label>
                  <p className={styles.value}>{profile.region.meta?.slug || 'N/A'}</p>
                </div>
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

              {/* Render */}
              {profile.region.render && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Render</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Style</label>
                    <p className={styles.value}>{profile.region.render.style || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Lighting Profile</label>
                    <p className={styles.value}>{profile.region.render.lighting_profile || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Seed</label>
                    <p className={styles.value}>{profile.region.render.seed || 'N/A'}</p>
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
            </ModalSection>
          </>
        )}

        {/* ============================================
            LOCATION NODE - Optional
        ============================================ */}
        {profile.location && (
          <>
            <ModalSection title="📍 Location" description="Specific site details">
              {/* Meta */}
              <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Meta</h4>
                <div className={styles.field}>
                  <label className={styles.label}>Name</label>
                  <p className={styles.value}>{profile.location.meta?.name || 'N/A'}</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Slug</label>
                  <p className={styles.value}>{profile.location.meta?.slug || 'N/A'}</p>
                </div>
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
                    <label className={styles.label}>Time of Day</label>
                    <p className={styles.value}>{profile.location.semantic.time_of_day || 'N/A'}</p>
                  </div>
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

              {/* Render */}
              {profile.location.render && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Render</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Style</label>
                    <p className={styles.value}>{renderValue(profile.location.render.style)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Camera</label>
                    <p className={styles.value}>{renderValue(profile.location.render.camera)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Composition</label>
                    <p className={styles.value}>{renderValue(profile.location.render.composition)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Lighting Profile</label>
                    <p className={styles.value}>{renderValue(profile.location.render.lighting_profile)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Seed</label>
                    <p className={styles.value}>{renderValue(profile.location.render.seed)}</p>
                  </div>
                </div>
              )}

              {/* Profile */}
              {profile.location.profile && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Profile</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Looks</label>
                    <p className={styles.value}>{profile.location.profile.looks || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Colors & Lighting</label>
                    <p className={styles.value}>{profile.location.profile.colorsAndLighting || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Atmosphere</label>
                    <p className={styles.value}>{profile.location.profile.atmosphere || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Materials</label>
                    <p className={styles.value}>{profile.location.profile.materials || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Mood</label>
                    <p className={styles.value}>{profile.location.profile.mood || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Sounds</label>
                    <p className={styles.value}>{profile.location.profile.sounds || 'N/A'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Symbolic Themes</label>
                    <p className={styles.value}>{profile.location.profile.symbolicThemes || 'N/A'}</p>
                  </div>
                  {profile.location.profile.airParticles && profile.location.profile.airParticles !== 'None' && (
                    <div className={styles.field}>
                      <label className={styles.label}>Air Particles</label>
                      <p className={styles.value}>{profile.location.profile.airParticles}</p>
                    </div>
                  )}
                  <div className={styles.field}>
                    <label className={styles.label}>Fictional</label>
                    <p className={styles.value}>{profile.location.profile.fictional ? 'Yes' : 'No'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Copyrighted</label>
                    <p className={styles.value}>{profile.location.profile.copyright ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}

              {/* Suggested Destinations */}
              {profile.location.suggestedDestinations && profile.location.suggestedDestinations.length > 0 && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Suggested Destinations</h4>
                  {profile.location.suggestedDestinations.map((dest: any, i: number) => (
                    <div key={i} className={styles.field}>
                      <label className={styles.label}>{dest.name}</label>
                      <p className={styles.value}>{`${dest.action} (${dest.relation}) - ${dest.slug_hint}`}</p>
                    </div>
                  ))}
                </div>
              )}
            </ModalSection>
          </>
        )}

        {/* ============================================
            SUBLOCATION NODE - Optional
        ============================================ */}
        {profile.sublocation && (
          <>
            <ModalSection title="🚪 Sublocation" description="Interior/tight space details">
              {/* Meta */}
              <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>Meta</h4>
                <div className={styles.field}>
                  <label className={styles.label}>Name</label>
                  <p className={styles.value}>{profile.sublocation.meta?.name || 'N/A'}</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Slug</label>
                  <p className={styles.value}>{profile.sublocation.meta?.slug || 'N/A'}</p>
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
                      <label className={styles.label}>Structures/Fixtures</label>
                      <p className={styles.value}>
                        {profile.sublocation.semantic.structures.map((s: any, i: number) => (
                          <span key={i}>{`${s.type} (${s.material}, ${s.color}, ${s.condition})`}{i < profile.sublocation.semantic.structures.length - 1 ? '; ' : ''}</span>
                        ))}
                      </p>
                    </div>
                  )}
                  <div className={styles.field}>
                    <label className={styles.label}>Time of Day</label>
                    <p className={styles.value}>{profile.sublocation.semantic.time_of_day || 'N/A'}</p>
                  </div>
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
                        <label className={styles.label}>Room Length (m)</label>
                        <p className={styles.value}>{profile.sublocation.spatial.scale.room_length_m ?? 'N/A'}</p>
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
                  {profile.sublocation.spatial.orientation && (
                    <div className={styles.field}>
                      <label className={styles.label}>Dominant View Axis</label>
                      <p className={styles.value}>{profile.sublocation.spatial.orientation.dominant_view_axis || 'N/A'}</p>
                    </div>
                  )}
                  {profile.sublocation.spatial.connectivity && (
                    <div className={styles.field}>
                      <label className={styles.label}>Links To</label>
                      <p className={styles.value}>{renderArray(profile.sublocation.spatial.connectivity.links_to)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Render */}
              {profile.sublocation.render && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Render</h4>
                  <div className={styles.field}>
                    <label className={styles.label}>Style</label>
                    <p className={styles.value}>{renderValue(profile.sublocation.render.style)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Camera</label>
                    <p className={styles.value}>{renderValue(profile.sublocation.render.camera)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Composition</label>
                    <p className={styles.value}>{renderValue(profile.sublocation.render.composition)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Lighting Profile</label>
                    <p className={styles.value}>{renderValue(profile.sublocation.render.lighting_profile)}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Seed</label>
                    <p className={styles.value}>{renderValue(profile.sublocation.render.seed)}</p>
                  </div>
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
                  <div className={styles.field}>
                    <label className={styles.label}>Symbolic Themes</label>
                    <p className={styles.value}>{profile.sublocation.profile.symbolicThemes || 'N/A'}</p>
                  </div>
                  {profile.sublocation.profile.airParticles && profile.sublocation.profile.airParticles !== 'None' && (
                    <div className={styles.field}>
                      <label className={styles.label}>Air Particles</label>
                      <p className={styles.value}>{profile.sublocation.profile.airParticles}</p>
                    </div>
                  )}
                  <div className={styles.field}>
                    <label className={styles.label}>Fictional</label>
                    <p className={styles.value}>{profile.sublocation.profile.fictional ? 'Yes' : 'No'}</p>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Copyrighted</label>
                    <p className={styles.value}>{profile.sublocation.profile.copyright ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}

              {/* Suggested Destinations */}
              {profile.sublocation.suggestedDestinations && profile.sublocation.suggestedDestinations.length > 0 && (
                <div className={styles.subsection}>
                  <h4 className={styles.subsectionTitle}>Suggested Destinations</h4>
                  {profile.sublocation.suggestedDestinations.map((dest: any, i: number) => (
                    <div key={i} className={styles.field}>
                      <label className={styles.label}>{dest.name}</label>
                      <p className={styles.value}>{`${dest.action} (${dest.relation}) - ${dest.slug_hint}`}</p>
                    </div>
                  ))}
                </div>
              )}
            </ModalSection>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
