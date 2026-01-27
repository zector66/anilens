import { useState, useEffect, useMemo } from 'react';
import { useAnimeList, useMangaList } from './use-anilist';
import { computeTaste, TasteResult, ComputeTasteOptions } from '@/lib/taste';
import { saveSnapshot, loadSnapshot, deleteSnapshot } from '@/lib/taste/cache/snapshotStore';

interface UseTasteOptions extends ComputeTasteOptions {
  userId?: number;
  mediaType?: 'ANIME' | 'MANGA';
  enableCache?: boolean;
  forceRecompute?: boolean;
}

/**
 * THE ONE AND ONLY taste hook
 * Returns a single canonical TasteResult
 */
export function useTaste(options: UseTasteOptions = {}) {
  const { 
    userId = 0, 
    mediaType = 'ANIME',
    enableCache = true,
    ...computeOptions 
  } = options;

  const [taste, setTaste] = useState<TasteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the appropriate list data
  const { data: animeList, isLoading: isLoadingAnime } = useAnimeList(userId);
  const { data: mangaList, isLoading: isLoadingManga } = useMangaList(userId);
  
  const listData = mediaType === 'ANIME' ? animeList : mangaList;
  const isLoadingList = mediaType === 'ANIME' ? isLoadingAnime : isLoadingManga;

  // Extract entries from the list
  const entries = useMemo(() => {
    if (!listData?.lists) return [];
    
    const validStatuses = ['COMPLETED', 'CURRENT', 'REPEATING'];
    return listData.lists
      .flatMap(list => list.entries)
      .filter(entry => validStatuses.includes(entry.status || ''));
  }, [listData]);

  // Compute taste
  useEffect(() => {
    async function compute() {
      if (isLoadingList) return;
      
      setLoading(true);
      setError(null);

      try {
        // Try to load from cache first (but skip if forcing recompute)
        if (enableCache && !computeOptions.forceRecompute) {
          const cached = await loadSnapshot(userId, mediaType);
          if (cached) {
            setTaste(cached);
            setLoading(false);
            return;
          }
        }

        // Delete existing cache if forcing recompute
        if (enableCache && computeOptions.forceRecompute) {
          await deleteSnapshot(userId, mediaType);
        }

        // Compute fresh taste
        const result = await computeTaste(entries, mediaType, userId, computeOptions);
        setTaste(result);

        // Save to cache
        if (enableCache) {
          await saveSnapshot(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to compute taste');
        console.error('[useTaste] Error:', err);
      } finally {
        setLoading(false);
      }
    }

    compute();
  }, [entries, mediaType, userId, isLoadingList, enableCache, computeOptions]);

  // Convenience getters for common use cases
  const convenience = useMemo(() => {
    if (!taste) return null;

    return {
      // Preference view (most common)
      topTraits: taste.views.preference.topTraits,
      traitSummary: taste.views.preference.summary,
      
      // What shaped me
      shapedBy: taste.shapedBy.topShapers,
      topTitles: taste.shapedBy.topShapers.map(s => s.mediaTitle).filter(Boolean),
      
      // Contradictions
      contradictions: taste.derived.contradictions,
      
      // Legacy access (will be removed eventually)
      personality: taste.legacy?.personalityTraits,
      behavioral: taste.legacy?.behavioralMetrics,
      
      // Meta info
      confidence: taste.views.preference.confidence,
      sampleSize: taste.meta.sampleSize,
      warnings: taste.meta.warnings
    };
  }, [taste]);

  return {
    taste,
    loading,
    error,
    ...convenience
  };
}

/**
 * Simplified version for quick access
 */
export function useTasteProfile(userId?: number) {
  return useTaste({ userId, includeViews: true, includeLegacy: true });
}
