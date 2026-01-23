/**
 * TRAIT SCORING ENGINE - Computes trait scores from media tags with:
 * - Diminishing returns for reinforcing tags
 * - Separate scoring channels (Identity, Vibe, Structure, Intensity)
 * - Normalized output per channel to avoid "1% everything" issue
 * - Weight-based signal prioritization
 */

import { ALL_TRAITS, TRAIT_BY_ID, type ScoringChannel } from './trait-universe';
import { getTagDefinition, isDefiningTag } from './tag-mappings';

// ============================================================================
// TYPES
// ============================================================================

export interface MediaTagInput {
  name: string;
  rank?: number; // 0-100, how relevant the tag is to this media
}

export interface TraitScore {
  traitId: string;
  name: string;
  category: string;
  channel: ScoringChannel;
  rawScore: number;       // Accumulated weighted score
  normalizedScore: number; // 0-100 within channel
  contributingTags: string[]; // Tags that contributed to this trait
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
}

// ============================================================================
// DIMINISHING RETURNS CURVE
// Each additional signal for the same trait adds less
// First = +5, Second = +3, Third = +2, Fourth = +1, Fifth+ = +0.5
// ============================================================================

const DIMINISHING_WEIGHTS = [5, 3, 2, 1, 0.5];

function getDiminishingWeight(hitCount: number): number {
  if (hitCount < DIMINISHING_WEIGHTS.length) {
    return DIMINISHING_WEIGHTS[hitCount];
  }
  return 0.5; // Minimum contribution
}

// ============================================================================
// TRAIT ACCUMULATOR
// Tracks raw scores with diminishing returns
// ============================================================================

interface TraitAccumulator {
  traitId: string;
  hitCount: number;        // How many times this trait was reinforced
  rawScore: number;        // Accumulated score with diminishing returns
  contributingTags: Set<string>;
}

class TraitScorer {
  private accumulators: Map<string, TraitAccumulator> = new Map();
  
  constructor() {
    // Initialize accumulators for all traits
    for (const trait of ALL_TRAITS) {
      this.accumulators.set(trait.id, {
        traitId: trait.id,
        hitCount: 0,
        rawScore: 0,
        contributingTags: new Set(),
      });
    }
  }
  
  /**
   * Add a tag's contribution to traits
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
    
    for (const mapping of tagDef.mappings) {
      const acc = this.accumulators.get(mapping.traitId);
      if (!acc) continue;
      
      // Calculate contribution with diminishing returns
      const diminishing = getDiminishingWeight(acc.hitCount);
      const contribution = mapping.weight * diminishing * rankModifier * definingBoost * engagementWeight;
      
      acc.rawScore += contribution;
      acc.hitCount++;
      acc.contributingTags.add(tag);
    }
  }
  
  /**
   * Add multiple tags from a media entry
   */
  addMediaTags(tags: MediaTagInput[], engagementWeight: number = 1): void {
    for (const tag of tags) {
      this.addTag(tag.name, tag.rank ?? 50, engagementWeight);
    }
  }
  
  /**
   * Get normalized scores by channel
   * Normalizes within each channel so top trait = 100
   */
  getChannelScores(): ChannelScores {
    const channels: ChannelScores = {
      identity: [],
      vibe: [],
      structure: [],
      intensity: [],
    };
    
    // Group accumulators by channel
    for (const [traitId, acc] of Array.from(this.accumulators.entries())) {
      const traitDef = TRAIT_BY_ID.get(traitId);
      if (!traitDef || acc.rawScore === 0) continue;
      
      const score: TraitScore = {
        traitId,
        name: traitDef.name,
        category: traitDef.category,
        channel: traitDef.channel,
        rawScore: acc.rawScore,
        normalizedScore: 0, // Will be computed after
        contributingTags: Array.from(acc.contributingTags),
      };
      
      channels[traitDef.channel].push(score);
    }
    
    // Normalize each channel independently
    for (const channel of Object.keys(channels) as ScoringChannel[]) {
      const scores = channels[channel];
      if (scores.length === 0) continue;
      
      // Find max raw score in this channel
      const maxScore = Math.max(...scores.map(s => s.rawScore));
      
      // Normalize to 0-100
      for (const score of scores) {
        score.normalizedScore = maxScore > 0 
          ? Math.round((score.rawScore / maxScore) * 100)
          : 0;
      }
      
      // Sort by normalized score descending
      scores.sort((a, b) => b.normalizedScore - a.normalizedScore);
    }
    
    return channels;
  }
  
  /**
   * Get top traits across all channels
   */
  getTopTraits(limit: number = 10): TraitScore[] {
    const channels = this.getChannelScores();
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
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute trait profile from a list of media entries with their tags
 */
export function computeTraitProfile(
  mediaEntries: Array<{
    tags: MediaTagInput[];
    engagementWeight: number;
  }>
): TraitProfile {
  const scorer = new TraitScorer();
  
  for (const entry of mediaEntries) {
    scorer.addMediaTags(entry.tags, entry.engagementWeight);
  }
  
  return {
    channels: scorer.getChannelScores(),
    topTraits: scorer.getTopTraits(15),
    totalMediaCount: mediaEntries.length,
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
