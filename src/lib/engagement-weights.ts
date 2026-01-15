/**
 * Engagement Weight Calculation
 * 
 * Formula: w = baseStatusWeight * scoreSignalWeight * progressWeight
 * 
 * This prevents "exposure inflation" where completionists inflate everything
 * by simply existing. Preferences become "engagement-weighted", not raw-count.
 */

import { MediaListEntry } from '@/types/anilist';

export interface EngagementWeight {
  weight: number;
  statusWeight: number;
  scoreSignalWeight: number;
  progressWeight: number;
}

export interface UserScoreStats {
  mean: number;
  std: number;
  count: number;
}

// Status-based weights
const STATUS_WEIGHTS: Record<string, number> = {
  'COMPLETED': 1.0,
  'REPEATING': 1.2, // Extra weight for rewatching
  'CURRENT': 0.7,
  'PAUSED': 0.4,
  'DROPPED': 0.25,
  'PLANNING': 0, // Ignore planning
};

/**
 * Calculate user's score statistics for z-score normalization
 */
export function calculateUserScoreStats(entries: MediaListEntry[]): UserScoreStats {
  const scoredEntries = entries.filter(e => e.score && e.score > 0);
  if (scoredEntries.length === 0) {
    return { mean: 6.8, std: 2, count: 0 };
  }
  
  const scores = scoredEntries.map(e => e.score!);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  const std = Math.sqrt(variance) || 1;
  
  return { mean, std, count: scores.length };
}

/**
 * Calculate z-score for a given score relative to user's personal scale
 */
export function getZScore(score: number, stats: UserScoreStats): number {
  return (score - stats.mean) / stats.std;
}

/**
 * Calculate engagement weight for a single entry
 * 
 * w = baseStatusWeight * scoreSignalWeight * progressWeight
 */
export function calculateEngagementWeight(
  entry: MediaListEntry,
  userStats: UserScoreStats,
  type: 'ANIME' | 'MANGA' = 'ANIME'
): EngagementWeight {
  // 1. Status weight
  const statusWeight = STATUS_WEIGHTS[entry.status] ?? 0.5;
  
  // Skip planning entries entirely
  if (entry.status === 'PLANNING') {
    return { weight: 0, statusWeight: 0, scoreSignalWeight: 0, progressWeight: 0 };
  }
  
  // 2. Score signal weight
  // If score exists: 1 + clamp(zScore, -1.25, 1.25) * 0.25
  // If no score: 1.0 (don't invent info)
  let scoreSignalWeight = 1.0;
  if (entry.score && entry.score > 0) {
    const zScore = getZScore(entry.score, userStats);
    const clampedZ = Math.max(-1.25, Math.min(1.25, zScore));
    scoreSignalWeight = 1 + clampedZ * 0.25; // Range: 0.6875 to 1.3125
  }
  
  // 3. Progress weight
  // How much of the content did they actually engage with?
  const media = entry.media;
  const total = type === 'ANIME' 
    ? (media?.episodes || 1) 
    : (media?.chapters || 1);
  
  let progressWeight = 1.0;
  if (entry.status === 'COMPLETED') {
    // Completed entries get full weight, plus repeat bonus
    progressWeight = 1.0 + Math.min(0.5, (entry.repeat || 0) * 0.2);
  } else {
    // Partial progress
    progressWeight = Math.min(1, (entry.progress || 0) / total);
  }
  
  // Combine all weights
  const weight = statusWeight * scoreSignalWeight * progressWeight;
  
  return { weight, statusWeight, scoreSignalWeight, progressWeight };
}

/**
 * Calculate confidence score for an affinity metric
 * 
 * confidence = 1 - exp(-count / k)
 * k ~ 6-10 depending on data type
 * 
 * This ensures small sample sizes show as "tentative" not "authoritative"
 */
export function calculateConfidence(count: number, scoredCount: number, k: number = 8): number {
  // Base confidence from count
  const countConfidence = 1 - Math.exp(-count / k);
  
  // Penalty if few entries are scored
  const scoredRatio = count > 0 ? scoredCount / count : 0;
  
  // Final confidence
  return countConfidence * (0.5 + 0.5 * scoredRatio);
}

/**
 * Get confidence label for UI display
 */
export function getConfidenceLabel(confidence: number): { label: string; emoji: string; color: string } {
  if (confidence >= 0.8) {
    return { label: 'Strong signal', emoji: '🟢', color: 'text-green-400' };
  } else if (confidence >= 0.5) {
    return { label: 'Moderate signal', emoji: '🟡', color: 'text-yellow-400' };
  } else if (confidence >= 0.25) {
    return { label: 'Tentative', emoji: '🟠', color: 'text-orange-400' };
  } else {
    return { label: 'Low confidence', emoji: '🔴', color: 'text-red-400' };
  }
}

/**
 * Filter entries by time window
 */
export function filterByTimeWindow(
  entries: MediaListEntry[],
  timeWindow: 'all' | '12months' | '90days'
): MediaListEntry[] {
  if (timeWindow === 'all') return entries;
  
  const now = Date.now();
  const cutoffMs = timeWindow === '12months' 
    ? 365 * 24 * 60 * 60 * 1000 
    : 90 * 24 * 60 * 60 * 1000;
  
  return entries.filter(entry => {
    // Use updatedAt timestamp if available
    if (entry.updatedAt) {
      const entryTime = entry.updatedAt * 1000; // AniList uses seconds
      return (now - entryTime) < cutoffMs;
    }
    
    // Fallback to completedAt for completed entries
    if (entry.completedAt?.year) {
      const completedDate = new Date(
        entry.completedAt.year,
        (entry.completedAt.month || 1) - 1,
        entry.completedAt.day || 1
      );
      return (now - completedDate.getTime()) < cutoffMs;
    }
    
    // If no date info, exclude from filtered results
    return false;
  });
}

/**
 * Filter entries by status
 */
export function filterByStatus(
  entries: MediaListEntry[],
  includedStatuses: string[]
): MediaListEntry[] {
  if (includedStatuses.length === 0) return entries;
  return entries.filter(entry => includedStatuses.includes(entry.status));
}
