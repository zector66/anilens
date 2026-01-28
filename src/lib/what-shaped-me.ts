/**
 * "WHAT SHAPED ME" - Global impact scoring for media attribution
 * 
 * Solves the attribution calibration problem:
 * - Computes influence in raw contribution space (not normalized/dampened)
 * - Uses role-weighting (core traits matter more than warnings)
 * - Adds rarity boost (unique traits count more than generic action)
 * - Returns human-readable "share of trait" percentages
 */

import type { TraitProfile, TraitScore } from './trait-scoring-engine';
import type { MediaListEntry } from '@/types/anilist';

// ============================================================================
// TYPES
// ============================================================================

export interface MediaImpact {
  mediaId?: number;
  title?: string;
  globalImpact: number;        // Total weighted contribution across all traits
  topTraits: MediaTraitImpact[]; // Top 5 traits this media shaped
  impactLevel: ImpactLevel;
  summary: string;             // "Shaped 18% of your Psychological DNA"
  howExplanation: string;      // "Through its psychological depth and complex characters"
  engagementScore?: number;    // User's rating/engagement with this show
}

export interface MediaTraitImpact {
  traitId: string;
  traitName: string;
  rawContribution: number;
  shareOfTrait: number;        // 0-1, what % of this trait
  roleWeight: number;          // Applied weight based on trait role
  rarityBoost: number;         // Applied boost for rare traits
}

export type ImpactLevel = 
  | 'defining'      // Top 1-3 shows that shaped you
  | 'very_high'     // 90th+ percentile
  | 'high'          // 75-90th percentile
  | 'notable'       // 50-75th percentile
  | 'moderate'      // 25-50th percentile
  | 'minor';        // <25th percentile

// ============================================================================
// ROLE WEIGHTS
// ============================================================================

const ROLE_WEIGHTS: Record<string, number> = {
  core: 1.0,        // Identity traits matter most
  modifier: 0.8,    // Vibe traits matter slightly less
  mechanic: 0.6,    // Structure traits matter somewhat less
  warning: 0.3,     // Intensity warnings matter least
};

// Limit rarity boost to prevent niche shows from dominating
const MAX_RARITY_BOOST = 2.0;
const MIN_RARITY_BOOST = 0.5;

// Anti-spam: shows contributing to too many traits are likely generic/popular
const TRAIT_COUNT_PENALTY_THRESHOLD = 6;
const MAX_TRAIT_COUNT_PENALTY = 0.4; // At 12+ traits, score is reduced to 40%

// ============================================================================
// HOW EXPLANATION GENERATION
// ============================================================================

/**
 * Generate a human-readable explanation of HOW a show shaped the user's taste
 */
function generateHowExplanation(
  topTraitNames: string[],
  sortedTraits: MediaTraitImpact[]
): string {
  if (topTraitNames.length === 0) {
    return 'Minor contribution to your overall taste';
  }
  
  // Build explanation based on trait types
  const traitDescriptions: string[] = [];
  
  for (const trait of sortedTraits.slice(0, 3)) {
    const name = trait.traitName.toLowerCase();
    const percent = Math.round(trait.shareOfTrait * 100);
    
    // Generate specific description based on trait type
    if (name.includes('psycholog')) {
      traitDescriptions.push(`psychological depth (${percent}%)`);
    } else if (name.includes('comedy') || name.includes('humor')) {
      traitDescriptions.push(`comedic timing (${percent}%)`);
    } else if (name.includes('action')) {
      traitDescriptions.push(`action sequences (${percent}%)`);
    } else if (name.includes('romance')) {
      traitDescriptions.push(`romantic elements (${percent}%)`);
    } else if (name.includes('drama')) {
      traitDescriptions.push(`dramatic storytelling (${percent}%)`);
    } else if (name.includes('fantasy') || name.includes('isekai')) {
      traitDescriptions.push(`fantasy worldbuilding (${percent}%)`);
    } else if (name.includes('mystery') || name.includes('thriller')) {
      traitDescriptions.push(`mystery and suspense (${percent}%)`);
    } else if (name.includes('slice') || name.includes('life')) {
      traitDescriptions.push(`slice-of-life moments (${percent}%)`);
    } else if (name.includes('dark') || name.includes('grim')) {
      traitDescriptions.push(`dark themes (${percent}%)`);
    } else if (name.includes('wholesome') || name.includes('heal')) {
      traitDescriptions.push(`wholesome vibes (${percent}%)`);
    } else if (name.includes('emotional') || name.includes('tear')) {
      traitDescriptions.push(`emotional impact (${percent}%)`);
    } else if (name.includes('hype') || name.includes('epic')) {
      traitDescriptions.push(`epic moments (${percent}%)`);
    } else if (name.includes('cute') || name.includes('moe')) {
      traitDescriptions.push(`cute aesthetics (${percent}%)`);
    } else {
      traitDescriptions.push(`${name} elements (${percent}%)`);
    }
  }
  
  if (traitDescriptions.length === 1) {
    return `Through its ${traitDescriptions[0]}`;
  } else if (traitDescriptions.length === 2) {
    return `Through its ${traitDescriptions[0]} and ${traitDescriptions[1]}`;
  } else {
    return `Through its ${traitDescriptions[0]}, ${traitDescriptions[1]}, and ${traitDescriptions[2]}`;
  }
}

// ============================================================================
// GLOBAL IMPACT CALCULATION
// ============================================================================

/**
 * Calculate global impact score for each media across all traits
 * Uses role-weighting, rarity boost, and user preference data
 */
export function calculateWhatShapedMe(
  profile: TraitProfile,
  limit: number = 10,
  entries?: MediaListEntry[],
  userStats?: { mean: number; std: number },
  favoriteIds?: Set<number>
): MediaImpact[] {
  // Build entry lookup map for preference boost
  const entryMap = new Map<number, MediaListEntry>();
  if (entries) {
    for (const entry of entries) {
      if (entry.media?.id) {
        entryMap.set(entry.media.id, entry);
      }
    }
  }
  
  // Debug: Log if we have entries and userStats
  console.log('[What Shaped Me] Data available:', {
    entriesCount: entries?.length || 0,
    userStats: userStats ? `mean=${userStats.mean.toFixed(2)}, std=${userStats.std.toFixed(2)}` : 'none',
    favoritesCount: favoriteIds?.size || 0,
    favoriteIdsSample: favoriteIds ? Array.from(favoriteIds).slice(0, 5) : []
  });
  // Build media contribution map
  const mediaContributions = new Map<string, {
    mediaId?: number;
    title?: string;
    traitContributions: Array<{
      traitId: string;
      traitName: string;
      rawContribution: number;
      shareOfTrait: number;
      role: string;
      occurrenceRate: number;
    }>;
  }>();
  
  // Collect all traits
  const allTraits = [
    ...profile.channels.identity,
    ...profile.channels.vibe,
    ...profile.channels.structure,
    ...profile.channels.intensity,
  ];
  
  // Calculate trait occurrence rates (for rarity boost)
  const traitOccurrences = new Map<string, number>();
  for (const trait of allTraits) {
    traitOccurrences.set(trait.traitId, trait.contributingTags.length);
  }
  const totalOccurrences = Array.from(traitOccurrences.values()).reduce((a, b) => a + b, 0);
  
  // Process each trait's contributors
  for (const trait of allTraits) {
    if (!trait.topContributors) continue;
    
    const occurrenceRate = (traitOccurrences.get(trait.traitId) || 1) / Math.max(1, totalOccurrences);
    
    for (const contributor of trait.topContributors) {
      const mediaKey = contributor.title || `media-${contributor.mediaId}`;
      
      if (!mediaContributions.has(mediaKey)) {
        mediaContributions.set(mediaKey, {
          mediaId: contributor.mediaId,
          title: contributor.title,
          traitContributions: [],
        });
      }
      
      const media = mediaContributions.get(mediaKey)!;
      media.traitContributions.push({
        traitId: trait.traitId,
        traitName: trait.name,
        rawContribution: contributor.rawContribution,
        shareOfTrait: contributor.shareOfTrait,
        role: trait.role || 'modifier',
        occurrenceRate,
      });
    }
  }
  
  // Calculate global impact for each media
  const impacts: MediaImpact[] = [];
  
  let debugLogCount = 0;
  for (const [_, media] of mediaContributions) {
    let globalImpact = 0;
    
    // Calculate preference boost from user's actual rating, rewatch, and favorite data
    let preferenceBoost = 1.0;
    const entry = media.mediaId ? entryMap.get(media.mediaId) : undefined;
    const isFavorite = media.mediaId && favoriteIds?.has(media.mediaId);
    
    // Favorite boost: favorites are MASSIVE preference signal (5x)
    // This is the strongest signal we have that a show truly shaped them
    if (isFavorite) {
      preferenceBoost *= 5.0;
    }
    
    if (entry) {
      // Rewatch boost: rewatching = very strong signal (3x for 1, up to 4x for 2+)
      if (entry.repeat && entry.repeat > 0) {
        preferenceBoost *= 2.5 + Math.min(1.5, entry.repeat * 0.5);
      }
      
      // High rating boost: scores significantly above user's mean
      if (entry.score && entry.score > 0 && userStats) {
        const zScore = (entry.score - userStats.mean) / Math.max(userStats.std, 0.5);
        if (zScore >= 1.5) {
          preferenceBoost *= 2.5; // Very high rating = 2.5x
        } else if (zScore >= 1.0) {
          preferenceBoost *= 2.0; // High rating = 2.0x
        } else if (zScore >= 0.5) {
          preferenceBoost *= 1.5; // Above average = 1.5x
        } else if (zScore < -0.5) {
          preferenceBoost *= 0.3; // Below average = strong penalty
        } else if (zScore < 0) {
          preferenceBoost *= 0.7; // Slightly below average = mild penalty
        }
      }
      
      // Debug first few entries with preference boost
      if (debugLogCount < 5 && (preferenceBoost > 1.0 || isFavorite)) {
        console.log('[What Shaped Me] Preference boost applied:', {
          title: media.title,
          isFavorite,
          repeat: entry.repeat,
          score: entry.score,
          preferenceBoost: preferenceBoost.toFixed(2)
        });
        debugLogCount++;
      }
    }
    
    // Anti-spam penalty: shows with too many trait contributions are likely generic
    // This prevents "Attack on Titan" syndrome where a popular show dominates by sheer volume
    const traitCount = media.traitContributions.length;
    let traitCountPenalty = 1.0;
    if (traitCount > TRAIT_COUNT_PENALTY_THRESHOLD) {
      // Linear penalty from 1.0 at threshold to MAX_TRAIT_COUNT_PENALTY at 2x threshold
      const excess = traitCount - TRAIT_COUNT_PENALTY_THRESHOLD;
      traitCountPenalty = Math.max(
        MAX_TRAIT_COUNT_PENALTY,
        1.0 - (excess / TRAIT_COUNT_PENALTY_THRESHOLD) * (1.0 - MAX_TRAIT_COUNT_PENALTY)
      );
    }
    
    for (const tc of media.traitContributions) {
      // Get role weight
      const roleWeight = ROLE_WEIGHTS[tc.role] || 0.5;
      
      // Calculate rarity boost (inverse of occurrence rate)
      // Rare traits get higher boost BUT capped to prevent domination
      const rawRarityBoost = 1 / (tc.occurrenceRate * 10 + 0.1);
      const rarityBoost = Math.max(MIN_RARITY_BOOST, Math.min(MAX_RARITY_BOOST, rawRarityBoost));
      
      // Weighted contribution - preference boost is major, trait count penalty prevents spam
      const weightedContribution = tc.rawContribution * roleWeight * rarityBoost * preferenceBoost * traitCountPenalty;
      globalImpact += weightedContribution;
      
      // DEBUG: Log first media's calculation
      if (debugLogCount === 0 && tc.rawContribution > 0) {
        console.log("What Shaped Me - using rawContribution:", {
          media: media.title,
          trait: tc.traitName,
          rawContribution: tc.rawContribution,
          roleWeight,
          rarityBoost,
          weightedContribution,
        });
        debugLogCount++;
      }
    }
    
    // Sort trait contributions by weighted impact
    const sortedTraits = media.traitContributions
      .map(tc => ({
        traitId: tc.traitId,
        traitName: tc.traitName,
        rawContribution: tc.rawContribution,
        shareOfTrait: tc.shareOfTrait,
        roleWeight: ROLE_WEIGHTS[tc.role] || 0.5,
        rarityBoost: 1 / (tc.occurrenceRate * 10 + 0.1),
      }))
      .sort((a, b) => {
        const aWeighted = a.rawContribution * a.roleWeight * a.rarityBoost;
        const bWeighted = b.rawContribution * b.roleWeight * b.rarityBoost;
        return bWeighted - aWeighted;
      })
      .slice(0, 5);
    
    // Generate summary from top trait
    const topTrait = sortedTraits[0];
    const summary = topTrait 
      ? `Shaped ${Math.round(topTrait.shareOfTrait * 100)}% of your ${topTrait.traitName} DNA`
      : 'Minor influence';
    
    // Generate HOW explanation from top 3 traits
    const topTraitNames = sortedTraits.slice(0, 3).map(t => t.traitName.toLowerCase());
    const howExplanation = generateHowExplanation(topTraitNames, sortedTraits);
    
    impacts.push({
      mediaId: media.mediaId,
      title: media.title,
      globalImpact: Math.round(globalImpact * 100) / 100,
      topTraits: sortedTraits,
      impactLevel: 'moderate', // Will be set after sorting
      summary,
      howExplanation,
    });
  }
  
  // Sort by global impact
  impacts.sort((a, b) => b.globalImpact - a.globalImpact);
  
  // Take top N for display
  const topImpacts = impacts.slice(0, limit);
  
  // Calculate influence as distribution - top N sum to 100%
  // This makes influence percentages feel accurate and meaningful
  const totalImpact = topImpacts.reduce((sum, m) => sum + m.globalImpact, 0);
  
  // Assign influence percentages and impact levels
  topImpacts.forEach((impact, index) => {
    // Influence as percentage of total (distribution model)
    const influencePercent = totalImpact > 0 
      ? (impact.globalImpact / totalImpact) * 100 
      : 0;
    
    // Store as normalized influence for display
    impact.globalImpact = Math.round(influencePercent * 10) / 10;
    
    // Assign impact levels based on position and influence
    if (index < 3) {
      impact.impactLevel = 'defining';
    } else if (influencePercent >= 12) {
      impact.impactLevel = 'very_high';
    } else if (influencePercent >= 8) {
      impact.impactLevel = 'high';
    } else if (influencePercent >= 5) {
      impact.impactLevel = 'notable';
    } else if (influencePercent >= 3) {
      impact.impactLevel = 'moderate';
    } else {
      impact.impactLevel = 'minor';
    }
  });
  
  console.log('[What Shaped Me] Distribution check:', {
    totalInfluence: topImpacts.reduce((sum, m) => sum + m.globalImpact, 0),
    top3: topImpacts.slice(0, 3).map(m => ({ title: m.title, influence: m.globalImpact })),
  });
  
  return topImpacts;
}

/**
 * Get the most influential media for a specific trait
 */
export function getTraitInfluencers(
  trait: TraitScore,
  limit: number = 5
): Array<{
  mediaId?: number;
  title?: string;
  rawContribution: number;
  shareOfTrait: number;
  displayText: string;
}> {
  if (!trait.topContributors) return [];
  
  return trait.topContributors
    .slice(0, limit)
    .map(c => ({
      mediaId: c.mediaId,
      title: c.title,
      rawContribution: c.rawContribution,
      shareOfTrait: c.shareOfTrait,
      displayText: `${Math.round(c.shareOfTrait * 100)}% of ${trait.name}`,
    }));
}

/**
 * Generate debug breakdown for a specific media's influence
 * Useful for understanding why certain shows rank where they do
 */
export function debugMediaInfluence(
  profile: TraitProfile,
  mediaTitle: string
): {
  found: boolean;
  breakdown?: {
    traitId: string;
    traitName: string;
    rawContribution: number;
    shareOfTrait: number;
    roleWeight: number;
    rarityBoost: number;
    weightedImpact: number;
    engagementFactor?: number;
  }[];
  totalImpact?: number;
} {
  const allTraits = [
    ...profile.channels.identity,
    ...profile.channels.vibe,
    ...profile.channels.structure,
    ...profile.channels.intensity,
  ];
  
  const breakdown: any[] = [];
  let found = false;
  
  // Calculate trait occurrence rates
  const traitOccurrences = new Map<string, number>();
  for (const trait of allTraits) {
    traitOccurrences.set(trait.traitId, trait.contributingTags.length);
  }
  const totalOccurrences = Array.from(traitOccurrences.values()).reduce((a, b) => a + b, 0);
  
  for (const trait of allTraits) {
    if (!trait.topContributors) continue;
    
    const contributor = trait.topContributors.find(c => c.title === mediaTitle);
    if (!contributor) continue;
    
    found = true;
    const occurrenceRate = (traitOccurrences.get(trait.traitId) || 1) / Math.max(1, totalOccurrences);
    const roleWeight = ROLE_WEIGHTS[trait.role || 'modifier'] || 0.5;
    const rarityBoost = 1 / (occurrenceRate * 10 + 0.1);
    const weightedImpact = contributor.rawContribution * roleWeight * rarityBoost;
    
    breakdown.push({
      traitId: trait.traitId,
      traitName: trait.name,
      rawContribution: contributor.rawContribution,
      shareOfTrait: contributor.shareOfTrait,
      roleWeight,
      rarityBoost: Math.round(rarityBoost * 100) / 100,
      weightedImpact: Math.round(weightedImpact * 100) / 100,
      engagementFactor: contributor.engagementFactor,
    });
  }
  
  if (!found) {
    return { found: false };
  }
  
  // Sort by weighted impact
  breakdown.sort((a, b) => b.weightedImpact - a.weightedImpact);
  
  const totalImpact = breakdown.reduce((sum, b) => sum + b.weightedImpact, 0);
  
  return {
    found: true,
    breakdown,
    totalImpact: Math.round(totalImpact * 100) / 100,
  };
}
