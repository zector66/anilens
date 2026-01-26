/**
 * IMPACT SCORING ENGINE - Ablation-based "What Shaped Me" analysis
 * 
 * This implements the correct definition of "shaped me":
 * "Which anime defined my taste identity" 
 * NOT "Which anime had the most mapped tags"
 * 
 * Uses ablation impact scoring:
 * 1. Compute full profile with all shows
 * 2. For each candidate show, compute profile without it
 * 3. Measure distance between profiles
 * 4. Rank by impact (distance)
 */

import { MediaListEntry } from '@/types/anilist';
import { 
  computeTraitProfile, 
  type TraitProfile, 
  type MediaTagInput
} from './trait-scoring-engine';
import { 
  calculateUserScoreStats, 
  createCoreIdentitySubset,
  calculateEngagementWeight
} from './engagement-weights';

export interface ImpactScore {
  mediaId: number;
  title: string;
  impact: number;              // How much this show shaped their taste
  distance: number;            // Profile distance when removed
  shapedTraits: string[];     // Which traits this show most influenced
  impactBreakdown: {
    identity: number;         // Impact on identity channel
    vibe: number;            // Impact on vibe channel  
    structure: number;       // Impact on structure channel
    intensity: number;      // Impact on intensity channel
  };
  confidence: number;         // How confident we are in this impact
}

export interface ImpactAnalysis {
  impacts: ImpactScore[];
  totalMedia: number;
  analysisVersion: string;
}

/**
 * Convert MediaListEntry to format expected by computeTraitProfile
 */
function convertEntriesForTraitProfile(
  entries: MediaListEntry[],
  userStats: { mean: number; std: number; count: number }
): Array<{
  tags: MediaTagInput[];
  engagementWeight: number;
  score?: number;
  id?: number;
  title?: string;
}> {
  return entries.map(entry => {
    const engagementWeight = calculateEngagementWeight(entry, userStats);
    
    // Convert media.tags to MediaTagInput format
    const tags: MediaTagInput[] = (entry.media?.tags || []).map(tag => ({
      name: tag.name,
      rank: tag.rank || 50
    }));
    
    return {
      tags,
      engagementWeight: engagementWeight.weight,
      score: entry.score || undefined,
      id: entry.mediaId || undefined,
      title: entry.media?.title?.userPreferred || undefined
    };
  });
}

/**
 * Compute impact scores using ablation methodology
 * 
 * This measures how much each show truly shaped the user's taste identity
 * by removing it and measuring the profile change.
 */
export async function computeImpactScores(
  entries: MediaListEntry[],
  options: {
    useCoreSubset?: boolean;     // Only analyze core identity titles
    maxCandidates?: number;     // Limit analysis to top candidates
    distanceMetric?: 'cosine' | 'euclidean' | 'weighted';
  } = {}
): Promise<ImpactAnalysis> {
  const {
    useCoreSubset = true,
    maxCandidates = 50,
    distanceMetric = 'weighted'
  } = options;

  // 1. Compute baseline profile with all entries
  const userStats = calculateUserScoreStats(entries);
  const analysisEntries = useCoreSubset 
    ? createCoreIdentitySubset(entries, userStats)
    : entries;

  if (analysisEntries.length === 0) {
    return {
      impacts: [],
      totalMedia: 0,
      analysisVersion: '1.0'
    };
  }

  // Compute full profile
  const convertedEntries = convertEntriesForTraitProfile(analysisEntries, userStats);
  const fullProfile = await computeTraitProfile(convertedEntries);

  // 2. Select candidates for impact analysis
  // Focus on titles that are likely to have high impact:
  // - High ratings relative to user baseline
  // - Completed status
  // - Substantial tag coverage
  const candidates = analysisEntries
    .filter(entry => {
      // Must be completed or have high rating
      if (entry.status !== 'COMPLETED') {
        if (!entry.score || entry.score <= userStats.mean) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by likely impact factors
      const aScore = a.score || userStats.mean;
      const bScore = b.score || userStats.mean;
      
      // Prefer higher ratings and completion
      if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return -1;
      if (b.status === 'COMPLETED' && a.status !== 'COMPLETED') return 1;
      
      return bScore - aScore;
    })
    .slice(0, maxCandidates);

  // 3. Compute impact for each candidate via ablation
  const impacts: ImpactScore[] = [];
  
  for (const candidate of candidates) {
    const impact = await computeSingleImpact(
      candidate,
      analysisEntries,
      fullProfile,
      distanceMetric,
      userStats
    );
    
    if (impact.impact > 0.01) { // Only include meaningful impacts
      impacts.push(impact);
    }
  }

  // 4. Sort by total impact
  impacts.sort((a, b) => b.impact - a.impact);

  return {
    impacts,
    totalMedia: analysisEntries.length,
    analysisVersion: '1.0'
  };
}

/**
 * Compute impact for a single show using ablation
 */
async function computeSingleImpact(
  candidate: MediaListEntry,
  allEntries: MediaListEntry[],
  fullProfile: TraitProfile,
  distanceMetric: 'cosine' | 'euclidean' | 'weighted',
  userStats: { mean: number; std: number; count: number }
): Promise<ImpactScore> {
  // Create profile without this candidate
  const entriesWithoutCandidate = allEntries.filter(
    entry => entry.mediaId !== candidate.mediaId
  );
  
  const ablatedProfile = entriesWithoutCandidate.length > 0
    ? await computeTraitProfile(convertEntriesForTraitProfile(entriesWithoutCandidate, userStats))
    : createEmptyProfile();

  // Calculate distance between profiles
  const distance = calculateProfileDistance(
    fullProfile,
    ablatedProfile,
    distanceMetric
  );

  // Identify which traits this show most influenced
  const shapedTraits = identifyShapedTraits(
    fullProfile,
    ablatedProfile,
    candidate
  );

  // Calculate impact breakdown by channel
  const impactBreakdown = calculateChannelBreakdown(
    fullProfile,
    ablatedProfile
  );

  // Calculate confidence based on sample size and rating
  const confidence = calculateImpactConfidence(candidate, allEntries.length);

  return {
    mediaId: candidate.mediaId!,
    title: candidate.media?.title?.userPreferred || `Title ${candidate.mediaId}`,
    impact: distance,
    distance,
    shapedTraits,
    impactBreakdown,
    confidence
  };
}

/**
 * Calculate distance between two trait profiles
 */
function calculateProfileDistance(
  profile1: TraitProfile,
  profile2: TraitProfile,
  metric: 'cosine' | 'euclidean' | 'weighted'
): number {
  // Get all traits from all channels
  const allTraits = new Set([
    ...profile1.channels.identity.map(t => t.traitId),
    ...profile1.channels.vibe.map(t => t.traitId),
    ...profile1.channels.structure.map(t => t.traitId),
    ...profile1.channels.intensity.map(t => t.traitId),
    ...profile2.channels.identity.map(t => t.traitId),
    ...profile2.channels.vibe.map(t => t.traitId),
    ...profile2.channels.structure.map(t => t.traitId),
    ...profile2.channels.intensity.map(t => t.traitId)
  ]);

  if (metric === 'cosine') {
    return calculateCosineDistance(profile1, profile2, allTraits);
  } else if (metric === 'euclidean') {
    return calculateEuclideanDistance(profile1, profile2, allTraits);
  } else {
    // Weighted gives more importance to identity/vibe channels
    return calculateWeightedDistance(profile1, profile2, allTraits);
  }
}

function getTraitScore(profile: TraitProfile, traitId: string): number {
  const allChannels = [
    ...profile.channels.identity,
    ...profile.channels.vibe,
    ...profile.channels.structure,
    ...profile.channels.intensity
  ];
  const trait = allChannels.find(t => t.traitId === traitId);
  return trait?.normalizedScore || 0;
}

/**
 * Cosine distance between trait vectors
 */
function calculateCosineDistance(
  profile1: TraitProfile,
  profile2: TraitProfile,
  allTraits: Set<string>
): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const traitId of allTraits) {
    const score1 = getTraitScore(profile1, traitId);
    const score2 = getTraitScore(profile2, traitId);
    
    dotProduct += score1 * score2;
    norm1 += score1 * score1;
    norm2 += score2 * score2;
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  
  const cosineSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  return 1 - cosineSimilarity; // Distance = 1 - similarity
}

/**
 * Euclidean distance between trait vectors
 */
function calculateEuclideanDistance(
  profile1: TraitProfile,
  profile2: TraitProfile,
  allTraits: Set<string>
): number {
  let sumSquares = 0;

  for (const traitId of allTraits) {
    const score1 = getTraitScore(profile1, traitId);
    const score2 = getTraitScore(profile2, traitId);
    
    const diff = score1 - score2;
    sumSquares += diff * diff;
  }

  return Math.sqrt(sumSquares);
}

/**
 * Weighted distance giving more importance to identity/vibe channels
 */
function calculateWeightedDistance(
  profile1: TraitProfile,
  profile2: TraitProfile,
  allTraits: Set<string>
): number {
  const channelWeights = {
    identity: 2.0,    // Most important for identity
    vibe: 1.5,       // Very important for preference
    structure: 1.0,  // Less important (many shows share structure)
    intensity: 0.8   // Least important (content intensity varies)
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const traitId of allTraits) {
    const score1 = getTraitScore(profile1, traitId);
    const score2 = getTraitScore(profile2, traitId);
    
    // Find the trait to get its channel
    const allChannels1 = [
      ...profile1.channels.identity,
      ...profile1.channels.vibe,
      ...profile1.channels.structure,
      ...profile1.channels.intensity
    ];
    const trait1 = allChannels1.find(t => t.traitId === traitId);
    const channel = trait1?.channel || 'structure';
    const weight = channelWeights[channel as keyof typeof channelWeights] || 1.0;
    
    const diff = score1 - score2;
    weightedSum += weight * diff * diff;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.sqrt(weightedSum / totalWeight) : 0;
}

/**
 * Identify which traits were most shaped by this show
 */
function identifyShapedTraits(
  fullProfile: TraitProfile,
  ablatedProfile: TraitProfile,
  _candidate: MediaListEntry
): string[] {
  const traitDeltas: Array<{ traitId: string; delta: number; name: string }> = [];
  
  // Get all traits from full profile
  const allFullTraits = [
    ...fullProfile.channels.identity,
    ...fullProfile.channels.vibe,
    ...fullProfile.channels.structure,
    ...fullProfile.channels.intensity
  ];

  for (const fullTrait of allFullTraits) {
    const ablatedScore = getTraitScore(ablatedProfile, fullTrait.traitId);
    const delta = fullTrait.normalizedScore - ablatedScore;
    
    if (delta > 5) { // Significant impact
      traitDeltas.push({
        traitId: fullTrait.traitId,
        delta,
        name: fullTrait.name
      });
    }
  }

  // Sort by impact and return top 5
  return traitDeltas
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5)
    .map(t => t.name);
}

/**
 * Calculate impact breakdown by channel
 */
function calculateChannelBreakdown(
  fullProfile: TraitProfile,
  ablatedProfile: TraitProfile
): ImpactScore['impactBreakdown'] {
  const channels: ImpactScore['impactBreakdown'] = {
    identity: 0,
    vibe: 0,
    structure: 0,
    intensity: 0
  };

  for (const channel of Object.keys(channels) as Array<keyof typeof channels>) {
    const fullTraits = fullProfile.channels[channel];
    const ablatedTraits = ablatedProfile.channels[channel];
    
    let channelDistance = 0;
    const allChannelTraits = new Set([
      ...fullTraits.map(t => t.traitId),
      ...ablatedTraits.map(t => t.traitId)
    ]);

    for (const traitId of allChannelTraits) {
      const fullScore = fullTraits.find(t => t.traitId === traitId)?.normalizedScore || 0;
      const ablatedScore = ablatedTraits.find(t => t.traitId === traitId)?.normalizedScore || 0;
      channelDistance += Math.abs(fullScore - ablatedScore);
    }

    channels[channel] = channelDistance;
  }

  return channels;
}

/**
 * Calculate confidence in impact score
 */
function calculateImpactConfidence(
  candidate: MediaListEntry,
  totalEntries: number
): number {
  let confidence = 0.5; // Base confidence

  // Higher confidence for completed shows
  if (candidate.status === 'COMPLETED') {
    confidence += 0.2;
  }

  // Higher confidence for high ratings
  if (candidate.score && candidate.score >= 8) {
    confidence += 0.2;
  }

  // Higher confidence for larger sample sizes
  if (totalEntries >= 20) {
    confidence += 0.1;
  }

  return Math.min(1.0, confidence);
}

/**
 * Create empty profile for edge cases
 */
function createEmptyProfile(): TraitProfile {
  return {
    channels: {
      identity: [],
      vibe: [],
      structure: [],
      intensity: []
    },
    topTraits: [],
    topSignatureTraits: [],
    balancedTraits: [],
    warningTraits: [],
    affinityInsights: [],
    totalMediaCount: 0,
    profileMeta: {
      sampleSize: 'tiny',
      ratingSignalStrength: 'none',
      maxScoreCap: 100,
      warnings: [],
      isEarlyProfile: true
    }
  };
}
