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
  intensity: number;       // How "hot" this take is (0-100)
  direction: 'hot' | 'cold'; // Hot = against consensus, Cold = with consensus
}

export interface HotTakesProfile {
  /** Overall contrarian score (0-100) */
  contrarianIndex: number;
  /** Label for the contrarian level */
  contrarianLabel: string;
  /** Top 5 hottest takes (biggest disagreements with popular shows) */
  hottestTakes: HotTake[];
  /** Top 5 coldest takes (biggest agreements with consensus) */
  coldestTakes: HotTake[];
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
 * Calculate the "heat intensity" of a take
 * Formula: |delta| * log(popularity) * (1 + |delta|/5)
 * - Bigger disagreements = hotter
 * - More popular shows = hotter
 * - Exponential scaling for extreme takes
 */
function calculateIntensity(delta: number, popularity: number): number {
  const absDelta = Math.abs(delta);
  // Log scale for popularity (min 1 to avoid log(0))
  const popFactor = Math.log10(Math.max(popularity, 1) + 1) / 6; // Normalize to ~0-1 range
  // Exponential factor for extreme takes
  const extremeFactor = 1 + absDelta / 5;
  // Raw intensity
  const raw = absDelta * popFactor * extremeFactor * 20;
  // Clamp to 0-100
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
 * Analyze a user's hot takes from their media list
 */
export function analyzeHotTakes(
  entries: MediaListEntry[],
  allEntriesIncludingPlanning?: MediaListEntry[]
): HotTakesProfile {
  // Filter to scored entries only
  const scoredEntries = entries.filter(e => 
    e.score && e.score > 0 && 
    e.media?.meanScore && 
    e.media?.popularity
  );

  if (scoredEntries.length === 0) {
    return {
      contrarianIndex: 50,
      contrarianLabel: 'Not Enough Data',
      hottestTakes: [],
      coldestTakes: [],
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
    const intensity = calculateIntensity(delta, popularity);

    return {
      mediaId: entry.media!.id!,
      title: entry.media!.title?.english || entry.media!.title?.romaji || 'Unknown',
      coverImage: entry.media!.coverImage?.large || entry.media!.coverImage?.medium,
      userScore,
      globalScore: Math.round(globalScore * 10) / 10,
      delta: Math.round(delta * 10) / 10,
      popularity,
      intensity: Math.round(intensity),
      direction: Math.abs(delta) < 0.5 ? 'cold' : (delta > 0 ? 'hot' : 'hot'),
    };
  });

  // Sort by intensity for hottest takes (biggest disagreements)
  const sortedByIntensity = [...takes].sort((a, b) => b.intensity - a.intensity);
  
  // Get actual hot takes (significant delta)
  const hotTakes = sortedByIntensity.filter(t => Math.abs(t.delta) >= 1.5);
  
  // Cold takes = closest to average on popular shows
  const coldTakes = [...takes]
    .filter(t => t.popularity > 10000) // Only consider popular shows
    .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));

  // Calculate stats
  const deltas = takes.map(t => t.delta);
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const overraters = takes.filter(t => t.delta > 0.5).length;
  const underraters = takes.filter(t => t.delta < -0.5).length;
  const perfectMatches = takes.filter(t => Math.abs(t.delta) <= 0.5).length;

  // Calculate contrarian index
  // Based on: average absolute delta weighted by popularity
  const weightedDeltas = takes.map(t => 
    Math.abs(t.delta) * Math.log10(t.popularity + 1)
  );
  const avgWeightedDelta = weightedDeltas.reduce((a, b) => a + b, 0) / weightedDeltas.length;
  // Normalize to 0-100 scale (typical range is 0-3)
  const contrarianIndex = Math.min(100, Math.round(avgWeightedDelta * 25));

  return {
    contrarianIndex,
    contrarianLabel: getContrarianLabel(contrarianIndex),
    hottestTakes: hotTakes.slice(0, 5),
    coldestTakes: coldTakes.slice(0, 5),
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
