/**
 * TRAIT SYSTEM - Central export for all trait-related functionality
 * 
 * This system provides:
 * - 100+ trait definitions organized by category
 * - AniList tag → trait mappings with weights
 * - Scoring engine with diminishing returns
 * - Separate scoring channels (Identity, Vibe, Structure, Intensity)
 * - Derived indices (Darkness, Cozy, Mindfuck, etc.)
 * - "You have a type" auto-detection
 */

// Core trait definitions
export {
  ALL_TRAITS,
  TRAIT_BY_ID,
  TRAITS_BY_CHANNEL,
  TRAITS_BY_CATEGORY,
  type TraitDefinition,
  type TraitCategory,
  type ScoringChannel,
  type TraitRole,
  type TraitPolarity,
} from '../trait-universe';

// Tag types and mappings
export {
  ALL_TAG_DEFINITIONS,
  TAG_MAP,
  DEFINING_TAGS,
  getTagDefinition,
  isDefiningTag,
  type TagType,
  type TagDefinition,
  type TraitMapping,
} from '../tag-mappings';

// Scoring engine
export {
  TraitScorer,
  computeTraitProfile,
  computeMediaTraits,
  formatTraitProfile,
  matchMediaToProfile,
  calculateRewatchFactor,
  type MediaTagInput,
  type TraitScore,
  type TraitContributor,
  type ChannelScores,
  type TraitProfile,
  type TraitMatchResult,
  type ProfileMeta,
} from '../trait-scoring-engine';

// Derived traits and user type detection
export {
  DERIVED_INDICES,
  computeDerivedIndices,
  detectTasteTypes,
  computeStressDiet,
  detectComfortLoop,
  getOppositeRecommendations,
  // Contradiction Engine
  detectTonalContradictions,
  detectPreferenceMismatches,
  detectStructuralContradictions,
  detectAllContradictions,
  // Mutual exclusivity resolution
  resolveOverlappingTypes,
  // Types
  type DerivedIndex,
  type TasteType,
  type TasteTypeDriver,
  type StressDiet,
  type ComfortLoop,
  type OppositeRecommendation,
  type Contradiction,
  type ContradictionType,
  type PreferenceMismatch,
} from '../derived-traits';

// Taste evolution tracking
export {
  createSnapshot,
  calculateDeltas,
  analyzeEvolution,
  serializeSnapshot,
  deserializeSnapshot,
  type TasteSnapshot,
  type TasteDelta,
  type TasteEvolution,
  type EvolutionPhase,
  type TasteSnapshotStorage,
} from '../taste-evolution';

// Individual trait category exports
export * from '../trait-universe';
