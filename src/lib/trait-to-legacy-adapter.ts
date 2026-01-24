/**
 * TRAIT-TO-LEGACY ADAPTER
 * 
 * Maps new trait system outputs to the legacy TasteProfile format
 * so existing UI components continue to work during migration.
 */

import type { TraitProfile, TraitScore } from './trait-scoring-engine';
import type { DerivedIndex, TasteType } from './derived-traits';
import { detectAllContradictions } from './derived-traits';

// Legacy interfaces (from taste-analyzer.ts)
export interface LegacyPersonalityTraits {
  completionist: number;
  seasonalTourist: number;
  cultHunter: number;
  nostalgiaAddict: number;
  mainstreamMaxxer: number;
  avantGarde: number;
  emotionalDamageIndex: number;
  chaosLevel: number;
  genreDiversity: number;
}

export interface LegacyTagAffinity {
  tag: string;
  count: number;
  affinity: number;
  confidence: number;      // 0-1, how reliable this trait score is
  avgScore?: number;        // Actual avg rating of contributing media (if available)
}

export interface LegacyGenreAffinity {
  genre: string;
  count: number;
  affinity: number;
  confidence: number;      // 0-1, how reliable this trait score is
  avgScore?: number;        // Actual avg rating of contributing media (if available)
}

/**
 * Convert trait scores to legacy tag affinity format
 */
export function traitScoresToTagAffinity(
  traitProfile: TraitProfile,
  limit: number = 20
): LegacyTagAffinity[] {
  const allTraits = [
    ...traitProfile.channels.identity,
    ...traitProfile.channels.vibe,
    ...traitProfile.channels.structure,
    ...traitProfile.channels.intensity,
  ];

  // Sort by normalized score
  const sorted = allTraits
    .filter(t => t.normalizedScore > 10)
    .sort((a, b) => b.normalizedScore - a.normalizedScore);

  return sorted.slice(0, limit).map(trait => ({
    tag: trait.name,
    count: trait.contributingTags.length,
    affinity: trait.normalizedScore / 100, // Convert to 0-1
    confidence: trait.confidence,          // Direct confidence value (0-1)
    // avgScore computed from actual contributing media ratings if available
  }));
}

/**
 * Convert identity channel traits to genre affinity format
 */
export function traitScoresToGenreAffinity(
  traitProfile: TraitProfile,
  limit: number = 15
): LegacyGenreAffinity[] {
  // Identity channel contains genre-like traits
  const genreTraits = traitProfile.channels.identity
    .filter(t => t.normalizedScore > 10)
    .sort((a, b) => b.normalizedScore - a.normalizedScore);

  return genreTraits.slice(0, limit).map(trait => ({
    genre: trait.name,
    count: trait.contributingTags.length,
    affinity: trait.normalizedScore / 100,
    confidence: trait.confidence,          // Direct confidence value (0-1)
  }));
}

/**
 * Calculate emotional damage index from trait system
 * Uses emotional output traits and intensity channel
 */
export function calculateEmotionalDamageFromTraits(
  traitProfile: TraitProfile,
  derivedIndices: DerivedIndex[]
): number {
  // Look for emotional depth index
  const emotionalDepth = derivedIndices.find(i => 
    i.id === 'emotional_depth' || i.id === 'tragedy_core'
  );
  
  if (emotionalDepth) {
    return emotionalDepth.score / 10; // Convert 0-100 to 0-10
  }

  // Fallback: calculate from relevant traits
  const emotionalTraits = [
    'emotional_damage', 'tragedy', 'melancholy', 'catharsis',
    'heartbreak', 'bittersweet', 'suffering', 'grief'
  ];

  const allTraits = [
    ...traitProfile.channels.vibe,
    ...traitProfile.channels.intensity,
  ];

  let totalScore = 0;
  let count = 0;

  for (const trait of allTraits) {
    if (emotionalTraits.some(e => trait.traitId.includes(e))) {
      totalScore += trait.normalizedScore;
      count++;
    }
  }

  if (count === 0) return 3; // Default neutral value
  return Math.min(10, (totalScore / count) / 10);
}

/**
 * Calculate chaos level from contradiction heat and chaotic traits
 */
export function calculateChaosFromTraits(
  traitProfile: TraitProfile,
  derivedIndices: DerivedIndex[]
): { chaosLevel: number; chaosLabel: string; chaosArchetype: string } {
  // Get contradiction analysis
  const contradictions = detectAllContradictions(traitProfile, derivedIndices);
  
  // Look for chaos-related indices
  const chaosIndex = derivedIndices.find(i => 
    i.id === 'chaos_index' || i.id === 'absurdism_quotient'
  );
  
  // Combine contradiction heat with chaos index
  const contradictionComponent = contradictions.contradictionHeat * 0.5;
  const chaosComponent = chaosIndex ? chaosIndex.score * 0.5 : 25;
  
  const chaosLevel = Math.round(contradictionComponent + chaosComponent);

  // Determine label and archetype
  let chaosLabel: string;
  let chaosArchetype: string;

  if (chaosLevel < 20) {
    chaosLabel = 'Stable';
    chaosArchetype = 'The Purist';
  } else if (chaosLevel < 40) {
    chaosLabel = 'Balanced';
    chaosArchetype = 'The Explorer';
  } else if (chaosLevel < 60) {
    chaosLabel = 'Eclectic';
    chaosArchetype = 'The Wildcard';
  } else if (chaosLevel < 80) {
    chaosLabel = 'Chaotic';
    chaosArchetype = 'The Chaos Agent';
  } else {
    chaosLabel = 'Maximum Chaos';
    chaosArchetype = 'The Entropy Lord';
  }

  return { chaosLevel, chaosLabel, chaosArchetype };
}

/**
 * Convert trait profile to legacy personality traits format
 */
export function traitProfileToLegacyPersonality(
  traitProfile: TraitProfile,
  derivedIndices: DerivedIndex[],
  behavioralMetrics?: {
    completionRate?: number;
    mainstreamIndex?: number;
    diversityIndex?: number;
  }
): LegacyPersonalityTraits {
  const chaos = calculateChaosFromTraits(traitProfile, derivedIndices);
  const emotionalDamage = calculateEmotionalDamageFromTraits(traitProfile, derivedIndices);

  // Find relevant traits for each personality dimension
  const findTraitScore = (keywords: string[]): number => {
    const allTraits = [
      ...traitProfile.channels.identity,
      ...traitProfile.channels.vibe,
      ...traitProfile.channels.structure,
    ];
    
    for (const trait of allTraits) {
      if (keywords.some(k => trait.traitId.includes(k))) {
        return trait.normalizedScore / 10; // Convert 0-100 to 0-10
      }
    }
    return 5; // Default neutral
  };

  // Cult Hunter: Look for niche/obscure traits
  const cultHunter = findTraitScore(['niche', 'obscure', 'cult', 'underground', 'experimental']);
  
  // Nostalgia Addict: Look for classic/retro traits
  const nostalgiaAddict = findTraitScore(['classic', 'retro', 'nostalgic', 'vintage', '90s', '80s']);
  
  // Avant-Garde: Look for experimental/artistic traits  
  const avantGarde = findTraitScore(['experimental', 'avant_garde', 'artistic', 'surreal', 'abstract']);

  // Seasonal Tourist: inverse of classic affinity (approximation)
  const seasonalTourist = 10 - nostalgiaAddict;

  return {
    completionist: (behavioralMetrics?.completionRate ?? 0.7) * 10,
    seasonalTourist,
    cultHunter,
    nostalgiaAddict,
    mainstreamMaxxer: (behavioralMetrics?.mainstreamIndex ?? 0.5) * 10,
    avantGarde,
    emotionalDamageIndex: emotionalDamage,
    chaosLevel: chaos.chaosLevel / 10, // Convert to 0-10 scale
    genreDiversity: (behavioralMetrics?.diversityIndex ?? 0.5) * 10,
  };
}

/**
 * Get top N traits across all channels for display
 */
export function getTopTraitsForDisplay(
  traitProfile: TraitProfile,
  limit: number = 10
): Array<{
  id: string;
  name: string;
  score: number;
  channel: string;
  confidence: number;
}> {
  const allTraits = [
    ...traitProfile.channels.identity.map(t => ({ ...t, channelName: 'identity' })),
    ...traitProfile.channels.vibe.map(t => ({ ...t, channelName: 'vibe' })),
    ...traitProfile.channels.structure.map(t => ({ ...t, channelName: 'structure' })),
    ...traitProfile.channels.intensity.map(t => ({ ...t, channelName: 'intensity' })),
  ];

  return allTraits
    .filter(t => t.normalizedScore > 15)
    .sort((a, b) => b.normalizedScore - a.normalizedScore)
    .slice(0, limit)
    .map(t => ({
      id: t.traitId,
      name: t.name,
      score: t.normalizedScore,
      channel: t.channelName,
      confidence: t.confidence,
    }));
}
