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
  impact: number;              // Preference-weighted impact (NOT raw distance)
  rawDistance: number;         // Profile distance when removed (exposure impact)
  preferenceWeight: number;    // How much user liked this relative to baseline
  shapedTraits: string[];     // Which CORE traits this show most influenced
  impactBreakdown: {
    identity: number;         // Impact on identity channel (weighted 2x)
    vibe: number;            // Impact on vibe channel (weighted 1.5x)
    structure: number;       // Impact on structure channel (weighted 1x)
    intensity: number;      // Impact on intensity channel (weighted 0.5x)
  };
  impactType: 'loved' | 'defining' | 'transformative'; // Which category this falls into
  confidence: number;         // How confident we are in this impact
  coreTraitRatio: number;     // What % of impact came from core traits (vs spam)
}

export interface ImpactAnalysis {
  // Separate views as requested
  mostLoved: ImpactScore[];       // Pure enjoyment (high rating relative to baseline)
  mostDefining: ImpactScore[];    // Titles that explain top identity traits
  mostTransformative: ImpactScore[]; // Titles that pulled away from baseline
  
  // Combined (legacy support)
  impacts: ImpactScore[];
  totalMedia: number;
  analysisVersion: string;
  
  // Diagnostics
  excludedForMidRating: number;   // How many shows were filtered for being "meh"
  excludedForSpam: number;        // How many shows were filtered for tag spam
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
 * Compute impact scores using PREFERENCE-WEIGHTED ablation methodology
 * 
 * KEY FIX: "What Shaped Me" now means:
 * - "Which anime defined my taste identity" 
 * - NOT "Which anime had the most mapped tags"
 * 
 * The core rule: Mid-rated shows CANNOT shape identity unless they have
 * exceptional other signals (rewatch, favorites, etc.)
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

  const emptyResult: ImpactAnalysis = {
    mostLoved: [],
    mostDefining: [],
    mostTransformative: [],
    impacts: [],
    totalMedia: 0,
    analysisVersion: '2.0',
    excludedForMidRating: 0,
    excludedForSpam: 0
  };

  if (analysisEntries.length === 0) {
    return emptyResult;
  }

  // Compute full profile
  const convertedEntries = convertEntriesForTraitProfile(analysisEntries, userStats);
  const fullProfile = computeTraitProfile(convertedEntries);

  // 2. CRITICAL: Filter candidates by PREFERENCE, not just completion
  // Mid-rated shows should NOT appear in "What Shaped Me"
  let excludedForMidRating = 0;
  let excludedForSpam = 0;

  const candidates = analysisEntries
    .filter(entry => {
      const score = entry.score || 0;
      const zScore = userStats.std > 0 ? (score - userStats.mean) / userStats.std : 0;
      
      // HARSH RULE: Shows rated at or below baseline cannot shape identity
      // Exception: If rewatched or high priority (user signals importance)
      const isRewatched = (entry.repeat || 0) > 0;
      const isHighPriority = (entry.priority || 0) >= 3;
      const hasExceptionalSignal = isRewatched || isHighPriority;
      
      if (zScore < 0 && !hasExceptionalSignal) {
        excludedForMidRating++;
        return false;
      }
      
      // Even shows AT baseline need to be completed
      if (zScore < 0.5 && entry.status !== 'COMPLETED') {
        excludedForMidRating++;
        return false;
      }
      
      // Check for tag spam (shows with too many tags but low distinctiveness)
      const tagCount = entry.media?.tags?.length || 0;
      if (tagCount > 30 && zScore < 1) {
        // Tag-dense shows need higher ratings to count
        excludedForSpam++;
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by preference weight (z-score), not raw score
      const aScore = a.score || userStats.mean;
      const bScore = b.score || userStats.mean;
      const aZ = userStats.std > 0 ? (aScore - userStats.mean) / userStats.std : 0;
      const bZ = userStats.std > 0 ? (bScore - userStats.mean) / userStats.std : 0;
      
      // Rewatched/high priority shows get boost
      const aBoost = ((a.repeat || 0) > 0 ? 1.5 : 0) + ((a.priority || 0) >= 3 ? 0.5 : 0);
      const bBoost = ((b.repeat || 0) > 0 ? 1.5 : 0) + ((b.priority || 0) >= 3 ? 0.5 : 0);
      
      return (bZ + bBoost) - (aZ + aBoost);
    })
    .slice(0, maxCandidates);

  // 3. Compute impact for each candidate via PREFERENCE-WEIGHTED ablation
  const allImpacts: ImpactScore[] = [];
  
  for (const candidate of candidates) {
    const impact = await computeSingleImpact(
      candidate,
      analysisEntries,
      fullProfile,
      distanceMetric,
      userStats
    );
    
    // Only include if preference-weighted impact is meaningful
    if (impact.impact > 0.01) {
      allImpacts.push(impact);
    }
  }

  // 4. Create the 3 different views
  
  // Most Loved: Pure enjoyment (highest preference weight)
  const mostLoved = [...allImpacts]
    .sort((a, b) => b.preferenceWeight - a.preferenceWeight)
    .slice(0, 10);
  
  // Most Defining: Titles that explain top identity traits (high core trait ratio)
  const mostDefining = [...allImpacts]
    .filter(i => i.coreTraitRatio > 0.5) // At least 50% core traits
    .sort((a, b) => {
      // Sort by identity channel impact * preference weight
      const aIdentityImpact = a.impactBreakdown.identity * a.preferenceWeight;
      const bIdentityImpact = b.impactBreakdown.identity * b.preferenceWeight;
      return bIdentityImpact - aIdentityImpact;
    })
    .slice(0, 10);
  
  // Most Transformative: Titles that pulled away from baseline (high raw distance)
  const mostTransformative = [...allImpacts]
    .filter(i => i.preferenceWeight > 0) // Must be above baseline
    .sort((a, b) => b.rawDistance - a.rawDistance)
    .slice(0, 10);
  
  // Combined view (legacy): use preference-weighted impact
  const impacts = [...allImpacts]
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 20);

  return {
    mostLoved,
    mostDefining,
    mostTransformative,
    impacts,
    totalMedia: analysisEntries.length,
    analysisVersion: '2.0',
    excludedForMidRating,
    excludedForSpam
  };
}

/**
 * Compute impact for a single show using PREFERENCE-WEIGHTED ablation
 * 
 * KEY CHANGES from V1:
 * - Impact is multiplied by preference weight (z-score)
 * - Core trait ratio tracks how much impact came from identity/vibe vs spam
 * - Impact type classifies the show's role in shaping taste
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
    ? computeTraitProfile(convertEntriesForTraitProfile(entriesWithoutCandidate, userStats))
    : createEmptyProfile();

  // Calculate raw distance between profiles (exposure impact)
  const rawDistance = calculateProfileDistance(
    fullProfile,
    ablatedProfile,
    distanceMetric
  );

  // Calculate PREFERENCE WEIGHT based on z-score
  // This is the key fix: mid-rated shows get suppressed
  const score = candidate.score || userStats.mean;
  const zScore = userStats.std > 0 ? (score - userStats.mean) / userStats.std : 0;
  
  // Convert z-score to preference weight using sigmoid
  // z=-2 → 0.1, z=0 → 0.5, z=2 → 0.9
  const preferenceWeight = 1 / (1 + Math.exp(-zScore));
  
  // Boost for rewatched/high priority shows
  const isRewatched = (candidate.repeat || 0) > 0;
  const isHighPriority = (candidate.priority || 0) >= 3;
  const signalBoost = (isRewatched ? 0.2 : 0) + (isHighPriority ? 0.1 : 0);
  const adjustedPreferenceWeight = Math.min(1, preferenceWeight + signalBoost);

  // Calculate impact breakdown by channel
  const impactBreakdown = calculateChannelBreakdown(
    fullProfile,
    ablatedProfile
  );

  // Calculate CORE TRAIT RATIO
  // Core = identity + vibe, Spam = structure + intensity
  const coreImpact = impactBreakdown.identity + impactBreakdown.vibe;
  const totalImpact = coreImpact + impactBreakdown.structure + impactBreakdown.intensity;
  const coreTraitRatio = totalImpact > 0 ? coreImpact / totalImpact : 0;

  // Identify which CORE traits this show most influenced (filter out spam)
  const shapedTraits = identifyShapedTraits(
    fullProfile,
    ablatedProfile,
    candidate,
    true // Only core traits
  );

  // PREFERENCE-WEIGHTED IMPACT: raw distance × preference weight × core focus
  // This is the key formula that fixes "Gintama everywhere"
  const impact = rawDistance * adjustedPreferenceWeight * (0.5 + 0.5 * coreTraitRatio);

  // Calculate confidence based on sample size and rating
  const confidence = calculateImpactConfidence(candidate, allEntries.length);

  // Determine impact type
  let impactType: 'loved' | 'defining' | 'transformative';
  if (adjustedPreferenceWeight > 0.7) {
    impactType = 'loved';
  } else if (coreTraitRatio > 0.6) {
    impactType = 'defining';
  } else {
    impactType = 'transformative';
  }

  return {
    mediaId: candidate.mediaId!,
    title: candidate.media?.title?.userPreferred || `Title ${candidate.mediaId}`,
    impact,
    rawDistance,
    preferenceWeight: adjustedPreferenceWeight,
    shapedTraits,
    impactBreakdown,
    impactType,
    confidence,
    coreTraitRatio
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
 * 
 * @param coreOnly - If true, only return identity/vibe traits (filter out spam)
 */
function identifyShapedTraits(
  fullProfile: TraitProfile,
  ablatedProfile: TraitProfile,
  _candidate: MediaListEntry,
  coreOnly: boolean = false
): string[] {
  const traitDeltas: Array<{ traitId: string; delta: number; name: string; channel: string }> = [];
  
  // Get traits from each channel with channel info
  const channelTraits = [
    ...fullProfile.channels.identity.map(t => ({ ...t, channel: 'identity' })),
    ...fullProfile.channels.vibe.map(t => ({ ...t, channel: 'vibe' })),
    ...fullProfile.channels.structure.map(t => ({ ...t, channel: 'structure' })),
    ...fullProfile.channels.intensity.map(t => ({ ...t, channel: 'intensity' }))
  ];

  for (const fullTrait of channelTraits) {
    // If coreOnly, skip structure and intensity traits
    if (coreOnly && (fullTrait.channel === 'structure' || fullTrait.channel === 'intensity')) {
      continue;
    }
    
    const ablatedScore = getTraitScore(ablatedProfile, fullTrait.traitId);
    const delta = fullTrait.normalizedScore - ablatedScore;
    
    if (delta > 5) { // Significant impact
      traitDeltas.push({
        traitId: fullTrait.traitId,
        delta,
        name: fullTrait.name,
        channel: fullTrait.channel
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
