import { TraitProfile } from '../../trait-scoring-engine';
import { DerivedIndices, ShapedByResult } from '../types/TasteResult';

/**
 * Adapter to convert new TasteResult to legacy format
 * This maintains backward compatibility while we migrate UI components
 */
export function adaptToLegacy(
  traits: TraitProfile,
  derived: DerivedIndices,
  shapedBy: ShapedByResult
) {
  // Map new trait system to legacy personality traits
  const personalityTraits = {
    completionist: derived.behavioralMetrics?.completionRate ? derived.behavioralMetrics.completionRate * 10 : 7,
    seasonalTourist: calculateSeasonalTourist(traits),
    cultHunter: calculateCultHunter(traits),
    nostalgiaAddict: calculateNostalgiaAddict(traits),
    mainstreamMaxxer: derived.behavioralMetrics?.mainstreamIndex ? derived.behavioralMetrics.mainstreamIndex * 10 : 5,
    avantGarde: calculateAvantGarde(traits),
    emotionalDamageIndex: derived.emotionalDamage?.overallScore || 0,
    chaosLevel: derived.chaosLevel?.chaosLevel || 0,
    genreDiversity: derived.diversityIndex ? derived.diversityIndex * 10 : 5
  };

  const behavioralMetrics = {
    completionRate: derived.behavioralMetrics?.completionRate || 0.7,
    dropRate: derived.behavioralMetrics?.dropRate || 0.2,
    meanDropProgress: derived.behavioralMetrics?.meanDropProgress || 0.3,
    bingeIndex: derived.behavioralMetrics?.bingeIndex || 0.5,
    mainstreamIndex: derived.behavioralMetrics?.mainstreamIndex || 0.5,
    nicheIndex: derived.behavioralMetrics?.nicheIndex || 0.5,
    experimentalIndex: derived.behavioralMetrics?.experimentalIndex || 0.5
  };

  const emotionalProfile = derived.emotionalProfile || {};

  const tasteClusters = derived.tasteClusters || [];

  const powerRankings = shapedBy.topShapers.map(shaper => ({
    title: shaper.mediaTitle || 'Unknown',
    score: shaper.impactScore,
    reason: shaper.reason || 'High impact on your taste'
  }));

  return {
    personalityTraits,
    behavioralMetrics,
    emotionalProfile,
    tasteClusters,
    powerRankings
  };
}

/**
 * Helper functions to calculate legacy traits from new system
 */
function calculateSeasonalTourist(traits: TraitProfile): number {
  // Look for current season indicators in traits
  const currentSeasonTraits = traits.topTraits.filter(t => 
    t.name.includes('Seasonal') || 
    t.name.includes('Current') ||
    t.name.includes('Winter 2026')
  );
  
  if (currentSeasonTraits.length > 0) {
    return Math.min(10, (currentSeasonTraits[0].enjoymentScore || 0) / 10);
  }
  
  // Fallback: inverse of nostalgia
  const nostalgiaTraits = traits.topTraits.filter(t => 
    t.name.includes('Classic') || 
    t.name.includes('Retro') ||
    t.name.includes('Vintage')
  );
  
  const nostalgiaScore = nostalgiaTraits.reduce((sum, t) => sum + (t.enjoymentScore || 0), 0);
  return Math.max(0, 10 - nostalgiaScore * 5);
}

function calculateCultHunter(traits: TraitProfile): number {
  const cultTraits = traits.topTraits.filter(t => 
    t.channel === 'identity' && 
    (t.rarity === 'rare' || t.rarity === 'very_rare') &&
    (t.exposureScore || 0) > 10
  );
  
  return Math.min(10, cultTraits.length * 2);
}

function calculateNostalgiaAddict(traits: TraitProfile): number {
  const nostalgiaTraits = traits.topTraits.filter(t => 
    t.name.includes('Classic') || 
    t.name.includes('Retro') ||
    t.name.includes('Vintage') ||
    t.name.includes('90s') ||
    t.name.includes('80s')
  );
  
  const totalScore = nostalgiaTraits.reduce((sum, t) => sum + (t.enjoymentScore || 0), 0);
  return Math.min(10, totalScore * 5);
}

function calculateAvantGarde(traits: TraitProfile): number {
  const avantGardeTraits = traits.topTraits.filter(t => 
    t.name.includes('Experimental') || 
    t.name.includes('Avant-Garde') ||
    t.name.includes('Artistic') ||
    t.name.includes('Surreal')
  );
  
  const totalScore = avantGardeTraits.reduce((sum, t) => sum + (t.enjoymentScore || 0), 0);
  return Math.min(10, totalScore * 5);
}
