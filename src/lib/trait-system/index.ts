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
  type MediaTagInput,
  type TraitScore,
  type ChannelScores,
  type TraitProfile,
  type TraitMatchResult,
} from '../trait-scoring-engine';

// Derived traits and user type detection
export {
  DERIVED_INDICES,
  computeDerivedIndices,
  detectTasteTypes,
  computeStressDiet,
  detectComfortLoop,
  getOppositeRecommendations,
  type DerivedIndex,
  type TasteType,
  type StressDiet,
  type ComfortLoop,
  type OppositeRecommendation,
} from '../derived-traits';

// Individual trait category exports
export * from '../trait-universe';
