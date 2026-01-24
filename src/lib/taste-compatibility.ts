/**
 * TASTE COMPATIBILITY - Trait-based user comparison
 * 
 * Powers Taste Battle mode and "Opposite You" recommendations
 * Uses channel-level similarity for nuanced compatibility analysis
 */

import type { TraitProfile, TraitScore, ChannelScores } from './trait-scoring-engine';

// ============================================================================
// TYPES
// ============================================================================

export interface CompatibilityResult {
  overallSimilarity: number;     // 0-100, cosine similarity across all traits
  channelSimilarity: {
    identity: number;            // Genre DNA match
    vibe: number;               // Mood preference match
    structure: number;          // Storytelling style match
    intensity: number;          // Intensity tolerance match
  };
  compatibilityType: CompatibilityType;
  matchingTraits: string[];      // Traits both users score high on
  clashingTraits: string[];      // Traits where users differ significantly
  summary: string;               // Human-readable compatibility summary
  recommendations: CompatibilityRecommendation[];
}

export type CompatibilityType = 
  | 'taste_twin'        // 85-100% match
  | 'kindred_spirit'    // 70-84% match
  | 'compatible'        // 55-69% match
  | 'mixed_bag'         // 40-54% match
  | 'opposites'         // 25-39% match
  | 'taste_nemesis';    // 0-24% match

export interface CompatibilityRecommendation {
  reason: string;
  targetTraits: string[];
  confidence: number;
}

export interface OppositeUserProfile {
  // Traits this "opposite" user would have
  identityTraits: InvertedTrait[];
  vibeTraits: InvertedTrait[];
  // Recommendations for exploring "opposite" content
  explorationRecommendations: ExplorationRecommendation[];
}

export interface InvertedTrait {
  traitId: string;
  name: string;
  yourScore: number;
  oppositeScore: number;  // What the "opposite" would score
  category: 'inverted' | 'shared' | 'neutral';
}

export interface ExplorationRecommendation {
  title: string;
  description: string;
  targetTraits: string[];
  riskLevel: 'safe' | 'moderate' | 'experimental';
}

// ============================================================================
// COSINE SIMILARITY
// ============================================================================

/**
 * Calculate cosine similarity between two trait vectors
 */
function cosineSimilarity(vectorA: Map<string, number>, vectorB: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  // Get all unique trait IDs
  const allTraits = new Set([...vectorA.keys(), ...vectorB.keys()]);
  
  for (const traitId of allTraits) {
    const a = vectorA.get(traitId) || 0;
    const b = vectorB.get(traitId) || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))) * 100;
}

/**
 * Convert trait array to score map
 */
function traitsToVector(traits: TraitScore[]): Map<string, number> {
  const vector = new Map<string, number>();
  for (const trait of traits) {
    vector.set(trait.traitId, trait.normalizedScore);
  }
  return vector;
}

// ============================================================================
// COMPATIBILITY CALCULATION
// ============================================================================

/**
 * Calculate detailed compatibility between two user profiles
 */
export function calculateCompatibility(
  profileA: TraitProfile,
  profileB: TraitProfile
): CompatibilityResult {
  // Calculate channel-level similarity
  const identitySim = cosineSimilarity(
    traitsToVector(profileA.channels.identity),
    traitsToVector(profileB.channels.identity)
  );
  const vibeSim = cosineSimilarity(
    traitsToVector(profileA.channels.vibe),
    traitsToVector(profileB.channels.vibe)
  );
  const structureSim = cosineSimilarity(
    traitsToVector(profileA.channels.structure),
    traitsToVector(profileB.channels.structure)
  );
  const intensitySim = cosineSimilarity(
    traitsToVector(profileA.channels.intensity),
    traitsToVector(profileB.channels.intensity)
  );
  
  // Weighted overall similarity (identity and vibe matter more)
  const overallSimilarity = Math.round(
    identitySim * 0.35 +
    vibeSim * 0.30 +
    structureSim * 0.20 +
    intensitySim * 0.15
  );
  
  // Find matching and clashing traits
  const { matchingTraits, clashingTraits } = findTraitOverlaps(profileA, profileB);
  
  // Determine compatibility type
  const compatibilityType = getCompatibilityType(overallSimilarity);
  
  // Generate summary
  const summary = generateCompatibilitySummary(
    compatibilityType,
    identitySim,
    vibeSim,
    matchingTraits,
    clashingTraits
  );
  
  // Generate recommendations
  const recommendations = generateCompatibilityRecommendations(
    profileA,
    profileB,
    matchingTraits
  );
  
  return {
    overallSimilarity,
    channelSimilarity: {
      identity: Math.round(identitySim),
      vibe: Math.round(vibeSim),
      structure: Math.round(structureSim),
      intensity: Math.round(intensitySim),
    },
    compatibilityType,
    matchingTraits,
    clashingTraits,
    summary,
    recommendations,
  };
}

function findTraitOverlaps(
  profileA: TraitProfile,
  profileB: TraitProfile
): { matchingTraits: string[]; clashingTraits: string[] } {
  const matchingTraits: string[] = [];
  const clashingTraits: string[] = [];
  
  const allTraitsA = [
    ...profileA.channels.identity,
    ...profileA.channels.vibe,
    ...profileA.channels.structure,
    ...profileA.channels.intensity,
  ];
  
  const bScores = new Map<string, number>();
  for (const trait of [
    ...profileB.channels.identity,
    ...profileB.channels.vibe,
    ...profileB.channels.structure,
    ...profileB.channels.intensity,
  ]) {
    bScores.set(trait.traitId, trait.normalizedScore);
  }
  
  for (const trait of allTraitsA) {
    if (trait.normalizedScore < 30) continue; // Only consider significant traits
    
    const bScore = bScores.get(trait.traitId) || 0;
    const diff = Math.abs(trait.normalizedScore - bScore);
    
    if (trait.normalizedScore >= 50 && bScore >= 50) {
      matchingTraits.push(trait.name);
    } else if (diff >= 40) {
      clashingTraits.push(trait.name);
    }
  }
  
  return { matchingTraits, clashingTraits };
}

function getCompatibilityType(similarity: number): CompatibilityType {
  if (similarity >= 85) return 'taste_twin';
  if (similarity >= 70) return 'kindred_spirit';
  if (similarity >= 55) return 'compatible';
  if (similarity >= 40) return 'mixed_bag';
  if (similarity >= 25) return 'opposites';
  return 'taste_nemesis';
}

function generateCompatibilitySummary(
  type: CompatibilityType,
  identitySim: number,
  vibeSim: number,
  matching: string[],
  clashing: string[]
): string {
  const matchList = matching.slice(0, 3).join(', ');
  const clashList = clashing.slice(0, 2).join(' and ');
  
  switch (type) {
    case 'taste_twin':
      return `You're taste twins! Strong matches on ${matchList}.`;
    case 'kindred_spirit':
      return `Kindred spirits - you share a love for ${matchList}.`;
    case 'compatible':
      if (identitySim > vibeSim + 15) {
        return `You match on genre DNA but have different mood preferences.`;
      } else if (vibeSim > identitySim + 15) {
        return `You seek the same feelings but through different genres.`;
      }
      return `Compatible tastes with some room for exploration.`;
    case 'mixed_bag':
      return `Mixed compatibility - you match on ${matchList} but clash on ${clashList}.`;
    case 'opposites':
      return `Opposite preferences! Great for discovering new perspectives.`;
    case 'taste_nemesis':
      return `Taste nemesis - you'd argue about everything, but that's fun!`;
  }
}

function generateCompatibilityRecommendations(
  profileA: TraitProfile,
  profileB: TraitProfile,
  matchingTraits: string[]
): CompatibilityRecommendation[] {
  const recommendations: CompatibilityRecommendation[] = [];
  
  if (matchingTraits.length > 0) {
    recommendations.push({
      reason: `Watch together - you both enjoy ${matchingTraits.slice(0, 2).join(' and ')}`,
      targetTraits: matchingTraits.slice(0, 3),
      confidence: 0.9,
    });
  }
  
  return recommendations;
}

// ============================================================================
// "OPPOSITE YOU" GENERATION
// ============================================================================

/**
 * Generate an "Opposite You" profile for exploration recommendations
 * Inverts high traits to low and vice versa
 */
export function generateOppositeProfile(profile: TraitProfile): OppositeUserProfile {
  const invertTraits = (traits: TraitScore[]): InvertedTrait[] => {
    return traits
      .filter(t => t.normalizedScore >= 20)
      .map(t => {
        const oppositeScore = 100 - t.normalizedScore;
        let category: InvertedTrait['category'] = 'neutral';
        
        if (t.normalizedScore >= 70) {
          category = 'inverted'; // High for you, low for opposite
        } else if (t.normalizedScore >= 50) {
          category = 'shared'; // Similar-ish
        }
        
        return {
          traitId: t.traitId,
          name: t.name,
          yourScore: t.normalizedScore,
          oppositeScore,
          category,
        };
      })
      .sort((a, b) => b.yourScore - a.yourScore);
  };
  
  const identityTraits = invertTraits(profile.channels.identity);
  const vibeTraits = invertTraits(profile.channels.vibe);
  
  // Generate exploration recommendations based on inverted traits
  const explorationRecommendations = generateExplorationRecs(identityTraits, vibeTraits);
  
  return {
    identityTraits,
    vibeTraits,
    explorationRecommendations,
  };
}

function generateExplorationRecs(
  identityTraits: InvertedTrait[],
  vibeTraits: InvertedTrait[]
): ExplorationRecommendation[] {
  const recommendations: ExplorationRecommendation[] = [];
  
  // Find traits you score low on (potential exploration areas)
  const lowIdentity = identityTraits.filter(t => t.yourScore <= 30 && t.oppositeScore >= 70);
  const lowVibe = vibeTraits.filter(t => t.yourScore <= 30 && t.oppositeScore >= 70);
  
  // Find traits you score high on (for contrast)
  const highIdentity = identityTraits.find(t => t.yourScore >= 70);
  const highVibe = vibeTraits.find(t => t.yourScore >= 70);
  
  // Safe exploration: similar vibe, different genre
  if (lowIdentity.length > 0 && highVibe) {
    recommendations.push({
      title: 'Same Vibe, New Genre',
      description: `Try ${lowIdentity[0].name} content with ${highVibe.name} vibes - familiar feelings, fresh setting.`,
      targetTraits: [lowIdentity[0].traitId, highVibe.traitId],
      riskLevel: 'safe',
    });
  }
  
  // Moderate exploration: different vibe, same genre
  if (lowVibe.length > 0 && highIdentity) {
    recommendations.push({
      title: 'New Mood, Familiar Ground',
      description: `Explore ${lowVibe[0].name} shows within ${highIdentity.name} - challenge yourself emotionally.`,
      targetTraits: [highIdentity.traitId, lowVibe[0].traitId],
      riskLevel: 'moderate',
    });
  }
  
  // Experimental: completely opposite
  if (lowIdentity.length > 0 && lowVibe.length > 0) {
    recommendations.push({
      title: 'The Full Opposite',
      description: `Dive into ${lowIdentity[0].name} with ${lowVibe[0].name} vibes - your polar opposite experience.`,
      targetTraits: [lowIdentity[0].traitId, lowVibe[0].traitId],
      riskLevel: 'experimental',
    });
  }
  
  return recommendations;
}

/**
 * Calculate how "opposite" two profiles are (inverse of compatibility)
 * Higher = more opposite
 */
export function calculateOppositeness(
  profileA: TraitProfile,
  profileB: TraitProfile
): number {
  const compatibility = calculateCompatibility(profileA, profileB);
  return 100 - compatibility.overallSimilarity;
}
