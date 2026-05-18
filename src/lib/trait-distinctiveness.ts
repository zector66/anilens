/**
 * TRAIT DISTINCTIVENESS MODULE
 * 
 * Computes signature scores using IDF (Inverse Document Frequency) weighting
 * to identify traits that make a user unique vs common traits everyone has.
 * 
 * Formula: signatureScore = normalizedScore * IDF
 * where IDF = log((N + 1) / (df + 1))
 * 
 * This prevents "everyone has 100% Action/Comedy/Drama" by boosting rare traits.
 */

import type { TraitScore } from './trait-scoring-engine';
import { supabase } from './supabase';

// ============================================================================
// GLOBAL TRAIT FREQUENCIES (from database)
// Replaces MOCK_TRAIT_FREQUENCIES with real data from global_trait_stats table
// ============================================================================

// Fallback defaults if DB is unavailable (same as old mock data)
const DEFAULT_FREQUENCIES: Record<string, number> = {
  'action': 0.85, 'comedy': 0.80, 'drama': 0.75, 'romance': 0.70,
  'fantasy': 0.72, 'school': 0.68, 'slice-of-life': 0.65,
  'teen-cast': 0.75, 'female-protagonist': 0.60, 'male-protagonist': 0.70,
  'adventure': 0.55, 'sci-fi': 0.50, 'supernatural': 0.52,
  'mystery': 0.45, 'thriller': 0.42, 'dark': 0.48,
  'emotional-damage': 0.55, 'coming-of-age': 0.50, 'friendship': 0.60,
  'magic': 0.58, 'psychological': 0.35, 'horror': 0.30,
  'mecha': 0.28, 'isekai': 0.38, 'time-travel': 0.25,
  'military': 0.22, 'sports': 0.32, 'music': 0.28,
  'historical': 0.24, 'cyberpunk': 0.18, 'gore': 0.15,
  'body-horror': 0.08, 'cosmic-horror': 0.06, 'noir': 0.12,
  'surrealism': 0.10, 'avant-garde': 0.05, 'meta': 0.08,
  'existential': 0.09, 'absurdist': 0.07, 'tragedy': 0.14,
  'denpa': 0.02, 'ero-guro': 0.01, 'gekiga': 0.01,
  'experimental': 0.03, 'art-film': 0.02, 'cult-classic': 0.04,
  'underground': 0.02, 'sexual-content': 0.45, 'nudity': 0.35,
  'ecchi': 0.40, 'torture': 0.12, 'violence': 0.55,
};

// Module-level cache of global frequencies
let _globalFrequencies: Record<string, number> | null = null;
let _frequenciesLoadedAt: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch global trait frequencies from Supabase
 * Cached in memory for 5 minutes to avoid repeated DB calls
 */
export async function loadGlobalTraitFrequencies(): Promise<Record<string, number>> {
  const now = Date.now();
  if (_globalFrequencies && (now - _frequenciesLoadedAt) < CACHE_TTL_MS) {
    return _globalFrequencies;
  }

  if (!supabase) {
    console.warn('[TraitDistinctiveness] Supabase not available, using defaults');
    return DEFAULT_FREQUENCIES;
  }

  try {
    const { data, error } = await supabase
      .from('global_trait_stats')
      .select('trait_id, frequency_ratio');

    if (error || !data || data.length === 0) {
      console.warn('[TraitDistinctiveness] No trait stats found, using defaults');
      return DEFAULT_FREQUENCIES;
    }

    const frequencies: Record<string, number> = {};
    data.forEach((row: { trait_id: string; frequency_ratio: number }) => {
      frequencies[row.trait_id.toLowerCase()] = Number(row.frequency_ratio);
    });

    _globalFrequencies = frequencies;
    _frequenciesLoadedAt = now;
    console.log(`[TraitDistinctiveness] Loaded ${data.length} trait frequencies from DB`);
    return frequencies;
  } catch (e) {
    console.error('[TraitDistinctiveness] Error loading frequencies:', e);
    return DEFAULT_FREQUENCIES;
  }
}

/**
 * Get cached frequencies synchronously (falls back to defaults if not loaded)
 */
function getFrequencies(): Record<string, number> {
  return _globalFrequencies || DEFAULT_FREQUENCIES;
}

/**
 * Invalidate the in-memory frequency cache
 */
export function invalidateFrequencyCache(): void {
  _globalFrequencies = null;
  _frequenciesLoadedAt = 0;
}

// Rarity tiers for display
export type RarityTier = 'common' | 'uncommon' | 'rare' | 'very_rare';

export interface DistinctivenessMetrics {
  signatureScore: number;      // normalizedScore * IDF
  rarity: RarityTier;
  globalFrequency: number;     // 0-1, % of users with this trait
  idf: number;                 // Inverse document frequency
  percentile?: number;         // Optional: user's percentile rank
}

// ============================================================================
// IDF CALCULATION
// ============================================================================

/**
 * Calculate IDF (Inverse Document Frequency) for a trait
 * Higher IDF = rarer trait = more distinctive
 * 
 * Formula: log((N + 1) / (df + 1))
 * where N = total users, df = users with this trait
 */
function calculateIDF(globalFrequency: number, totalUsers: number = 10000): number {
  const usersWithTrait = globalFrequency * totalUsers;
  const idf = Math.log((totalUsers + 1) / (usersWithTrait + 1));
  return idf;
}

/**
 * Determine rarity tier based on global frequency
 */
function getRarityTier(globalFrequency: number): RarityTier {
  if (globalFrequency >= 0.60) return 'common';
  if (globalFrequency >= 0.20) return 'uncommon';
  if (globalFrequency >= 0.05) return 'rare';
  return 'very_rare';
}

// ============================================================================
// SIGNATURE SCORE COMPUTATION
// ============================================================================

/**
 * Enhance trait scores with distinctiveness metrics
 * This is the main function to call from the trait scoring engine
 */
export function computeDistinctivenessMetrics(
  traitScore: TraitScore,
  totalUsers: number = 10000
): DistinctivenessMetrics {
  // Get global frequency (default to 0.5 if unknown)
  const traitKey = traitScore.traitId.toLowerCase();
  const globalFrequency = getFrequencies()[traitKey] ?? 0.5;
  
  // Calculate IDF
  const idf = calculateIDF(globalFrequency, totalUsers);
  
  // Compute signature score: strength × rarity
  // Normalize IDF to 0-2 range for reasonable multipliers
  const normalizedIDF = Math.min(idf / 3, 2);
  const signatureScore = traitScore.normalizedScore * normalizedIDF;
  
  // Determine rarity tier
  const rarity = getRarityTier(globalFrequency);
  
  return {
    signatureScore: Math.round(signatureScore),
    rarity,
    globalFrequency,
    idf,
  };
}

/**
 * Enhance all trait scores with distinctiveness metrics
 */
export function enhanceTraitsWithDistinctiveness(
  traits: TraitScore[],
  totalUsers: number = 10000
): TraitScore[] {
  return traits.map(trait => {
    const distinctiveness = computeDistinctivenessMetrics(trait, totalUsers);
    return {
      ...trait,
      signatureScore: distinctiveness.signatureScore,
      rarity: distinctiveness.rarity,
      globalFrequency: distinctiveness.globalFrequency,
    };
  });
}

/**
 * Get top signature traits (sorted by signature score, not raw score)
 * This is what should be displayed as "What Makes You Unique"
 */
export function getTopSignatureTraits(
  traits: TraitScore[],
  limit: number = 10,
  options?: {
    excludeWarnings?: boolean;
    minScore?: number;
  }
): TraitScore[] {
  let filtered = traits;
  
  // Filter out warning traits if requested
  if (options?.excludeWarnings) {
    filtered = filtered.filter(t => t.role !== 'warning');
  }
  
  // Filter by minimum score if specified
  const minScore = options?.minScore;
  if (minScore !== undefined) {
    filtered = filtered.filter(t => t.normalizedScore >= minScore);
  }
  
  // Enhance with distinctiveness
  const enhanced = enhanceTraitsWithDistinctiveness(filtered);
  
  // Sort by signature score (not normalized score!)
  return enhanced
    .sort((a, b) => (b.signatureScore ?? 0) - (a.signatureScore ?? 0))
    .slice(0, limit);
}

/**
 * Get diversity-balanced top traits
 * Ensures mix of identity/vibe/structure/intensity instead of all one type
 */
export function getBalancedTopTraits(
  traits: TraitScore[],
  options?: {
    identity?: number;
    vibe?: number;
    structure?: number;
    intensity?: number;
    excludeWarnings?: boolean;
  }
): TraitScore[] {
  const defaults = {
    identity: 8,
    vibe: 6,
    structure: 3,
    intensity: 3,
  };
  
  const limits = { ...defaults, ...options };
  const enhanced = enhanceTraitsWithDistinctiveness(traits);
  
  // Filter warnings if requested
  let filtered = options?.excludeWarnings 
    ? enhanced.filter(t => t.role !== 'warning')
    : enhanced;
  
  // Group by channel
  const byChannel = {
    identity: filtered.filter(t => t.channel === 'identity'),
    vibe: filtered.filter(t => t.channel === 'vibe'),
    structure: filtered.filter(t => t.channel === 'structure'),
    intensity: filtered.filter(t => t.channel === 'intensity'),
  };
  
  // Sort each channel by signature score
  Object.keys(byChannel).forEach(channel => {
    byChannel[channel as keyof typeof byChannel].sort(
      (a, b) => (b.signatureScore ?? 0) - (a.signatureScore ?? 0)
    );
  });
  
  // Take top N from each channel
  const result = [
    ...byChannel.identity.slice(0, limits.identity),
    ...byChannel.vibe.slice(0, limits.vibe),
    ...byChannel.structure.slice(0, limits.structure),
    ...byChannel.intensity.slice(0, limits.intensity),
  ];
  
  // Sort final result by signature score
  return result.sort((a, b) => (b.signatureScore ?? 0) - (a.signatureScore ?? 0));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get rarity label for display
 */
export function getRarityLabel(rarity: RarityTier): string {
  const labels = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    very_rare: 'Very Rare',
  };
  return labels[rarity];
}

/**
 * Get rarity color for UI
 */
export function getRarityColor(rarity: RarityTier): string {
  const colors = {
    common: 'text-gray-400',
    uncommon: 'text-blue-400',
    rare: 'text-purple-400',
    very_rare: 'text-amber-400',
  };
  return colors[rarity];
}

/**
 * Format global frequency as percentage
 */
export function formatFrequency(frequency: number): string {
  return `${Math.round(frequency * 100)}% of users`;
}
