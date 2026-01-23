/**
 * TASTE EVOLUTION - Track how user taste changes over time
 * 
 * Features:
 * - Monthly snapshots of top traits and indices
 * - Delta calculation for "trending" indicators
 * - Evolution narratives like "comfort era" or "dark phase"
 */

import type { TraitProfile, TraitScore, ChannelScores } from './trait-scoring-engine';
import type { DerivedIndex, TasteType } from './derived-traits';

// ============================================================================
// TYPES
// ============================================================================

export interface TasteSnapshot {
  id: string;
  userId: string;
  timestamp: Date;
  month: string; // YYYY-MM format for easy grouping
  
  // Top traits by channel
  topIdentity: SnapshotTrait[];
  topVibe: SnapshotTrait[];
  topStructure: SnapshotTrait[];
  topIntensity: SnapshotTrait[];
  
  // Key derived indices
  derivedIndices: SnapshotIndex[];
  
  // Detected taste types at this time
  tasteTypes: string[];
  
  // Profile metadata
  totalMediaCount: number;
  contradictionHeat: number;
  personalityLabel: string;
}

export interface SnapshotTrait {
  traitId: string;
  name: string;
  score: number;
}

export interface SnapshotIndex {
  id: string;
  name: string;
  score: number;
}

export interface TasteDelta {
  traitId: string;
  name: string;
  previousScore: number;
  currentScore: number;
  delta: number; // positive = increased, negative = decreased
  direction: 'up' | 'down' | 'stable';
  significance: 'minor' | 'notable' | 'major'; // based on delta magnitude
}

export interface TasteEvolution {
  currentSnapshot: TasteSnapshot;
  previousSnapshot?: TasteSnapshot;
  
  // Changes since last snapshot
  traitDeltas: TasteDelta[];
  indexDeltas: TasteDelta[];
  
  // High-level evolution narrative
  trendingUp: string[];   // Traits increasing significantly
  trendingDown: string[]; // Traits decreasing significantly
  newTraits: string[];    // New top traits not present before
  lostTraits: string[];   // Former top traits now absent
  
  // Evolution phase detection
  currentPhase?: EvolutionPhase;
  narrative: string;
}

export interface EvolutionPhase {
  id: string;
  name: string;
  description: string;
  startMonth: string;
  traits: string[];
}

// ============================================================================
// SNAPSHOT CREATION
// ============================================================================

/**
 * Create a snapshot from a trait profile
 */
export function createSnapshot(
  userId: string,
  profile: TraitProfile,
  derivedIndices: DerivedIndex[],
  tasteTypes: TasteType[],
  contradictionHeat: number,
  personalityLabel: string
): TasteSnapshot {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const extractTopTraits = (channel: TraitScore[], limit: number = 5): SnapshotTrait[] => {
    return channel
      .filter(t => t.normalizedScore > 20)
      .slice(0, limit)
      .map(t => ({
        traitId: t.traitId,
        name: t.name,
        score: t.normalizedScore,
      }));
  };
  
  return {
    id: `${userId}-${month}`,
    userId,
    timestamp: now,
    month,
    topIdentity: extractTopTraits(profile.channels.identity),
    topVibe: extractTopTraits(profile.channels.vibe),
    topStructure: extractTopTraits(profile.channels.structure),
    topIntensity: extractTopTraits(profile.channels.intensity),
    derivedIndices: derivedIndices.slice(0, 10).map(i => ({
      id: i.id,
      name: i.name,
      score: i.score,
    })),
    tasteTypes: tasteTypes.slice(0, 5).map(t => t.id),
    totalMediaCount: profile.totalMediaCount,
    contradictionHeat,
    personalityLabel,
  };
}

// ============================================================================
// DELTA CALCULATION
// ============================================================================

/**
 * Calculate deltas between two snapshots
 */
export function calculateDeltas(
  current: TasteSnapshot,
  previous: TasteSnapshot
): { traitDeltas: TasteDelta[]; indexDeltas: TasteDelta[] } {
  const traitDeltas: TasteDelta[] = [];
  const indexDeltas: TasteDelta[] = [];
  
  // Build previous trait lookup
  const prevTraitScores = new Map<string, { name: string; score: number }>();
  for (const trait of [...previous.topIdentity, ...previous.topVibe, ...previous.topStructure, ...previous.topIntensity]) {
    prevTraitScores.set(trait.traitId, { name: trait.name, score: trait.score });
  }
  
  // Calculate trait deltas
  for (const trait of [...current.topIdentity, ...current.topVibe, ...current.topStructure, ...current.topIntensity]) {
    const prev = prevTraitScores.get(trait.traitId);
    const previousScore = prev?.score || 0;
    const delta = trait.score - previousScore;
    
    traitDeltas.push({
      traitId: trait.traitId,
      name: trait.name,
      previousScore,
      currentScore: trait.score,
      delta,
      direction: delta > 3 ? 'up' : delta < -3 ? 'down' : 'stable',
      significance: getSignificance(Math.abs(delta)),
    });
  }
  
  // Build previous index lookup
  const prevIndexScores = new Map<string, number>();
  for (const index of previous.derivedIndices) {
    prevIndexScores.set(index.id, index.score);
  }
  
  // Calculate index deltas
  for (const index of current.derivedIndices) {
    const previousScore = prevIndexScores.get(index.id) || 0;
    const delta = index.score - previousScore;
    
    indexDeltas.push({
      traitId: index.id,
      name: index.name,
      previousScore,
      currentScore: index.score,
      delta,
      direction: delta > 5 ? 'up' : delta < -5 ? 'down' : 'stable',
      significance: getSignificance(Math.abs(delta)),
    });
  }
  
  // Sort by absolute delta magnitude
  traitDeltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  indexDeltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  
  return { traitDeltas, indexDeltas };
}

function getSignificance(absDelta: number): TasteDelta['significance'] {
  if (absDelta >= 15) return 'major';
  if (absDelta >= 8) return 'notable';
  return 'minor';
}

// ============================================================================
// EVOLUTION ANALYSIS
// ============================================================================

/**
 * Analyze taste evolution between current and previous snapshot
 */
export function analyzeEvolution(
  current: TasteSnapshot,
  previous?: TasteSnapshot
): TasteEvolution {
  if (!previous) {
    return {
      currentSnapshot: current,
      traitDeltas: [],
      indexDeltas: [],
      trendingUp: [],
      trendingDown: [],
      newTraits: [],
      lostTraits: [],
      narrative: 'Taste drift begins today. Check back next month to see how you evolve.',
    };
  }
  
  const { traitDeltas, indexDeltas } = calculateDeltas(current, previous);
  
  // Find trending traits
  const trendingUp = traitDeltas
    .filter(d => d.direction === 'up' && d.significance !== 'minor')
    .slice(0, 3)
    .map(d => d.name);
  
  const trendingDown = traitDeltas
    .filter(d => d.direction === 'down' && d.significance !== 'minor')
    .slice(0, 3)
    .map(d => d.name);
  
  // Find new and lost traits
  const prevTraitIds = new Set([
    ...previous.topIdentity.map(t => t.traitId),
    ...previous.topVibe.map(t => t.traitId),
  ]);
  const currentTraitIds = new Set([
    ...current.topIdentity.map(t => t.traitId),
    ...current.topVibe.map(t => t.traitId),
  ]);
  
  const newTraits = [...currentTraitIds]
    .filter(id => !prevTraitIds.has(id))
    .slice(0, 3);
  const lostTraits = [...prevTraitIds]
    .filter(id => !currentTraitIds.has(id))
    .slice(0, 3);
  
  // Detect current phase
  const currentPhase = detectEvolutionPhase(current, traitDeltas, indexDeltas);
  
  // Generate narrative
  const narrative = generateEvolutionNarrative(trendingUp, trendingDown, indexDeltas, currentPhase);
  
  return {
    currentSnapshot: current,
    previousSnapshot: previous,
    traitDeltas,
    indexDeltas,
    trendingUp,
    trendingDown,
    newTraits,
    lostTraits,
    currentPhase,
    narrative,
  };
}

/**
 * Detect if user is in a particular taste "phase" based on trends
 */
function detectEvolutionPhase(
  current: TasteSnapshot,
  traitDeltas: TasteDelta[],
  indexDeltas: TasteDelta[]
): EvolutionPhase | undefined {
  // Check for comfort era
  const comfortDelta = indexDeltas.find(d => d.traitId === 'comfort_density' || d.traitId === 'cozy_index');
  if (comfortDelta && comfortDelta.delta > 10) {
    return {
      id: 'comfort_era',
      name: 'Comfort Era',
      description: 'You\'re gravitating toward cozy, low-stakes content',
      startMonth: current.month,
      traits: ['cozy', 'wholesome', 'slice_of_life'],
    };
  }
  
  // Check for dark phase
  const darknessDelta = indexDeltas.find(d => d.traitId === 'darkness_index');
  if (darknessDelta && darknessDelta.delta > 10) {
    return {
      id: 'dark_phase',
      name: 'Dark Phase',
      description: 'You\'re exploring darker, more intense content',
      startMonth: current.month,
      traits: ['dark', 'psychological', 'thriller'],
    };
  }
  
  // Check for romance arc
  const romanceDelta = indexDeltas.find(d => d.traitId === 'romantic_voltage' || d.traitId === 'romance_core');
  if (romanceDelta && romanceDelta.delta > 10) {
    return {
      id: 'romance_arc',
      name: 'Romance Arc',
      description: 'You\'re in a romance-heavy viewing phase',
      startMonth: current.month,
      traits: ['romance', 'slow_burn', 'emotional'],
    };
  }
  
  // Check for complexity phase
  const complexityDelta = indexDeltas.find(d => d.traitId === 'cognitive_complexity' || d.traitId === 'mindfuck_index');
  if (complexityDelta && complexityDelta.delta > 10) {
    return {
      id: 'complexity_phase',
      name: 'Brain Food Phase',
      description: 'You\'re seeking complex, thought-provoking content',
      startMonth: current.month,
      traits: ['psychological', 'nonlinear', 'mystery'],
    };
  }
  
  return undefined;
}

/**
 * Generate human-readable evolution narrative
 */
function generateEvolutionNarrative(
  trendingUp: string[],
  trendingDown: string[],
  indexDeltas: TasteDelta[],
  phase?: EvolutionPhase
): string {
  const parts: string[] = [];
  
  // Phase-based narrative
  if (phase) {
    parts.push(`You're entering a ${phase.name.toLowerCase()}.`);
  }
  
  // Trending traits
  if (trendingUp.length > 0) {
    parts.push(`Trending up: ${trendingUp.join(', ')}.`);
  }
  
  if (trendingDown.length > 0) {
    parts.push(`Cooling off: ${trendingDown.join(', ')}.`);
  }
  
  // Notable index changes
  const majorChanges = indexDeltas.filter(d => d.significance === 'major');
  if (majorChanges.length > 0) {
    const change = majorChanges[0];
    const verb = change.delta > 0 ? 'increased' : 'decreased';
    parts.push(`Your ${change.name} ${verb} by ${Math.abs(change.delta)} points.`);
  }
  
  if (parts.length === 0) {
    return 'Your taste has been relatively stable this month.';
  }
  
  return parts.join(' ');
}

// ============================================================================
// STORAGE INTERFACE (for Supabase integration)
// ============================================================================

export interface TasteSnapshotStorage {
  save(snapshot: TasteSnapshot): Promise<void>;
  getLatest(userId: string): Promise<TasteSnapshot | null>;
  getByMonth(userId: string, month: string): Promise<TasteSnapshot | null>;
  getHistory(userId: string, limit?: number): Promise<TasteSnapshot[]>;
}

/**
 * Serialize snapshot for storage (converts Date to ISO string)
 */
export function serializeSnapshot(snapshot: TasteSnapshot): Record<string, unknown> {
  return {
    ...snapshot,
    timestamp: snapshot.timestamp.toISOString(),
  };
}

/**
 * Deserialize snapshot from storage
 */
export function deserializeSnapshot(data: Record<string, unknown>): TasteSnapshot {
  return {
    ...data,
    timestamp: new Date(data.timestamp as string),
  } as TasteSnapshot;
}
