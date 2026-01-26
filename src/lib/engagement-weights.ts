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
 * Calculate Personal Meaning preference weight
 * 
 * This transforms raw AniList scores into meaningful preference weights
 * by treating ratings relative to each user's personal baseline.
 * 
 * Key insight: "7/10" means different things to different users:
 * - For a harsh rater (mean 5.5): 7/10 = strong preference
 * - For a generous rater (mean 8.2): 7/10 = mild preference
 * - For a romance lover: 7/10 romance = identity-defining
 * - For a romance hater: 7/10 romance = tolerated
 */
export function calculatePersonalMeaningWeight(
  score: number,
  userStats: UserScoreStats
): number {
  // No score = neutral engagement (don't invent preference)
  if (!score || score <= 0) {
    return 1.0;
  }
  
  // Calculate how far this rating is from user's personal baseline
  const zScore = (score - userStats.mean) / userStats.std;
  
  // Apply a curve with hard "mid" cutoff and asymmetric response
  // Below baseline: fast drop-off (tolerated)
  // Above baseline: steep rise (enjoyed)
  // Far above: saturates (can't exceed meaningful maximum)
  
  let preferenceWeight;
  
  if (zScore <= -0.5) {
    // Well below user's mean = strong negative preference
    // Fast drop-off: 0.3 to 0.7
    preferenceWeight = 0.7 + (zScore + 0.5) * 0.4;
    preferenceWeight = Math.max(0.3, preferenceWeight);
  } else if (zScore <= 0.5) {
    // Around user's mean = neutral to mild
    // Narrow neutral zone: 0.7 to 1.1
    preferenceWeight = 0.7 + (zScore + 0.5) * 0.4;
  } else if (zScore <= 2.0) {
    // Above user's mean = strong positive preference
    // Steep rise: 1.1 to 1.8
    preferenceWeight = 1.1 + (zScore - 0.5) * 0.47;
  } else {
    // Far above user's mean = maximum preference
    // Saturate at 1.8 to prevent unrealistic dominance
    preferenceWeight = 1.8;
  }
  
  return preferenceWeight;
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
  
  // 2. Score signal weight using Personal Meaning transform
  // This treats ratings relative to user's personal baseline, not absolute
  let scoreSignalWeight = 1.0;
  if (entry.score && entry.score > 0) {
    scoreSignalWeight = calculatePersonalMeaningWeight(entry.score, userStats);
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

/**
 * Filter entries by format (for manga ecosystem separation)
 */
export function filterByFormat(
  entries: MediaListEntry[],
  includedFormats: string[]
): MediaListEntry[] {
  if (includedFormats.length === 0) return entries;
  return entries.filter(entry => 
    entry.media?.format && includedFormats.includes(entry.media.format)
  );
}

/**
 * Create Core Identity Subset - titles that truly define the user's taste
 * 
 * This filters to only the most meaningful entries:
 * - Favorites (guaranteed identity-defining)
 * - High ratings (well above user's personal baseline)
 * - Rewatched (shows they returned to)
 * - Strong completion (engaged deeply)
 */
export function createCoreIdentitySubset(
  entries: MediaListEntry[],
  userStats: UserScoreStats
): MediaListEntry[] {
  return entries.filter(entry => {
    // 1. Favorites are always included (guaranteed preference)
    // AniList uses custom lists for favorites, so check if it's in a favorites list
    if (entry.customLists && entry.customLists.some(list => 
      list.toLowerCase().includes('favorite') || list.toLowerCase().includes('favourite')
    )) {
      return true;
    }
    
    // 2. Rewatched content shows strong preference
    if (entry.repeat && entry.repeat > 0) {
      return true;
    }
    
    // 3. High ratings relative to user's personal baseline
    if (entry.score && entry.score > 0) {
      const zScore = (entry.score - userStats.mean) / userStats.std;
      // Include if rating is 0.7 std dev above user's mean
      if (zScore >= 0.7) {
        return true;
      }
    }
    
    // 4. Strong completion of substantial content
    if (entry.status === 'COMPLETED') {
      const total = entry.media?.episodes || entry.media?.chapters || 1;
      const progress = entry.progress || 0;
      
      // For longer series, require significant engagement
      if (total >= 12 && progress >= total * 0.9) {
        return true;
      }
      
      // For shorter series, completion alone is enough
      if (total < 12 && progress >= total) {
        return true;
      }
    }
    
    return false;
  });
}
