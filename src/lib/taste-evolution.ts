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

// ============================================================================
// TASTE STABILITY INDEX
// Measures how consistent core identity traits are over time
// ============================================================================

export interface TasteStabilityResult {
  stabilityIndex: number;        // 0-100, higher = more stable
  stabilityLabel: StabilityLabel;
  coreTraitStability: number;    // Identity channel stability
  vibeStability: number;         // Vibe channel stability
  overallVolatility: number;     // How much traits change in general
  analysis: string;              // Human-readable summary
}

export type StabilityLabel = 
  | 'Bedrock Identity'    // 90-100: Core traits never shift
  | 'Stable Foundation'   // 70-89: Minor fluctuations only
  | 'Evolving Taste'      // 50-69: Notable changes over time
  | 'Fluid Explorer'      // 30-49: Significant shifts
  | 'Chameleon Viewer';   // 0-29: Constantly changing

/**
 * Calculate Taste Stability Index from snapshot history
 * Compares core identity traits across multiple snapshots
 * 
 * @param snapshots - Historical snapshots, newest first
 * @param minSnapshots - Minimum snapshots needed for valid calculation
 */
export function calculateTasteStability(
  snapshots: TasteSnapshot[],
  minSnapshots: number = 3
): TasteStabilityResult | null {
  if (snapshots.length < minSnapshots) {
    return null; // Not enough history
  }
  
  // Compare each snapshot to the one before it
  const traitStabilityScores: number[] = [];
  const vibeStabilityScores: number[] = [];
  
  for (let i = 0; i < snapshots.length - 1; i++) {
    const current = snapshots[i];
    const previous = snapshots[i + 1];
    
    // Calculate identity trait stability
    const identityStability = calculateChannelStability(
      current.topIdentity,
      previous.topIdentity
    );
    traitStabilityScores.push(identityStability);
    
    // Calculate vibe stability
    const vibeStability = calculateChannelStability(
      current.topVibe,
      previous.topVibe
    );
    vibeStabilityScores.push(vibeStability);
  }
  
  // Average stability across all comparisons
  const avgIdentityStability = traitStabilityScores.reduce((a, b) => a + b, 0) / traitStabilityScores.length;
  const avgVibeStability = vibeStabilityScores.reduce((a, b) => a + b, 0) / vibeStabilityScores.length;
  
  // Weight identity traits more heavily (they're "who you are")
  const stabilityIndex = Math.round(avgIdentityStability * 0.6 + avgVibeStability * 0.4);
  
  // Calculate overall volatility (inverse of stability)
  const overallVolatility = 100 - stabilityIndex;
  
  // Determine label
  const stabilityLabel = getStabilityLabel(stabilityIndex);
  
  // Generate analysis
  const analysis = generateStabilityAnalysis(
    stabilityIndex,
    avgIdentityStability,
    avgVibeStability,
    snapshots.length
  );
  
  return {
    stabilityIndex,
    stabilityLabel,
    coreTraitStability: Math.round(avgIdentityStability),
    vibeStability: Math.round(avgVibeStability),
    overallVolatility: Math.round(overallVolatility),
    analysis,
  };
}

/**
 * Calculate stability between two sets of traits
 * Returns 0-100 where 100 = identical, 0 = completely different
 */
function calculateChannelStability(
  current: SnapshotTrait[],
  previous: SnapshotTrait[]
): number {
  if (current.length === 0 && previous.length === 0) return 100;
  if (current.length === 0 || previous.length === 0) return 0;
  
  const currentSet = new Set(current.map(t => t.traitId));
  const previousSet = new Set(previous.map(t => t.traitId));
  
  // Jaccard similarity for trait presence
  const intersection = [...currentSet].filter(t => previousSet.has(t)).length;
  const union = new Set([...currentSet, ...previousSet]).size;
  const presenceStability = (intersection / union) * 100;
  
  // Score delta for shared traits
  let scoreDeltaSum = 0;
  let sharedCount = 0;
  
  const previousScoreMap = new Map(previous.map(t => [t.traitId, t.score]));
  for (const trait of current) {
    const prevScore = previousScoreMap.get(trait.traitId);
    if (prevScore !== undefined) {
      const delta = Math.abs(trait.score - prevScore);
      // Max delta is ~100, normalize to 0-1 where 0 = no change
      scoreDeltaSum += delta / 100;
      sharedCount++;
    }
  }
  
  const scoreStability = sharedCount > 0 
    ? (1 - scoreDeltaSum / sharedCount) * 100 
    : presenceStability;
  
  // Combine presence and score stability
  return presenceStability * 0.6 + scoreStability * 0.4;
}

function getStabilityLabel(index: number): StabilityLabel {
  if (index >= 90) return 'Bedrock Identity';
  if (index >= 70) return 'Stable Foundation';
  if (index >= 50) return 'Evolving Taste';
  if (index >= 30) return 'Fluid Explorer';
  return 'Chameleon Viewer';
}

function generateStabilityAnalysis(
  stabilityIndex: number,
  identityStability: number,
  vibeStability: number,
  snapshotCount: number
): string {
  const monthsAnalyzed = snapshotCount - 1;
  
  if (stabilityIndex >= 90) {
    return `Your core taste has been remarkably consistent over ${monthsAnalyzed} months. You know exactly what you like.`;
  } else if (stabilityIndex >= 70) {
    if (identityStability > vibeStability + 15) {
      return `Your genre preferences are rock-solid, but your mood preferences shift based on life circumstances.`;
    }
    return `Your taste has a stable core with healthy exploration around the edges. A balanced viewer.`;
  } else if (stabilityIndex >= 50) {
    if (vibeStability > identityStability + 15) {
      return `Your emotional preferences are consistent, but you're actively exploring different genres and styles.`;
    }
    return `Your taste is evolving! You're discovering new preferences while maintaining some core favorites.`;
  } else if (stabilityIndex >= 30) {
    return `You're a taste explorer - your preferences shift significantly over time. Each month brings new favorites.`;
  } else {
    return `Your taste is highly fluid - you're either early in your journey or genuinely enjoy variety above all else.`;
  }
}
