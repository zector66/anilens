/**
 * Hot Takes Analyzer
 * 
 * Calculates how "contrarian" a user's ratings are compared to global AniList averages.
 * Weights by popularity so dunking on famous shows matters more.
 */

import { MediaListEntry } from '@/types/anilist';

export interface HotTake {
  mediaId: number;
  title: string;
  coverImage?: string;
  userScore: number;       // User's score (1-10)
  globalScore: number;     // AniList average (1-10 scale)
  delta: number;           // userScore - globalScore
  popularity: number;      // AniList popularity metric
  heat: number;            // Heat score (0-100) - how spicy this take is
  heatLabel: 'nuclear' | 'spicy' | 'hot' | 'warm' | 'mild'; // Heat tier
  direction: 'overrated' | 'underrated' | 'consensus'; // User's stance vs global
  ratingBand: 'beloved' | 'well-liked' | 'mixed' | 'disliked' | 'bad'; // AniList rating band
  ratingBandLabel: string; // Human-readable context
  crowdCategory: 'mainstream' | 'popular' | 'known' | 'niche'; // Crowd size category
}

export interface HotTakesProfile {
  /** Hot Take Energy (0-100) - overall contrarian score */
  hotTakeEnergy: number;
  /** Label for the Hot Take Energy level */
  hotTakeEnergyLabel: string;
  /** Tendency: positive = generous rater, negative = harsh critic */
  tendency: number;
  /** Tendency label */
  tendencyLabel: string;
  /** Top 5 Most Contrarian Picks (either direction, highest heat) */
  mostContrarianPicks: HotTake[];
  /** Shows user thinks are overrated (only if global ≥7.0, user rated lower) */
  overratedTakes: HotTake[];
  /** Shows user thinks are underrated (user rated higher) */
  underratedTakes: HotTake[];
  /** Hot Takes by crowd category */
  hotTakesByCategory: {
    mainstream: HotTake[];  // 200k+ popularity - TRUE hot takes
    popular: HotTake[];     // 100k-200k - contrarian picks
    known: HotTake[];       // 50k-100k - meaningful disagreements
    niche: HotTake[];       // <50k - fun differences
  };
  /** Stats breakdown */
  stats: {
    avgDelta: number;
    totalScored: number;
    qualifiedTakes: number; // Takes with heat >= 20
  };
  /** Planning procrastination stats */
  procrastination: {
    index: number;         // 0-100
    label: string;
    planningCount: number;
    totalCount: number;
    ratio: number;
  };
}

/**
 * Calculate popularity confidence using sigmoid curve (0-1)
 * Updated to normalize around mainstream shows (~300k popularity)
 * P = 10k → low confidence (~0.1)
 * P = 100k → decent confidence (~0.4)  
 * P = 300k → high confidence (~0.8) - Solo Leveling range
 * P = 500k+ → very high confidence (~0.9+)
 */
function calculatePopularityConfidence(popularity: number): number {
  const logP = Math.log10(Math.max(1, popularity));
  // Normalize around 4.5-5.5 range (31k to 316k) so mainstream hits hard
  const normalized = (logP - 4.5) / 1.0; // 4.5 ≈ 31k, 5.5 ≈ 316k
  const clamped = Math.max(0, Math.min(1, normalized)); // Clamp to 0-1
  return clamped;
}

/**
 * Calculate heat score for a take (0-100)
 * Formula: 100 * disagreement * confidence * qualityGate
 * 
 * - disagreement: min(1, abs(Δ) / 5) - Δ of 5 points = max heat
 * - confidence: sigmoid based on popularity
 * - qualityGate: 1.0 if overrated AND global >= 7.0, else 0.35 for non-qualified overrated
 */
function calculateHeat(
  delta: number, 
  popularity: number, 
  globalScore: number,
  direction: 'overrated' | 'underrated' | 'consensus'
): number {
  // Step 1: Disagreement magnitude (0-1, capped at Δ=5)
  const disagreement = Math.min(1, Math.abs(delta) / 5);
  
  // Step 2: Popularity confidence (sigmoid curve)
  const confidence = calculatePopularityConfidence(popularity);
  
  // Step 3: Quality gate for overrated
  // Only full credit if it's "overrated" AND community actually likes it (>=7.0)
  // Underrated always gets full credit (disagreeing upward is always valid)
  let qualityGate = 1.0;
  if (direction === 'overrated' && globalScore < 7.0) {
    qualityGate = 0.35; // Heavily discounted - community already dislikes it
  }
  
  // Step 4: Compute heat (0-100)
  const heat = 100 * disagreement * confidence * qualityGate;
  
  return Math.round(heat * 10) / 10;
}

/**
 * Get heat label based on score
 */
function getHeatLabel(heat: number): 'nuclear' | 'spicy' | 'hot' | 'warm' | 'mild' {
  if (heat >= 80) return 'nuclear';
  if (heat >= 60) return 'spicy';
  if (heat >= 40) return 'hot';
  if (heat >= 20) return 'warm';
  return 'mild';
}

/**
 * Get Hot Take Energy label based on score
 */
function getHotTakeEnergyLabel(energy: number): string {
  if (energy >= 80) return 'Chaos Agent 🔥';
  if (energy >= 65) return 'Hot Take Machine';
  if (energy >= 50) return 'Against the Grain';
  if (energy >= 35) return 'Independent Thinker';
  if (energy >= 20) return 'Mild Contrarian';
  return 'Consensus Enjoyer';
}

/**
 * Get procrastination label based on index
 */
function getProcrastinationLabel(index: number): string {
  if (index >= 70) return 'Backlog Hoarder';
  if (index >= 50) return 'Planning Purgatory';
  if (index >= 35) return 'Wishlist Wanderer';
  if (index >= 20) return 'Casual Planner';
  return 'Decisive Viewer';
}

/**
 * Get tendency label based on signed index
 * Positive = generous rater, Negative = harsh critic
 */
function getTendencyLabel(signedIndex: number): string {
  if (signedIndex >= 0.5) return 'Generous Rater';
  if (signedIndex >= 0.2) return 'Slightly Generous';
  if (signedIndex >= -0.2) return 'Balanced';
  if (signedIndex >= -0.5) return 'Slightly Critical';
  return 'Harsh Critic';
}

/**
 * Get rating band based on global score (AniList context)
 */
function getRatingBand(globalScore: number): 'beloved' | 'well-liked' | 'mixed' | 'disliked' | 'bad' {
  if (globalScore >= 8.0) return 'beloved';
  if (globalScore >= 7.4) return 'well-liked';
  if (globalScore >= 6.9) return 'mixed';
  if (globalScore >= 6.0) return 'disliked';
  return 'bad';
}

/**
 * Get crowd category based on popularity
 */
function getCrowdCategory(popularity: number): 'mainstream' | 'popular' | 'known' | 'niche' {
  if (popularity >= 200000) return 'mainstream'; // Solo Leveling (~300k) and above
  if (popularity >= 100000) return 'popular';   // 100k-200k
  if (popularity >= 50000) return 'known';      // 50k-100k  
  return 'niche';                               // Below 50k
}

/**
 * Get human-readable context for the take based on rating band and direction
 */
function getRatingBandLabel(band: string, direction: string, globalScore: number): string {
  if (direction === 'overrated') {
    if (band === 'beloved') return `You disliked a beloved show (${globalScore})`;
    if (band === 'well-liked') return `You didn't like a popular show (${globalScore})`;
    return `You rated lower than average (${globalScore})`;
  } else if (direction === 'underrated') {
    if (band === 'bad') return `You loved a poorly-rated show (${globalScore})`;
    if (band === 'disliked') return `You championed an underdog (${globalScore})`;
    if (band === 'mixed') return `You saw value others missed (${globalScore})`;
    return `You rated higher than average (${globalScore})`;
  }
  return `You matched the consensus (${globalScore})`;
}

/**
 * Analyze a user's hot takes from their media list
 */
export function analyzeHotTakes(
  entries: MediaListEntry[],
  allEntriesIncludingPlanning?: MediaListEntry[]
): HotTakesProfile {
  // Filter to scored entries with quality data
  // Require: valid user score, global score exists, minimum popularity for confidence
  const MIN_POPULARITY = 50000; // Higher threshold - only shows with meaningful audience
  
  const scoredEntries = entries.filter(e => 
    e.score && e.score >= 1 && // Valid user score (Filter C)
    e.media?.meanScore && e.media.meanScore > 0 && // Global score exists
    e.media?.popularity && e.media.popularity >= MIN_POPULARITY && // Popularity threshold (Filter B)
    (e.status === 'COMPLETED' || e.status === 'DROPPED') // Only completed/dropped (Filter D)
  );

  if (scoredEntries.length === 0) {
    return {
      hotTakeEnergy: 0,
      hotTakeEnergyLabel: 'Not Enough Data',
      tendency: 0,
      tendencyLabel: 'Not Enough Data',
      mostContrarianPicks: [],
      overratedTakes: [],
      underratedTakes: [],
      hotTakesByCategory: {
        mainstream: [],
        popular: [],
        known: [],
        niche: [],
      },
      stats: {
        avgDelta: 0,
        totalScored: 0,
        qualifiedTakes: 0,
      },
      procrastination: calculateProcrastination(entries, allEntriesIncludingPlanning),
    };
  }

  // Calculate takes for each entry
  const takes: HotTake[] = scoredEntries.map(entry => {
    const userScore = entry.score!;
    const globalScore = (entry.media!.meanScore! / 10); // Convert from 0-100 to 0-10
    const delta = userScore - globalScore;
    const popularity = entry.media!.popularity!;
    
    // Determine direction based on delta
    let direction: 'overrated' | 'underrated' | 'consensus';
    if (Math.abs(delta) < 0.5) {
      direction = 'consensus';
    } else if (delta < 0) {
      direction = 'overrated'; // User scored lower = thinks it's overrated
    } else {
      direction = 'underrated'; // User scored higher = thinks it's underrated
    }
    
    // Calculate heat with new formula
    const heat = calculateHeat(delta, popularity, globalScore, direction);
    const heatLabel = getHeatLabel(heat);
    const ratingBand = getRatingBand(globalScore);
    const ratingBandLabel = getRatingBandLabel(ratingBand, direction, Math.round(globalScore * 10) / 10);

    return {
      mediaId: entry.media!.id!,
      title: entry.media!.title?.english || entry.media!.title?.romaji || 'Unknown',
      coverImage: entry.media!.coverImage?.large || entry.media!.coverImage?.medium,
      userScore,
      globalScore: Math.round(globalScore * 10) / 10,
      delta: Math.round(delta * 10) / 10,
      popularity,
      heat,
      heatLabel,
      direction,
      ratingBand,
      ratingBandLabel,
      crowdCategory: getCrowdCategory(popularity),
    };
  });

  // Minimum heat threshold for display (heat >= 20 = "warm" or better)
  const HEAT_THRESHOLD = 20;
  
  // OVERRATED: User rated LOWER than global AND global >= 7.0 (quality floor - Filter A)
  const overrated = takes
    .filter(t => t.direction === 'overrated' && t.globalScore >= 7.0 && t.heat >= HEAT_THRESHOLD)
    .sort((a, b) => b.heat - a.heat);
  
  // UNDERRATED: User rated HIGHER than global (no quality floor needed)
  const underrated = takes
    .filter(t => t.direction === 'underrated' && t.heat >= HEAT_THRESHOLD)
    .sort((a, b) => b.heat - a.heat);
  
  // MOST CONTRARIAN PICKS: Top 5 by absolute heat (either direction)
  const mostContrarian = takes
    .filter(t => t.direction !== 'consensus' && t.heat >= HEAT_THRESHOLD)
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 5);

  // Calculate stats
  const deltas = takes.map(t => t.delta);
  const avgDelta = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
  const qualifiedTakes = takes.filter(t => t.heat >= HEAT_THRESHOLD).length;

  // Calculate Hot Take Energy (user-wide score)
  // Step 1: Get top 15 heat entries
  const topHeats = takes
    .filter(t => t.direction !== 'consensus')
    .map(t => t.heat)
    .sort((a, b) => b - a)
    .slice(0, 15);
  
  // Step 2: Average the top heats
  const avgHeat = topHeats.length > 0 ? topHeats.reduce((a, b) => a + b, 0) / topHeats.length : 0;
  
  // Step 3: Volume weight (penalize low data)
  const ratedCount = scoredEntries.length;
  const volumeWeight = Math.min(1, ratedCount / 40);
  
  // Step 4: Final Hot Take Energy
  const hotTakeEnergy = Math.round(avgHeat * volumeWeight);
  
  // Calculate tendency (positive = generous, negative = harsh)
  const tendency = avgDelta;
  const tendencyLabel = getTendencyLabel(tendency);

  // Group takes by crowd category
  const hotTakesByCategory = {
    mainstream: takes.filter(t => t.crowdCategory === 'mainstream' && t.heat >= HEAT_THRESHOLD),
    popular: takes.filter(t => t.crowdCategory === 'popular' && t.heat >= HEAT_THRESHOLD),
    known: takes.filter(t => t.crowdCategory === 'known' && t.heat >= HEAT_THRESHOLD),
    niche: takes.filter(t => t.crowdCategory === 'niche' && t.heat >= HEAT_THRESHOLD),
  };

  return {
    hotTakeEnergy,
    hotTakeEnergyLabel: getHotTakeEnergyLabel(hotTakeEnergy),
    tendency: Math.round(tendency * 100) / 100,
    tendencyLabel,
    mostContrarianPicks: mostContrarian,
    overratedTakes: overrated,
    underratedTakes: underrated,
    hotTakesByCategory,
    stats: {
      avgDelta: Math.round(avgDelta * 100) / 100,
      totalScored: scoredEntries.length,
      qualifiedTakes,
    },
    procrastination: calculateProcrastination(entries, allEntriesIncludingPlanning),
  };
}

/**
 * Calculate procrastination/backlog stats
 */
function calculateProcrastination(
  watchedEntries: MediaListEntry[],
  allEntries?: MediaListEntry[]
): HotTakesProfile['procrastination'] {
  // If we don't have all entries, estimate from watched
  const planningCount = allEntries 
    ? allEntries.filter(e => e.status === 'PLANNING').length
    : 0;
  
  const completedCount = watchedEntries.filter(e => e.status === 'COMPLETED').length;
  const currentCount = watchedEntries.filter(e => e.status === 'CURRENT').length;
  const droppedCount = allEntries 
    ? allEntries.filter(e => e.status === 'DROPPED').length 
    : 0;
  const pausedCount = allEntries
    ? allEntries.filter(e => e.status === 'PAUSED').length
    : 0;
  
  const totalCount = completedCount + currentCount + planningCount + droppedCount + pausedCount;
  
  if (totalCount === 0) {
    return {
      index: 0,
      label: 'No Data',
      planningCount: 0,
      totalCount: 0,
      ratio: 0,
    };
  }

  const ratio = planningCount / totalCount;
  // Index scales with ratio but caps around 70% planning
  const index = Math.min(100, Math.round(ratio * 140));

  return {
    index,
    label: getProcrastinationLabel(index),
    planningCount,
    totalCount,
    ratio: Math.round(ratio * 100) / 100,
  };
}

export default analyzeHotTakes;
