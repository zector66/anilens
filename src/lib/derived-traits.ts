/**
 * DERIVED TRAITS - Computed indices from trait combinations
 * These aren't tags - they're computed from patterns in trait scores
 * 
 * Examples:
 * - "Darkness Index" = Horror + Gore + Torture + Suicide + Abuse + War + Crime
 * - "Cozy Index" = Iyashikei + CuteGirls + Food + FamilyLife + Rural + LowStakes
 * - "Mindfuck Index" = Nonlinear + TimeLoop + Meta + Denpa + UnreliableNarrator
 */

import type { ChannelScores, TraitProfile } from './trait-scoring-engine';

// ============================================================================
// DERIVED INDEX DEFINITIONS
// ============================================================================

interface DerivedIndexDef {
  id: string;
  name: string;
  description: string;
  contributingTraits: string[]; // trait IDs
}

export const DERIVED_INDICES: DerivedIndexDef[] = [
  {
    id: 'darkness_index',
    name: 'Darkness Index',
    description: 'How dark and intense your taste is',
    contributingTraits: ['horror', 'gore_level', 'torture', 'suicide_themes', 'abuse_themes', 'war', 'crime', 'dark', 'grim', 'tragic', 'violence_level', 'psychological_abuse'],
  },
  {
    id: 'cozy_index',
    name: 'Cozy Index',
    description: 'Your comfort content affinity',
    contributingTraits: ['wholesome', 'cozy', 'chill', 'warm', 'cute', 'slice_of_life', 'comfort_food', 'food_world', 'modern_rural', 'hopeful'],
  },
  {
    id: 'mindfuck_index',
    name: 'Mindfuck Index',
    description: 'Love for mind-bending narratives',
    contributingTraits: ['mindfuck', 'nonlinear', 'time_loop', 'time_travel', 'meta', 'denpa', 'unreliable_narrator', 'psychological', 'memory_manipulation', 'parallel_worlds', 'achronological'],
  },
  {
    id: 'action_density',
    name: 'Action Density',
    description: 'How much you love hype and action',
    contributingTraits: ['action', 'martial_arts', 'swordplay', 'military', 'survival', 'hype', 'tournament_engine', 'mecha_combat', 'superpowers'],
  },
  {
    id: 'romance_core',
    name: 'Romance Core',
    description: 'Your romantic content affinity',
    contributingTraits: ['romance', 'romance_primary', 'romantic_vibes', 'slow_burn', 'love_triangle', 'bl', 'yuri', 'harem', 'reverse_harem', 'cohabitation'],
  },
  {
    id: 'systems_fantasy',
    name: 'Systems Fantasy',
    description: 'Love for magic systems and RPG mechanics',
    contributingTraits: ['magic_system', 'rpg_mechanics', 'skill_trees', 'cultivation_power', 'isekai', 'training_loop', 'monster_taming', 'dungeon'],
  },
  {
    id: 'emotional_damage_quotient',
    name: 'Emotional Damage Quotient',
    description: 'How much you enjoy suffering',
    contributingTraits: ['emotional_damage', 'tearjerker', 'tragic', 'melancholic', 'sad', 'bittersweet', 'anxiety', 'existential_dread', 'loneliness'],
  },
  {
    id: 'strategy_brain',
    name: 'Strategy Brain',
    description: 'Love for tactical and political content',
    contributingTraits: ['tactical_combat', 'mindgames_combat', 'political', 'scheme_engine', 'psychological_warfare', 'investigation_loop', 'mystery_box'],
  },
  {
    id: 'chaos_index',
    name: 'Chaos Index',
    description: 'Affinity for absurd and chaotic content',
    contributingTraits: ['chaotic', 'absurd', 'parody', 'surreal_comedy', 'meta', 'slapstick', 'dark_comedy'],
  },
  {
    id: 'epic_scale',
    name: 'Epic Scale',
    description: 'Love for grand, large-scale stories',
    contributingTraits: ['epic', 'war', 'space_opera', 'fantasy_medieval', 'kaiju_scale', 'gods', 'serialized'],
  },
];

// ============================================================================
// DERIVED INDEX COMPUTATION
// ============================================================================

export interface DerivedIndex {
  id: string;
  name: string;
  description: string;
  score: number; // 0-100
  topContributors: string[]; // Top contributing trait names
}

/**
 * Compute derived indices from a trait profile
 */
export function computeDerivedIndices(profile: TraitProfile): DerivedIndex[] {
  // Build trait score lookup from all channels
  const traitScores = new Map<string, number>();
  for (const channel of Object.values(profile.channels)) {
    for (const trait of channel) {
      traitScores.set(trait.traitId, trait.normalizedScore);
    }
  }
  
  const indices: DerivedIndex[] = [];
  
  for (const indexDef of DERIVED_INDICES) {
    let totalScore = 0;
    let maxPossible = 0;
    const contributors: { name: string; score: number }[] = [];
    
    for (const traitId of indexDef.contributingTraits) {
      const score = traitScores.get(traitId) || 0;
      totalScore += score;
      maxPossible += 100;
      
      if (score > 20) {
        contributors.push({ name: traitId, score });
      }
    }
    
    // Normalize to 0-100
    const normalizedScore = maxPossible > 0 
      ? Math.round((totalScore / maxPossible) * 100)
      : 0;
    
    // Sort contributors by score
    contributors.sort((a, b) => b.score - a.score);
    
    indices.push({
      id: indexDef.id,
      name: indexDef.name,
      description: indexDef.description,
      score: normalizedScore,
      topContributors: contributors.slice(0, 3).map(c => c.name),
    });
  }
  
  // Sort by score descending
  indices.sort((a, b) => b.score - a.score);
  
  return indices;
}

// ============================================================================
// "YOU HAVE A TYPE" AUTO-DETECTION
// ============================================================================

export interface TasteType {
  id: string;
  name: string;
  description: string;
  matchScore: number; // 0-100
}

const TASTE_TYPES: Array<{
  id: string;
  name: string;
  description: string;
  requirements: { traitId: string; minScore: number }[];
  indices?: { indexId: string; minScore: number }[];
}> = [
  {
    id: 'systems_fantasy_addict',
    name: 'Systems Fantasy Addict',
    description: 'You love isekai, leveling, and watching numbers go up',
    requirements: [
      { traitId: 'isekai', minScore: 40 },
      { traitId: 'rpg_mechanics', minScore: 30 },
    ],
    indices: [{ indexId: 'systems_fantasy', minScore: 35 }],
  },
  {
    id: 'mindfuck_thriller_enjoyer',
    name: 'Mindfuck Thriller Enjoyer',
    description: 'You love being confused and then having your mind blown',
    requirements: [
      { traitId: 'psychological', minScore: 40 },
      { traitId: 'thriller', minScore: 30 },
    ],
    indices: [{ indexId: 'mindfuck_index', minScore: 35 }],
  },
  {
    id: 'found_family_emotional_damage',
    name: 'Found Family + Emotional Damage',
    description: 'You love found family stories that make you cry',
    requirements: [
      { traitId: 'found_family', minScore: 40 },
      { traitId: 'emotional_damage', minScore: 35 },
    ],
  },
  {
    id: 'cozy_detox_watcher',
    name: 'Cozy Slice-of-Life Detox',
    description: 'When life gets hard, you watch wholesome comfort content',
    requirements: [
      { traitId: 'slice_of_life', minScore: 40 },
    ],
    indices: [{ indexId: 'cozy_index', minScore: 40 }],
  },
  {
    id: 'politics_war_tactical_brain',
    name: 'Politics + War + Tactical Brain',
    description: 'You love strategic scheming and military conflicts',
    requirements: [
      { traitId: 'political', minScore: 30 },
      { traitId: 'war', minScore: 30 },
    ],
    indices: [{ indexId: 'strategy_brain', minScore: 35 }],
  },
  {
    id: 'dark_edge_lord',
    name: 'Certified Dark Content Enjoyer',
    description: 'You gravitate toward dark, intense, and disturbing content',
    requirements: [
      { traitId: 'dark', minScore: 40 },
    ],
    indices: [{ indexId: 'darkness_index', minScore: 40 }],
  },
  {
    id: 'romance_brain',
    name: 'Romance Brain',
    description: 'Romance is your primary content driver',
    requirements: [
      { traitId: 'romance', minScore: 50 },
    ],
    indices: [{ indexId: 'romance_core', minScore: 40 }],
  },
  {
    id: 'hype_action_junkie',
    name: 'Hype Action Junkie',
    description: 'You live for epic fights and tournament arcs',
    requirements: [
      { traitId: 'action', minScore: 50 },
      { traitId: 'hype', minScore: 35 },
    ],
    indices: [{ indexId: 'action_density', minScore: 40 }],
  },
  {
    id: 'sports_anime_supremacy',
    name: 'Sports Anime Supremacy',
    description: 'Training arcs and tournament hype are your lifeblood',
    requirements: [
      { traitId: 'sports', minScore: 50 },
      { traitId: 'training_loop', minScore: 30 },
    ],
  },
  {
    id: 'mystery_detective_obsessed',
    name: 'Mystery Detective Obsessed',
    description: 'You love solving puzzles alongside the characters',
    requirements: [
      { traitId: 'mystery', minScore: 45 },
      { traitId: 'investigation_loop', minScore: 30 },
    ],
  },
  {
    id: 'mecha_pilot',
    name: 'Giant Robot Enthusiast',
    description: 'You love mechas, giant robots, and pilots',
    requirements: [
      { traitId: 'mecha', minScore: 45 },
      { traitId: 'mecha_combat', minScore: 30 },
    ],
  },
  {
    id: 'horror_connoisseur',
    name: 'Horror Connoisseur',
    description: 'You actively seek out creepy and disturbing content',
    requirements: [
      { traitId: 'horror', minScore: 45 },
      { traitId: 'creepy', minScore: 30 },
    ],
  },
  {
    id: 'chaos_gremlin',
    name: 'Chaos Gremlin',
    description: 'You love absurd, chaotic, and surreal comedy',
    requirements: [
      { traitId: 'comedy', minScore: 40 },
    ],
    indices: [{ indexId: 'chaos_index', minScore: 35 }],
  },
];

/**
 * Detect user's taste types based on their trait profile and derived indices
 */
export function detectTasteTypes(
  profile: TraitProfile,
  derivedIndices: DerivedIndex[]
): TasteType[] {
  // Build trait score lookup
  const traitScores = new Map<string, number>();
  for (const channel of Object.values(profile.channels)) {
    for (const trait of channel) {
      traitScores.set(trait.traitId, trait.normalizedScore);
    }
  }
  
  // Build index score lookup
  const indexScores = new Map<string, number>();
  for (const index of derivedIndices) {
    indexScores.set(index.id, index.score);
  }
  
  const detectedTypes: TasteType[] = [];
  
  for (const typeDef of TASTE_TYPES) {
    let matchScore = 0;
    let totalRequirements = 0;
    let allRequirementsMet = true;
    
    // Check trait requirements
    for (const req of typeDef.requirements) {
      const score = traitScores.get(req.traitId) || 0;
      totalRequirements++;
      
      if (score >= req.minScore) {
        matchScore += score;
      } else {
        allRequirementsMet = false;
      }
    }
    
    // Check index requirements
    if (typeDef.indices) {
      for (const req of typeDef.indices) {
        const score = indexScores.get(req.indexId) || 0;
        totalRequirements++;
        
        if (score >= req.minScore) {
          matchScore += score;
        } else {
          allRequirementsMet = false;
        }
      }
    }
    
    if (allRequirementsMet && totalRequirements > 0) {
      detectedTypes.push({
        id: typeDef.id,
        name: typeDef.name,
        description: typeDef.description,
        matchScore: Math.round(matchScore / totalRequirements),
      });
    }
  }
  
  // Sort by match score descending
  detectedTypes.sort((a, b) => b.matchScore - a.matchScore);
  
  return detectedTypes;
}

// ============================================================================
// STRESS DIET COMPUTATION
// "You voluntarily ate 418 anxiety points this year"
// ============================================================================

export interface StressDiet {
  totalAnxietyPoints: number;
  totalEmotionalDamage: number;
  totalDarknessConsumed: number;
  topStressShows: string[]; // placeholder for actual show names
}

/**
 * Compute stress diet from trait profile
 * This is a placeholder - actual implementation needs media-level data
 */
export function computeStressDiet(profile: TraitProfile): StressDiet {
  const traitScores = new Map<string, number>();
  for (const channel of Object.values(profile.channels)) {
    for (const trait of channel) {
      traitScores.set(trait.traitId, trait.normalizedScore);
    }
  }
  
  return {
    totalAnxietyPoints: Math.round((traitScores.get('anxiety') || 0) * profile.totalMediaCount / 10),
    totalEmotionalDamage: Math.round((traitScores.get('emotional_damage') || 0) * profile.totalMediaCount / 10),
    totalDarknessConsumed: Math.round((traitScores.get('dark') || 0) * profile.totalMediaCount / 10),
    topStressShows: [], // Would need media-level data
  };
}

// ============================================================================
// COMFORT LOOP DETECTION
// "When you were burnt out you always returned to ____"
// ============================================================================

export interface ComfortLoop {
  primaryComfortTraits: string[];
  comfortIndex: number;
}

export function detectComfortLoop(profile: TraitProfile): ComfortLoop {
  const comfortTraits = ['wholesome', 'cozy', 'chill', 'warm', 'cute', 'slice_of_life', 'comfort_food'];
  const traitScores = new Map<string, number>();
  
  for (const channel of Object.values(profile.channels)) {
    for (const trait of channel) {
      traitScores.set(trait.traitId, trait.normalizedScore);
    }
  }
  
  const primaryComfortTraits = comfortTraits
    .filter(t => (traitScores.get(t) || 0) > 30)
    .sort((a, b) => (traitScores.get(b) || 0) - (traitScores.get(a) || 0))
    .slice(0, 3);
  
  const comfortIndex = comfortTraits.reduce((sum, t) => sum + (traitScores.get(t) || 0), 0) / comfortTraits.length;
  
  return {
    primaryComfortTraits,
    comfortIndex: Math.round(comfortIndex),
  };
}

// ============================================================================
// OPPOSITE-YOU RECOMMENDATIONS
// If you're Dark+Mindfuck: recommend Cozy+Warm+LowStakes
// ============================================================================

export interface OppositeRecommendation {
  reason: string;
  targetTraits: string[];
}

export function getOppositeRecommendations(profile: TraitProfile, derivedIndices: DerivedIndex[]): OppositeRecommendation[] {
  const recommendations: OppositeRecommendation[] = [];
  
  const indexScores = new Map<string, number>();
  for (const index of derivedIndices) {
    indexScores.set(index.id, index.score);
  }
  
  const darknessScore = indexScores.get('darkness_index') || 0;
  const cozyScore = indexScores.get('cozy_index') || 0;
  const mindfuckScore = indexScores.get('mindfuck_index') || 0;
  const actionScore = indexScores.get('action_density') || 0;
  
  // If high darkness, recommend cozy
  if (darknessScore > 40 && cozyScore < 30) {
    recommendations.push({
      reason: 'You watch a lot of dark content. Try some healing shows for balance.',
      targetTraits: ['wholesome', 'cozy', 'slice_of_life', 'warm'],
    });
  }
  
  // If high cozy, recommend some edge
  if (cozyScore > 50 && darknessScore < 20) {
    recommendations.push({
      reason: 'You mostly watch comfort content. Try something with more edge.',
      targetTraits: ['thriller', 'mystery', 'psychological'],
    });
  }
  
  // If high mindfuck, recommend simple
  if (mindfuckScore > 40) {
    recommendations.push({
      reason: 'You love complex narratives. Sometimes simple is refreshing.',
      targetTraits: ['episodic', 'slice_of_life', 'comedy'],
    });
  }
  
  // If high action, recommend slow
  if (actionScore > 50) {
    recommendations.push({
      reason: 'You love action. Try something slower-paced for variety.',
      targetTraits: ['slice_of_life', 'drama', 'romance'],
    });
  }
  
  return recommendations;
}
