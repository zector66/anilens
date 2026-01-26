import { MediaListEntry } from '@/types/anilist';
import { computeTraitProfile } from '../../trait-scoring-engine';
import { computeImpactScores } from '../../impact-scoring';
import { TasteResult, ComputeTasteOptions, TraitView } from '../types/TasteResult';
import { TasteAnalyzer } from '../../taste-analyzer';
import { adaptToLegacy } from '../adapters/legacyAdapter';

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
  
  // Create shaped by from impact analysis
  const shapedBy = {
    topShapers: impactAnalysis.impacts.slice(0, 10).map(impact => ({
      mediaId: impact.mediaId,
      mediaTitle: impact.title,
      impactScore: impact.impact,
      reason: impact.impactType
    })),
    totalImpact: impactAnalysis.impacts.reduce((sum, i) => sum + i.impact, 0),
    confidence: 0.8 // TODO: Calculate actual confidence
  };

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
      engagementWeight: getEngagementWeight(e),
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
function getEngagementWeight(entry: MediaListEntry): number {
  const status = entry.status;
  const progress = entry.progress || 0;
  const progressTotal = entry.media?.episodes || 1;
  const score = entry.score || 0;
  
  let weight = 1;
  
  // Status weight
  if (status === 'COMPLETED') weight *= 2;
  else if (status === 'CURRENT') weight *= 1.5;
  else if (status === 'DROPPED') weight *= 0.5;
  else if (status === 'PAUSED') weight *= 0.8;
  
  // Progress weight
  const progressRatio = progress / progressTotal;
  weight *= (0.5 + progressRatio * 0.5);
  
  // Score weight
  if (score > 0) {
    weight *= (0.7 + (score / 10) * 0.3);
  }
  
  return weight;
}

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
