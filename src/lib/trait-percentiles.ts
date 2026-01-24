/**
 * TRAIT PERCENTILES
 * Calculates "Is X high for most people?" rankings
 * 
 * Uses aggregated userbase statistics to compute percentile ranks.
 * Initially uses hardcoded baseline estimates; can be updated with real data.
 */

import type { TraitScore, TraitProfile } from './trait-scoring-engine';
import type { DerivedIndex } from './derived-traits';

// ============================================================================
// TYPES
// ============================================================================

export interface PercentileResult {
  traitId: string;
  name: string;
  score: number;
  percentile: number;       // 0-100, what % of users score lower
  rarity: RarityTier;
  description: string;      // "Higher than 85% of users"
}

export type RarityTier = 
  | 'common'      // 0-25th percentile
  | 'uncommon'    // 25-50th percentile  
  | 'notable'     // 50-75th percentile
  | 'rare'        // 75-90th percentile
  | 'exceptional' // 90-99th percentile
  | 'legendary';  // 99th+ percentile

export interface TraitDistribution {
  traitId: string;
  mean: number;
  stdDev: number;
  p25: number;    // 25th percentile
  p50: number;    // Median
  p75: number;    // 75th percentile
  p90: number;    // 90th percentile
  p99: number;    // 99th percentile
  sampleSize: number;
}

// ============================================================================
// BASELINE DISTRIBUTIONS
// Estimated from typical anime viewer patterns
// These should be replaced with real data once available
// ============================================================================

const BASELINE_TRAIT_DISTRIBUTIONS: Record<string, TraitDistribution> = {
  // Identity channel - genre preferences
  psychological: { traitId: 'psychological', mean: 35, stdDev: 25, p25: 15, p50: 30, p75: 50, p90: 70, p99: 90, sampleSize: 10000 },
  action: { traitId: 'action', mean: 55, stdDev: 20, p25: 40, p50: 55, p75: 70, p90: 80, p99: 95, sampleSize: 10000 },
  romance: { traitId: 'romance', mean: 40, stdDev: 25, p25: 20, p50: 35, p75: 55, p90: 75, p99: 92, sampleSize: 10000 },
  comedy: { traitId: 'comedy', mean: 50, stdDev: 20, p25: 35, p50: 50, p75: 65, p90: 78, p99: 92, sampleSize: 10000 },
  thriller: { traitId: 'thriller', mean: 30, stdDev: 22, p25: 12, p50: 25, p75: 45, p90: 65, p99: 85, sampleSize: 10000 },
  slice_of_life: { traitId: 'slice_of_life', mean: 42, stdDev: 25, p25: 22, p50: 40, p75: 60, p90: 75, p99: 90, sampleSize: 10000 },
  fantasy: { traitId: 'fantasy', mean: 48, stdDev: 22, p25: 30, p50: 48, p75: 65, p90: 78, p99: 92, sampleSize: 10000 },
  sci_fi: { traitId: 'sci_fi', mean: 35, stdDev: 24, p25: 15, p50: 32, p75: 52, p90: 70, p99: 88, sampleSize: 10000 },
  horror: { traitId: 'horror', mean: 20, stdDev: 22, p25: 5, p50: 15, p75: 30, p90: 50, p99: 78, sampleSize: 10000 },
  mystery: { traitId: 'mystery', mean: 32, stdDev: 23, p25: 12, p50: 28, p75: 48, p90: 65, p99: 85, sampleSize: 10000 },
  
  // Vibe channel
  cozy: { traitId: 'cozy', mean: 38, stdDev: 26, p25: 18, p50: 35, p75: 55, p90: 72, p99: 90, sampleSize: 10000 },
  dark: { traitId: 'dark', mean: 32, stdDev: 24, p25: 12, p50: 28, p75: 48, p90: 68, p99: 88, sampleSize: 10000 },
  wholesome: { traitId: 'wholesome', mean: 40, stdDev: 25, p25: 20, p50: 38, p75: 58, p90: 75, p99: 92, sampleSize: 10000 },
  chaotic: { traitId: 'chaotic', mean: 28, stdDev: 22, p25: 10, p50: 24, p75: 42, p90: 60, p99: 82, sampleSize: 10000 },
  melancholic: { traitId: 'melancholic', mean: 30, stdDev: 24, p25: 10, p50: 26, p75: 45, p90: 65, p99: 85, sampleSize: 10000 },
  tense: { traitId: 'tense', mean: 35, stdDev: 23, p25: 15, p50: 32, p75: 52, p90: 68, p99: 86, sampleSize: 10000 },
  
  // Intensity channel
  gore_level: { traitId: 'gore_level', mean: 22, stdDev: 25, p25: 5, p50: 15, p75: 35, p90: 58, p99: 82, sampleSize: 10000 },
  violence_level: { traitId: 'violence_level', mean: 38, stdDev: 24, p25: 18, p50: 35, p75: 55, p90: 72, p99: 90, sampleSize: 10000 },
  emotional_damage: { traitId: 'emotional_damage', mean: 35, stdDev: 25, p25: 14, p50: 32, p75: 52, p90: 70, p99: 88, sampleSize: 10000 },
  fanservice_level: { traitId: 'fanservice_level', mean: 30, stdDev: 26, p25: 8, p50: 25, p75: 48, p90: 68, p99: 88, sampleSize: 10000 },
  
  // Structure channel
  complex_plot: { traitId: 'complex_plot', mean: 35, stdDev: 24, p25: 15, p50: 32, p75: 52, p90: 70, p99: 88, sampleSize: 10000 },
  nonlinear: { traitId: 'nonlinear', mean: 22, stdDev: 22, p25: 5, p50: 18, p75: 35, p90: 55, p99: 78, sampleSize: 10000 },
  episodic: { traitId: 'episodic', mean: 40, stdDev: 24, p25: 20, p50: 38, p75: 58, p90: 75, p99: 90, sampleSize: 10000 },
  slow_burn: { traitId: 'slow_burn', mean: 32, stdDev: 24, p25: 12, p50: 28, p75: 48, p90: 68, p99: 86, sampleSize: 10000 },
};

const BASELINE_INDEX_DISTRIBUTIONS: Record<string, TraitDistribution> = {
  emotional_damage_index: { traitId: 'emotional_damage_index', mean: 35, stdDev: 25, p25: 14, p50: 32, p75: 52, p90: 72, p99: 92, sampleSize: 10000 },
  chaos_index: { traitId: 'chaos_index', mean: 30, stdDev: 24, p25: 10, p50: 26, p75: 46, p90: 65, p99: 85, sampleSize: 10000 },
  cruelty_index: { traitId: 'cruelty_index', mean: 28, stdDev: 25, p25: 8, p50: 22, p75: 42, p90: 62, p99: 85, sampleSize: 10000 },
  comfort_index: { traitId: 'comfort_index', mean: 42, stdDev: 25, p25: 22, p50: 40, p75: 60, p90: 78, p99: 95, sampleSize: 10000 },
  complexity_index: { traitId: 'complexity_index', mean: 38, stdDev: 24, p25: 18, p50: 35, p75: 55, p90: 72, p99: 90, sampleSize: 10000 },
  tension_index: { traitId: 'tension_index', mean: 35, stdDev: 24, p25: 15, p50: 32, p75: 52, p90: 70, p99: 88, sampleSize: 10000 },
};

// ============================================================================
// PERCENTILE CALCULATION
// ============================================================================

/**
 * Calculate percentile for a score given a distribution
 * Uses linear interpolation between known percentiles
 */
function calculatePercentile(score: number, dist: TraitDistribution): number {
  if (score <= dist.p25) {
    // 0-25th percentile
    return (score / dist.p25) * 25;
  } else if (score <= dist.p50) {
    // 25-50th percentile
    return 25 + ((score - dist.p25) / (dist.p50 - dist.p25)) * 25;
  } else if (score <= dist.p75) {
    // 50-75th percentile
    return 50 + ((score - dist.p50) / (dist.p75 - dist.p50)) * 25;
  } else if (score <= dist.p90) {
    // 75-90th percentile
    return 75 + ((score - dist.p75) / (dist.p90 - dist.p75)) * 15;
  } else if (score <= dist.p99) {
    // 90-99th percentile
    return 90 + ((score - dist.p90) / (dist.p99 - dist.p90)) * 9;
  } else {
    // 99th+ percentile
    return Math.min(100, 99 + (score - dist.p99) / 10);
  }
}

function getRarityTier(percentile: number): RarityTier {
  if (percentile >= 99) return 'legendary';
  if (percentile >= 90) return 'exceptional';
  if (percentile >= 75) return 'rare';
  if (percentile >= 50) return 'notable';
  if (percentile >= 25) return 'uncommon';
  return 'common';
}

function getPercentileDescription(percentile: number): string {
  const rounded = Math.round(percentile);
  if (rounded >= 99) return 'Top 1% of viewers';
  if (rounded >= 95) return `Higher than ${rounded}% of viewers`;
  if (rounded >= 75) return `Higher than ${rounded}% of viewers`;
  if (rounded >= 50) return `Above average (${rounded}th percentile)`;
  if (rounded >= 25) return `Below average (${rounded}th percentile)`;
  return `Lower than ${100 - rounded}% of viewers`;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Calculate percentile ranks for trait scores
 */
export function calculateTraitPercentiles(traits: TraitScore[]): PercentileResult[] {
  const results: PercentileResult[] = [];
  
  for (const trait of traits) {
    const dist = BASELINE_TRAIT_DISTRIBUTIONS[trait.traitId];
    if (!dist) {
      // Unknown trait - use generic distribution
      const genericPercentile = Math.min(100, trait.normalizedScore);
      results.push({
        traitId: trait.traitId,
        name: trait.name,
        score: trait.normalizedScore,
        percentile: genericPercentile,
        rarity: getRarityTier(genericPercentile),
        description: getPercentileDescription(genericPercentile),
      });
      continue;
    }
    
    const percentile = calculatePercentile(trait.normalizedScore, dist);
    results.push({
      traitId: trait.traitId,
      name: trait.name,
      score: trait.normalizedScore,
      percentile: Math.round(percentile),
      rarity: getRarityTier(percentile),
      description: getPercentileDescription(percentile),
    });
  }
  
  return results;
}

/**
 * Calculate percentile ranks for derived indices
 */
export function calculateIndexPercentiles(indices: DerivedIndex[]): PercentileResult[] {
  const results: PercentileResult[] = [];
  
  for (const index of indices) {
    const dist = BASELINE_INDEX_DISTRIBUTIONS[index.id];
    if (!dist) {
      const genericPercentile = Math.min(100, index.score);
      results.push({
        traitId: index.id,
        name: index.name,
        score: index.score,
        percentile: genericPercentile,
        rarity: getRarityTier(genericPercentile),
        description: getPercentileDescription(genericPercentile),
      });
      continue;
    }
    
    const percentile = calculatePercentile(index.score, dist);
    results.push({
      traitId: index.id,
      name: index.name,
      score: index.score,
      percentile: Math.round(percentile),
      rarity: getRarityTier(percentile),
      description: getPercentileDescription(percentile),
    });
  }
  
  return results;
}

/**
 * Get the most exceptional traits (rarest percentiles)
 */
export function getMostExceptionalTraits(
  profile: TraitProfile,
  limit: number = 5
): PercentileResult[] {
  const allTraits = [
    ...profile.channels.identity,
    ...profile.channels.vibe,
    ...profile.channels.structure,
    ...profile.channels.intensity,
  ];
  
  const withPercentiles = calculateTraitPercentiles(allTraits);
  
  // Sort by percentile descending (highest = most exceptional)
  withPercentiles.sort((a, b) => b.percentile - a.percentile);
  
  return withPercentiles.slice(0, limit);
}

/**
 * Get traits that are unusually low (might be avoided)
 */
export function getMostAvoidedTraits(
  profile: TraitProfile,
  limit: number = 5
): PercentileResult[] {
  const allTraits = [
    ...profile.channels.identity,
    ...profile.channels.vibe,
    ...profile.channels.structure,
    ...profile.channels.intensity,
  ];
  
  const withPercentiles = calculateTraitPercentiles(allTraits);
  
  // Sort by percentile ascending (lowest = most avoided)
  withPercentiles.sort((a, b) => a.percentile - b.percentile);
  
  return withPercentiles.slice(0, limit);
}

/**
 * Generate a profile uniqueness score (how different from average)
 */
export function calculateProfileUniqueness(profile: TraitProfile): {
  uniquenessScore: number;  // 0-100
  label: string;
  exceptionalCount: number;
  description: string;
} {
  const allPercentiles = calculateTraitPercentiles([
    ...profile.channels.identity,
    ...profile.channels.vibe,
    ...profile.channels.structure,
    ...profile.channels.intensity,
  ]);
  
  // Count traits in extreme percentiles
  const exceptionalCount = allPercentiles.filter(p => p.percentile >= 90 || p.percentile <= 10).length;
  const rareCount = allPercentiles.filter(p => p.percentile >= 75 || p.percentile <= 25).length;
  
  // Calculate deviation from mean (50th percentile)
  const avgDeviation = allPercentiles.reduce((sum, p) => sum + Math.abs(p.percentile - 50), 0) / allPercentiles.length;
  
  // Normalize to 0-100 (max deviation is 50)
  const uniquenessScore = Math.min(100, Math.round(avgDeviation * 2));
  
  let label: string;
  let description: string;
  
  if (uniquenessScore >= 80) {
    label = 'Highly Distinctive';
    description = `Your taste is remarkably unique - you have ${exceptionalCount} exceptional traits.`;
  } else if (uniquenessScore >= 60) {
    label = 'Notable Preferences';
    description = `You have strong preferences that set you apart from typical viewers.`;
  } else if (uniquenessScore >= 40) {
    label = 'Balanced Explorer';
    description = `Your taste blends mainstream appeal with personal touches.`;
  } else {
    label = 'Mainstream Core';
    description = `Your preferences align closely with the average anime viewer.`;
  }
  
  return {
    uniquenessScore,
    label,
    exceptionalCount,
    description,
  };
}
