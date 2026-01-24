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
  modifier: 0.65,   // Vibe traits matter less
  mechanic: 0.50,   // Structure traits matter even less
  warning: 0.25,    // Intensity warnings matter least
};

// ============================================================================
// GLOBAL IMPACT CALCULATION
// ============================================================================

/**
 * Calculate global impact score for each media across all traits
 * Uses role-weighting and rarity boost
 */
export function calculateWhatShapedMe(
  profile: TraitProfile,
  limit: number = 10
): MediaImpact[] {
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
  
  for (const [_, media] of mediaContributions) {
    let globalImpact = 0;
    
    for (const tc of media.traitContributions) {
      // Get role weight
      const roleWeight = ROLE_WEIGHTS[tc.role] || 0.5;
      
      // Calculate rarity boost (inverse of occurrence rate)
      // Rare traits (low occurrence) get higher boost
      const rarityBoost = 1 / (tc.occurrenceRate * 10 + 0.1);
      
      // Weighted contribution
      const weightedContribution = tc.rawContribution * roleWeight * rarityBoost;
      globalImpact += weightedContribution;
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
    
    impacts.push({
      mediaId: media.mediaId,
      title: media.title,
      globalImpact: Math.round(globalImpact * 100) / 100,
      topTraits: sortedTraits,
      impactLevel: 'moderate', // Will be set after sorting
      summary,
    });
  }
  
  // Sort by global impact
  impacts.sort((a, b) => b.globalImpact - a.globalImpact);
  
  // Assign impact levels based on percentile
  const total = impacts.length;
  impacts.forEach((impact, index) => {
    const percentile = (total - index) / total;
    
    if (index < 3) {
      impact.impactLevel = 'defining';
    } else if (percentile >= 0.90) {
      impact.impactLevel = 'very_high';
    } else if (percentile >= 0.75) {
      impact.impactLevel = 'high';
    } else if (percentile >= 0.50) {
      impact.impactLevel = 'notable';
    } else if (percentile >= 0.25) {
      impact.impactLevel = 'moderate';
    } else {
      impact.impactLevel = 'minor';
    }
  });
  
  return impacts.slice(0, limit);
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
