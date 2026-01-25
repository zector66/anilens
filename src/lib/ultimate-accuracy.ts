/**
 * ULTIMATE ACCURACY ENGINE
 * 
 * Implements the "go nuclear" blueprint for maximum taste accuracy.
 * 
 * KEY FEATURES:
 * ✅ TF-IDF signature traits with real population data
 * ✅ Episode count weighting (sqrt(episodes/12) clamped)
 * ✅ Status weighting (completed=1.0, dropped=0.15, etc.)
 * ✅ Rating signal strength detection
 * ✅ Negative evidence from dropped/low scores
 * ✅ Exposure vs Preference split
 * ✅ Realistic confidence scoring
 * ✅ Population percentiles
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

export interface UltimateAccuracyProfile {
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
    ratingSignalStrength: number;     // 0-1, variance in ratings
    coverageCompleteness: number;      // 0-1, tag mapping coverage
    traitDiversity: number;           // 0-1, not dominated by one trait
  };
  
  // Quality metrics
  dataQuality: {
    ratingVariance: number;
    episodeWeighting: number;
    statusDistribution: Record<string, number>;
    favoriteBoost: number;
  };
}

export interface AccuracyWeights {
  episodeWeight: number;
  statusWeight: number;
  ratingWeight: number;
  favoriteWeight: number;
  negativeWeight: number;
}

// ============================================================================
// ACCURACY CONFIGURATION
// ============================================================================

const ACCURACY_CONFIG = {
  // Episode count weighting: clamp(sqrt(episodes/12), 0.75, 2.0)
  MIN_EPISODE_WEIGHT: 0.75,
  MAX_EPISODE_WEIGHT: 2.0,
  BASE_EPISODE_COUNT: 12,
  
  // Status weighting
  STATUS_WEIGHTS: {
    'COMPLETED': 1.0,
    'REPEATING': 0.9,
    'WATCHING': 0.7,
    'PAUSED': 0.5,
    'DROPPED': 0.15,     // Still informative: "you tried this and bounced"
    'PLANNING': 0.0,
  },
  
  // Rating signal strength
  RATING_VARIANCE_THRESHOLD: 2.0,  // Below this = weak signal
  MIN_RATING_VARIANCE: 0.5,
  
  // Negative evidence
  NEGATIVE_SCORE_THRESHOLD: 4,     // <= 4 counts as dislike
  DROPPED_NEGATIVE_FACTOR: 0.6,    // How much dropped reduces traits
  
  // Favorite boost (capped)
  FAVORITE_BOOST: 1.25,
  MAX_FAVORITE_IMPACT: 0.3,        // Max 30% boost to any trait
};

// ============================================================================
// CORE ACCURACY FUNCTIONS
// ============================================================================

/**
 * Compute episode count weighting
 * Formula: clamp(sqrt(episodes/12), 0.75, 2.0)
 */
export function computeEpisodeWeight(episodes: number): number {
  if (episodes <= 0) return ACCURACY_CONFIG.MIN_EPISODE_WEIGHT;
  
  const rawWeight = Math.sqrt(episodes / ACCURACY_CONFIG.BASE_EPISODE_COUNT);
  return Math.max(
    ACCURACY_CONFIG.MIN_EPISODE_WEIGHT,
    Math.min(ACCURACY_CONFIG.MAX_EPISODE_WEIGHT, rawWeight)
  );
}

/**
 * Compute status weighting based on completion state
 */
export function computeStatusWeight(status: string): number {
  return ACCURACY_CONFIG.STATUS_WEIGHTS[status as keyof typeof ACCURACY_CONFIG.STATUS_WEIGHTS] || 0.5;
}

/**
 * Detect rating signal strength (variance analysis)
 */
export function computeRatingSignalStrength(entries: MediaListEntry[]): number {
  const scores = entries
    .filter(e => e.score !== null && e.score > 0)
    .map(e => e.score!);
  
  if (scores.length < 3) return 0.1; // Weak signal with few ratings
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  
  // Normalize variance to 0-1 scale
  const normalizedVariance = Math.min(1.0, variance / ACCURACY_CONFIG.RATING_VARIANCE_THRESHOLD);
  
  return Math.max(ACCURACY_CONFIG.MIN_RATING_VARIANCE, normalizedVariance);
}

/**
 * Compute data quality metrics
 */
export function computeDataQuality(entries: MediaListEntry[]): UltimateAccuracyProfile['dataQuality'] {
  const scores = entries.filter(e => e.score !== null && e.score > 0).map(e => e.score!);
  const ratingVariance = scores.length > 1 ? 
    scores.reduce((sum, score) => sum + Math.pow(score - (scores.reduce((s, x) => s + x, 0) / scores.length), 2), 0) / scores.length 
    : 0;
  
  // Status distribution
  const statusDistribution: Record<string, number> = {};
  entries.forEach(entry => {
    statusDistribution[entry.status] = (statusDistribution[entry.status] || 0) + 1;
  });
  
  // Episode weighting
  const totalEpisodes = entries.reduce((sum, entry) => sum + (entry.media?.episodes || 1), 0);
  const avgEpisodeWeight = entries.reduce((sum, entry) => 
    sum + computeEpisodeWeight(entry.media?.episodes || 1), 0) / entries.length;
  
  // Favorite boost (would need to be added to MediaListEntry interface)
  const favoriteBoost = 1.0; // TODO: Implement when favorites are available
  
  return {
    ratingVariance,
    episodeWeighting: avgEpisodeWeight,
    statusDistribution,
    favoriteBoost,
  };
}

/**
 * Compute realistic confidence scoring
 */
export function computeRealisticConfidence(
  sampleSize: number,
  ratingSignalStrength: number,
  coverageCompleteness: number,
  traitDiversity: number
): UltimateAccuracyProfile['confidence'] {
  // Confidence factors (all 0-1)
  const sampleFactor = Math.min(1.0, sampleSize / 50); // 50+ shows = full confidence
  const ratingFactor = ratingSignalStrength;
  const coverageFactor = coverageCompleteness;
  const diversityFactor = traitDiversity;
  
  // Combined confidence (geometric mean prevents one factor from dominating)
  const overall = Math.pow(
    sampleFactor * ratingFactor * coverageFactor * diversityFactor,
    0.25
  );
  
  return {
    overall,
    sampleSize,
    ratingSignalStrength,
    coverageCompleteness,
    traitDiversity,
  };
}

/**
 * Split media into positive vs negative evidence
 */
export function splitEvidence(entries: MediaListEntry[]): {
  positive: MediaListEntry[];
  negative: MediaListEntry[];
  neutral: MediaListEntry[];
} {
  const positive: MediaListEntry[] = [];
  const negative: MediaListEntry[] = [];
  const neutral: MediaListEntry[] = [];
  
  entries.forEach(entry => {
    const isLowScore = entry.score !== null && entry.score <= ACCURACY_CONFIG.NEGATIVE_SCORE_THRESHOLD;
    const isDropped = entry.status === 'DROPPED';
    
    if (isLowScore || isDropped) {
      negative.push(entry);
    } else if (entry.score && entry.score >= 7) {
      positive.push(entry);
    } else {
      neutral.push(entry);
    }
  });
  
  return { positive, negative, neutral };
}

/**
 * Convert MediaListEntry to trait scoring format with accuracy weights
 */
export function toAccurateMediaEntry(entry: MediaListEntry): {
  tags: MediaTagInput[];
  engagementWeight: number;
  score?: number;
  id?: number;
  title?: string;
} {
  const episodeWeight = computeEpisodeWeight(entry.media?.episodes || 1);
  const statusWeight = computeStatusWeight(entry.status);
  const isNegative = (entry.score !== null && entry.score <= ACCURACY_CONFIG.NEGATIVE_SCORE_THRESHOLD) || 
                     entry.status === 'DROPPED';
  
  // Base weight combines episode and status factors
  let baseWeight = episodeWeight * statusWeight;
  
  // Apply rating modifier
  if (entry.score !== null && entry.score > 0) {
    const ratingModifier = entry.score / 10; // Normalize to 0-1
    baseWeight *= ratingModifier;
  }
  
  // Apply negative weighting
  if (isNegative) {
    baseWeight *= -ACCURACY_CONFIG.DROPPED_NEGATIVE_FACTOR;
  }
  
  // Convert tags to MediaTagInput format
  const tags: MediaTagInput[] = [
    ...(entry.media?.genres || []).map(genre => ({ name: genre, rank: 80 })),
    ...(entry.media?.tags || []).map(tag => ({ name: tag.name, rank: tag.rank || 50 }))
  ];
  
  return {
    tags,
    engagementWeight: Math.max(-1.0, Math.min(1.0, baseWeight)), // Clamp to -1 to 1
    score: entry.score || undefined,
    id: entry.mediaId,
    title: entry.media?.title?.userPreferred,
  };
}

// ============================================================================
// MAIN ACCURACY ENGINE
// ============================================================================

/**
 * Compute ultimate accuracy profile
 * This is the main entry point that implements the full blueprint
 */
export async function computeUltimateAccuracy(
  entries: MediaListEntry[]
): Promise<UltimateAccuracyProfile> {
  // 1. Data quality assessment
  const dataQuality = computeDataQuality(entries);
  const ratingSignalStrength = computeRatingSignalStrength(entries);
  
  // 2. Split evidence
  const { positive, negative } = splitEvidence(entries);
  
  // 3. Convert to accurate media entries
  const positiveInputs = positive.map(toAccurateMediaEntry);
  const allInputs = entries.map(toAccurateMediaEntry);
  
  // 4. Compute profiles
  const exposureProfile = computeTraitProfile(allInputs); // What they watched
  const preferenceProfile = computeTraitProfile(positiveInputs); // What they liked
  
  // 5. Compute signature traits (TF-IDF enhanced)
  const signatureTraits = getTopSignatureTraits(exposureProfile.topTraits, 10);
  
  // 6. Compute population percentiles
  const percentiles = calculateTraitPercentiles(exposureProfile.topTraits);
  
  // 7. Compute confidence
  const coverageCompleteness = 0.8; // TODO: Calculate from tag mapping coverage
  const traitDiversity = 0.9; // TODO: Calculate from trait distribution
  
  const confidence = computeRealisticConfidence(
    entries.length,
    ratingSignalStrength,
    coverageCompleteness,
    traitDiversity
  );
  
  return {
    exposureProfile,
    preferenceProfile,
    percentiles,
    signatureTraits,
    confidence,
    dataQuality,
  };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { ACCURACY_CONFIG };
