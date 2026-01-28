import { MediaListEntry } from '@/types/anilist';
import { computeTraitProfile, TraitProfile } from '../../trait-scoring-engine';
import { computeImpactScores } from '../../impact-scoring';
import { TasteResult, ComputeTasteOptions, TraitView } from '../types/TasteResult';
import { TasteAnalyzer } from '../../taste-analyzer';
import { adaptToLegacy } from '../adapters/legacyAdapter';
import { calculateEngagementWeight, calculateUserScoreStats } from '../../engagement-weights';

/**
 * ONE CANONICAL PIPELINE for taste computation
 * This is the only function that should be used to compute taste
 */
export async function computeTaste(
  entries: MediaListEntry[],
  mediaType: 'ANIME' | 'MANGA' = 'ANIME',
  userId: number = 0,
  options: ComputeTasteOptions = {}
): Promise<TasteResult> {
  const {
    includeViews = true,
    includeLegacy = true,
    debugMode = false
  } = options;

  // 1. Normalize entries for the pipeline
  const normalizedEntries = normalizeEntries(entries);
  
  if (debugMode) {
    console.log(`[computeTaste] Processing ${normalizedEntries.length} entries for ${mediaType}`);
  }

  // 2. Core engine computations
  const traits = computeTraitProfile(normalizedEntries);
  const impactAnalysis = await computeImpactScores(entries, {});
  
  // Create derived indices from impact analysis
  const derived = {
    contradictions: [], // TODO: Calculate from trait preferences
    indices: {}, // TODO: Calculate from trait scores
    types: {}, // TODO: Calculate from patterns
    behavioralMetrics: {
      completionRate: calculateCompletionRate(entries),
      dropRate: calculateDropRate(entries),
      bingeIndex: calculateBingeIndex(entries),
      mainstreamIndex: calculateMainstreamIndex(entries),
      nicheIndex: calculateNicheIndex(entries),
      experimentalIndex: calculateExperimentalIndex(entries)
    },
    emotionalDamage: { overallScore: 0 }, // TODO: Implement
    chaosLevel: { chaosLevel: 0 }, // TODO: Implement
    emotionalProfile: {}, // TODO: Implement
    tasteClusters: [], // TODO: Implement
    diversityIndex: calculateDiversityIndex(entries)
  };
  
  // Calculate actual user score stats for proper engagement weighting
  const userScoreStats = calculateUserScoreStats(entries);
  
  // Create shaped by from impact analysis - focus on preference + signature influence
  const definingTraits = getDefiningTraits(traits);
  const shapedBy = computeShapedBy(impactAnalysis.impacts, definingTraits, entries, userScoreStats);

  // 3. Compute views (if requested)
  const views = includeViews ? {
    exposure: computeExposureView(traits, derived),
    preference: computePreferenceView(traits, derived),
    signature: computeSignatureView(traits, derived)
  } : {
    exposure: createEmptyView(),
    preference: createEmptyView(),
    signature: createEmptyView()
  };

  // 4. Legacy adapter (if requested)
  const legacy = includeLegacy ? adaptToLegacy(traits, derived, shapedBy) : undefined;

  // 5. Assemble final result
  const result: TasteResult = {
    meta: {
      userId,
      mediaType,
      computedAt: new Date(),
      version: '1.0.0',
      sampleSize: normalizedEntries.length,
      warnings: generateWarnings(normalizedEntries, traits)
    },
    traits,
    derived,
    shapedBy,
    views,
    legacy
  };

  if (debugMode) {
    console.log('[computeTaste] Computation complete', {
      traitCount: traits.topTraits.length,
      contradictionCount: derived.contradictions.length,
      shapingCount: shapedBy.topShapers.length
    });
  }

  return result;
}

/**
 * Step 1: Normalize entries for the pipeline
 */
function normalizeEntries(entries: MediaListEntry[]) {
  return entries
    .filter(e => e.media) // Must have media
    .map(e => ({
      tags: e.media?.tags?.map(tag => ({
        id: tag.id,
        name: tag.name,
        description: tag.description || '',
        category: tag.category || 'general',
        rank: tag.rank || 0,
        isGeneralSpoiler: tag.isGeneralSpoiler || false,
        isMediaSpoiler: tag.isMediaSpoiler || false,
        isAdult: tag.isAdult || false
      })) || [],
      engagementWeight: calculateEngagementWeight(e, { mean: 7, std: 1.5, count: 100 }).weight,
      score: e.score || undefined,
      id: e.media?.id,
      title: e.media?.title?.userPreferred || e.media?.title?.english || e.media?.title?.romaji || 'Unknown'
    }));
}

/**
 * Step 2: Compute exposure view (what you consume a lot)
 */
function computeExposureView(traits: any, derived: any): TraitView {
  const topTraits = traits.traits
    .filter((t: any) => t.exposure > 0.1)
    .sort((a: any, b: any) => b.exposure - a.exposure)
    .slice(0, 10)
    .map((t: any) => ({
      trait: t.name,
      score: t.exposure,
      channel: t.channel,
      strength: getStrength(t.exposure),
      exposure: t.exposure,
      rarity: t.rarity || 0.5,
      populationPercentile: t.populationPercentile
    }));

  return {
    topTraits,
    summary: `You frequently consume content in ${topTraits.length} major categories`,
    confidence: Math.min(1, traits.totalMediaCount / 50)
  };
}

/**
 * Step 3: Compute preference view (what you actually like)
 */
function computePreferenceView(traits: any, derived: any): TraitView {
  const topTraits = traits.traits
    .filter((t: any) => t.preferenceScore > 0)
    .sort((a: any, b: any) => b.preferenceScore - a.preferenceScore)
    .slice(0, 10)
    .map((t: any) => ({
      trait: t.name,
      score: t.preferenceScore,
      channel: t.channel,
      strength: getStrength(t.preferenceScore),
      exposure: t.exposure,
      rarity: t.rarity || 0.5,
      populationPercentile: t.populationPercentile
    }));

  return {
    topTraits,
    summary: `You show strong preference for ${topTraits[0]?.trait || 'various'} content`,
    confidence: Math.min(1, traits.totalMediaCount / 30)
  };
}

/**
 * Step 4: Compute signature view (what makes you unique)
 */
function computeSignatureView(traits: any, derived: any): TraitView {
  const topTraits = traits.traits
    .filter((t: any) => t.isSignature)
    .sort((a: any, b: any) => (b.rarity || 0.5) - (a.rarity || 0.5))
    .slice(0, 10)
    .map((t: any) => ({
      trait: t.name,
      score: t.rarity || 0.5,
      channel: t.channel,
      strength: getStrength(t.rarity || 0.5),
      exposure: t.exposure,
      rarity: t.rarity || 0.5,
      populationPercentile: t.populationPercentile
    }));

  return {
    topTraits,
    summary: `Your taste is uniquely defined by ${topTraits[0]?.trait || 'diverse interests'}`,
    confidence: Math.min(1, traits.totalMediaCount / 40)
  };
}

/**
 * Helper functions
 */
function getStrength(score: number): 'weak' | 'moderate' | 'strong' | 'intense' {
  if (score < 0.3) return 'weak';
  if (score < 0.6) return 'moderate';
  if (score < 0.8) return 'strong';
  return 'intense';
}

function createEmptyView(): TraitView {
  return {
    topTraits: [],
    summary: 'Insufficient data',
    confidence: 0
  };
}

function generateWarnings(entries: any[], traits: any): string[] {
  const warnings: string[] = [];
  
  if (entries.length < 10) {
    warnings.push('Limited sample size - results may not be accurate');
  }
  
  if (traits.totalMediaCount < 20) {
    warnings.push('Few titles analyzed - consider watching more content');
  }
  
  return warnings;
}

// Simple metric calculations (TODO: Move to dedicated module)
function calculateCompletionRate(entries: MediaListEntry[]): number {
  const completed = entries.filter(e => e.status === 'COMPLETED').length;
  return entries.length > 0 ? completed / entries.length : 0;
}

function calculateDropRate(entries: MediaListEntry[]): number {
  const dropped = entries.filter(e => e.status === 'DROPPED').length;
  return entries.length > 0 ? dropped / entries.length : 0;
}

function calculateBingeIndex(entries: MediaListEntry[]): number {
  // Simple implementation - TODO: Improve
  return 0.5;
}

function calculateMainstreamIndex(entries: MediaListEntry[]): number {
  // Simple implementation - TODO: Improve
  return 0.5;
}

function calculateNicheIndex(entries: MediaListEntry[]): number {
  // Simple implementation - TODO: Improve
  return 0.5;
}

function calculateExperimentalIndex(entries: MediaListEntry[]): number {
  // Simple implementation - TODO: Improve
  return 0.5;
}

function calculateDiversityIndex(entries: MediaListEntry[]): number {
  // Simple implementation - TODO: Improve
  return 0.5;
}

/**
 * Get the user's defining traits - the ones that make them unique
 * Combines preference strength with signature rarity
 */
function getDefiningTraits(traits: TraitProfile): { trait: string; importance: number; channel: string }[] {
  // Combine preference and signature traits
  const preferenceTraits = traits.topSignatureTraits || traits.topTraits;
  const signatureTraits = traits.topSignatureTraits || [];
  
  // Calculate importance for each trait
  const traitImportance = new Map<string, { importance: number; channel: string }>();
  
  // Process preference traits (what they love)
  preferenceTraits.forEach(trait => {
    const baseImportance = (trait.enjoymentScore || 0) / 100;
    const rarityBoost = trait.rarity === 'rare' ? 1.5 : trait.rarity === 'very_rare' ? 2 : 1;
    const channelWeight = trait.channel === 'identity' ? 1.2 : trait.channel === 'vibe' ? 1.1 : 1;
    
    traitImportance.set(trait.name, {
      importance: baseImportance * rarityBoost * channelWeight,
      channel: trait.channel
    });
  });
  
  // Boost signature traits further
  signatureTraits.forEach(trait => {
    const existing = traitImportance.get(trait.name);
    if (existing) {
      existing.importance *= 1.5; // Signature boost
    }
  });
  
  // Filter out generic traits unless unusually high
  const genericTraits = ['Drama', 'Comedy', 'Action', 'Romance', 'Fantasy', 'Sci-Fi'];
  
  return Array.from(traitImportance.entries())
    .filter(([name, data]) => {
      // Keep generic traits only if they're very strong
      if (genericTraits.includes(name)) {
        return data.importance > 0.8;
      }
      return true;
    })
    .map(([name, data]) => ({
      trait: name,
      importance: data.importance,
      channel: data.channel
    }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 20); // Top 20 defining traits
}

/**
 * Compute what shaped the user's taste based on influence on defining traits
 */
function computeShapedBy(
  impacts: any[], 
  definingTraits: { trait: string; importance: number; channel: string }[],
  entries: MediaListEntry[],
  userScoreStats: { mean: number; std: number; count: number }
): {
  topShapers: Array<{
    mediaId: number;
    mediaTitle: string;
    impactScore: number;
    reason: string;
    shapedTraits: Array<{ trait: string; contribution: number; importance: number }>;
    explanation: string;
  }>;
  totalImpact: number;
  confidence: number;
  shapingAxes: {
    identity: Array<typeof topShapers[0]>;
    emotional: Array<typeof topShapers[0]>;
    cerebral: Array<typeof topShapers[0]>;
    edge: Array<typeof topShapers[0]>;
  };
} {
  // Create a map of trait importance for quick lookup
  const traitImportanceMap = new Map(
    definingTraits.map(t => [t.trait, t.importance])
  );
  
  // Score each title based on its influence on defining traits
  const scoredImpacts = impacts.map(impact => {
    // Only count contributions to defining traits
    const relevantTraits = (impact.shapedTraits || []).filter((trait: string) => 
      traitImportanceMap.has(trait)
    );
    
    if (relevantTraits.length === 0) {
      return { ...impact, influenceScore: 0 };
    }
    
    // Calculate influence based on trait importance and contribution
    let traitInfluence = 0;
    const shapedTraits = relevantTraits.map((traitName: string) => {
      const contribution = 1 / relevantTraits.length; // Simplified - should use actual contribution
      const importance = traitImportanceMap.get(traitName) || 0;
      traitInfluence += contribution * importance;
      
      return {
        trait: traitName,
        contribution,
        importance
      };
    });
    
    // Apply engagement weight using actual user stats
    const entry = entries.find(e => e.media?.id === impact.mediaId);
    const engagementWeight = entry ? calculateEngagementWeight(entry, userScoreStats).weight : 1;
    
    // Apply STRONG favorite and rewatch boost (user explicitly loves these)
    let preferenceBoost = 1.0;
    if (entry) {
      // Rewatch boost: rewatching = strong signal of preference
      if (entry.repeat && entry.repeat > 0) {
        preferenceBoost *= 1.5 + Math.min(0.5, entry.repeat * 0.25); // 1.5x for 1 rewatch, up to 2x for 2+
      }
      
      // High rating boost: scores significantly above user's mean
      if (entry.score && entry.score > 0) {
        const zScore = (entry.score - userScoreStats.mean) / userScoreStats.std;
        if (zScore >= 1.5) {
          preferenceBoost *= 1.8; // Very high rating = 1.8x
        } else if (zScore >= 1.0) {
          preferenceBoost *= 1.5; // High rating = 1.5x
        } else if (zScore >= 0.5) {
          preferenceBoost *= 1.25; // Above average = 1.25x
        } else if (zScore < -0.5) {
          preferenceBoost *= 0.5; // Below average = penalty
        }
      }
    }
    
    // Apply anti-tag-spam penalty
    const traitCount = impact.shapedTraits?.length || 0;
    const spamPenalty = Math.min(1, 6 / Math.max(traitCount, 6)); // Normalize to top 6 traits
    
    // Final influence score - preference boost is now a major factor
    const influenceScore = traitInfluence * engagementWeight * spamPenalty * preferenceBoost * (impact.preferenceWeight || 1);
    
    return {
      ...impact,
      influenceScore,
      shapedTraits,
      engagementWeight,
      spamPenalty
    };
  });
  
  // Sort by influence and take top 20
  const topShapers = scoredImpacts
    .filter(impact => impact.influenceScore > 0)
    .sort((a, b) => b.influenceScore - a.influenceScore)
    .slice(0, 20)
    .map((impact, index) => ({
      mediaId: impact.mediaId,
      mediaTitle: impact.title,
      impactScore: impact.influenceScore,
      reason: impact.impactType || 'defining',
      shapedTraits: impact.shapedTraits || [],
      explanation: generateExplanation(impact, index + 1)
    }));
  
  // Organize into shaping axes
  const shapingAxes = {
    identity: topShapers.filter(s => 
      s.shapedTraits.some((t: { trait: string }) => t.trait.includes('Psychological') || t.trait.includes('Identity'))
    ),
    emotional: topShapers.filter(s => 
      s.shapedTraits.some((t: { trait: string }) => t.trait.includes('Emotional') || t.trait.includes('Heartbreak') || t.trait.includes('Romance'))
    ),
    cerebral: topShapers.filter(s => 
      s.shapedTraits.some((t: { trait: string }) => t.trait.includes('Mind Game') || t.trait.includes('Strategy') || t.trait.includes('Complex'))
    ),
    edge: topShapers.filter(s => 
      s.shapedTraits.some((t: { trait: string }) => t.trait.includes('Dark') || t.trait.includes('Gore') || t.trait.includes('Psychological Horror'))
    )
  };
  
  return {
    topShapers,
    totalImpact: topShapers.reduce((sum, s) => sum + s.impactScore, 0),
    confidence: Math.min(0.95, 0.5 + (topShapers.length / 20)), // More titles = higher confidence
    shapingAxes
  };
}

/**
 * Generate human-readable explanation for why a title shaped the user's taste
 */
function generateExplanation(impact: any, rank: number): string {
  const reasons = [];
  
  if (impact.engagementWeight > 1.5) {
    reasons.push('highly rated');
  }
  if (impact.spamPenalty < 1) {
    reasons.push('focused impact');
  }
  if (impact.impactType === 'transformative') {
    reasons.push('changed your taste');
  }
  
  const traitCount = impact.shapedTraits?.length || 0;
  if (traitCount > 5) {
    reasons.push('shaped multiple traits');
  }
  
  if (reasons.length === 0) {
    return `#${rank} influence on your defining traits`;
  }
  
  return `#${rank} - ${reasons.join(', ')}`;
}
