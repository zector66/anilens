import { MediaListEntry, MediaList } from '@/types/anilist';

export interface NormalizeOptions {
  /** Statuses to include. Defaults to ['COMPLETED', 'CURRENT', 'REPEATING'] */
  statuses?: string[];
  /** Whether to deduplicate entries by mediaId. Defaults to true */
  dedupe?: boolean;
  /** Prefer non-custom list entries when deduping. Defaults to true */
  preferNonCustom?: boolean;
}

const DEFAULT_STATUSES = ['COMPLETED', 'CURRENT', 'REPEATING'];

/**
 * Normalizes a MediaList response from AniList into a flat, deduplicated array of entries.
 * 
 * This consolidates the repeated logic across Taste Profile, Games, and Recommendations:
 * - Flattens MediaList.lists[].entries into a single array
 * - Filters by status (excludes PLANNING, PAUSED, DROPPED by default)
 * - Deduplicates entries by mediaId (AniList returns duplicates via custom lists)
 * 
 * @param mediaList - The MediaList response from AniList API
 * @param options - Configuration options
 * @returns Flattened, filtered, and deduplicated array of MediaListEntry
 */
export function normalizeMediaList(
  mediaList: MediaList | null | undefined,
  options: NormalizeOptions = {}
): MediaListEntry[] {
  if (!mediaList?.lists) return [];

  const {
    statuses = DEFAULT_STATUSES,
    dedupe = true,
    preferNonCustom = true,
  } = options;

  const statusSet = new Set(statuses);

  if (!dedupe) {
    // Simple case: just flatten and filter
    return mediaList.lists
      .flatMap((list) => list.entries)
      .filter((entry) => statusSet.has(entry.status || ''));
  }

  // Deduplicate by mediaId
  const entriesMap = new Map<number, MediaListEntry>();

  for (const list of mediaList.lists) {
    const isCustomList = list.isCustomList ?? false;

    for (const entry of list.entries) {
      const mediaId = entry.media?.id || entry.mediaId;
      if (!mediaId) continue;

      // Skip if doesn't match status filter
      if (!statusSet.has(entry.status || '')) continue;

      const existing = entriesMap.get(mediaId);
      
      if (!existing) {
        entriesMap.set(mediaId, entry);
      } else if (preferNonCustom && !isCustomList) {
        // Prefer non-custom list entries as they have the official status
        entriesMap.set(mediaId, entry);
      }
    }
  }

  return Array.from(entriesMap.values());
}

/**
 * Extract watched IDs from a normalized list of entries.
 * Useful for filtering recommendations.
 */
export function extractMediaIds(entries: MediaListEntry[]): Set<number> {
  return new Set(
    entries
      .map((e) => e.media?.id)
      .filter((id): id is number => id != null)
  );
}
