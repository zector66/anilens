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
  hotness: number;         // How "hot" this take is (weighted by confidence)
  direction: 'overrated' | 'underrated' | 'consensus'; // User's stance vs global
}

export interface HotTakesProfile {
  /** Overall contrarian score (0-100) */
  contrarianIndex: number;
  /** Signed index: positive = rates higher, negative = rates lower, 0 = matches consensus */
  signedContrarianIndex: number;
  /** Label for the contrarian level */
  contrarianLabel: string;
  /** Tendency label (harsh critic vs generous rater) */
  tendencyLabel: string;
  /** Top 5 shows user thinks are overrated */
  overratedTakes: HotTake[];
  /** Top 5 shows user thinks are underrated */
  underratedTakes: HotTake[];
  /** Stats breakdown */
  stats: {
    avgDelta: number;
    totalScored: number;
    overraters: number;    // Times user scored higher than avg
    underraters: number;   // Times user scored lower than avg
    perfectMatches: number; // Within 0.5 of average
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
 * Calculate popularity confidence (0-1)
 * Uses smooth exponential curve: 1 - exp(-popularity / 25000)
 * Popular shows (100k+) approach confidence of 1.0
 * Niche shows (1k) have confidence ~0.04
 */
function calculatePopularityConfidence(popularity: number): number {
  return 1 - Math.exp(-popularity / 25000);
}

/**
 * Calculate the "hotness" of a take
 * Formula: abs(delta) * confidence(popularity)
 * - Bigger disagreements = hotter
 * - Popularity acts as confidence multiplier (not the base signal)
 * - Disagreeing with 1M people is hotter than disagreeing with 100
 */
function calculateHotness(delta: number, popularity: number): number {
  const absDelta = Math.abs(delta);
  const confidence = calculatePopularityConfidence(popularity);
  // Raw hotness: disagreement weighted by confidence
  const raw = absDelta * confidence * 20; // Scale to ~0-100 range
  return Math.min(100, Math.max(0, raw));
}

/**
 * Get contrarian label based on index
 */
function getContrarianLabel(index: number): string {
  if (index >= 80) return 'Chaos Agent';
  if (index >= 65) return 'Hot Take Machine';
  if (index >= 50) return 'Against the Grain';
  if (index >= 35) return 'Independent Thinker';
  if (index >= 20) return 'Mild Contrarian';
  return 'Consensus Conformist';
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
 * Analyze a user's hot takes from their media list
 */
export function analyzeHotTakes(
  entries: MediaListEntry[],
  allEntriesIncludingPlanning?: MediaListEntry[]
): HotTakesProfile {
  // Filter to scored entries with quality data
  // Require: valid user score, global score exists, minimum popularity threshold
  const MIN_POPULARITY = 3000; // Filter out very niche shows to reduce noise
  
  const scoredEntries = entries.filter(e => 
    e.score && e.score >= 1 && // Valid user score
    e.media?.meanScore && e.media.meanScore > 0 && // Global score exists
    e.media?.popularity && e.media.popularity >= MIN_POPULARITY // Minimum popularity
  );

  if (scoredEntries.length === 0) {
    return {
      contrarianIndex: 50,
      signedContrarianIndex: 0,
      contrarianLabel: 'Not Enough Data',
      tendencyLabel: 'Not Enough Data',
      overratedTakes: [],
      underratedTakes: [],
      stats: {
        avgDelta: 0,
        totalScored: 0,
        overraters: 0,
        underraters: 0,
        perfectMatches: 0,
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
    const hotness = calculateHotness(delta, popularity);

    // Determine direction based on delta
    let direction: 'overrated' | 'underrated' | 'consensus';
    if (Math.abs(delta) < 0.5) {
      direction = 'consensus';
    } else if (delta < 0) {
      direction = 'overrated'; // User thinks it's overrated (scored lower)
    } else {
      direction = 'underrated'; // User thinks it's underrated (scored higher)
    }

    return {
      mediaId: entry.media!.id!,
      title: entry.media!.title?.english || entry.media!.title?.romaji || 'Unknown',
      coverImage: entry.media!.coverImage?.large || entry.media!.coverImage?.medium,
      userScore,
      globalScore: Math.round(globalScore * 10) / 10,
      delta: Math.round(delta * 10) / 10,
      popularity,
      hotness: Math.round(hotness * 10) / 10,
      direction,
    };
  });

  // Split into overrated and underrated
  const overrated = takes
    .filter(t => t.direction === 'overrated' && Math.abs(t.delta) >= 1.0)
    .sort((a, b) => b.hotness - a.hotness);
  
  const underrated = takes
    .filter(t => t.direction === 'underrated' && Math.abs(t.delta) >= 1.0)
    .sort((a, b) => b.hotness - a.hotness);

  // Calculate stats
  const deltas = takes.map(t => t.delta);
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const overraters = takes.filter(t => t.delta > 0.5).length;
  const underraters = takes.filter(t => t.delta < -0.5).length;
  const perfectMatches = takes.filter(t => Math.abs(t.delta) <= 0.5).length;

  // Calculate SIGNED contrarian index (shows tendency)
  // Positive = rates higher than average, Negative = rates lower
  const weightedDeltas = takes.map(t => {
    const confidence = calculatePopularityConfidence(t.popularity);
    return t.delta * confidence; // Keep sign for tendency
  });
  const signedIndex = weightedDeltas.reduce((a, b) => a + b, 0) / weightedDeltas.length;
  
  // Calculate ABSOLUTE contrarian index (shows how much they disagree)
  const absWeightedDeltas = takes.map(t => {
    const confidence = calculatePopularityConfidence(t.popularity);
    return Math.abs(t.delta) * confidence;
  });
  const avgAbsWeightedDelta = absWeightedDeltas.reduce((a, b) => a + b, 0) / absWeightedDeltas.length;
  // Normalize to 0-100 scale (typical range is 0-2)
  const contrarianIndex = Math.min(100, Math.round(avgAbsWeightedDelta * 35));
  
  // Tendency label
  const tendencyLabel = getTendencyLabel(signedIndex);

  return {
    contrarianIndex,
    signedContrarianIndex: Math.round(signedIndex * 100) / 100,
    contrarianLabel: getContrarianLabel(contrarianIndex),
    tendencyLabel,
    overratedTakes: overrated.slice(0, 5),
    underratedTakes: underrated.slice(0, 5),
    stats: {
      avgDelta: Math.round(avgDelta * 100) / 100,
      totalScored: scoredEntries.length,
      overraters,
      underraters,
      perfectMatches,
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
