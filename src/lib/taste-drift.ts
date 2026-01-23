/**
 * TASTE DRIFT
 * 
 * Track how a user's taste evolves over time by storing
 * and comparing genome snapshots.
 * 
 * Features:
 * - Save genome snapshots periodically
 * - Calculate drift between snapshots
 * - Identify "eras" in taste evolution
 * - Generate drift narratives ("You entered your psychological era")
 */

import { TasteGenome, GenomeDimension } from './taste-genome';
import { createClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface GenomeSnapshot {
  id: string;
  anilistId: number;
  mediaType: 'ANIME' | 'MANGA';
  
  vector: number[];
  tagBuckets: number[];
  dominantTraits: string[];
  
  entropy: number;
  uniquenessScore: number;
  
  dimSummary: Record<string, number>;
  
  genomeVersion: string;
  listHash?: string;
  entryCount?: number;
  
  createdAt: Date;
}

export interface DriftDimension {
  name: string;
  oldValue: number;
  newValue: number;
  delta: number;
  percentChange: number;
  direction: 'up' | 'down' | 'stable';
  category: 'genre' | 'tag' | 'emotional' | 'structural' | 'behavioral';
}

export interface TasteDrift {
  fromDate: Date;
  toDate: Date;
  daysElapsed: number;
  
  // Overall drift magnitude
  overallDrift: number;  // 0-1 how much total change
  driftLabel: string;    // "Minimal", "Notable", "Significant", "Major Shift"
  
  // Top changes
  biggestGains: DriftDimension[];   // Dimensions that increased most
  biggestDrops: DriftDimension[];   // Dimensions that decreased most
  
  // Era detection
  currentEra: TasteEra;
  previousEra?: TasteEra;
  eraChanged: boolean;
  
  // Narrative
  narrative: string;     // "Your taste moved +18% darker"
  highlights: string[];  // Key changes in human-readable form
}

export interface TasteEra {
  name: string;           // e.g., "Psychological Era", "Action Phase"
  primaryTrait: string;   // Dominant trait defining this era
  secondaryTrait: string;
  startDate: Date;
  confidence: number;     // 0-1 how strongly this era is defined
}

export interface DriftTimeline {
  snapshots: GenomeSnapshot[];
  drifts: TasteDrift[];
  eras: TasteEra[];
  
  // Overall trends
  overallTrends: Array<{
    dimension: string;
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    correlation: number;  // -1 to 1
  }>;
}

// ============================================
// DIMENSION METADATA
// ============================================

const DIMENSION_METADATA: Record<string, { category: GenomeDimension['category']; friendlyName: string }> = {
  // Genres
  'Action': { category: 'genre', friendlyName: 'Action' },
  'Adventure': { category: 'genre', friendlyName: 'Adventure' },
  'Comedy': { category: 'genre', friendlyName: 'Comedy' },
  'Drama': { category: 'genre', friendlyName: 'Drama' },
  'Fantasy': { category: 'genre', friendlyName: 'Fantasy' },
  'Horror': { category: 'genre', friendlyName: 'Horror' },
  'Mystery': { category: 'genre', friendlyName: 'Mystery' },
  'Psychological': { category: 'genre', friendlyName: 'Psychological' },
  'Romance': { category: 'genre', friendlyName: 'Romance' },
  'Sci-Fi': { category: 'genre', friendlyName: 'Sci-Fi' },
  'Slice of Life': { category: 'genre', friendlyName: 'Slice of Life' },
  'Sports': { category: 'genre', friendlyName: 'Sports' },
  'Supernatural': { category: 'genre', friendlyName: 'Supernatural' },
  'Thriller': { category: 'genre', friendlyName: 'Thriller' },
  'Mecha': { category: 'genre', friendlyName: 'Mecha' },
  
  // Tags
  'Dark': { category: 'tag', friendlyName: 'Dark themes' },
  'Gore': { category: 'tag', friendlyName: 'Gore' },
  'Isekai': { category: 'tag', friendlyName: 'Isekai' },
  'Time Travel': { category: 'tag', friendlyName: 'Time Travel' },
  'Tragedy': { category: 'tag', friendlyName: 'Tragedy' },
  
  // Emotional
  'escapism': { category: 'emotional', friendlyName: 'Escapism' },
  'bleakness': { category: 'emotional', friendlyName: 'Bleakness' },
  'idealism': { category: 'emotional', friendlyName: 'Idealism' },
  'intensity': { category: 'emotional', friendlyName: 'Intensity' },
  'sentimentality': { category: 'emotional', friendlyName: 'Sentimentality' },
  
  // Structural
  'episodicVsSerial': { category: 'structural', friendlyName: 'Serial preference' },
  'pacingPreference': { category: 'structural', friendlyName: 'Fast pacing' },
  'plotVsCharacter': { category: 'structural', friendlyName: 'Plot focus' },
  'complexityPreference': { category: 'structural', friendlyName: 'Complexity' },
  
  // Behavioral
  'completionRate': { category: 'behavioral', friendlyName: 'Completion rate' },
  'nicheIndex': { category: 'behavioral', friendlyName: 'Niche preference' },
  'diversityIndex': { category: 'behavioral', friendlyName: 'Diversity' },
  'experimentalIndex': { category: 'behavioral', friendlyName: 'Experimental' },
  'mainstreamIndex': { category: 'behavioral', friendlyName: 'Mainstream' },
  'chaosLevel': { category: 'behavioral', friendlyName: 'Chaos level' },
};

// ============================================
// SNAPSHOT CREATION
// ============================================

/**
 * Create a dimension summary from a genome for storage
 * Only stores key dimensions to avoid huge JSONB
 */
export function createDimSummary(genome: TasteGenome): Record<string, number> {
  const summary: Record<string, number> = {};
  
  // Store all dimensions with significant values
  for (const dim of genome.dimensions) {
    if (dim.contribution > 0.1 || dim.value > 0.3) {
      summary[dim.name] = Math.round(dim.value * 1000) / 1000;
    }
  }
  
  // Always include key metrics
  summary['entropy'] = Math.round(genome.entropy * 1000) / 1000;
  summary['uniqueness'] = Math.round(genome.uniquenessScore * 1000) / 1000;
  
  return summary;
}

/**
 * Convert genome to snapshot format for storage
 */
export function genomeToSnapshot(
  genome: TasteGenome,
  anilistId: number,
  mediaType: 'ANIME' | 'MANGA',
  listHash?: string,
  entryCount?: number
): Omit<GenomeSnapshot, 'id' | 'createdAt'> {
  return {
    anilistId,
    mediaType,
    vector: genome.vector,
    tagBuckets: genome.tagBuckets,
    dominantTraits: genome.dominantTraits,
    entropy: genome.entropy,
    uniquenessScore: genome.uniquenessScore,
    dimSummary: createDimSummary(genome),
    genomeVersion: genome.version,
    listHash,
    entryCount
  };
}

// ============================================
// DRIFT CALCULATION
// ============================================

/**
 * Calculate drift between two snapshots
 */
export function calculateDrift(
  older: GenomeSnapshot,
  newer: GenomeSnapshot
): TasteDrift {
  const daysElapsed = Math.floor(
    (newer.createdAt.getTime() - older.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Calculate dimension-level changes
  const changes: DriftDimension[] = [];
  const allDims = new Set([
    ...Object.keys(older.dimSummary),
    ...Object.keys(newer.dimSummary)
  ]);
  
  for (const dimName of allDims) {
    if (dimName === 'entropy' || dimName === 'uniqueness') continue;
    
    const oldValue = older.dimSummary[dimName] || 0;
    const newValue = newer.dimSummary[dimName] || 0;
    const delta = newValue - oldValue;
    
    if (Math.abs(delta) > 0.03) { // Threshold for meaningful change
      const meta = DIMENSION_METADATA[dimName];
      changes.push({
        name: dimName,
        oldValue,
        newValue,
        delta,
        percentChange: oldValue > 0 ? (delta / oldValue) * 100 : delta * 100,
        direction: delta > 0.02 ? 'up' : delta < -0.02 ? 'down' : 'stable',
        category: meta?.category || 'genre'
      });
    }
  }
  
  // Sort by absolute delta
  changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  
  const biggestGains = changes.filter(c => c.direction === 'up').slice(0, 5);
  const biggestDrops = changes.filter(c => c.direction === 'down').slice(0, 5);
  
  // Calculate overall drift magnitude
  const totalDelta = changes.reduce((sum, c) => sum + Math.abs(c.delta), 0);
  const overallDrift = Math.min(1, totalDelta / 3); // Normalize
  
  const driftLabel = 
    overallDrift < 0.1 ? 'Minimal' :
    overallDrift < 0.25 ? 'Notable' :
    overallDrift < 0.5 ? 'Significant' :
    'Major Shift';
  
  // Detect eras
  const currentEra = detectEra(newer);
  const previousEra = detectEra(older);
  const eraChanged = currentEra.name !== previousEra.name;
  
  // Generate narrative
  const narrative = generateNarrative(biggestGains, biggestDrops, overallDrift);
  const highlights = generateHighlights(biggestGains, biggestDrops, currentEra, eraChanged);
  
  return {
    fromDate: older.createdAt,
    toDate: newer.createdAt,
    daysElapsed,
    overallDrift,
    driftLabel,
    biggestGains,
    biggestDrops,
    currentEra,
    previousEra,
    eraChanged,
    narrative,
    highlights
  };
}

/**
 * Detect the "era" of a snapshot based on dominant traits
 */
function detectEra(snapshot: GenomeSnapshot): TasteEra {
  const traits = snapshot.dominantTraits;
  const primary = traits[0] || 'Unknown';
  const secondary = traits[1] || 'Unknown';
  
  // Generate era name based on primary trait
  const eraNames: Record<string, string> = {
    'Psychological': 'Psychological Era',
    'Dark': 'Dark Phase',
    'Action': 'Action Arc',
    'Romance': 'Romance Era',
    'Comedy': 'Comedy Phase',
    'Drama': 'Drama Era',
    'Horror': 'Horror Phase',
    'Sci-Fi': 'Sci-Fi Exploration',
    'Fantasy': 'Fantasy Phase',
    'Slice of Life': 'Slice of Life Era',
    'nicheIndex': 'Underground Phase',
    'mainstreamIndex': 'Mainstream Era',
    'chaosLevel': 'Chaos Era',
    'escapism': 'Escapism Phase',
    'bleakness': 'Existential Era',
    'intensity': 'Intensity Phase',
  };
  
  const name = eraNames[primary] || `${primary} Phase`;
  
  // Confidence based on how dominant the primary trait is
  const confidence = snapshot.dimSummary[primary] || 0.5;
  
  return {
    name,
    primaryTrait: primary,
    secondaryTrait: secondary,
    startDate: snapshot.createdAt,
    confidence
  };
}

/**
 * Generate a narrative string describing the drift
 */
function generateNarrative(
  gains: DriftDimension[],
  drops: DriftDimension[],
  overallDrift: number
): string {
  if (overallDrift < 0.05) {
    return "Your taste has been remarkably consistent.";
  }
  
  const parts: string[] = [];
  
  // Top gain
  if (gains.length > 0) {
    const top = gains[0];
    const meta = DIMENSION_METADATA[top.name];
    const friendly = meta?.friendlyName || top.name;
    const percent = Math.round(Math.abs(top.delta) * 100);
    parts.push(`+${percent}% ${friendly.toLowerCase()}`);
  }
  
  // Top drop
  if (drops.length > 0) {
    const top = drops[0];
    const meta = DIMENSION_METADATA[top.name];
    const friendly = meta?.friendlyName || top.name;
    const percent = Math.round(Math.abs(top.delta) * 100);
    parts.push(`-${percent}% ${friendly.toLowerCase()}`);
  }
  
  if (parts.length === 0) {
    return "Your taste evolved subtly.";
  }
  
  return `Your taste moved ${parts.join(', ')}.`;
}

/**
 * Generate highlight strings for the drift
 */
function generateHighlights(
  gains: DriftDimension[],
  drops: DriftDimension[],
  currentEra: TasteEra,
  eraChanged: boolean
): string[] {
  const highlights: string[] = [];
  
  if (eraChanged) {
    highlights.push(`You entered your ${currentEra.name}`);
  }
  
  // Significant gains
  for (const gain of gains.slice(0, 2)) {
    if (Math.abs(gain.delta) > 0.1) {
      const meta = DIMENSION_METADATA[gain.name];
      const friendly = meta?.friendlyName || gain.name;
      highlights.push(`${friendly} preference increased significantly`);
    }
  }
  
  // Significant drops
  for (const drop of drops.slice(0, 2)) {
    if (Math.abs(drop.delta) > 0.1) {
      const meta = DIMENSION_METADATA[drop.name];
      const friendly = meta?.friendlyName || drop.name;
      highlights.push(`${friendly} interest decreased`);
    }
  }
  
  return highlights;
}

// ============================================
// TIMELINE ANALYSIS
// ============================================

/**
 * Build a complete drift timeline from snapshots
 */
export function buildDriftTimeline(snapshots: GenomeSnapshot[]): DriftTimeline {
  // Sort oldest to newest
  const sorted = [...snapshots].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  
  const drifts: TasteDrift[] = [];
  const eras: TasteEra[] = [];
  let currentEra: TasteEra | null = null;
  
  for (let i = 1; i < sorted.length; i++) {
    const drift = calculateDrift(sorted[i - 1], sorted[i]);
    drifts.push(drift);
    
    // Track era changes
    if (drift.eraChanged || !currentEra) {
      currentEra = drift.currentEra;
      eras.push(currentEra);
    }
  }
  
  // Calculate overall trends
  const overallTrends = calculateTrends(sorted);
  
  return {
    snapshots: sorted,
    drifts,
    eras,
    overallTrends
  };
}

/**
 * Calculate long-term trends for each dimension
 */
function calculateTrends(
  snapshots: GenomeSnapshot[]
): DriftTimeline['overallTrends'] {
  if (snapshots.length < 3) return [];
  
  const trends: DriftTimeline['overallTrends'] = [];
  
  // Get all dimension names
  const allDims = new Set<string>();
  for (const s of snapshots) {
    Object.keys(s.dimSummary).forEach(d => {
      if (d !== 'entropy' && d !== 'uniqueness') {
        allDims.add(d);
      }
    });
  }
  
  for (const dim of allDims) {
    const values = snapshots.map(s => s.dimSummary[dim] || 0);
    
    // Calculate simple linear correlation with time
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = values[i] - yMean;
      numerator += xDiff * yDiff;
      denomX += xDiff * xDiff;
      denomY += yDiff * yDiff;
    }
    
    const correlation = denomX > 0 && denomY > 0 
      ? numerator / Math.sqrt(denomX * denomY)
      : 0;
    
    // Determine trend
    const volatility = Math.sqrt(denomY / n);
    let trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    
    if (volatility > 0.15) {
      trend = 'volatile';
    } else if (correlation > 0.3) {
      trend = 'increasing';
    } else if (correlation < -0.3) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }
    
    if (Math.abs(correlation) > 0.2 || volatility > 0.1) {
      trends.push({ dimension: dim, trend, correlation });
    }
  }
  
  // Sort by absolute correlation
  trends.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  
  return trends.slice(0, 10);
}

// ============================================
// EXPORTS
// ============================================

export default {
  createDimSummary,
  genomeToSnapshot,
  calculateDrift,
  buildDriftTimeline
};
