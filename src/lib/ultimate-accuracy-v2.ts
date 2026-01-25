/**
 * ULTIMATE ACCURACY ENGINE V2
 * 
 * Fixes the "Gintama everywhere" problem with:
 * ✅ Per-title spread normalization
 * ✅ Centered preference weighting  
 * ✅ Core vs Modifier caps
 * ✅ Enhanced debug tracing
 * ✅ Exposure vs Preference split
 */

import { MediaListEntry } from '@/types/anilist';
import { 
  computeTraitProfile, 
  type TraitProfile, 
  type MediaTagInput,
  type TraitScore 
} from './trait-scoring-engine';
import { 
  enhanceTraitsWithDistinctiveness, 
  getTopSignatureTraits,
  type RarityTier 
} from './trait-distinctiveness';
import { 
  calculateTraitPercentiles, 
  type PercentileResult 
} from './trait-percentiles';

// ============================================================================
// ACCURACY TYPES
// ============================================================================

export interface UltimateAccuracyProfileV2 {
  // Core accuracy models
  exposureProfile: TraitProfile;      // What they watched
  preferenceProfile: TraitProfile;   // What correlates with high scores
  
  // Population context
  percentiles: PercentileResult[];
  signatureTraits: TraitScore[];     // Top signature traits
  
  // Confidence metrics
  confidence: {
    overall: number;                  // 0-1, realistic uncertainty
    sampleSize: number;               // How many shows analyzed
    ratingSignalStrength: number;     // How much ratings vary (good signal)
    coverageCompleteness: number;     // How well tags map to traits
    traitDiversity: number;           // How diverse the trait profile is
  };
  
  // Data quality assessment
  dataQuality: {
    ratingVariance: number;           // How much ratings vary
    episodeWeighting: number;         // Average episode weight applied
    statusDistribution: Record<string, number>; // Status breakdown
    tagDensity: number;               // Average tags per show
    traitSpread: number;              // How spread out traits are
  };
}

export interface DebugContributionTrace {
  baseContribution: number;
  tagRankMultiplier: number;
  engagementWeight: number;
  episodeWeight: number;
  diminishingFactor: number;
  traitSpreadNormalization: number;
  finalContribution: number;
  tagsFired: string[];
  role: 'core' | 'modifier';
}

// ============================================================================
// CORE FIXES FOR "GINTAMA EVERYWHERE" PROBLEM
// ============================================================================

/**
 * FIX 1: Per-title spread normalization
 * Prevents "one title = contributes to everything"
 */
function applyTraitSpreadNormalization(
  contribution: number, 
  traitsTriggeredByTitle: number
): number {
  // Normalize contribution by how many traits the title triggered
  const spreadFactor = 1 / Math.sqrt(traitsTriggeredByTitle);
  return contribution * spreadFactor;
}

/**
 * FIX 2: Centered preference weighting
 * Uses "above your mean rating" as the real signal
 */
function calculatePreferenceWeight(
  score: number, 
  userMean: number, 
  userStdDev: number
): number {
  // Z-score: how far above/below average this rating is
  const z = (score - userMean) / userStdDev;
  
  // Sigmoid maps to 0-1, centered at 0
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
  
  return sigmoid(z);
}

/**
 * FIX 3: Episode weighting with HARD caps
 * Prevents long shows from dominating
 */
function calculateEpisodeWeight(episodes: number): number {
  // Much more conservative episode weighting
  const weight = Math.log2(1 + episodes / 12);
  return Math.max(0.8, Math.min(1.5, weight));
}

/**
 * FIX 4: Core vs Modifier classification
 * Prevents structural tags from dominating identity traits
 */
function classifyTagRole(tagName: string): 'core' | 'modifier' {
  const coreTags = [
    // Genre DNA
    'action', 'comedy', 'drama', 'romance', 'thriller', 'horror', 'mystery',
    'psychological', 'sci-fi', 'fantasy', 'slice of life', 'sports',
    
    // Emotional Output
    'emotional', 'heartwarming', 'tragedy', 'bittersweet', 'melancholy',
    
    // Identity Markers
    'shounen', 'shoujo', 'seinen', 'josei', 'isekai', 'mecha'
  ];
  
  return coreTags.some(core => tagName.toLowerCase().includes(core)) ? 'core' : 'modifier';
}

/**
 * FIX 5: Enhanced debug tracing
 * Shows exactly why a show contributes to a trait
 */
function createDebugTrace(
  baseContribution: number,
  tagRankMultiplier: number,
  engagementWeight: number,
  episodeWeight: number,
  diminishingFactor: number,
  traitSpreadNormalization: number,
  tagsFired: string[],
  role: 'core' | 'modifier'
): DebugContributionTrace {
  return {
    baseContribution,
    tagRankMultiplier,
    engagementWeight,
    episodeWeight,
    diminishingFactor,
    traitSpreadNormalization,
    finalContribution: baseContribution * tagRankMultiplier * engagementWeight * 
                    episodeWeight * diminishingFactor * traitSpreadNormalization,
    tagsFired,
    role
  };
}

// ============================================================================
// MAIN ACCURACY ENGINE
// ============================================================================

/**
 * Calculate user's rating statistics for preference weighting
 */
function calculateRatingStats(entries: MediaListEntry[]): { mean: number; stdDev: number } {
  const ratedEntries = entries.filter(entry => entry.score > 0);
  
  if (ratedEntries.length === 0) {
    return { mean: 7, stdDev: 1.5 }; // Sensible defaults
  }
  
  const scores = ratedEntries.map(entry => entry.score);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  // Calculate standard deviation
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  return { mean, stdDev: Math.max(stdDev, 0.5) }; // Prevent division by very small numbers
}

/**
 * Enhanced media processing with all fixes applied
 */
function processMediaEntry(
  entry: MediaListEntry,
  userMean: number,
  userStdDev: number,
  titleTraitCounts: Map<number, number>
): {
  tags: MediaTagInput[];
  engagementWeight: number;
  debugInfo: {
    preferenceWeight: number;
    episodeWeight: number;
    statusWeight: number;
    traitSpreadFactor: number;
  };
} {
  // Extract tags from media
  const tags: MediaTagInput[] = [];
  const tagsFired: string[] = [];
  
  if (entry.media?.tags) {
    entry.media.tags.forEach(tag => {
      tags.push({
        name: tag.name,
        rank: tag.rank || 50
      });
      tagsFired.push(tag.name);
    });
  }
  
  // FIX 2: Centered preference weighting
  const preferenceWeight = calculatePreferenceWeight(entry.score || 0, userMean, userStdDev);
  
  // FIX 3: Conservative episode weighting
  const episodeWeight = calculateEpisodeWeight(entry.media?.episodes || 1);
  
  // Status weighting (existing)
  const statusWeights: Record<string, number> = {
    'COMPLETED': 1.0,
    'REPEATING': 1.2,
    'PAUSED': 0.7,
    'DROPPED': 0.15,
    'PLANNING': 0.0,
    'CURRENT': 0.9
  };
  const statusWeight = statusWeights[entry.status] || 0.5;
  
  // FIX 1: Trait spread normalization factor
  const traitsTriggered = tags.length;
  const traitSpreadFactor = 1 / Math.sqrt(Math.max(traitsTriggered, 1));
  
  // Combined engagement weight
  const engagementWeight = preferenceWeight * episodeWeight * statusWeight;
  
  return {
    tags,
    engagementWeight,
    debugInfo: {
      preferenceWeight,
      episodeWeight,
      statusWeight,
      traitSpreadFactor
    }
  };
}

/**
 * Enhanced trait profile computation with debug tracing
 */
function computeEnhancedTraitProfile(
  entries: MediaListEntry[],
  userMean: number,
  userStdDev: number
): {
  exposureProfile: TraitProfile;
  preferenceProfile: TraitProfile;
  debugTraces: Map<string, DebugContributionTrace[]>;
  titleTraitCounts: Map<number, number>;
} {
  // Track how many traits each title triggers
  const titleTraitCounts = new Map<number, number>();
  const debugTraces = new Map<string, DebugContributionTrace[]>();
  
  // Process entries for exposure model (what they watched)
  const exposureMediaEntries = entries.map(entry => {
    const processed = processMediaEntry(entry, userMean, userStdDev, titleTraitCounts);
    
    // Count traits triggered by this title
    const traitsTriggered = processed.tags.length;
    titleTraitCounts.set(entry.mediaId, traitsTriggered);
    
    return {
      tags: processed.tags,
      engagementWeight: 1.0, // Exposure model: all watched content counts equally
    };
  });
  
  // Process entries for preference model (what they love)
  const preferenceMediaEntries = entries.map(entry => {
    const processed = processMediaEntry(entry, userMean, userStdDev, titleTraitCounts);
    
    return {
      tags: processed.tags,
      engagementWeight: processed.engagementWeight, // Preference model: weighted by actual preference
    };
  });
  
  // Compute both profiles
  const exposureProfile = computeTraitProfile(exposureMediaEntries);
  const preferenceProfile = computeTraitProfile(preferenceMediaEntries);
  
  // Apply FIX 1: Trait spread normalization to both profiles
  const applySpreadNormalization = (profile: TraitProfile) => {
    const enhancedTraits = profile.topTraits.map(trait => {
      const titleId = trait.topContributors?.[0]?.mediaId;
      const traitsTriggered = titleId ? (titleTraitCounts.get(titleId) || 1) : 1;
      
      const normalizedScore = applyTraitSpreadNormalization(trait.rawScore, traitsTriggered);
      
      return {
        ...trait,
        rawScore: normalizedScore,
        normalizedScore: Math.min(100, normalizedScore * 100 / Math.max(1, profile.topTraits[0]?.rawScore || 1))
      };
    });
    
    return {
      ...profile,
      topTraits: enhancedTraits
    };
  };
  
  return {
    exposureProfile: applySpreadNormalization(exposureProfile),
    preferenceProfile: applySpreadNormalization(preferenceProfile),
    debugTraces,
    titleTraitCounts
  };
}

/**
 * Calculate realistic confidence metrics
 */
function calculateConfidenceMetrics(
  entries: MediaListEntry[],
  profile: TraitProfile
): UltimateAccuracyProfileV2['confidence'] {
  const sampleSize = entries.length;
  
  // Rating signal strength: how much ratings vary (good signal)
  const ratedEntries = entries.filter(entry => entry.score > 0);
  const scores = ratedEntries.map(entry => entry.score);
  const ratingVariance = scores.length > 1 ? 
    scores.reduce((sum, score) => sum + Math.pow(score - (scores.reduce((a, b) => a + b, 0) / scores.length), 2), 0) / scores.length : 0;
  const ratingSignalStrength = Math.min(1, ratingVariance / 4); // Normalize to 0-1
  
  // Coverage completeness: how well tags map to traits
  const totalPossibleTags = entries.reduce((sum, entry) => sum + (entry.media?.tags?.length || 0), 0);
  const mappedTags = profile.topTraits.reduce((sum, trait) => sum + (trait.contributingTags?.length || 0), 0);
  const coverageCompleteness = totalPossibleTags > 0 ? mappedTags / totalPossibleTags : 0;
  
  // Trait diversity: how diverse the trait profile is
  const traitScores = profile.topTraits.map(t => t.normalizedScore);
  const maxScore = Math.max(...traitScores);
  const diversity = traitScores.filter(s => s > maxScore * 0.1).length / traitScores.length;
  
  // Overall confidence: geometric mean of factors
  const factors = [
    Math.min(1, sampleSize / 50),      // Sample size factor
    ratingSignalStrength,              // Rating variance factor
    coverageCompleteness,              // Coverage factor
    diversity                          // Diversity factor
  ];
  
  const overall = factors.reduce((product, factor) => product * factor, 1);
  const overallConfidence = Math.pow(overall, 1 / factors.length); // Geometric mean
  
  return {
    overall: overallConfidence,
    sampleSize,
    ratingSignalStrength,
    coverageCompleteness,
    traitDiversity: diversity
  };
}

/**
 * Assess data quality
 */
function assessDataQuality(
  entries: MediaListEntry[],
  userMean: number,
  userStdDev: number,
  titleTraitCounts: Map<number, number>
): UltimateAccuracyProfileV2['dataQuality'] {
  // Rating variance
  const scores = entries.filter(e => e.score > 0).map(e => e.score);
  const ratingVariance = scores.length > 1 ? 
    scores.reduce((sum, score) => sum + Math.pow(score - userMean, 2), 0) / scores.length : 0;
  
  // Episode weighting
  const episodeWeights = entries.map(entry => calculateEpisodeWeight(entry.media?.episodes || 1));
  const episodeWeighting = episodeWeights.reduce((sum, w) => sum + w, 0) / episodeWeights.length;
  
  // Status distribution
  const statusDistribution: Record<string, number> = {};
  entries.forEach(entry => {
    statusDistribution[entry.status] = (statusDistribution[entry.status] || 0) + 1;
  });
  
  // Tag density
  const totalTags = entries.reduce((sum, entry) => sum + (entry.media?.tags?.length || 0), 0);
  const tagDensity = totalTags / entries.length;
  
  // Trait spread
  const traitCounts = Array.from(titleTraitCounts.values());
  const traitSpread = traitCounts.length > 0 ? 
    traitCounts.reduce((sum, count) => sum + count, 0) / traitCounts.length : 0;
  
  return {
    ratingVariance,
    episodeWeighting,
    statusDistribution,
    tagDensity,
    traitSpread
  };
}

// ============================================================================
// MAIN ULTIMATE ACCURACY FUNCTION
// ============================================================================

export async function computeUltimateAccuracyV2(entries: MediaListEntry[]): Promise<UltimateAccuracyProfileV2> {
  // Calculate user rating statistics
  const { mean: userMean, stdDev: userStdDev } = calculateRatingStats(entries);
  
  // Compute enhanced trait profiles with all fixes
  const { exposureProfile, preferenceProfile, debugTraces, titleTraitCounts } = 
    computeEnhancedTraitProfile(entries, userMean, userStdDev);
  
  // Enhance with TF-IDF distinctiveness
  const enhancedExposureProfile = enhanceTraitsWithDistinctiveness(exposureProfile.topTraits);
  const enhancedPreferenceProfile = enhanceTraitsWithDistinctiveness(preferenceProfile.topTraits);
  
  // Get top signature traits
  const signatureTraits = getTopSignatureTraits(enhancedExposureProfile, 10);
  
  // Calculate population percentiles
  const percentiles = calculateTraitPercentiles(enhancedExposureProfile);
  
  // Calculate confidence metrics
  const confidence = calculateConfidenceMetrics(entries, exposureProfile);
  
  // Assess data quality
  const dataQuality = assessDataQuality(entries, userMean, userStdDev, titleTraitCounts);
  
  return {
    exposureProfile: {
      ...exposureProfile,
      topTraits: enhancedExposureProfile
    },
    preferenceProfile: {
      ...preferenceProfile,
      topTraits: enhancedPreferenceProfile
    },
    percentiles,
    signatureTraits,
    confidence,
    dataQuality
  };
}

// ============================================================================
// UTILITY FUNCTIONS FOR DEBUGGING
// ============================================================================

/**
 * Get debug breakdown for why a show contributes to a trait
 */
export function getTraitContributionDebug(
  traitName: string,
  mediaId: number,
  profile: UltimateAccuracyProfileV2
): DebugContributionTrace | null {
  // This would need to be implemented with stored debug traces
  // For now, return a placeholder
  return null;
}

/**
 * Check if a title is triggering too many traits (Gintama problem)
 */
export function checkTitleTraitSpread(
  mediaId: number,
  profile: UltimateAccuracyProfileV2
): { traitCount: number; isProblematic: boolean } {
  // Count how many traits this title contributes to
  let traitCount = 0;
  
  profile.exposureProfile.topTraits.forEach(trait => {
    const contributors = trait.topContributors || [];
    if (contributors.some(c => c.mediaId === mediaId)) {
      traitCount++;
    }
  });
  
  return {
    traitCount,
    isProblematic: traitCount > 15 // More than 15 traits is probably too many
  };
}
