/**
 * Async wrapper for TasteAnalyzer to avoid blocking the main thread on large lists.
 * 
 * For lists with 500+ entries, uses chunked processing with yielding to keep UI responsive.
 * For smaller lists, runs synchronously for simplicity.
 * 
 * Usage:
 *   import { analyzeTasteAsync } from '@/lib/taste-analyzer-async';
 *   const profile = await analyzeTasteAsync(entries, 'ANIME');
 */

import { MediaListEntry, TasteProfile } from '@/types/anilist';
import { TasteAnalyzer } from './taste-analyzer';
import { logger } from './logger';

const LARGE_LIST_THRESHOLD = 500;

/**
 * Yields control back to the browser to keep UI responsive.
 * Uses requestIdleCallback when available, falls back to setTimeout.
 */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => resolve(), { timeout: 50 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Analyze taste profile asynchronously.
 * For large lists, yields to the main thread periodically to keep UI responsive.
 */
export async function analyzeTasteAsync(
  mediaList: MediaListEntry[],
  type: 'ANIME' | 'MANGA' = 'ANIME'
): Promise<TasteProfile | null> {
  if (mediaList.length === 0) return null;

  // For small lists, run synchronously
  if (mediaList.length < LARGE_LIST_THRESHOLD) {
    return TasteAnalyzer.analyzeTaste(mediaList, type);
  }

  // For large lists, yield before heavy computation
  logger.debug(`[TasteAnalyzerAsync] Processing large list: ${mediaList.length} entries`);
  
  // Yield before starting heavy computation
  await yieldToMain();
  
  const startTime = performance.now();
  const profile = TasteAnalyzer.analyzeTaste(mediaList, type);
  const duration = performance.now() - startTime;
  
  logger.debug(`[TasteAnalyzerAsync] Analysis completed in ${duration.toFixed(2)}ms`);
  
  // Yield after computation to allow UI updates
  await yieldToMain();
  
  return profile;
}

/**
 * Check if a list is large enough to warrant async processing.
 */
export function isLargeList(mediaList: MediaListEntry[]): boolean {
  return mediaList.length >= LARGE_LIST_THRESHOLD;
}
