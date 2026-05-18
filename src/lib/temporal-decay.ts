/**
 * TEMPORAL DECAY MODULE
 * 
 * Implements recency-aware scoring for taste profiles.
 * Based on research showing that recent preferences are more indicative
 * of current taste than older ones.
 * 
 * Key features:
 * - Exponential decay with configurable half-life
 * - Era-aware weighting (formative years matter more)
 * - Seasonal/yearly aggregation for trend detection
 * - Taste drift detection
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TemporalWeight {
  weight: number;           // 0-1 decay weight
  era: 'recent' | 'mid' | 'formative' | 'ancient';
  yearsAgo: number;
  decayFactor: number;      // Raw decay multiplier
  eraBoost: number;         // Boost for formative years
}

export interface TasteTrend {
  traitId: string;
  traitName: string;
  trend: 'rising' | 'stable' | 'declining';
  recentScore: number;      // Score from last 2 years
  historicalScore: number;  // Score from older content
  delta: number;            // recentScore - historicalScore
  confidence: number;       // How confident we are in this trend
}

export interface TemporalProfile {
  // Current taste (weighted by recency)
  currentTaste: Map<string, number>;
  
  // Historical taste (unweighted)
  historicalTaste: Map<string, number>;
  
  // Detected trends
  trends: TasteTrend[];
  
  // Era breakdown
  eraDistribution: {
    recent: number;         // % of library from last 2 years
    mid: number;            // % from 2-5 years ago
    formative: number;      // % from 5-10 years ago
    ancient: number;        // % from 10+ years ago
  };
  
  // Taste evolution insights
  insights: TemporalInsight[];
}

export interface TemporalInsight {
  type: 'evolution' | 'rediscovery' | 'abandoned' | 'consistent';
  title: string;
  description: string;
  traits: string[];
}

// ============================================================================
// DECAY CONFIGURATION
// ============================================================================

export interface DecayConfig {
  halfLifeYears: number;    // Years until weight = 0.5 (default: 3)
  formativeBoost: number;   // Multiplier for formative years (default: 1.3)
  minimumWeight: number;    // Floor for very old content (default: 0.1)
  formativeStart: number;   // Years ago formative era starts (default: 5)
  formativeEnd: number;     // Years ago formative era ends (default: 10)
}

const DEFAULT_CONFIG: DecayConfig = {
  halfLifeYears: 3,
  formativeBoost: 1.3,
  minimumWeight: 0.1,
  formativeStart: 5,
  formativeEnd: 10,
};

// ============================================================================
// CORE DECAY FUNCTIONS
// ============================================================================

/**
 * Calculate temporal weight for a media entry based on when it was consumed
 * 
 * Uses exponential decay: weight = (0.5)^(yearsAgo / halfLife)
 * With special handling for "formative years" which often shape core taste
 */
export function calculateTemporalWeight(
  consumedDate: Date | string | number,
  config: Partial<DecayConfig> = {}
): TemporalWeight {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const now = new Date();
  
  // Parse the date
  let date: Date;
  if (typeof consumedDate === 'number') {
    // Assume it's a year
    date = new Date(consumedDate, 6, 1); // Mid-year
  } else if (typeof consumedDate === 'string') {
    date = new Date(consumedDate);
  } else {
    date = consumedDate;
  }
  
  // Calculate years ago
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const yearsAgo = (now.getTime() - date.getTime()) / msPerYear;
  
  // Determine era
  let era: TemporalWeight['era'];
  if (yearsAgo <= 2) {
    era = 'recent';
  } else if (yearsAgo <= cfg.formativeStart) {
    era = 'mid';
  } else if (yearsAgo <= cfg.formativeEnd) {
    era = 'formative';
  } else {
    era = 'ancient';
  }
  
  // Calculate base decay (exponential)
  const decayFactor = Math.pow(0.5, yearsAgo / cfg.halfLifeYears);
  
  // Apply era boost for formative years
  const eraBoost = era === 'formative' ? cfg.formativeBoost : 1.0;
  
  // Calculate final weight with floor
  const rawWeight = decayFactor * eraBoost;
  const weight = Math.max(cfg.minimumWeight, Math.min(1, rawWeight));
  
  return {
    weight,
    era,
    yearsAgo: Math.round(yearsAgo * 10) / 10,
    decayFactor: Math.round(decayFactor * 100) / 100,
    eraBoost,
  };
}

/**
 * Get the year a media entry was likely consumed
 * Uses completedAt if available, falls back to updatedAt or startedAt
 */
export function getConsumptionYear(entry: {
  completedAt?: { year?: number; month?: number; day?: number } | null;
  updatedAt?: number;
  startedAt?: { year?: number; month?: number; day?: number } | null;
}): number | null {
  // Prefer completedAt
  if (entry.completedAt?.year) {
    return entry.completedAt.year;
  }
  
  // Fall back to updatedAt (Unix timestamp in seconds)
  if (entry.updatedAt) {
    return new Date(entry.updatedAt * 1000).getFullYear();
  }
  
  // Fall back to startedAt
  if (entry.startedAt?.year) {
    return entry.startedAt.year;
  }
  
  return null;
}

// ============================================================================
// TREND DETECTION
// ============================================================================

/**
 * Detect taste trends by comparing recent vs historical preferences
 */
export function detectTasteTrends(
  recentScores: Map<string, { score: number; count: number }>,
  historicalScores: Map<string, { score: number; count: number }>,
  traitNames: Map<string, string>
): TasteTrend[] {
  const trends: TasteTrend[] = [];
  
  // Get all traits present in either period
  const allTraits = new Set([...recentScores.keys(), ...historicalScores.keys()]);
  
  for (const traitId of allTraits) {
    const recent = recentScores.get(traitId);
    const historical = historicalScores.get(traitId);
    
    // Skip if not enough data in at least one period
    if (!recent && !historical) continue;
    
    const recentScore = recent?.score || 0;
    const historicalScore = historical?.score || 0;
    const delta = recentScore - historicalScore;
    
    // Calculate confidence based on sample sizes
    const recentCount = recent?.count || 0;
    const historicalCount = historical?.count || 0;
    const minCount = Math.min(recentCount, historicalCount);
    const confidence = Math.min(minCount / 10, 1);
    
    // Only report if delta is significant and we have confidence
    if (Math.abs(delta) < 10 || confidence < 0.3) continue;
    
    // Determine trend direction
    let trend: TasteTrend['trend'];
    if (delta > 15) {
      trend = 'rising';
    } else if (delta < -15) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }
    
    trends.push({
      traitId,
      traitName: traitNames.get(traitId) || traitId,
      trend,
      recentScore: Math.round(recentScore),
      historicalScore: Math.round(historicalScore),
      delta: Math.round(delta),
      confidence: Math.round(confidence * 100) / 100,
    });
  }
  
  // Sort by absolute delta (most significant changes first)
  trends.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  
  return trends;
}

// ============================================================================
// TEMPORAL INSIGHTS
// ============================================================================

/**
 * Generate insights about taste evolution over time
 */
export function generateTemporalInsights(trends: TasteTrend[]): TemporalInsight[] {
  const insights: TemporalInsight[] = [];
  
  // Find rising traits (evolution)
  const risingTraits = trends.filter(t => t.trend === 'rising' && t.confidence >= 0.5);
  if (risingTraits.length > 0) {
    insights.push({
      type: 'evolution',
      title: 'Your taste is evolving',
      description: `You've been gravitating more toward ${risingTraits.slice(0, 3).map(t => t.traitName).join(', ')} recently`,
      traits: risingTraits.map(t => t.traitId),
    });
  }
  
  // Find declining traits (abandoned)
  const decliningTraits = trends.filter(t => t.trend === 'declining' && t.confidence >= 0.5);
  if (decliningTraits.length > 0) {
    insights.push({
      type: 'abandoned',
      title: 'Moving away from',
      description: `You've been watching less ${decliningTraits.slice(0, 3).map(t => t.traitName).join(', ')} lately`,
      traits: decliningTraits.map(t => t.traitId),
    });
  }
  
  // Find stable core traits (consistent)
  const stableTraits = trends.filter(t => t.trend === 'stable' && t.recentScore >= 60);
  if (stableTraits.length > 0) {
    insights.push({
      type: 'consistent',
      title: 'Core taste remains stable',
      description: `Your love for ${stableTraits.slice(0, 3).map(t => t.traitName).join(', ')} has stayed consistent`,
      traits: stableTraits.map(t => t.traitId),
    });
  }
  
  return insights;
}

// ============================================================================
// WEIGHTED SCORING
// ============================================================================

/**
 * Apply temporal decay to trait scores
 * Returns both current (decayed) and historical (raw) scores
 */
export function applyTemporalDecay<T extends { year?: number }>(
  entries: T[],
  getScore: (entry: T) => Map<string, number>,
  config: Partial<DecayConfig> = {}
): {
  currentScores: Map<string, number>;
  historicalScores: Map<string, number>;
  weights: Map<string, TemporalWeight>;
} {
  const currentScores = new Map<string, number>();
  const historicalScores = new Map<string, number>();
  const traitWeightSums = new Map<string, number>();
  
  for (const entry of entries) {
    const year = entry.year || new Date().getFullYear();
    const weight = calculateTemporalWeight(year, config);
    
    const scores = getScore(entry);
    for (const [traitId, score] of scores) {
      // Historical (unweighted)
      const prevHistorical = historicalScores.get(traitId) || 0;
      historicalScores.set(traitId, prevHistorical + score);
      
      // Current (weighted)
      const prevCurrent = currentScores.get(traitId) || 0;
      currentScores.set(traitId, prevCurrent + score * weight.weight);
      
      // Track weight sums for normalization
      const prevWeightSum = traitWeightSums.get(traitId) || 0;
      traitWeightSums.set(traitId, prevWeightSum + weight.weight);
    }
  }
  
  // Normalize current scores by weight sum (weighted average of raw scores)
  for (const [traitId, score] of currentScores) {
    const weightSum = traitWeightSums.get(traitId) || 1;
    currentScores.set(traitId, score / weightSum);
  }
  
  return {
    currentScores,
    historicalScores,
    weights: new Map(), // Individual weights would need to be tracked differently
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate era distribution for a list of entries
 */
export function calculateEraDistribution(
  years: number[],
  config: Partial<DecayConfig> = {}
): TemporalProfile['eraDistribution'] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const now = new Date().getFullYear();
  
  let recent = 0, mid = 0, formative = 0, ancient = 0;
  
  for (const year of years) {
    const yearsAgo = now - year;
    if (yearsAgo <= 2) recent++;
    else if (yearsAgo <= cfg.formativeStart) mid++;
    else if (yearsAgo <= cfg.formativeEnd) formative++;
    else ancient++;
  }
  
  const total = years.length || 1;
  return {
    recent: Math.round((recent / total) * 100),
    mid: Math.round((mid / total) * 100),
    formative: Math.round((formative / total) * 100),
    ancient: Math.round((ancient / total) * 100),
  };
}
