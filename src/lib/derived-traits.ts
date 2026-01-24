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
  // ============================================================================
  // SPLIT: Darkness Index → Horror Darkness + Violence Darkness
  // ============================================================================
  {
    id: 'horror_darkness',
    name: 'Horror Darkness',
    description: 'Fear, dread, and psychological horror affinity',
    contributingTraits: ['horror', 'creepy', 'disturbing', 'paranoid', 'psychological', 'existential_dread', 'dark', 'grim'],
  },
  {
    id: 'violence_darkness',
    name: 'Violence Darkness',
    description: 'Gore, brutality, and violent content affinity',
    contributingTraits: ['gore_level', 'torture', 'violence_level', 'body_horror', 'abuse_themes', 'bullying', 'humiliation', 'despair'],
  },
  // Legacy combined index for backward compatibility
  {
    id: 'darkness_index',
    name: 'Darkness Index',
    description: 'Overall dark and intense content affinity',
    contributingTraits: ['horror', 'gore_level', 'torture', 'suicide_themes', 'abuse_themes', 'war', 'crime', 'dark', 'grim', 'tragic', 'violence_level', 'psychological_abuse'],
  },
  
  // ============================================================================
  // SPLIT: Mindfuck Index → Cognitive Complexity + Reality Warp
  // ============================================================================
  {
    id: 'cognitive_complexity',
    name: 'Cognitive Complexity',
    description: 'Love for complex, puzzle-like narratives',
    contributingTraits: ['nonlinear', 'time_loop', 'time_travel', 'multiple_timelines', 'achronological', 'mystery_box', 'investigation_loop', 'psychological_warfare'],
  },
  {
    id: 'reality_warp',
    name: 'Reality Warp',
    description: 'Affinity for surreal, reality-bending content',
    contributingTraits: ['denpa', 'meta', 'absurd', 'unreliable_narrator', 'memory_manipulation', 'parallel_worlds', 'fourth_wall', 'abstract_symbolism'],
  },
  // Legacy combined index for backward compatibility
  {
    id: 'mindfuck_index',
    name: 'Mindfuck Index',
    description: 'Love for mind-bending narratives',
    contributingTraits: ['mindfuck', 'nonlinear', 'time_loop', 'time_travel', 'meta', 'denpa', 'unreliable_narrator', 'psychological', 'memory_manipulation', 'parallel_worlds', 'achronological'],
  },
  
  // ============================================================================
  // ORIGINAL INDICES (kept)
  // ============================================================================
  {
    id: 'cozy_index',
    name: 'Cozy Index',
    description: 'Your comfort content affinity',
    contributingTraits: ['wholesome', 'cozy', 'chill', 'warm', 'cute', 'slice_of_life', 'comfort_food', 'food_world', 'modern_rural', 'hopeful'],
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
    contributingTraits: ['magic_system', 'rpg_mechanics', 'skill_trees', 'cultivation_power', 'isekai', 'training_loop', 'monster_taming'],
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
  
  // ============================================================================
  // NEW INDICES (ChatGPT suggestions)
  // ============================================================================
  {
    id: 'comfort_density',
    name: 'Comfort Density',
    description: 'Cozy content relative to total viewing - "comfort era" detection',
    contributingTraits: ['cozy', 'wholesome', 'warm', 'chill', 'comfort_food', 'slice_of_life'],
  },
  {
    id: 'tension_appetite',
    name: 'Tension Appetite',
    description: 'Affinity for suspense and psychological pressure',
    contributingTraits: ['tense', 'paranoid', 'thriller', 'psychological', 'anxiety', 'survival', 'death_game_engine'],
  },
  {
    id: 'romantic_voltage',
    name: 'Romantic Voltage',
    description: 'Intensity of romantic content preferences',
    contributingTraits: ['romance', 'romantic_vibes', 'love_triangle', 'forbidden_romance', 'enemies_to_lovers', 'slow_burn', 'drama'],
  },
  {
    id: 'wonder_index',
    name: 'Wonder Index',
    description: 'Affinity for awe, exploration, and magical worlds',
    contributingTraits: ['awe', 'fantasy', 'adventure', 'quest_engine', 'fantasy_medieval', 'alien_planet', 'space_setting'],
  },
  {
    id: 'absurdism_quotient',
    name: 'Absurdism Quotient',
    description: 'Love for surreal, absurd, and meta humor',
    contributingTraits: ['absurd', 'parody', 'surreal_comedy', 'meta_comedy', 'chaotic', 'satirical', 'meta'],
  },
  {
    id: 'cruelty_index',
    name: 'Cruelty Index',
    description: 'Exposure to cruel, suffering-focused content',
    contributingTraits: ['torture', 'abuse_themes', 'bullying', 'humiliation', 'despair', 'psychological_abuse'],
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

export interface TasteTypeDriver {
  traitId: string;
  traitName: string;
  score: number;
}

export interface TasteType {
  id: string;
  name: string;
  description: string;
  matchScore: number; // 0-100, dampened by confidence
  confidence?: number; // 0-1, based on sample size
  drivers: TasteTypeDriver[]; // Top 3 traits that triggered this type
  summary: string; // 1-sentence explanation
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
 * Calculate confidence multiplier based on sample size
 * This dampens CLAIMS (type detection, contradictions) not raw trait scores
 * Users still see their trait values, but type/claim confidence scales with data
 */
function calculateConfidenceMultiplier(sampleSize: number): number {
  // Smooth curve: 0 at 0, ~0.5 at 15, ~0.8 at 30, 1.0 at 50+
  if (sampleSize >= 50) return 1.0;
  return Math.pow(sampleSize / 50, 0.6); // Smooth power curve
}

/**
 * Detect user's taste types based on their trait profile and derived indices
 * Now includes driver attribution with top 3 traits and 1-sentence summary
 * 
 * @param sampleSize - Total media count, used for confidence dampening on matchScore
 */
export function detectTasteTypes(
  profile: TraitProfile,
  derivedIndices: DerivedIndex[],
  sampleSize?: number
): TasteType[] {
  const confidenceMultiplier = calculateConfidenceMultiplier(sampleSize ?? profile.totalMediaCount);
  // Build trait score lookup with names
  const traitScores = new Map<string, number>();
  const traitNames = new Map<string, string>();
  for (const channel of Object.values(profile.channels)) {
    for (const trait of channel) {
      traitScores.set(trait.traitId, trait.normalizedScore);
      traitNames.set(trait.traitId, trait.name);
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
    const drivers: TasteTypeDriver[] = [];
    
    // Check trait requirements and collect drivers
    for (const req of typeDef.requirements) {
      const score = traitScores.get(req.traitId) || 0;
      totalRequirements++;
      
      if (score >= req.minScore) {
        matchScore += score;
        drivers.push({
          traitId: req.traitId,
          traitName: traitNames.get(req.traitId) || req.traitId.replace(/_/g, ' '),
          score: Math.round(score),
        });
      } else {
        allRequirementsMet = false;
      }
    }
    
    // Check index requirements and add to drivers
    if (typeDef.indices) {
      for (const req of typeDef.indices) {
        const score = indexScores.get(req.indexId) || 0;
        totalRequirements++;
        
        if (score >= req.minScore) {
          matchScore += score;
          drivers.push({
            traitId: req.indexId,
            traitName: req.indexId.replace(/_/g, ' '),
            score: Math.round(score),
          });
        } else {
          allRequirementsMet = false;
        }
      }
    }
    
    if (allRequirementsMet && totalRequirements > 0) {
      // Sort drivers by score and take top 3
      drivers.sort((a, b) => b.score - a.score);
      const topDrivers = drivers.slice(0, 3);
      
      // Generate summary sentence
      const driverList = topDrivers.map(d => `${d.traitName} (${d.score})`).join(', ');
      const summary = `Driven by: ${driverList}`;
      
      // Apply confidence dampening to matchScore (affects claims, not raw values)
      const rawMatchScore = matchScore / totalRequirements;
      const dampenedMatchScore = Math.round(rawMatchScore * confidenceMultiplier);
      
      detectedTypes.push({
        id: typeDef.id,
        name: typeDef.name,
        description: typeDef.description,
        matchScore: dampenedMatchScore,
        confidence: confidenceMultiplier, // Track confidence for UI
        drivers: topDrivers,
        summary,
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

// ============================================================================
// CONTRADICTION ENGINE
// Detects interesting contradictions in taste profile
// ============================================================================

export type ContradictionType = 'tonal' | 'preference' | 'structural';

export interface Contradiction {
  type: ContradictionType;
  name: string;
  description: string;
  severity: number; // 0-100, how strong the contradiction is
  traits: { high: string[]; low?: string[] };
  // Resolved explanation - what this contradiction MEANS about the user
  flavorType?: ContradictionFlavor;
  resolvedExplanation?: string;
}

/**
 * Flavor types explain WHY someone has this contradiction
 */
export type ContradictionFlavor = 
  | 'palate_cleanser'    // Uses one to recover from the other
  | 'dual_mode'          // Has two distinct viewing modes
  | 'comfort_through'    // Finds comfort IN the contrast (e.g., comfort through fear)
  | 'aesthetic_only'     // Likes the aesthetic, not the intensity
  | 'genre_agnostic'     // Doesn't care about genre, cares about execution
  | 'mood_dependent'     // Watches based on current mood
  | 'context_switch'     // Completely separates these as different activities
  | 'hidden_depth'       // Uses light content to process heavy content
  | 'thrill_seeker';     // Loves the emotional rollercoaster

/**
 * Flavor definitions with detection logic and explanations
 */
interface FlavorDefinition {
  id: ContradictionFlavor;
  name: string;
  triggers: {
    contradictionIds: string[];        // Which contradictions this applies to
    requiredTraits?: string[];         // Additional traits that must be present
    intensityThreshold?: number;       // Min severity to consider
  };
  explanationTemplate: string;         // Template with {high} and {low} placeholders
}

const CONTRADICTION_FLAVORS: FlavorDefinition[] = [
  {
    id: 'palate_cleanser',
    name: 'Palate Cleanser',
    triggers: { 
      contradictionIds: ['cozy_horror', 'chill_tense', 'cute_dark'],
      intensityThreshold: 40,
    },
    explanationTemplate: 'You likely use {high} content to decompress after intense {low} sessions. The contrast is intentional self-care.',
  },
  {
    id: 'comfort_through',
    name: 'Comfort Through Contrast',
    triggers: { 
      contradictionIds: ['cozy_horror'],
      requiredTraits: ['horror', 'psychological'],
    },
    explanationTemplate: 'You find comfort IN fear itself. Horror provides a safe way to experience controlled anxiety, while cozy content grounds you.',
  },
  {
    id: 'dual_mode',
    name: 'Dual Mode Viewer',
    triggers: { 
      contradictionIds: ['romance_gore', 'absurd_tragic'],
      intensityThreshold: 50,
    },
    explanationTemplate: 'You have two distinct viewing personalities: one that craves {high}, another that needs {low}. Both are authentically you.',
  },
  {
    id: 'aesthetic_only',
    name: 'Aesthetic Appreciator',
    triggers: { 
      contradictionIds: ['cute_dark', 'romance_gore'],
      requiredTraits: ['artistic', 'visual_storytelling'],
    },
    explanationTemplate: 'You appreciate the AESTHETIC of {low} content without necessarily seeking its full intensity. Visual storytelling matters more than shock value.',
  },
  {
    id: 'mood_dependent',
    name: 'Mood-Based Viewer',
    triggers: { 
      contradictionIds: ['chill_tense', 'absurd_tragic', 'cozy_horror'],
      intensityThreshold: 30,
    },
    explanationTemplate: 'Your viewing choices are strongly mood-dependent. Sometimes you need {high}, sometimes {low} - and you trust your instincts.',
  },
  {
    id: 'thrill_seeker',
    name: 'Emotional Thrill Seeker',
    triggers: { 
      contradictionIds: ['absurd_tragic', 'romance_gore'],
      requiredTraits: ['emotional_damage', 'catharsis'],
    },
    explanationTemplate: 'You seek emotional extremes. The contrast between {high} and {low} creates a richer emotional experience than either alone.',
  },
  {
    id: 'hidden_depth',
    name: 'Hidden Depth Processor',
    triggers: { 
      contradictionIds: ['cute_dark', 'cozy_horror'],
      requiredTraits: ['psychological', 'character_study'],
    },
    explanationTemplate: 'Light content helps you process heavy themes. Your {high} watching might be how you digest the weight of {low}.',
  },
];

// Tonal contradiction pairs (watching both extremes)
const TONAL_CONTRADICTION_PAIRS: Array<{
  id: string;
  name: string;
  description: string;
  highTraits: string[];
  lowTraits: string[];
  threshold: number;
}> = [
  {
    id: 'cozy_horror',
    name: 'Cozy Horror Fan',
    description: 'You watch both wholesome comfort AND disturbing horror',
    highTraits: ['cozy', 'wholesome', 'warm'],
    lowTraits: ['horror', 'creepy', 'disturbing'],
    threshold: 30,
  },
  {
    id: 'romance_gore',
    name: 'Romance + Gore',
    description: 'You enjoy both romantic content AND violent gore',
    highTraits: ['romance', 'romantic_vibes', 'slow_burn'],
    lowTraits: ['gore_level', 'violence_level', 'torture'],
    threshold: 30,
  },
  {
    id: 'absurd_tragic',
    name: 'Absurd + Tragic',
    description: 'You appreciate both absurd comedy AND deep tragedy',
    highTraits: ['absurd', 'chaotic', 'parody'],
    lowTraits: ['tragic', 'emotional_damage', 'tearjerker'],
    threshold: 25,
  },
  {
    id: 'chill_tense',
    name: 'Chill + Tense',
    description: 'You watch both low-stakes chill content AND high-tension thrillers',
    highTraits: ['chill', 'cozy', 'slice_of_life'],
    lowTraits: ['tense', 'thriller', 'paranoid'],
    threshold: 30,
  },
  {
    id: 'cute_dark',
    name: 'Cute + Dark',
    description: 'You enjoy both cute/moe content AND dark themes',
    highTraits: ['cute', 'wholesome', 'warm'],
    lowTraits: ['dark', 'grim', 'edgy'],
    threshold: 30,
  },
  {
    id: 'simple_complex',
    name: 'Simple + Complex',
    description: 'You watch both episodic comfort AND complex narratives',
    highTraits: ['episodic', 'sol_routine', 'chill'],
    lowTraits: ['nonlinear', 'mindfuck', 'psychological'],
    threshold: 25,
  },
];

/**
 * Resolve the flavor type for a contradiction based on user's trait profile
 * Returns the best-matching flavor with explanation
 */
function resolveContradictionFlavor(
  contradictionId: string,
  severity: number,
  highTraitsLabel: string,
  lowTraitsLabel: string,
  traitScores: Map<string, number>
): { flavorType: ContradictionFlavor; resolvedExplanation: string } | undefined {
  // Find matching flavors for this contradiction
  const matchingFlavors = CONTRADICTION_FLAVORS.filter(flavor => {
    // Must match contradiction ID
    if (!flavor.triggers.contradictionIds.includes(contradictionId)) return false;
    
    // Check intensity threshold
    if (flavor.triggers.intensityThreshold && severity < flavor.triggers.intensityThreshold) return false;
    
    // Check required traits
    if (flavor.triggers.requiredTraits) {
      const hasRequiredTraits = flavor.triggers.requiredTraits.some(t => (traitScores.get(t) || 0) > 30);
      if (!hasRequiredTraits) return false;
    }
    
    return true;
  });
  
  if (matchingFlavors.length === 0) return undefined;
  
  // Pick the most specific flavor (one with most requirements)
  const bestFlavor = matchingFlavors.reduce((best, current) => {
    const bestScore = (best.triggers.requiredTraits?.length || 0) + (best.triggers.intensityThreshold || 0) / 100;
    const currentScore = (current.triggers.requiredTraits?.length || 0) + (current.triggers.intensityThreshold || 0) / 100;
    return currentScore > bestScore ? current : best;
  });
  
  // Generate explanation from template
  const explanation = bestFlavor.explanationTemplate
    .replace('{high}', highTraitsLabel)
    .replace('{low}', lowTraitsLabel);
  
  return {
    flavorType: bestFlavor.id,
    resolvedExplanation: explanation,
  };
}

/**
 * Detect tonal contradictions - when user watches polar opposite vibes
 * Now includes flavor resolution for meaningful explanations
 */
export function detectTonalContradictions(profile: TraitProfile): Contradiction[] {
  const contradictions: Contradiction[] = [];
  
  const traitScores = new Map<string, number>();
  for (const channel of Object.values(profile.channels)) {
    for (const trait of channel) {
      traitScores.set(trait.traitId, trait.normalizedScore);
    }
  }
  
  for (const pair of TONAL_CONTRADICTION_PAIRS) {
    // Calculate average score for both sides
    const highAvg = pair.highTraits.reduce((sum, t) => sum + (traitScores.get(t) || 0), 0) / pair.highTraits.length;
    const lowAvg = pair.lowTraits.reduce((sum, t) => sum + (traitScores.get(t) || 0), 0) / pair.lowTraits.length;
    
    // Both sides must be above threshold
    if (highAvg >= pair.threshold && lowAvg >= pair.threshold) {
      const severity = Math.round((highAvg + lowAvg) / 2);
      
      // Get active traits for labels
      const activeHigh = pair.highTraits.filter(t => (traitScores.get(t) || 0) >= pair.threshold);
      const activeLow = pair.lowTraits.filter(t => (traitScores.get(t) || 0) >= pair.threshold);
      
      // Resolve flavor for this contradiction
      const flavor = resolveContradictionFlavor(
        pair.id,
        severity,
        activeHigh[0] || 'light',
        activeLow[0] || 'dark',
        traitScores
      );
      
      contradictions.push({
        type: 'tonal',
        name: pair.name,
        description: pair.description,
        severity,
        traits: {
          high: activeHigh,
          low: activeLow,
        },
        flavorType: flavor?.flavorType,
        resolvedExplanation: flavor?.resolvedExplanation,
      });
    }
  }
  
  // Sort by severity
  contradictions.sort((a, b) => b.severity - a.severity);
  return contradictions;
}

// Preference mismatch: traits you see often but don't rate highly
export interface PreferenceMismatch extends Contradiction {
  exposureScore: number;  // How much you see it (before engagement weighting)
  enjoymentScore: number; // How much you like it (after engagement weighting)
  mismatchRatio: number;  // exposure / enjoyment
}

// Traits to track for preference mismatch detection
const PREFERENCE_MISMATCH_TRAITS = [
  'fanservice', 'ecchi', 'harem', 'isekai', 'action', 'romance',
  'psychological', 'thriller', 'gore_level', 'violence_level',
  'battle_shounen', 'slice_of_life', 'mecha', 'sports',
];

// Mechanic traits for structural contradictions
const STRUCTURAL_MISMATCH_TRAITS = [
  'nonlinear', 'episodic', 'slow_burn', 'dense_worldbuilding',
  'complex_plot', 'simple_plot', 'time_loop', 'mystery',
];

/**
 * Detect preference mismatches - traits you see often but don't rate highly
 * Requires exposure/enjoyment score pairs from separate scoring passes
 */
export function detectPreferenceMismatches(
  exposureScores: Map<string, number>,  // Scores without engagement weighting
  enjoymentScores: Map<string, number>   // Scores with engagement weighting
): PreferenceMismatch[] {
  const mismatches: PreferenceMismatch[] = [];
  
  for (const traitId of PREFERENCE_MISMATCH_TRAITS) {
    const exposure = exposureScores.get(traitId) || 0;
    const enjoyment = enjoymentScores.get(traitId) || 0;
    
    // Mismatch: high exposure but low enjoyment
    if (exposure >= 40 && enjoyment < exposure * 0.6) {
      const mismatchRatio = exposure / Math.max(enjoyment, 1);
      mismatches.push({
        type: 'preference',
        name: `${traitId.replace(/_/g, ' ')} Mismatch`,
        description: `You encounter ${traitId.replace(/_/g, ' ')} often, but consistently rate it lower`,
        severity: Math.round((exposure - enjoyment) * 0.8),
        traits: { high: [traitId] },
        exposureScore: Math.round(exposure),
        enjoymentScore: Math.round(enjoyment),
        mismatchRatio: Math.round(mismatchRatio * 10) / 10,
      });
    }
  }
  
  // Sort by severity (biggest mismatches first)
  mismatches.sort((a, b) => b.severity - a.severity);
  return mismatches.slice(0, 5); // Top 5 mismatches
}

/**
 * Detect structural contradictions - complex vs simple, respect vs enjoy
 * Same method as preference but focused on mechanic/structure traits
 */
export function detectStructuralContradictions(
  exposureScores: Map<string, number>,
  enjoymentScores: Map<string, number>
): Contradiction[] {
  const contradictions: Contradiction[] = [];
  
  // Check for "tries complex but rates simple higher"
  const complexExposure = ['nonlinear', 'complex_plot', 'dense_worldbuilding', 'time_loop']
    .reduce((sum, t) => sum + (exposureScores.get(t) || 0), 0) / 4;
  const complexEnjoyment = ['nonlinear', 'complex_plot', 'dense_worldbuilding', 'time_loop']
    .reduce((sum, t) => sum + (enjoymentScores.get(t) || 0), 0) / 4;
  
  const simpleExposure = ['episodic', 'simple_plot', 'slice_of_life']
    .reduce((sum, t) => sum + (exposureScores.get(t) || 0), 0) / 3;
  const simpleEnjoyment = ['episodic', 'simple_plot', 'slice_of_life']
    .reduce((sum, t) => sum + (enjoymentScores.get(t) || 0), 0) / 3;
  
  // Tries complex but enjoys simple more
  if (complexExposure > 30 && simpleEnjoyment > complexEnjoyment + 15) {
    contradictions.push({
      type: 'structural',
      name: 'Complexity Mismatch',
      description: 'You try complex narratives, but your ratings peak on simpler pacing',
      severity: Math.round(complexExposure - complexEnjoyment + simpleEnjoyment - simpleExposure),
      traits: { 
        high: ['nonlinear', 'complex_plot'],
        low: ['episodic', 'simple_plot'],
      },
    });
  }
  
  // Opposite: tolerates slow pacing better than most
  const slowExposure = (exposureScores.get('slow_burn') || 0);
  const slowEnjoyment = (enjoymentScores.get('slow_burn') || 0);
  
  if (slowExposure > 25 && slowEnjoyment > slowExposure * 1.1) {
    contradictions.push({
      type: 'structural',
      name: 'Patience Virtue',
      description: 'You tolerate slower pacing better than most people',
      severity: Math.round(slowEnjoyment - slowExposure),
      traits: { high: ['slow_burn'] },
    });
  }
  
  return contradictions;
}

/**
 * Detect all contradictions (tonal, preference, structural)
 * Returns a comprehensive contradiction analysis
 */
export function detectAllContradictions(
  profile: TraitProfile,
  derivedIndices: DerivedIndex[],
  exposureScores?: Map<string, number>,
  enjoymentScores?: Map<string, number>
): {
  tonal: Contradiction[];
  preference: PreferenceMismatch[];
  structural: Contradiction[];
  summary: string;
  contradictionHeat: number; // 0-100, overall contradiction level
  personalityLabel: string;  // Human-readable contradiction personality
} {
  const tonalContradictions = detectTonalContradictions(profile);
  
  // Preference and structural contradictions require exposure/enjoyment data
  const preferenceContradictions = exposureScores && enjoymentScores
    ? detectPreferenceMismatches(exposureScores, enjoymentScores)
    : [];
  const structuralContradictions = exposureScores && enjoymentScores
    ? detectStructuralContradictions(exposureScores, enjoymentScores)
    : [];
  
  // Calculate contradiction heat (how contradictory the profile is overall)
  const allContradictions = [...tonalContradictions, ...preferenceContradictions, ...structuralContradictions];
  const totalSeverity = allContradictions.reduce((sum, c) => sum + c.severity, 0);
  const avgSeverity = allContradictions.length > 0 ? totalSeverity / allContradictions.length : 0;
  const contradictionHeat = Math.min(100, Math.round(avgSeverity + allContradictions.length * 8));
  
  // Map heat to personality label
  const personalityLabel = getContradictionPersonality(contradictionHeat);
  
  // Generate summary based on findings
  let summary = 'No significant contradictions detected';
  if (allContradictions.length > 0) {
    const topContradiction = allContradictions.sort((a, b) => b.severity - a.severity)[0];
    if (allContradictions.length === 1) {
      summary = `Your taste has one interesting contradiction: ${topContradiction.name}`;
    } else {
      summary = `You're a ${personalityLabel} watcher with ${allContradictions.length} contradictions. Most notable: ${topContradiction.name}`;
    }
  } else {
    summary = `You're a ${personalityLabel} watcher with consistent taste patterns.`;
  }
  
  return {
    tonal: tonalContradictions,
    preference: preferenceContradictions,
    structural: structuralContradictions,
    summary,
    contradictionHeat,
    personalityLabel,
  };
}

/**
 * Convert contradiction heat to a personality label
 * 0-20: Stable Taste, 21-45: Dual Range, 46-70: Chaotic Palette, 71-100: Contradiction Engine
 */
function getContradictionPersonality(heat: number): string {
  if (heat <= 20) return 'Stable Taste';
  if (heat <= 45) return 'Dual Range';
  if (heat <= 70) return 'Chaotic Palette';
  return 'Contradiction Engine';
}

// ============================================================================
// TASTE TYPE MUTUAL EXCLUSIVITY RESOLUTION
// Prevents overlapping types from all firing at once
// ============================================================================

/**
 * Resolve overlapping taste types - cap at top 3 and suppress overlapping ones
 */
export function resolveOverlappingTypes(types: TasteType[], maxTypes: number = 3): TasteType[] {
  if (types.length <= maxTypes) return types;
  
  // Already sorted by matchScore, take top N
  const selected = types.slice(0, maxTypes);
  
  // Could add Jaccard similarity check here to further suppress overlapping types
  // For now, just return top N
  return selected;
}
