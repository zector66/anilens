/**
 * TRAIT SCORING ENGINE - Computes trait scores from media tags with:
 * - Diminishing returns for reinforcing tags
 * - Separate scoring channels (Identity, Vibe, Structure, Intensity)
 * - Normalized output per channel to avoid "1% everything" issue
 * - Weight-based signal prioritization
 */

import { ALL_TRAITS, TRAIT_BY_ID, type ScoringChannel, type TraitDefinition } from './trait-universe';
import { getTagDefinition, isDefiningTag, ALL_TAG_DEFINITIONS } from './tag-mappings';

// ============================================================================
// PRECOMPILED TAG→TRAIT LOOKUP MAP (Performance optimization)
// ============================================================================

interface TraitContribution {
  traitId: string;
  weight: number;
  diminishRate: number;
}

// Build lookup map once at module load for O(1) tag→trait lookups
const TAG_TRAIT_MAP: Map<string, TraitContribution[]> = new Map();

function buildTagTraitMap(): void {
  for (const tagDef of ALL_TAG_DEFINITIONS) {
    const contributions: TraitContribution[] = [];
    for (const mapping of tagDef.mappings) {
      const traitDef = TRAIT_BY_ID.get(mapping.traitId);
      if (traitDef) {
        contributions.push({
          traitId: mapping.traitId,
          weight: mapping.weight,
          diminishRate: traitDef.diminishRate ?? 0.15,
        });
      }
    }
    TAG_TRAIT_MAP.set(tagDef.tagName.toLowerCase(), contributions);
  }
}

// Initialize on module load
buildTagTraitMap();

// Fast lookup function
function getTraitContributions(tagName: string): TraitContribution[] {
  return TAG_TRAIT_MAP.get(tagName.toLowerCase()) || [];
}

// ============================================================================
// TYPES
// ============================================================================

export interface MediaTagInput {
  name: string;
  rank?: number; // 0-100, how relevant the tag is to this media
}

// Explainability: Top contributors per trait
export interface TraitContributor {
  mediaId?: number;
  title?: string;
  contribution: number;
  tagsUsed: { name: string; rank: number }[];
}

export interface TraitScore {
  traitId: string;
  name: string;
  category: string;
  channel: ScoringChannel;
  rawScore: number;       // Accumulated weighted score
  normalizedScore: number; // 0-100 within channel
  contributingTags: string[]; // Tags that contributed to this trait
  topContributors?: TraitContributor[]; // Top 3 media that contributed most
  confidence: number;     // 0-1, based on sample size and consistency
  role?: 'core' | 'modifier' | 'mechanic' | 'warning';
}

export interface ChannelScores {
  identity: TraitScore[];
  vibe: TraitScore[];
  structure: TraitScore[];
  intensity: TraitScore[];
}

export interface TraitProfile {
  channels: ChannelScores;
  topTraits: TraitScore[];  // Top traits across all channels
  totalMediaCount: number;
  profileMeta: ProfileMeta;  // Edge case handling metadata
}

// Edge case handling metadata
export interface ProfileMeta {
  sampleSize: 'tiny' | 'small' | 'medium' | 'large' | 'massive';
  ratingSignalStrength: 'none' | 'weak' | 'normal' | 'strong';
  maxScoreCap: number;      // Applied cap based on sample size
  warnings: string[];       // UI hints for the user
  isEarlyProfile: boolean;  // < 15 titles
}

// ============================================================================
// DIMINISHING RETURNS - Per-Trait Formula
// Each trait has its own diminishRate (0.05 for rare traits, 0.25 for broad)
// Formula: contribution = weight * (1 / (1 + diminishRate * hitCount))
// This ensures:
//   - Rare traits (denpa, noir) diminish slowly → can surface even with few hits
//   - Broad traits (action, comedy) diminish quickly → prevents spam domination
// ============================================================================

// ============================================================================
// EDGE CASE HANDLING UTILITIES
// ============================================================================

/**
 * Calculate max score cap based on sample size
 * Prevents "100% THIS" on tiny samples
 */
function calculateSampleCap(totalMediaCount: number): number {
  if (totalMediaCount >= 15) return 100; // Full confidence
  // Formula: max = 55 + totalMediaCount * 2
  // 5 shows → 65, 10 shows → 75, 15 shows → 85+
  return Math.min(55 + totalMediaCount * 3, 100);
}

/**
 * Classify sample size for UI hints
 */
function classifySampleSize(count: number): ProfileMeta['sampleSize'] {
  if (count <= 5) return 'tiny';
  if (count <= 15) return 'small';
  if (count <= 100) return 'medium';
  if (count <= 1000) return 'large';
  return 'massive';
}

/**
 * Detect score compression (user only uses 2-3 rating values)
 * Returns entropy-like measure: 0 = all same, 1 = full distribution used
 */
function detectScoreCompression(scores: number[]): number {
  if (scores.length === 0) return 0;
  const validScores = scores.filter(s => s > 0);
  if (validScores.length < 5) return 0.5; // Too few to judge
  
  // Count unique values
  const uniqueValues = new Set(validScores).size;
  const maxPossible = Math.min(10, validScores.length); // 1-10 scale or sample size
  
  return uniqueValues / maxPossible;
}

/**
 * Detect rating signal strength from multiple indicators:
 * 1. Standard deviation (variance)
 * 2. Score compression (unique values used)
 * 3. Implicit signals available (completion/drop/rewatch data)
 */
function detectRatingSignal(
  scores: number[],
  implicitSignals?: { completionRate?: number; dropRate?: number; rewatchCount?: number }
): ProfileMeta['ratingSignalStrength'] {
  if (scores.length === 0) {
    // No explicit ratings - check if we have implicit signals
    if (implicitSignals && (implicitSignals.completionRate !== undefined || implicitSignals.dropRate !== undefined)) {
      return 'weak'; // Implicit signals available
    }
    return 'none';
  }
  
  const validScores = scores.filter(s => s > 0);
  if (validScores.length === 0) {
    if (implicitSignals && (implicitSignals.completionRate !== undefined || implicitSignals.dropRate !== undefined)) {
      return 'weak';
    }
    return 'none';
  }
  
  // Calculate standard deviation
  const mean = validScores.reduce((a, b) => a + b, 0) / validScores.length;
  const variance = validScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / validScores.length;
  const stdDev = Math.sqrt(variance);
  
  // Check score compression (do they only use 2-3 values?)
  const compression = detectScoreCompression(validScores);
  
  // Combine signals: stdDev + compression + implicit
  let signalScore = 0;
  
  // Variance contribution (0-2 points)
  if (stdDev >= 2.0) signalScore += 2;
  else if (stdDev >= 1.0) signalScore += 1.5;
  else if (stdDev >= 0.5) signalScore += 0.5;
  
  // Compression contribution (0-1 points)
  signalScore += compression;
  
  // Implicit signals contribution (0-0.5 points)
  if (implicitSignals) {
    if (implicitSignals.completionRate !== undefined) signalScore += 0.2;
    if (implicitSignals.dropRate !== undefined && implicitSignals.dropRate > 0) signalScore += 0.2;
    if (implicitSignals.rewatchCount !== undefined && implicitSignals.rewatchCount > 0) signalScore += 0.1;
  }
  
  // Map to signal strength
  if (signalScore < 0.5) return 'none';
  if (signalScore < 1.5) return 'weak';
  if (signalScore < 2.5) return 'normal';
  return 'strong';
}

/**
 * Cap rewatch effect to prevent spam domination
 * Formula: 1 + min(rewatches, 3) * 0.15
 */
export function calculateRewatchFactor(rewatchCount: number): number {
  return 1 + Math.min(rewatchCount, 3) * 0.15;
}

/**
 * Calculate rare trait floor for massive libraries
 * Prevents "denpa/noir/time_loop" from sinking into nothing
 */
function calculateRareTraitFloor(
  rawScore: number, 
  hitCount: number, 
  diminishRate: number,
  totalMediaCount: number
): number {
  // Only apply floor for massive libraries with rare traits
  if (totalMediaCount < 500) return rawScore;
  if (diminishRate > 0.10) return rawScore; // Not a rare trait
  if (hitCount < 6) return rawScore; // Not enough occurrences to preserve
  
  // Floor: ensure rare trait maintains at least 30% of its peak potential
  const peakScore = hitCount * 3; // Rough estimate of peak contribution
  const floor = peakScore * 0.3;
  
  return Math.max(rawScore, floor);
}

// ============================================================================
// TRAIT ACCUMULATOR
// Tracks raw scores with diminishing returns
// ============================================================================

interface MediaContribution {
  mediaId?: number;
  title?: string;
  contribution: number;
  tags: { name: string; rank: number }[];
}

interface TraitAccumulator {
  traitId: string;
  hitCount: number;        // How many times this trait was reinforced
  rawScore: number;        // Accumulated score with diminishing returns
  contributingTags: Set<string>;
  mediaContributions: MediaContribution[]; // Track per-media contributions for explainability
  diminishRate: number;    // Per-trait diminishing rate
}

class TraitScorer {
  private accumulators: Map<string, TraitAccumulator> = new Map();
  private currentMediaId?: number;
  private currentMediaTitle?: string;
  private currentMediaTags: { name: string; rank: number }[] = [];
  
  constructor() {
    // Initialize accumulators for all traits with per-trait diminish rates
    for (const trait of ALL_TRAITS) {
      this.accumulators.set(trait.id, {
        traitId: trait.id,
        hitCount: 0,
        rawScore: 0,
        contributingTags: new Set(),
        mediaContributions: [],
        diminishRate: trait.diminishRate ?? 0.15, // Default 0.15 if not specified
      });
    }
  }
  
  /**
   * Add a tag's contribution to traits (uses per-trait diminishing rates)
   * @param tag - The tag name from AniList
   * @param tagRank - The tag's relevance to the media (0-100, default 50)
   * @param engagementWeight - How much the user engaged with this media (0-1)
   */
  addTag(tag: string, tagRank: number = 50, engagementWeight: number = 1): void {
    const tagDef = getTagDefinition(tag);
    if (!tagDef) return; // Unknown tag, skip
    
    // Rank modifier: tags with higher relevance contribute more
    const rankModifier = tagRank / 100;
    
    // Defining tags get a boost
    const definingBoost = isDefiningTag(tag) ? 1.5 : 1;
    
    // Track this tag for current media
    this.currentMediaTags.push({ name: tag, rank: tagRank });
    
    for (const mapping of tagDef.mappings) {
      const acc = this.accumulators.get(mapping.traitId);
      if (!acc) continue;
      
      // Calculate contribution with PER-TRAIT diminishing returns
      // Formula: 1 / (1 + diminishRate * hitCount)
      const diminishing = 1 / (1 + acc.diminishRate * acc.hitCount);
      const contribution = mapping.weight * diminishing * rankModifier * definingBoost * engagementWeight;
      
      acc.rawScore += contribution;
      acc.hitCount++;
      acc.contributingTags.add(tag);
    }
  }
  
  /**
   * Add multiple tags from a media entry with explainability tracking
   */
  addMediaTags(
    tags: MediaTagInput[], 
    engagementWeight: number = 1,
    mediaInfo?: { id?: number; title?: string }
  ): void {
    // Store current media context for contribution tracking
    this.currentMediaId = mediaInfo?.id;
    this.currentMediaTitle = mediaInfo?.title;
    this.currentMediaTags = [];
    
    // Collect contributions per trait for this media
    const preScores = new Map<string, number>();
    for (const [id, acc] of Array.from(this.accumulators.entries())) {
      preScores.set(id, acc.rawScore);
    }
    
    // Add all tags
    for (const tag of tags) {
      this.addTag(tag.name, tag.rank ?? 50, engagementWeight);
    }
    
    // Record contributions for explainability (top traits only)
    for (const [id, acc] of Array.from(this.accumulators.entries())) {
      const contribution = acc.rawScore - (preScores.get(id) || 0);
      if (contribution > 0.5) { // Only track meaningful contributions
        acc.mediaContributions.push({
          mediaId: this.currentMediaId,
          title: this.currentMediaTitle,
          contribution,
          tags: [...this.currentMediaTags],
        });
      }
    }
  }
  
  /**
   * Get normalized scores by channel with explainability data
   * Normalizes within each channel so top trait = 100
   * Applies edge case handling: sample dampening + rare trait preservation
   */
  getChannelScores(totalMediaCount: number = 1): ChannelScores {
    const channels: ChannelScores = {
      identity: [],
      vibe: [],
      structure: [],
      intensity: [],
    };
    
    // Calculate sample cap for early profiles
    const sampleCap = calculateSampleCap(totalMediaCount);
    
    // Group accumulators by channel
    for (const [traitId, acc] of Array.from(this.accumulators.entries())) {
      const traitDef = TRAIT_BY_ID.get(traitId);
      if (!traitDef || acc.rawScore === 0) continue;
      
      // Apply rare trait floor for massive libraries
      const adjustedRawScore = calculateRareTraitFloor(
        acc.rawScore,
        acc.hitCount,
        acc.diminishRate,
        totalMediaCount
      );
      
      // Sort media contributions by contribution amount and take top 3
      const sortedContributions = [...acc.mediaContributions]
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 3);
      
      // Calculate confidence based on sample size and consistency
      // More hits = more confident, but cap at reasonable levels
      const sampleConfidence = Math.min(acc.hitCount / 10, 1); // Max confidence at 10+ hits
      const sizeConfidence = Math.min(totalMediaCount / 20, 1); // Max confidence at 20+ media
      const confidence = Math.round((sampleConfidence * 0.7 + sizeConfidence * 0.3) * 100) / 100;
      
      const score: TraitScore = {
        traitId,
        name: traitDef.name,
        category: traitDef.category,
        channel: traitDef.channel,
        rawScore: adjustedRawScore,
        normalizedScore: 0, // Will be computed after
        contributingTags: Array.from(acc.contributingTags),
        topContributors: sortedContributions.map(c => ({
          mediaId: c.mediaId,
          title: c.title,
          contribution: Math.round(c.contribution * 100) / 100,
          tagsUsed: c.tags,
        })),
        confidence,
        role: traitDef.role,
      };
      
      channels[traitDef.channel].push(score);
    }
    
    // Normalize each channel independently with sample dampening
    for (const channel of Object.keys(channels) as ScoringChannel[]) {
      const scores = channels[channel];
      if (scores.length === 0) continue;
      
      // Find max raw score in this channel
      const maxScore = Math.max(...scores.map(s => s.rawScore));
      
      // Normalize to 0-100, then apply sample cap
      for (const score of scores) {
        const baseNormalized = maxScore > 0 
          ? Math.round((score.rawScore / maxScore) * 100)
          : 0;
        // Apply sample dampening: cap max score for tiny samples
        score.normalizedScore = Math.min(baseNormalized, sampleCap);
      }
      
      // Sort by normalized score descending
      scores.sort((a, b) => b.normalizedScore - a.normalizedScore);
    }
    
    return channels;
  }
  
  /**
   * Get top traits across all channels
   */
  getTopTraits(limit: number = 10, totalMediaCount: number = 1): TraitScore[] {
    const channels = this.getChannelScores(totalMediaCount);
    const allScores: TraitScore[] = [
      ...channels.identity,
      ...channels.vibe,
      ...channels.structure,
      ...channels.intensity,
    ];
    
    // Sort by raw score (not normalized, since channels have different scales)
    allScores.sort((a, b) => b.rawScore - a.rawScore);
    
    return allScores.slice(0, limit);
  }
  
  /**
   * Get top traits by role (for cleaner UI display)
   */
  getTraitsByRole(totalMediaCount: number = 1): {
    core: TraitScore[];
    modifier: TraitScore[];
    mechanic: TraitScore[];
    warning: TraitScore[];
  } {
    const channels = this.getChannelScores(totalMediaCount);
    const allScores = [
      ...channels.identity,
      ...channels.vibe,
      ...channels.structure,
      ...channels.intensity,
    ];
    
    return {
      core: allScores.filter(t => t.role === 'core').sort((a, b) => b.normalizedScore - a.normalizedScore),
      modifier: allScores.filter(t => t.role === 'modifier').sort((a, b) => b.normalizedScore - a.normalizedScore),
      mechanic: allScores.filter(t => t.role === 'mechanic').sort((a, b) => b.normalizedScore - a.normalizedScore),
      warning: allScores.filter(t => t.role === 'warning').sort((a, b) => b.normalizedScore - a.normalizedScore),
    };
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute trait profile from a list of media entries with their tags
 * Includes edge case handling metadata for UI hints
 */
export function computeTraitProfile(
  mediaEntries: Array<{
    tags: MediaTagInput[];
    engagementWeight: number;
    score?: number; // User's rating (0-10)
  }>
): TraitProfile {
  const scorer = new TraitScorer();
  const totalMediaCount = mediaEntries.length;
  
  for (const entry of mediaEntries) {
    scorer.addMediaTags(entry.tags, entry.engagementWeight);
  }
  
  // Detect rating signal strength
  const scores = mediaEntries.map(e => e.score ?? 0);
  const ratingSignalStrength = detectRatingSignal(scores);
  
  // Build profile metadata for edge case handling
  const sampleSize = classifySampleSize(totalMediaCount);
  const maxScoreCap = calculateSampleCap(totalMediaCount);
  const isEarlyProfile = totalMediaCount < 15;
  
  // Generate warnings for UI
  const warnings: string[] = [];
  if (isEarlyProfile) {
    warnings.push(`Early profile — accuracy increases after ${15 - totalMediaCount} more titles.`);
  }
  if (ratingSignalStrength === 'none') {
    warnings.push('No rating data available. Profile based on viewing history only.');
  } else if (ratingSignalStrength === 'weak') {
    warnings.push('Limited rating variance. Preference-based insights may be less accurate.');
  }
  if (sampleSize === 'massive') {
    warnings.push('Massive library detected. Rare traits have been preserved.');
  }
  
  return {
    channels: scorer.getChannelScores(totalMediaCount),
    topTraits: scorer.getTopTraits(15, totalMediaCount),
    totalMediaCount,
    profileMeta: {
      sampleSize,
      ratingSignalStrength,
      maxScoreCap,
      warnings,
      isEarlyProfile,
    },
  };
}

/**
 * Compute trait scores for a single media entry
 * Useful for prediction/matching
 */
export function computeMediaTraits(tags: MediaTagInput[]): ChannelScores {
  const scorer = new TraitScorer();
  scorer.addMediaTags(tags, 1);
  return scorer.getChannelScores();
}

/**
 * Format trait profile for display (Wrapped-style output)
 */
export function formatTraitProfile(profile: TraitProfile): {
  identityDNA: { name: string; score: number }[];
  vibeProfile: { name: string; score: number }[];
  structureProfile: { name: string; score: number }[];
  intensityBars: { name: string; score: number }[];
} {
  return {
    identityDNA: profile.channels.identity
      .filter(t => t.normalizedScore > 0)
      .slice(0, 8)
      .map(t => ({ name: t.name, score: t.normalizedScore })),
    vibeProfile: profile.channels.vibe
      .filter(t => t.normalizedScore > 0)
      .slice(0, 8)
      .map(t => ({ name: t.name, score: t.normalizedScore })),
    structureProfile: profile.channels.structure
      .filter(t => t.normalizedScore > 0)
      .slice(0, 8)
      .map(t => ({ name: t.name, score: t.normalizedScore })),
    intensityBars: profile.channels.intensity
      .filter(t => t.normalizedScore > 0)
      .slice(0, 6)
      .map(t => ({ name: t.name, score: t.normalizedScore })),
  };
}

// ============================================================================
// TRAIT MATCHER - For recommendations
// ============================================================================

export interface TraitMatchResult {
  overallMatch: number; // 0-100
  matchingTraits: { traitId: string; name: string; userScore: number; mediaScore: number }[];
  missingTraits: { traitId: string; name: string; mediaScore: number }[];
}

/**
 * Calculate how well a media's traits match a user's trait profile
 */
export function matchMediaToProfile(
  mediaTraits: ChannelScores,
  userProfile: TraitProfile
): TraitMatchResult {
  const matchingTraits: TraitMatchResult['matchingTraits'] = [];
  const missingTraits: TraitMatchResult['missingTraits'] = [];
  
  let totalWeight = 0;
  let matchedWeight = 0;
  
  // Build user trait lookup
  const userTraitMap = new Map<string, number>();
  for (const channel of Object.values(userProfile.channels)) {
    for (const trait of channel) {
      userTraitMap.set(trait.traitId, trait.normalizedScore);
    }
  }
  
  // Compare media traits to user traits
  for (const channel of Object.values(mediaTraits)) {
    for (const trait of channel) {
      if (trait.normalizedScore < 20) continue; // Skip weak signals
      
      const userScore = userTraitMap.get(trait.traitId) || 0;
      const weight = trait.normalizedScore / 100;
      totalWeight += weight;
      
      if (userScore > 20) {
        // User has this trait
        const matchStrength = Math.min(userScore, trait.normalizedScore) / 100;
        matchedWeight += weight * matchStrength;
        
        matchingTraits.push({
          traitId: trait.traitId,
          name: trait.name,
          userScore,
          mediaScore: trait.normalizedScore,
        });
      } else {
        // User doesn't have this trait strongly
        missingTraits.push({
          traitId: trait.traitId,
          name: trait.name,
          mediaScore: trait.normalizedScore,
        });
      }
    }
  }
  
  const overallMatch = totalWeight > 0 
    ? Math.round((matchedWeight / totalWeight) * 100)
    : 50;
  
  // Sort by relevance
  matchingTraits.sort((a, b) => Math.min(b.userScore, b.mediaScore) - Math.min(a.userScore, a.mediaScore));
  missingTraits.sort((a, b) => b.mediaScore - a.mediaScore);
  
  return {
    overallMatch,
    matchingTraits: matchingTraits.slice(0, 5),
    missingTraits: missingTraits.slice(0, 3),
  };
}

export { TraitScorer };
